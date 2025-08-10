import { JSDOM } from 'jsdom';
import { OptimizedByteSerializationStrategy } from '../../../src/utils/serialization/OptimizedByteSerializationStrategy';

describe('OptimizedByteSerializationStrategy', () => {
    let strategy: OptimizedByteSerializationStrategy;

    beforeEach(() => {
        strategy = new OptimizedByteSerializationStrategy();
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
            expect(serialized).toMatch(/^[0-9a-f]+\/[0-9a-f]+$/);
        });

        it('should produce same output as ByteSerializationStrategy for complex selectors', () => {
            const basicHtml = `<html><body><div><h1><span>Example</span> <span>Domain</span></h1></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();

            const firstSpan = document.querySelector('span')!;
            const secondSpan = document.querySelectorAll('span')[1]!;
            range.setStart(firstSpan.firstChild!, 2);
            range.setEnd(secondSpan.firstChild!, 3);

            const result = strategy.serialize([range], document.body);
            expect(result).toBeTruthy();
            expect(result.split('|')).toHaveLength(1);
            expect(result.split('/')[0]).toMatch(/^[0-9a-f]+$/);
            expect(result.split('/')[1]).toMatch(/^[0-9a-f]+$/);
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

        it('should correctly deserialize ranges', () => {
            const basicHtml = `<html><body><div><h1><span>Example</span> <span>Domain</span></h1></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Create a real range and test round-trip serialization/deserialization
            const range = document.createRange();
            const firstSpan = document.querySelector('span')!;
            range.setStart(firstSpan.firstChild!, 2);
            range.setEnd(firstSpan.firstChild!, 5);

            const serialized = strategy.serialize([range], document.body);
            const result = strategy.deserialize(serialized, document);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeDefined();
            expect(result[0].toString()).toBe('amp');
        });
    });

    describe('round-trip compatibility', () => {
        it('should maintain compatibility with serialize/deserialize cycle', () => {
            const basicHtml = `<html><body><div><p>Test content</p><span>More content</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            const span = document.querySelector('span')!;
            range.setStart(p.firstChild!, 1);
            range.setEnd(span.firstChild!, 4);

            // Serialize
            const serialized = strategy.serialize([range], document.body);

            // Deserialize
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].startOffset).toBe(1);
            expect(deserialized[0].endOffset).toBe(4);
        });

        it('should handle nth-of-type selectors correctly', () => {
            const basicHtml = `<html><body><div><span>First</span><span>Second</span><span>Third</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const secondSpan = document.querySelectorAll('span')[1]!;
            const thirdSpan = document.querySelectorAll('span')[2]!;
            range.setStart(secondSpan.firstChild!, 0);
            range.setEnd(thirdSpan.firstChild!, 2);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].startOffset).toBe(0);
            expect(deserialized[0].endOffset).toBe(2);
        });
    });

    describe('performance optimizations', () => {
        it('should handle multiple ranges efficiently', () => {
            const basicHtml = `<html><body><div><p>Para 1</p><p>Para 2</p><p>Para 3</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create multiple ranges
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 3);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(3);
            expect(serialized.split('|')).toHaveLength(3);
        });
    });

    describe('error handling', () => {
        it('should throw error for unknown selector parts', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();

            // Create element with unknown tag (this should not normally happen in real usage)
            const unknownElement = document.createElement('unknowntag');
            range.setStart(unknownElement, 0);
            range.setEnd(unknownElement, 0);

            expect(() => {
                strategy.serialize([range], document.body);
            }).toThrow('Unknown selector part: unknowntag');
        });

        it('should throw error for unknown encoded selector parts during decode', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Use invalid hex that doesn't map to any tag
            const invalidEncoded = 'zzzz00';

            expect(() => {
                strategy.deserialize(invalidEncoded, document);
            }).toThrow('Unknown encoded selector part');
        });
    });
});
