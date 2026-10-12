const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const AVATAR_SIZE = 512;
const COVER_WIDTH = 1080;
const COVER_HEIGHT = 608;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function prepareAvatar(file: File): Promise<string> {
  return prepareImage(file, AVATAR_SIZE, AVATAR_SIZE, "头像");
}

export async function prepareCoverImage(file: File): Promise<string> {
  return prepareImage(file, COVER_WIDTH, COVER_HEIGHT, "封面图");
}

async function prepareImage(file: File, targetWidth: number, targetHeight: number, label: string): Promise<string> {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error("请选择 PNG、JPG、WEBP 或 GIF 图片");
  if (file.size === 0) throw new Error(`${label}文件为空`);
  if (file.size > MAX_AVATAR_BYTES) throw new Error(`${label}不能超过 10 MB`);

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.body.createEl("canvas", { cls: "xhs-avatar-canvas" });
    try {
      canvas.width = targetWidth; canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error(`当前环境无法处理${label}`);
      const targetRatio = targetWidth / targetHeight;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const sourceWidth = sourceRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
      const sourceHeight = sourceRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
      const sx = (image.naturalWidth - sourceWidth) / 2;
      const sy = (image.naturalHeight - sourceHeight) / 2;
      context.drawImage(image, sx, sy, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL("image/webp", .88);
    } finally { canvas.remove(); }
  } finally { URL.revokeObjectURL(url); }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取图片，文件可能已损坏"));
    image.src = url;
  });
}
