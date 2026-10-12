import type { FontDefinition } from "./fonts";

export type DownloadableFontDefinition = FontDefinition & {
  source: "downloadable";
  url: string;
  sha256: string;
};

const FONT_ASSET_BASE = "https://raw.githubusercontent.com/zhy9495/obsidian-xhs-longform/1.1.2/assets/fonts";

export const DOWNLOADABLE_HANDWRITING_FONTS: DownloadableFontDefinition[] = [
  {
    id: "xiaolai-regular", name: "小赖字体 Regular", family: "XhsXiaolaiRegular", source: "downloadable", format: "woff2",
    url: `${FONT_ASSET_BASE}/Xiaolai-Regular.woff2`, sha256: "b01b7373b008c76f7ec6d7b19468d11f54e2ec40bc0df5713e79bb3d6a952303"
  },
  {
    id: "naikai-light", name: "内海字体 Light", family: "XhsNaikaiLight", source: "downloadable", format: "woff2",
    url: `${FONT_ASSET_BASE}/NaikaiFont-Light.woff2`, sha256: "c6df0d46e7d6bdf139a42d28ea45263d34f40af57cd165bc450962e3faf18651"
  },
  {
    id: "cef-cjk-regular", name: "快去写作业 CJK Regular", family: "XhsCefCjkRegular", source: "downloadable", format: "woff2",
    url: `${FONT_ASSET_BASE}/CEFFontsCJK-Regular.woff2`, sha256: "f7ad6f3602a53205250cddb1ed93b1284ed3f55c668730812d7d86719895b9e0"
  }
];

export function downloadableFontById(id: string): DownloadableFontDefinition | undefined {
  return DOWNLOADABLE_HANDWRITING_FONTS.find((font) => font.id === id);
}
