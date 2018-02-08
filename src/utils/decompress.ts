import { decompressFromUint8Array } from "lz-string";

export const decompress = (compressed: Uint8Array) =>
  decompressFromUint8Array(compressed);
