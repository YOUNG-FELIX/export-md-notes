declare module "electron" {
  export const shell: {
    openPath(path: string): Promise<string>;
  };
}

declare module "*.live-photo-tool" {
  const base64: string;
  export default base64;
}
