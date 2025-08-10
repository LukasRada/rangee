/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
import { HTML_TAG_BYTE_MAP } from '../../constants';
import { HtmlElementSelectorResult } from '../../types/HtmlElementSelectorResult';
import { SerializationStrategy } from '../../types/SerializationStrategy';
import { findNodeBySelector } from '../findNodeBySelector';
import { generateSelector } from '../generateSelector';

const NTH_OF_TYPE_MARKER = 0xff;

export class UltraOptimizedSerializationStrategy implements SerializationStrategy {
    private tagToByteCache = new Map<string, number>();
    private byteToTagCache = new Map<number, string>();
    private selectorCache = new Map<Node, string>();
    private compressionDict = new Map<string, number>();
    private decompressionDict = new Map<number, string>();

    constructor() {
        this.initializeCaches();
    }

    serialize(ranges: Range[], relativeTo: HTMLElement): string {
        if (ranges.length === 0) {
            return '';
        }

        // First pass: collect all selector parts for compression dictionary
        const allParts: string[] = [];
        const rangeData: Array<{ start: HtmlElementSelectorResult; end: HtmlElementSelectorResult }> = [];

        for (const range of ranges) {
            const start = this.getCachedSelectorResult(range.startContainer, relativeTo);
            start.o = range.startOffset;
            const end = this.getCachedSelectorResult(range.endContainer, relativeTo);
            end.o = range.endOffset;

            rangeData.push({ start, end });

            const startEncoded = this.directBinaryEncode(start.s, start.o, start.c);
            const endEncoded = this.directBinaryEncode(end.s, end.o, end.c);

            allParts.push(startEncoded, endEncoded);
        }

        // Build compression dictionary from common patterns
        this.buildCompressionDict(allParts);

        // Second pass: compress using dictionary + XOR + delta encoding
        return this.compressWithAdvancedTechniques(allParts);
    }

    deserialize(result: string, document: Document): Range[] {
        if (!result) {
            return [];
        }

        const decodedParts = this.decompressWithAdvancedTechniques(result);
        const ranges: Range[] = [];

        for (let i = 0; i < decodedParts.length; i += 2) {
            const start = this.directBinaryDecode(decodedParts[i]);
            const end = this.directBinaryDecode(decodedParts[i + 1]);
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

    private directBinaryEncode(selector: string, offset: number, childIndex: number = 0): string {
        const parts = selector.split('>');
        const bytes: number[] = [];

        for (const part of parts) {
            const nthTypeIndex = part.indexOf(':nth-of-type(');

            if (nthTypeIndex === -1) {
                const byteValue = this.tagToByteCache.get(part);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${part}`);
                }
                bytes.push(byteValue);
            } else {
                const tagName = part.substring(0, nthTypeIndex);
                const nthStart = nthTypeIndex + 13;
                const nthEnd = part.indexOf(')', nthStart);
                const nthValue = parseInt(part.substring(nthStart, nthEnd), 10);

                const byteValue = this.tagToByteCache.get(tagName);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${tagName}`);
                }

                bytes.push(byteValue, NTH_OF_TYPE_MARKER, nthValue);
            }
        }

        bytes.push(offset, childIndex);

        // Convert to compact base64-like encoding
        return this.bytesToCompactString(bytes);
    }

    private directBinaryDecode(encoded: string): HtmlElementSelectorResult {
        const bytes = this.compactStringToBytes(encoded);
        if (bytes.length < 2) {
            throw new Error('Invalid encoded data: too short');
        }

        // Extract offset and childIndex (last 2 bytes)
        const offset = bytes[bytes.length - 2];
        const childIndex = bytes[bytes.length - 1];

        // Process selector bytes (all bytes except the last 2)
        let selector = '';
        let i = 0;
        const selectorBytesEnd = bytes.length - 2;

        while (i < selectorBytesEnd) {
            const byteValue = bytes[i];
            if (byteValue === NTH_OF_TYPE_MARKER) {
                // This is an nth-of-type marker, append to previous tag
                if (i + 1 < selectorBytesEnd) {
                    const nthIndex = bytes[i + 1];
                    selector += `:nth-of-type(${nthIndex})`;
                    i += 2; // Skip marker and nth value
                } else {
                    // Invalid: marker without value, skip it
                    i++;
                }
            } else {
                const tag = this.byteToTagCache.get(byteValue);
                if (!tag) {
                    throw new Error(`Unknown encoded selector part: ${byteValue}`);
                }
                // Add separator if this isn't the first tag
                if (selector) {
                    selector += '>';
                }
                selector += tag;
                i++; // Move to next byte
            }
        }

        return { s: selector, o: offset, c: childIndex };
    }

    private bytesToCompactString(bytes: number[]): string {
        // Use base64-like encoding but store the byte count as the first character
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let result = chars[bytes.length]; // Store byte count in first character

        for (let i = 0; i < bytes.length; i += 3) {
            const b1 = bytes[i] || 0;
            const b2 = bytes[i + 1] || 0;
            const b3 = bytes[i + 2] || 0;

            const combined = (b1 << 16) | (b2 << 8) | b3;

            result += chars[(combined >> 18) & 63];
            result += chars[(combined >> 12) & 63];
            result += chars[(combined >> 6) & 63];
            result += chars[combined & 63];
        }

        return result;
    }

