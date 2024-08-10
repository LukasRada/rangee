import { compressToUint8Array, decompressFromUint8Array } from 'lz-string';
import { CompressionStrategy } from '../../types/CompressionStrategy';

export class DefaultCompressionStrategy implements CompressionStrategy {
    compress(decompressed: string): Uint8Array {
        return compressToUint8Array(decompressed);
    }

    decompress(compressed: Uint8Array): string {
        return decompressFromUint8Array(compressed);
    }
}
