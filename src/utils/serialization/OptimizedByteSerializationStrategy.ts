import { HTML_TAG_BYTE_MAP } from '../../constants';
import { HtmlElementSelectorResult } from '../../types/HtmlElementSelectorResult';
import { SerializationStrategy } from '../../types/SerializationStrategy';
import { findNodeBySelector } from '../findNodeBySelector';
import { generateSelector } from '../generateSelector';

const NTH_OF_TYPE_MARKER = 0xff;

export class OptimizedByteSerializationStrategy implements SerializationStrategy {
    private tagToByteCache = new Map<string, number>();
    private byteToTagCache = new Map<number, string>();
    private selectorCache = new Map<Node, string>();
    private hexCache = new Map<number, string>();

    constructor() {
        // Pre-populate caches to avoid runtime map lookups
        this.initializeCaches();
    }

    serialize(ranges: Range[], relativeTo: HTMLElement): string {
        if (ranges.length === 0) {
            return '';
        }

        const parts: string[] = new Array(ranges.length);

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const startEncoded = this.fastEncodeSelector(range.startContainer, range.startOffset, relativeTo);
            const endEncoded = this.fastEncodeSelector(range.endContainer, range.endOffset, relativeTo);
            parts[i] = `${startEncoded}/${endEncoded}`;
        }

        return parts.join('|');
    }

    deserialize(result: string, document: Document): Range[] {
        if (!result) {
            return [];
        }

        const serializedRanges = result.split('|');
        const ranges: Range[] = new Array(serializedRanges.length);

        for (let i = 0; i < serializedRanges.length; i++) {
            const parts = serializedRanges[i].split('/');
            const start = this.fastDecodeSelector(parts[0]);
            const end = this.fastDecodeSelector(parts[1]);
            const resultRange = document.createRange();

            const startNode = findNodeBySelector(start, document);
            const endNode = findNodeBySelector(end, document);
            if (startNode) {
                resultRange.setStart(startNode, start.o);
            }
            if (endNode) {
                resultRange.setEnd(endNode, end.o);
            }

            ranges[i] = resultRange;
        }

        return ranges;
    }

    private initializeCaches(): void {
        // Pre-populate tag caches
        // eslint-disable-next-line no-restricted-syntax
        for (const [tag, byte] of Object.entries(HTML_TAG_BYTE_MAP)) {
            this.tagToByteCache.set(tag, byte);
            this.byteToTagCache.set(byte, tag);
        }

        // Pre-populate common hex values (0-255)
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
        // Pre-split selector parts to avoid regex
        const parts = selector.split('>');
        const encodedParts: string[] = new Array(parts.length);

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const nthTypeIndex = part.indexOf(':nth-of-type(');

            if (nthTypeIndex === -1) {
                // Simple tag
                const byteValue = this.tagToByteCache.get(part);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${part}`);
                }
                encodedParts[i] = this.hexCache.get(byteValue)!;
            } else {
                // Tag with nth-of-type
                const tagName = part.substring(0, nthTypeIndex);
                const nthStart = nthTypeIndex + 13; // ':nth-of-type('.length
                const nthEnd = part.indexOf(')', nthStart);
                const nthValue = parseInt(part.substring(nthStart, nthEnd), 10);

                const byteValue = this.tagToByteCache.get(tagName);
                if (byteValue === undefined) {
                    throw new Error(`Unknown selector part: ${tagName}`);
                }

                const markerHex = this.hexCache.get(NTH_OF_TYPE_MARKER)!;
                const nthHex = nthValue <= 255 && !Number.isNaN(nthValue) ? this.hexCache.get(nthValue)! : nthValue.toString(16).padStart(2, '0');
                encodedParts[i] = this.hexCache.get(byteValue)! + markerHex + nthHex;
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

        // Process selector part (all but last 4 characters which are offset + c)
        while (i < encodedLength - 4) {
            const hexValue = encoded.substring(i, i + 2);
            const byteValue = parseInt(hexValue, 16);

            if (byteValue === NTH_OF_TYPE_MARKER) {
                // Handle nth-of-type
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

        // Extract offset and c values
        const offset = parseInt(encoded.substring(encodedLength - 4, encodedLength - 2), 16);
        const c = parseInt(encoded.substring(encodedLength - 2), 16);

        return { s: selector, o: offset, c };
    }
}