    private compactStringToBytes(encoded: string): number[] {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const bytes: number[] = [];

        // First character encodes the expected byte count
        const expectedByteCount = chars.indexOf(encoded[0]);

        for (let i = 1; i < encoded.length; i += 4) {
            const c1 = encoded[i] ? chars.indexOf(encoded[i]) : 0;
            const c2 = encoded[i + 1] ? chars.indexOf(encoded[i + 1]) : 0;
            const c3 = encoded[i + 2] ? chars.indexOf(encoded[i + 2]) : 0;
            const c4 = encoded[i + 3] ? chars.indexOf(encoded[i + 3]) : 0;

            const combined = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;

            if (bytes.length < expectedByteCount) bytes.push((combined >> 16) & 255);
            if (bytes.length < expectedByteCount) bytes.push((combined >> 8) & 255);
            if (bytes.length < expectedByteCount) bytes.push(combined & 255);
        }

        return bytes;
    }

    private buildCompressionDict(parts: string[]): void {
        const patternCounts = new Map<string, number>();

        // Find common patterns of various lengths
        for (const part of parts) {
            for (let len = 2; len <= Math.min(part.length, 8); len++) {
                for (let start = 0; start <= part.length - len; start++) {
                    const pattern = part.substring(start, start + len);
                    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
                }
            }
        }

        // Build compression dictionary from most frequent patterns
        this.compressionDict.clear();
        this.decompressionDict.clear();

        let dictIndex = 1; // Start from 1, reserve 0 for special cases

        [...patternCounts.entries()]
            .filter(([pattern, count]) => count >= 2 && pattern.length >= 2)
            .sort((a, b) => b[1] * b[0].length - a[1] * a[0].length) // Sort by potential savings
            .slice(0, 200) // Limit dictionary size
            .forEach(([pattern]) => {
                this.compressionDict.set(pattern, dictIndex);
                this.decompressionDict.set(dictIndex, pattern);
                dictIndex++;
            });
    }

    private compressWithAdvancedTechniques(parts: string[]): string {
        // 1. Dictionary compression
        const dictCompressed = parts.map(part => this.applyDictionaryCompression(part));

        // 2. XOR compression for similar patterns
        const xorCompressed = this.applyXORCompression(dictCompressed);

        // 3. Variable length encoding
        const vlEncoded = this.applyVariableLengthEncoding(xorCompressed);

        return vlEncoded;
    }

    private decompressWithAdvancedTechniques(compressed: string): string[] {
        // Reverse the compression steps
        const vlDecoded = this.decodeVariableLengthEncoding(compressed);
        const xorDecompressed = this.reverseXORCompression(vlDecoded);
        const dictDecompressed = xorDecompressed.map(part => this.applyDictionaryDecompression(part));

        return dictDecompressed;
    }

    private applyDictionaryCompression(part: string): string {
        let compressed = part;

        // Replace patterns with dictionary references (longest first)
        const sortedPatterns = [...this.compressionDict.entries()].sort((a, b) => b[0].length - a[0].length);

        for (const [pattern, index] of sortedPatterns) {
            const marker = String.fromCharCode(256 + index); // Use high Unicode chars
            compressed = compressed.split(pattern).join(marker);
        }

        return compressed;
    }

    private applyDictionaryDecompression(part: string): string {
        let decompressed = part;

        for (const [index, pattern] of this.decompressionDict.entries()) {
            const marker = String.fromCharCode(256 + index);
            decompressed = decompressed.split(marker).join(pattern);
        }

        return decompressed;
    }

    private applyXORCompression(parts: string[]): string[] {
        if (parts.length < 2) return parts;

        const xorCompressed = [parts[0]]; // First part stays as-is

        for (let i = 1; i < parts.length; i++) {
            const prev = parts[i - 1];
            const curr = parts[i];
            const xored = this.xorStrings(prev, curr);
            xorCompressed.push(xored);
        }

        return xorCompressed;
    }

    private reverseXORCompression(parts: string[]): string[] {
        if (parts.length < 2) return parts;

        const restored = [parts[0]]; // First part stays as-is

        for (let i = 1; i < parts.length; i++) {
            const prev = restored[i - 1];
            const xored = parts[i];
            const original = this.xorStrings(prev, xored);
            restored.push(original);
        }

        return restored;
    }

    private xorStrings(str1: string, str2: string): string {
        const maxLen = Math.max(str1.length, str2.length);
        let result = '';

        for (let i = 0; i < maxLen; i++) {
            const char1 = i < str1.length ? str1.charCodeAt(i) : 0;
            const char2 = i < str2.length ? str2.charCodeAt(i) : 0;
            result += String.fromCharCode(char1 ^ char2);
        }

        return result;
    }

    private applyVariableLengthEncoding(parts: string[]): string {
        // Simple run-length encoding for repeated characters
        let encoded = '';

        for (const part of parts) {
            let compressed = '';
            let i = 0;

            while (i < part.length) {
                const char = part[i];
                let count = 1;

                while (i + count < part.length && part[i + count] === char) {
                    count++;
                }

                if (count > 3) {
                    compressed += `~${count}${char}`;
                } else {
                    compressed += char.repeat(count);
                }

                i += count;
            }

            encoded += `${compressed}|`;
        }

        return encoded.slice(0, -1); // Remove last separator
    }

    private decodeVariableLengthEncoding(encoded: string): string[] {
        const parts = encoded.split('|');

        return parts.map(part => {
            let decoded = '';
            let i = 0;

            while (i < part.length) {
                if (part[i] === '~') {
                    // Parse run-length encoding
                    let numStr = '';
                    i++; // Skip ~

                    while (i < part.length && part[i] >= '0' && part[i] <= '9') {
                        numStr += part[i];
                        i++;
                    }

                    const count = parseInt(numStr, 10);
                    const char = part[i];
                    decoded += char.repeat(count);
                    i++;
                } else {
                    decoded += part[i];
                    i++;
                }
            }

            return decoded;
        });
    }
}
