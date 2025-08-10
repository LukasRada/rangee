/* eslint-disable no-restricted-syntax */
import { HTML_TAG_BYTE_MAP } from '../../constants';
import { HtmlElementSelectorResult } from '../../types/HtmlElementSelectorResult';
import { SerializationStrategy } from '../../types/SerializationStrategy';
import { findNodeBySelector } from '../findNodeBySelector';
import { generateSelector } from '../generateSelector';

const NTH_OF_TYPE_MARKER = 0xff;

export class CompressedByteSerializationStrategy implements SerializationStrategy {
    private tagToByteCache = new Map<string, number>();
    private byteToTagCache = new Map<number, string>();
    private selectorCache = new Map<Node, string>();
    private hexCache = new Map<number, string>();

    constructor() {
        this.initializeCaches();
    }

    serialize(ranges: Range[], relativeTo: HTMLElement): string {
        if (ranges.length === 0) {
            return '';
        }

        const parts: string[] = [];

        for (const range of ranges) {
            const startEncoded = this.fastEncodeSelector(range.startContainer, range.startOffset, relativeTo);
            const endEncoded = this.fastEncodeSelector(range.endContainer, range.endOffset, relativeTo);
            parts.push(`${startEncoded}/${endEncoded}`);
        }

        const joined = parts.join('|');

        // Apply simple compression techniques
        return this.applySimpleCompression(joined);
    }

    deserialize(result: string, document: Document): Range[] {
        if (!result) {
            return [];
        }

        // Decompress first
        const decompressed = this.reverseSimpleCompression(result);

        const serializedRanges = decompressed.split('|');
        const ranges: Range[] = [];

        for (const serializedRange of serializedRanges) {
            const [startSerialized, endSerialized] = serializedRange.split('/');
            const start = this.fastDecodeSelector(startSerialized);
            const end = this.fastDecodeSelector(endSerialized);
            const resultRange = document.createRange();

            const startNode = findNodeBySelector(start, document);
            const endNode = findNodeBySelector(end, document);
            if (startNode) {
                resultRange.setStart(startNode, start.o);
            }
            if (endNode) {
                resultRange.setEnd(endNode, end.o);
            }

            ranges.push(resultRange);
        }

        return ranges;
    }

    private initializeCaches(): void {
        for (const [tag, byte] of Object.entries(HTML_TAG_BYTE_MAP)) {
            this.tagToByteCache.set(tag, byte);
            this.byteToTagCache.set(byte, tag);
        }

        for (let i = 0; i <= 255; i++) {
            this.hexCache.set(i, i.toString(16).padStart(2, '0'));
        }
    }

    private fastEncodeSelector(node: Node, offset: number, relativeTo: HTMLElement): string {
        const selectorResult = this.getCachedSelectorResult(node, relativeTo);
        selectorResult.o = offset;
        return this.directHexEncode(selectorResult.s, selectorResult.o, selectorResult.c);
    }

    private getCachedSelectorResult(node: Node, relativeTo: HTMLElement): HtmlElementSelectorResult {
        if (this.selectorCache.has(node)) {
            const cached = this.selectorCache.get(node)!;
            const parts = cached.split('|');
            const childIndex = parts[1] ? parseInt(parts[1], 10) : 0;
            return { s: parts[0], c: Number.isNaN(childIndex) ? 0 : childIndex, o: 0 };
        }

        const selectorResult = generateSelector(node, relativeTo);
        const childIndex = selectorResult.c || 0;
        this.selectorCache.set(node, `${selectorResult.s}|${childIndex}`);
        return { ...selectorResult, c: childIndex };
    }

