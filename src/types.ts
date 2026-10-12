export type StyleId = "theme" | "pingfang" | "handwrite";
export type TextureId = "theme" | "auto" | "none" | "grid" | "dot" | "line";
// 预设值之外允许任意字符串（自定义字号百分比 / 自定义边距 px），预设字面量仍保留提示。
export type SizeScale = "80" | "90" | "100" | "110" | (string & {});
export type PageMargin = "64" | "76" | "88" | "100" | "112" | (string & {});
export type CoverMode = "avatar-body" | "avatar-title-body" | "title-body";
export type AvatarSize = "small" | "medium" | "large";

export type AspectId = "xhs-3x4" | "douyin-9x16" | "square-1x1" | "common-4x5" | "longform";
export type WatermarkPosition = "tile" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
export type TileDensity = "sparse" | "medium" | "dense" | "custom";
export type LongformScale = "1" | "2" | "3" | "4";
export type LongformAuthorPosition = "top" | "bottom-right";
export type ExportFormat = "png" | "jpg" | "pdf";
export type WatermarkOptions = {
  enabled: boolean;
  text: string;
  size: number;
  opacity: number;
  color: string;
  position: WatermarkPosition;
  tileDensity?: TileDensity;
  tileDensityPercent?: number;
};

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold" | "italic" | "highlight" | "code" | "strike"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "checkbox"; checked: boolean }
  | { type: "tag"; text: string }
  | { type: "math"; text: string };

export type TextBlock = {
  type: "cover-title" | "subtitle" | "paragraph" | "quote" | "code-block";
  inlines: Inline[];
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  continuedFromPrevious?: boolean;
  continuesNext?: boolean;
};

export type ListBlock = {
  type: "list";
  ordered: boolean;
  items: Inline[][];
  continuedFromPrevious?: boolean;
  continuesNext?: boolean;
};

export type TableBlock = {
  type: "table";
  header: Inline[][];
  rows: Inline[][][];
};

export type ImageBlock = { type: "image"; link: string; alt: string; dataUri?: string; contain?: boolean };
export type ImagePairBlock = { type: "image-pair"; images: [ImageBlock, ImageBlock] };
export type DataviewBlock = { type: "dataview"; language: "dataview" | "dataviewjs"; query: string };
export type MotionBlock = {
  type: "motion";
  id: string;
  link: string;
  alt: string;
  format: "gif" | "mp4" | "mov";
  resourceUrl?: string;
  filePath?: string;
};
export type VideoEmbedBlock = {
  type: "video-embed";
  provider: "bilibili" | "youtube" | "douyin";
  videoId: string;
  url: string;
  title?: string;
  coverDataUrl?: string;
};
export type SpacerBlock = { type: "spacer" };
export type AuthorBlock = { type: "author"; nickname: string; subtitle: string; showText: boolean; avatarDataUrl: string };
export type Block = TextBlock | ListBlock | TableBlock | ImageBlock | ImagePairBlock | DataviewBlock | MotionBlock | VideoEmbedBlock | SpacerBlock | AuthorBlock;

export type Page = { blocks: Block[] };

export type ExportOptions = {
  account: string;
  style: StyleId;
  paletteId: string;
  customBg: string;
  fontId: string;
  texture: TextureId;
  customTexture: string;
  titleScale: SizeScale;
  subtitleScale: SizeScale;
  bodyScale: SizeScale;
  horizontalMargin: PageMargin;
  topMargin: PageMargin;
  showAvatar: boolean;
  showTitle: boolean;
  avatarDataUrl: string;
  avatarUrl: string;
  avatarSize: AvatarSize;
  authorSubtitle: string;
  coverImageDataUrl: string;
  coverImageUrl: string;
  showCoverImage: boolean;
  aspectId: AspectId;
  longformWidth: number;
  longformScale: LongformScale;
  exportFormat: ExportFormat;
  longformAuthorPosition: LongformAuthorPosition;
  watermark: WatermarkOptions;
};
