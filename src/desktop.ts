import { Platform } from "obsidian";
import { shell } from "electron";

type ElectronDialog = {
  showOpenDialogSync(options: {
    title: string;
    defaultPath?: string;
    properties: string[];
  }): string[] | undefined;
};

type ElectronWindow = Window & {
  electron?: {
    remote?: {
      dialog?: ElectronDialog;
    };
  };
};

export function chooseComputerFolder(defaultPath?: string): string | null {
  if (!Platform.isDesktopApp) throw new Error("选择电脑文件夹仅支持 Obsidian 桌面版");
  const dialog = (window as ElectronWindow).electron?.remote?.dialog;
  if (!dialog) throw new Error("当前 Obsidian 版本无法打开文件夹选择器");
  const selected = dialog.showOpenDialogSync({
    title: "选择小红书图片导出文件夹",
    defaultPath: defaultPath || undefined,
    properties: ["openDirectory", "createDirectory", "dontAddToRecent"]
  });
  return selected?.[0] ?? null;
}

export async function openComputerFolder(path: string): Promise<void> {
  if (!Platform.isDesktopApp) throw new Error("打开电脑文件夹仅支持 Obsidian 桌面版");
  const result = await shell.openPath(path);
  if (result) throw new Error(result);
}
