import { PakoCompressionStrategy } from '../../../src/utils/compression/PakoCompressionStrategy';

describe('PakoCompressionStrategy', () => {
    let strategy: PakoCompressionStrategy;

    beforeEach(() => {
        strategy = new PakoCompressionStrategy();
    });

    it('should decompress a Uint8Array correctly', () => {
        const inputString = 'Hello, world!';
        const compressed = strategy.compress(inputString);
        const decompressed = strategy.decompress(compressed);

        // Expect that the decompressed string matches the original string
        expect(decompressed).toStrictEqual(inputString);
    });

    it('should compress and decompress to get the original string', () => {
        const inputString = 'This is a test string that needs to be compressed and then decompressed.';
        const compressed = strategy.compress(inputString);
        const decompressed = strategy.decompress(compressed);

        // The original string should be the same after compression and decompression
        expect(decompressed).toBe(inputString);
    });
});
