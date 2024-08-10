export interface CompressionStrategy {
    compress(decompressed: string): Uint8Array;
    decompress(compressed: Uint8Array): string;
}
