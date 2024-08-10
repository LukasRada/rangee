export interface EncodingStrategy {
    encode(buffer: Uint8Array): string;
    decode(encoded: string): Uint8Array;
}
