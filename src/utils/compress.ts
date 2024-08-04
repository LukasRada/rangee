import { compressToUint8Array } from 'lz-string';

export const compress = (decompressed: string) => compressToUint8Array(decompressed);
