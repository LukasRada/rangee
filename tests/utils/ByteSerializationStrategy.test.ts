import { JSDOM } from 'jsdom';
import { ByteSerializationStrategy } from '../../src/utils/serialization/ByteSerializationStrategy'; // Adjust the import path as necessary
import { findNodeBySelector } from '../../src/utils/findNodeBySelector';
import { SerializationStrategy } from '../../src/types/SerializationStrategy';

jest.mock('../../src/utils/findNodeBySelector');

describe('ByteSerializationStrategy', () => {
    let strategy: SerializationStrategy;

    beforeEach(() => {
        strategy = new ByteSerializationStrategy();
    });

    describe('serialize', () => {
        it('should return an empty string for empty ranges', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const result = strategy.serialize([], dom.window.document.createElement('div'));
            expect(result).toBe('');
        });

        it('should correctly serialize a single range', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();
            const startContainer = document.createElement('div');
            const endContainer = document.createElement('div');
            range.setStart(startContainer, 0);
            range.setEnd(endContainer, 0);

            const serialized = strategy.serialize([range], document.body);
            expect(serialized).toMatch(/^[0-9a-f]+\/[0-9a-f]+$/); // Check if it has two hex parts
        });
    });

    describe('deserialize', () => {
        it('should return an empty array for empty string input', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const result = strategy.deserialize('', document);
            expect(result).toEqual([]);
        });
    });

    // describe('encodeSelectorWithCO', () => {
    //     it('should correctly encode a selector with offset', () => {
    //         const selector = 'div';
    //         const offset = 2;
    //         const result = strategy.encodeSelectorWithCO(selector, offset);
    //         expect(result).toMatch(/^[0-9a-f]{2}02$/); // Example: div will be encoded, and offset 2 should match
    //     });

    //     it('should throw an error for unknown selector part', () => {
    //         const selector = 'unknownTag';
    //         expect(() => strategy.encodeSelectorWithCO(selector, 2)).toThrow('Unknown selector part: unknownTag');
    //     });
    // });

    // describe('decodeSelectorWithCO', () => {
    //     it('should correctly decode a valid encoded selector', () => {
    //         const encoded = '0102'; // Example encoded value
    //         const result = strategy.decodeSelectorWithCO(encoded);
    //         expect(result.s).toEqual('div'); // Modify according to your actual decoding
    //         expect(result.o).toEqual(2);
    //     });

    //     it('should throw an error for unknown encoded selector part', () => {
    //         const encoded = 'zz'; // Invalid hex
    //         expect(() => strategy.decodeSelectorWithCO(encoded)).toThrow('Unknown encoded selector part: zz');
    //     });
    // });
});
