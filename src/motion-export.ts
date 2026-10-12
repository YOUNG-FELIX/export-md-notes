import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Platform } from "obsidian";
import livePhotoToolBase64 from "../assets/xhs-live-photo.live-photo-tool";

const IMPORT_PAGE_TO_PHOTOS_SCRIPT = `
on run arguments
  if (count of arguments) is less than 3 then error "缺少照片导入参数"
  set albumName to item 1 of arguments
  set resourceKind to item 2 of arguments
  set photoPath to item 3 of arguments
  tell application "Photos"
    set matchingAlbums to every album whose name is albumName
    if (count of matchingAlbums) is 0 then
      set targetAlbum to make new album named albumName
    else
      set targetAlbum to item 1 of matchingAlbums
    end if
    if resourceKind is "live-photo" then
      if (count of arguments) is not 4 then error "缺少实况视频资源"
      set videoPath to item 4 of arguments
      set importedItems to import {POSIX file photoPath, POSIX file videoPath} skip check duplicates yes
    else
      set importedItems to import {POSIX file photoPath} skip check duplicates yes
    end if
    add importedItems to targetAlbum
    return count of importedItems
  end tell
end run
`;

export type MotionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LivePhotoPair = {
  photoPath: string;
  videoPath: string;
};

export type PhotosPageResource =
  | { kind: "photo"; path: string }
  | { kind: "live-photo"; photoPath: string; videoPath: string };

export async function exportMacLivePhoto(
  coverPng: ArrayBuffer,
  mediaPath: string,
  destinationDirectory: string,
  prefix: string,
  rect: MotionRect
): Promise<LivePhotoPair> {
  if (!Platform.isMacOS) throw new Error("直接导出实况照片仅支持 macOS");
  const workDirectory = await mkdtemp(path.join(os.tmpdir(), "xhs-live-photo-"));
  const pairDirectory = path.join(workDirectory, "pair");
  const toolPath = path.join(workDirectory, "xhs-live-photo");
  const coverPath = path.join(workDirectory, "cover.png");
  try {
    await mkdir(destinationDirectory, { recursive: true });
    await writeFile(toolPath, Buffer.from(livePhotoToolBase64, "base64"));
    await chmod(toolPath, 0o755);
    await writeFile(coverPath, new Uint8Array(coverPng));
    await run(toolPath, [
      coverPath,
      mediaPath,
      pairDirectory,
      "--compose",
      String(rect.x),
      String(rect.y),
      String(rect.width),
      String(rect.height)
    ]);
    const photoPath = path.join(destinationDirectory, `${prefix}.jpg`);
    const pairedVideoPath = path.join(destinationDirectory, `${prefix}.mov`);
    await copyFile(path.join(pairDirectory, "live-photo.jpg"), photoPath);
    await copyFile(path.join(pairDirectory, "live-photo.mov"), pairedVideoPath);
    return { photoPath, videoPath: pairedVideoPath };
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

export async function importPagesToPhotos(
  resources: PhotosPageResource[],
  albumName: string,
  onProgress: (current: number, total: number) => void
): Promise<void> {
  if (!Platform.isMacOS) throw new Error("导入“照片”仅支持 macOS");
  for (let index = 0; index < resources.length; index++) {
    onProgress(index + 1, resources.length);
    const resource = resources[index]!;
    const args = resource.kind === "live-photo"
      ? ["-e", IMPORT_PAGE_TO_PHOTOS_SCRIPT, albumName, resource.kind, resource.photoPath, resource.videoPath]
      : ["-e", IMPORT_PAGE_TO_PHOTOS_SCRIPT, albumName, resource.kind, resource.path];
    const imported = (await run("/usr/bin/osascript", args)).trim();
    if (imported !== "1") throw new Error(`第 ${index + 1} 页没有正确加入“照片”相簿`);
  }
}

export async function exportMotionOriginal(sourcePath: string, destinationDirectory: string, filename: string): Promise<void> {
  await mkdir(destinationDirectory, { recursive: true });
  await copyFile(sourcePath, path.join(destinationDirectory, filename));
}

async function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}
