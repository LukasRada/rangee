import { JSDOM } from 'jsdom';
import { ByteSerializationStrategy } from '../../src/utils/serialization/ByteSerializationStrategy'; // Adjust the import path as necessary

describe('ByteSerializationStrategy', () => {
    let strategy: ByteSerializationStrategy;

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

    describe('deserialize', () => {
        it('should return an array of ranges', () => {
            const basicHtml = `<html lang="en"><body><div><div><h1><span>Example</span> <span>Domain</span></h1></div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const result = strategy.deserialize('0924240e3b0500/0924240e3b0700|0924240e3bff020000/0924240e3bff020200', dom.window.document);
            expect(result[0].toString()).toEqual('le');
            expect(result[1].toString()).toEqual('Do');
        });
    });

    describe('encodeSelectorWithCO', () => {
        it('should correctly encode a selector with offset', () => {
            const selector = 'div';
            const offset = 2;
            const result = strategy.encodeSelectorWithCO(selector, offset);
            expect(result).toMatch('2402');
        });

        it('should throw an error for unknown selector part', () => {
            const selector = 'unknownTag';
            expect(() => strategy.encodeSelectorWithCO(selector, 2)).toThrow('Unknown selector part: unknownTag');
        });
    });

    describe('decodeSelectorWithCO', () => {
        it('should correctly decode a valid encoded selector', () => {
            const encoded = '240200'; // Example encoded value
            const result = strategy.decodeSelectorWithCO(encoded);
            expect(result.s).toEqual('div'); // Modify according to your actual decoding
            expect(result.o).toEqual(2);
            expect(result.c).toEqual(0);
        });

        it('should correctly decode a valid encoded selector with nth-type-of', () => {
            const encoded = '24ff0202'; // Example encoded value
            const result = strategy.decodeSelectorWithCO(encoded);
            expect(result.s).toEqual('div:nth-of-type(2)'); // Modify according to your actual decoding
            expect(result.o).toEqual(2);
        });

        it('should throw an error for unknown encoded selector part', () => {
            const encoded = 'zzzzzz'; // Invalid hex
            expect(() => strategy.decodeSelectorWithCO(encoded)).toThrow('Unknown encoded selector part: zz');
        });
    });
});