    private directHexEncode(selector: string, offset: number, childIndex: number = 0): string {
        const parts = selector.split('>');
        const encodedParts: string[] = [];

        for (const part of parts) {
            const nthTypeIndex = part.indexOf(':nth-of-type(');

            if (nthTypeIndex === -1) {
                const byteValue = this.tagToByteCache.get(part);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${part}`);
                }
                encodedParts.push(this.hexCache.get(byteValue)!);
            } else {
                const tagName = part.substring(0, nthTypeIndex);
                const nthStart = nthTypeIndex + 13;
                const nthEnd = part.indexOf(')', nthStart);
                const nthValue = parseInt(part.substring(nthStart, nthEnd), 10);

                const byteValue = this.tagToByteCache.get(tagName);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${tagName}`);
                }

                const markerHex = this.hexCache.get(NTH_OF_TYPE_MARKER)!;
                const nthHex = nthValue <= 255 && !Number.isNaN(nthValue) ? this.hexCache.get(nthValue)! : nthValue.toString(16).padStart(2, '0');
                encodedParts.push(this.hexCache.get(byteValue)! + markerHex + nthHex);
            }
        }

        const encodedSelector = encodedParts.join('');
        const offsetHex = offset <= 255 ? this.hexCache.get(offset)! : offset.toString(16).padStart(2, '0');
        const childIndexHex = childIndex <= 255 ? this.hexCache.get(childIndex)! : childIndex.toString(16).padStart(2, '0');
        return encodedSelector + offsetHex + childIndexHex;
    }

    private fastDecodeSelector(encoded: string): HtmlElementSelectorResult {
        let selector = '';
        let i = 0;
        const encodedLength = encoded.length;

        while (i < encodedLength - 4) {
            const hexValue = encoded.substring(i, i + 2);
            const byteValue = parseInt(hexValue, 16);

            if (byteValue === NTH_OF_TYPE_MARKER) {
                i += 2;
                const nthIndex = parseInt(encoded.substring(i, i + 2), 16);
                selector += `:nth-of-type(${nthIndex})`;
            } else {
                const tag = this.byteToTagCache.get(byteValue);
                if (!tag) {
                    throw new Error(`Unknown encoded selector part: ${hexValue}`);
                }
                selector += (selector ? '>' : '') + tag;
            }
            i += 2;
        }

        const offset = parseInt(encoded.substring(encodedLength - 4, encodedLength - 2), 16);
        const c = parseInt(encoded.substring(encodedLength - 2), 16);

        return { s: selector, o: offset, c };
    }

    private applySimpleCompression(data: string): string {
        // 1. Replace common patterns with shorter representations
        const patterns = [
            ['0924', '🅰️'], // body>div appears frequently
            ['092418', '🅱️'], // body>div>p
            ['0924243b', '🅲️'], // body>div>div>span
            ['ff02', '🅳️'], // nth-of-type(2)
            ['ff03', '🅴️'], // nth-of-type(3)
            ['0000', '🅵️'], // offset 0, childIndex 0 (very common)
            ['0500', '🅶️'], // offset 5, childIndex 0
            ['0a00', '🅷️'], // offset 10, childIndex 0
        ];

        let compressed = data;
        for (const [pattern, replacement] of patterns) {
            compressed = compressed.split(pattern).join(replacement);
        }

        // 2. Apply run-length encoding for repeated characters
        compressed = this.applyRunLengthEncoding(compressed);

        return compressed;
    }

    private reverseSimpleCompression(compressed: string): string {
        // 1. Reverse run-length encoding
        let data = this.reverseRunLengthEncoding(compressed);

        // 2. Restore patterns (reverse order)
        const patterns = [
            ['🅰️', '0924'],
            ['🅱️', '092418'],
            ['🅲️', '0924243b'],
            ['🅳️', 'ff02'],
            ['🅴️', 'ff03'],
            ['🅵️', '0000'],
            ['🅶️', '0500'],
            ['🅷️', '0a00'],
        ];

        for (const [replacement, pattern] of patterns) {
            data = data.split(replacement).join(pattern);
        }

        return data;
    }

    private applyRunLengthEncoding(data: string): string {
        let result = '';
        let i = 0;

        while (i < data.length) {
            const char = data[i];
            let count = 1;

            while (i + count < data.length && data[i + count] === char) {
                count++;
            }

            if (count >= 3) {
                result += `§${count}${char}`;
            } else {
                result += char.repeat(count);
            }

            i += count;
        }

        return result;
    }

    private reverseRunLengthEncoding(data: string): string {
        let result = '';
        let i = 0;

        while (i < data.length) {
            if (data[i] === '§') {
                i++; // Skip §
                let countStr = '';

                while (i < data.length && data[i] >= '0' && data[i] <= '9') {
                    countStr += data[i];
                    i++;
                }

                const count = parseInt(countStr, 10);
                const char = data[i];
                result += char.repeat(count);
                i++;
            } else {
                result += data[i];
                i++;
            }
        }

        return result;
    }
}
