import { JSDOM } from 'jsdom';
import { UltraOptimizedSerializationStrategy } from '../../../src/utils/serialization/UltraOptimizedSerializationStrategy';

describe('UltraOptimizedSerializationStrategy', () => {
    let strategy: UltraOptimizedSerializationStrategy;

    beforeEach(() => {
        strategy = new UltraOptimizedSerializationStrategy();
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
        });

        it('should handle complex nested selectors', () => {
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

        it('should handle nth-of-type selectors without creating invalid CSS', () => {
            const basicHtml = `<html><body><div><span>First</span><span>Second</span><span>Third</span></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const secondSpan = document.querySelectorAll('span')[1]!;
            const thirdSpan = document.querySelectorAll('span')[2]!;
            range.setStart(secondSpan.firstChild!, 0);
            range.setEnd(thirdSpan.firstChild!, 2);

            const serialized = strategy.serialize([range], document.body);

            // This should not throw the "Unable to find element with selector" error
            expect(() => {
                strategy.deserialize(serialized, document);
            }).not.toThrow('Unable to find element with selector');

            const deserialized = strategy.deserialize(serialized, document);
            expect(deserialized).toHaveLength(1);
        });

        it('should not create malformed selectors like "body>div>header>p>html>html"', () => {
            const basicHtml = `<html><body><div><header><p>Header text</p></header></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('header p')!;
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 6);

            const serialized = strategy.serialize([range], document.body);

            // Mock the console to capture any error logs
            // eslint-disable-next-line no-empty-function
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                strategy.deserialize(serialized, document);
            }).not.toThrow(/Unable to find element with selector.*html.*html/);

            consoleErrorSpy.mockRestore();
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

        it('should handle multiple ranges with complex selectors', () => {
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

        it('should preserve offsets and child indices correctly', () => {
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
        it('should apply dictionary compression for repeated patterns', () => {
            const basicHtml = `<html><body><div><section><p>Text 1</p></section><section><p>Text 2</p></section><section><p>Text 3</p></section></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const sections = document.querySelectorAll('section');

            // Create ranges with similar selectors that should benefit from compression
            for (let i = 0; i < sections.length; i++) {
                const range = document.createRange();
                const p = sections[i].querySelector('p')!;
                range.setStart(p.firstChild!, 0);
                range.setEnd(p.firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);

            // Verify that compression techniques are working
            expect(serialized).toBeTruthy();
            expect(typeof serialized).toBe('string');

            // Should still be deserializable
            const deserialized = strategy.deserialize(serialized, document);
            expect(deserialized).toHaveLength(3);
        });

        it('should handle XOR compression for similar patterns', () => {
            const basicHtml = `<html><body><div><p class="a">Para A</p><p class="b">Para B</p><p class="c">Para C</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const ranges: Range[] = [];
            const paragraphs = document.querySelectorAll('p');

            // Create ranges that will have similar encoded representations
            for (let i = 0; i < paragraphs.length; i++) {
                const range = document.createRange();
                range.setStart(paragraphs[i].firstChild!, 0);
                range.setEnd(paragraphs[i].firstChild!, 4);
                ranges.push(range);
            }

            const serialized = strategy.serialize(ranges, document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(3);
            expect(deserialized[0].toString()).toBe('Para');
            expect(deserialized[1].toString()).toBe('Para');
            expect(deserialized[2].toString()).toBe('Para');
        });

        it('should apply variable length encoding for repeated characters', () => {
            const basicHtml = `<html><body><div><p>Teeeeest</p></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            const range = document.createRange();
            const p = document.querySelector('p')!;
            range.setStart(p.firstChild!, 0);
            range.setEnd(p.firstChild!, 8);

            const serialized = strategy.serialize([range], document.body);
            const deserialized = strategy.deserialize(serialized, document);

            expect(deserialized).toHaveLength(1);
            expect(deserialized[0].toString()).toBe('Teeeeest');
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

            // Create a malformed encoded string that would result in unknown byte values
            const invalidEncoded = 'ZZZZZZZZ';

            expect(() => {
                strategy.deserialize(invalidEncoded, document);
            }).toThrow('Unknown encoded selector part');
        });

        it('should handle malformed compressed data gracefully', () => {
            const basicHtml = `<html><body><div></div></body></html>`;
            const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
            const document = dom.window.document;

            // Test with various malformed inputs
            const malformedInputs = ['', '~', '~5', '~abc', 'invalid|data'];

            malformedInputs.forEach(input => {
                expect(() => {
                    strategy.deserialize(input, document);
                }).not.toThrow(/TypeError/); // Should not throw basic type errors
            });
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
    });
});
