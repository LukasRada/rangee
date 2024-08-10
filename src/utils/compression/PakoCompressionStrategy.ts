import { CompressionStrategy } from '../../types/CompressionStrategy';
import { deflate, inflate } from 'pako';

export class PakoCompressionStrategy implements CompressionStrategy {
    compress(decompressed: string): Uint8Array {
        return deflate(decompressed);
    }

    decompress(compressed: Uint8Array): string {
        return inflate(compressed, { to: 'string' }).toString();
    }
}
