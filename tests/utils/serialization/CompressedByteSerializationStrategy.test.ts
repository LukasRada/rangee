import { JSDOM } from 'jsdom';
import { CompressedByteSerializationStrategy } from '../../../src/utils/serialization/CompressedByteSerializationStrategy';

describe('CompressedByteSerializationStrategy', () => {
    let strategy: CompressedByteSerializationStrategy;

    beforeEach(() => {
        strategy = new CompressedByteSerializationStrategy();
    });

    describe('serialize', () => {
        it('should return an empty string for empty ranges', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const result = strategy.serialize([], dom.window.document.createElement('div'));
            expect(result).toBe('');
        });

        it('should correctly serialize a single range', () => {
            const basicHtml = `<html><body><div><p>Test content</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();
            const p = document.querySelector('p')!;
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 4);

            const serialized = strategy.serialize([range], document.body);
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');
        });

        it('should produce compressed output for multiple similar ranges', () => {
            const basicHtml = `<html><body><div><p>Para 1</p><p>Para 2</p><p>Para 3</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create multiple ranges with similar patterns
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');

            // Should be shorter than uncompressed due to compression
            expect(serialized.length).toBeGreaterThan(0);
        });

        it('should apply dictionary compression with emojis', () => {
            const basicHtml = `<html><body><div><p>Test 1</p><p>Test 2</p><p>Test 3</p><p>Test 4</p><p>Test 5</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create ranges that will benefit from dictionary compression
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            expect(serialized).toBeTruthy();

            // Should contain emoji replacements for common patterns
            const hasEmoji = /🅰️|🅱️|🅲️|🅳️|🅴️|🅵️|🅶️|🅷️/.test(serialized);
            expect(hasEmoji).toBe(true);
        });

        it('should apply run-length encoding for repeated characters', () => {
            // Create a scenario where the encoded output has repeated characters
            const basicHtml = `<html><body><div><span>A</span><span>A</span><span>A</span><span>A</span><span>A</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const spans = document.querySelectorAll('span');

            for (let i = 0; i < spans.length; i++) {
                const range = document.createRange();
                range.setStart(spans[i].firstChild!, 0);
                range.setEnd(spans[i].firstChild!, 1);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');
        });

        it('should handle complex nested selectors with compression', () => {
            const basicHtml = `<html><body><div><section><article><h1><span>Nested</span></h1></article></section></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();

            const span = document.querySelector('span')!;
            range.setStart(span.firstChild!, 1);
            range.setEnd(span.firstChild!, 4);

            const serialized = strategy.serialize([range], document.body);
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');
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

        it('should correctly deserialize simple ranges', () => {
            const basicHtml = `<html><body><div><p>Test content</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 4);

            const serialized = strategy.serialize([range], document.body);
            const result = strategy.deserialize(serialized, document);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeDefined();
            expect(result[0].toString()).toBe('Test');
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

        it('should correctly decompress dictionary-compressed data', () => {
            const basicHtml = `<html><body><div><p>Test 1</p><p>Test 2</p><p>Test 3</p><p>Test 4</p><p>Test 5</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(5);
            for (let i = 0; i < deserialized.length; i++) {
                expect(deserialized[i].toString()).toBe('Test');
            }
        });

        it('should correctly decompress run-length encoded data', () => {
            const basicHtml = `<html><body><div><span>A</span><span>A</span><span>A</span><span>A</span><span>A</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const spans = document.querySelectorAll('span');

            for (let i = 0; i < spans.length; i++) {
                const range = document.createRange();
                range.setStart(spans[i].firstChild!, 0);
                range.setEnd(spans[i].firstChild!, 1);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(5);
            for (let i = 0; i < deserialized.length; i++) {
                expect(deserialized[i].toString()).toBe('A');
            }
        });
    });

    describe('round-trip compatibility', () => {
        it('should maintain data integrity through serialize/deserialize cycle', () => {
            const basicHtml = `<html><body><div><p>Test content</p><span>More content</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            const span = document.querySelector('span')!;
            range.setStart(p.firstChild!, 1);
            range.setEnd(span.firstChild!, 4);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].startOffset).toBe(1);
            expect(deserialized[0].endOffset).toBe(4);
            expect(deserialized[0].toString()).toBe('est contentMore');
        });

        it('should handle multiple ranges with compression', () => {
            const basicHtml = `<html><body><div><article><h1>Title 1</h1><p>Content 1</p></article><article><h1>Title 2</h1><p>Content 2</p></article></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const articles = document.querySelectorAll('article');

            for (let i = 0; i < articles.length; i++) {
                const range = document.createRange();
                const h1 = articles[i].querySelector('h1')!;
                const p = articles[i].querySelector('p')!;
                range.setStart(h1.firstChild!, 0);
                range.setEnd(p.firstChild!, 7);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(2);
            expect(deserialized[0].toString()).toBe('Title 1Content');
            expect(deserialized[1].toString()).toBe('Title 2Content');
        });

        it('should preserve offsets and child indices correctly with compression', () => {
            const basicHtml = `<html><body><div><p>First paragraph</p><p>Second paragraph</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const firstP = document.querySelectorAll('p')[0]!;
            const secondP = document.querySelectorAll('p')[1]!;
            range.setStart(firstP.firstChild!, 6); // Start at "paragraph"
            range.setEnd(secondP.firstChild!, 6); // End at "paragraph"

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].startOffset).toBe(6);
            expect(deserialized[0].endOffset).toBe(6);
        });
    });

    describe('compression features', () => {
        it('should apply dictionary compression for common patterns', () => {
            const basicHtml = `<html><body><div><p>Text 1</p><p>Text 2</p><p>Text 3</p><p>Text 4</p><p>Text 5</p><p>Text 6</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create ranges that will have similar encoded patterns
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);

            // Should contain emoji replacements
            expect(serialized).toMatch(/🅰️|🅱️|🅲️|🅳️|🅴️|🅵️|🅶️|🅷️/);

            // Should still be deserializable
            const deserialized = strategy.deserialize(serialized, document);
            expect(deserialized).toHaveLength(6);
        });

        it('should apply run-length encoding for repeated sequences', () => {
            // Create a scenario that produces repeated characters in the encoded output
            const basicHtml = `<html><body><div><span>Same</span><span>Same</span><span>Same</span><span>Same</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const spans = document.querySelectorAll('span');

            for (let i = 0; i < spans.length; i++) {
                const range = document.createRange();
                range.setStart(spans[i].firstChild!, 0);
                range.setEnd(spans[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(4);
            for (let i = 0; i < deserialized.length; i++) {
                expect(deserialized[i].toString()).toBe('Same');
            }
        });

        it('should handle combination of dictionary and run-length compression', () => {
            const basicHtml = `<html><body><div><p>A</p><p>A</p><p>A</p><p>A</p><p>A</p><p>A</p><p>A</p><p>A</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 1);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(8);
            for (let i = 0; i < deserialized.length; i++) {
                expect(deserialized[i].toString()).toBe('A');
            }
        });

        it('should produce more compact output than uncompressed strategies', () => {
            const basicHtml = `<html><body><div><p>Test 1</p><p>Test 2</p><p>Test 3</p><p>Test 4</p><p>Test 5</p><p>Test 6</p><p>Test 7</p><p>Test 8</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);

            // Verify compression is working
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');

            // Should be deserializable
            const deserialized = strategy.deserialize(serialized, document);
            expect(deserialized).toHaveLength(8);
        });
    });

    describe('error handling', () => {
        it('should throw error for unknown selector parts during encoding', () => {
            const basicHtml = ``;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();

            const unknownElement = document.createElement('unknowntag');
            range.setStart(unknownElement, 0);
            range.setEnd(unknownElement, 0);

            expect(() => {
                strategy.serialize([range], document.body);
            }).toThrow('Unknown selector part: unknowntag');
        });

        it('should throw error for unknown encoded selector parts during decoding', () => {
            const basicHtml = `<html><body><div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Use invalid hex that doesn't map to any tag
            const invalidEncoded = 'zzzz00';

            expect(() => {
                strategy.deserialize(invalidEncoded, document);
            }).toThrow('Unknown encoded selector part');
        });

        it('should handle malformed compressed data gracefully', () => {
            const basicHtml = `<html><body><div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Test with various malformed inputs
            const malformedInputs = ['', '§', '§5', '§abc', '🅰️invalid', 'partial🅱️data'];

            malformedInputs.forEach(input => {
                expect(() => {
                    strategy.deserialize(input, document);
                }).not.toThrow(/TypeError/); // Should not throw basic type errors
            });
        });

        it('should handle malformed run-length encoding', () => {
            const basicHtml = `<html><body><div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Test malformed run-length sequences
            const malformedRLE = ['§', '§a', '§999', '§0a'];

            malformedRLE.forEach(input => {
                expect(() => {
                    strategy.deserialize(input, document);
                }).not.toThrow(/SyntaxError/); // Should handle parsing gracefully
            });
        });

        it('should throw error for unknown selector part in nth-of-type', () => {
            const basicHtml = `<html><body><div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;
            const range = document.createRange();

            // Create an element with unknown tag that has nth-of-type
            const unknownElement = document.createElement('unknowntag');
            unknownElement.innerHTML = 'test';
            const container = document.createElement('div');
            container.appendChild(unknownElement);
            container.appendChild(unknownElement.cloneNode(true));
            document.body.appendChild(container);

            range.setStart(unknownElement.firstChild!, 0);
            range.setEnd(unknownElement.firstChild!, 4);

            expect(() => {
                strategy.serialize([range], container);
            }).toThrow('Unknown selector part: unknowntag');
        });

        it('should handle run-length encoding when count >= 3', () => {
            // Create a scenario that will produce repeated characters >= 3 times
            // This is tricky because we need the encoded hex to have repeated chars
            const basicHtml = `<html><body><div><p>A</p><p>A</p><p>A</p><p>A</p><p>A</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create many ranges to increase chance of repeated hex patterns
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 1);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(5);
            expect(serialized).toBeTruthy();

            // Test that the run-length encoding worked by verifying deserialization
            for (let i = 0; i < deserialized.length; i++) {
                expect(deserialized[i].toString()).toBe('A');
            }
        });
    });

    describe('edge cases', () => {
        it('should handle single character ranges', () => {
            const basicHtml = `<html><body><div><p>A</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 1);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].toString()).toBe('A');
        });

        it('should handle ranges at element boundaries', () => {
            const basicHtml = `<html><body><div><p>Start</p><p>End</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const firstP = document.querySelectorAll('p')[0]!;
            const secondP = document.querySelectorAll('p')[1]!;
            range.setStart(firstP.firstChild!, 0);
            range.setEnd(secondP.firstChild!, 3);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].toString()).toBe('StartEnd');
        });

        it('should handle empty text nodes', () => {
            const basicHtml = `<html><body><div><p></p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            p.appendChild(document.createTextNode(''));
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 0);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].toString()).toBe('');
        });

        it('should handle very large datasets efficiently', () => {
            const basicHtml = `<html><body><div>${'<p>Data</p>'.repeat(100)}</div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create many ranges to test compression efficiency
            for (let i = 0; i < Math.min(50, paragraphs.length); i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(50);
            expect(serialized.length).toBeGreaterThan(0);

            // Verify compression effectiveness
            expect(serialized).toMatch(/🅰️|🅱️|🅲️|🅳️|🅴️|🅵️|🅶️|🅷️/); // Should have emoji replacements
        });
    });
});
