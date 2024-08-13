import { BYTE_HTML_TAG_MAP, HTML_TAG_BYTE_MAP } from '../../constants';
import { HtmlElementSelectorResult } from '../../types/HtmlElementSelectorResult';
import { SerializationStrategy } from '../../types/SerializationStrategy';
import { findNodeBySelector } from '../findNodeBySelector';
import { generateSelector } from '../generateSelector';

const NTH_OF_TYPE_MARKER = 0xff;
const NTH_OF_TYPE_REGEX = /:nth-of-type\((\d+)\)/;

export class ByteSerializationStrategy implements SerializationStrategy {
    serialize(ranges: Range[], relativeTo: HTMLElement): string {
        if (ranges.length === 0) {
            return '';
        }
        return ranges
            .map(range => {
                const start = generateSelector(range.startContainer, relativeTo);
                start.o = range.startOffset;
                const end = generateSelector(range.endContainer, relativeTo);
                end.o = range.endOffset;
                return `${this.encodeSelectorWithCO(start.s, start.o, start.c)}/${this.encodeSelectorWithCO(end.s, end.o, end.c)}`;
            })
            .join('|');
    }
    deserialize(result: string, document: Document): Range[] {
        if (!result) {
            return [];
        }

        return result.split('|').map(serializedRange => {
            const [startSerialized, endSerialized] = serializedRange.split('/');
            const start = this.decodeSelectorWithCO(startSerialized);
            const end = this.decodeSelectorWithCO(endSerialized);
            const resultRange = document.createRange();

            const startNode = findNodeBySelector(start, document);
            const endNode = findNodeBySelector(end, document);
            // TODO: Consider to remove it? When is this necessary?
            // if (startNode && startNode.nodeType !== DOM_NODE_TEXT_NODE && startNode.firstChild) {
            //     startNode = startNode.firstChild;
            // }
            // if (endNode && endNode.nodeType !== DOM_NODE_TEXT_NODE && endNode.firstChild) {
            //     endNode = endNode.firstChild;
            // }
            if (startNode) {
                resultRange.setStart(startNode, start.o);
            }
            if (endNode) {
                resultRange.setEnd(endNode, end.o);
            }

            return resultRange;
        });
    }

    encodeSelectorWithCO(selector: string, o: number, c?: number): string {
        const encodedSelector = selector
            .split('>')
            .map(part => {
                const [tagName, nthOfType] = part.split(NTH_OF_TYPE_REGEX).filter(Boolean);
                const hexValue = HTML_TAG_BYTE_MAP[tagName];
                if (hexValue === undefined) {
                    throw new Error(`Unknown selector part: ${tagName}`);
                }
                if (nthOfType === undefined) {
                    return hexValue.toString(16).padStart(2, '0');
                }
                return [hexValue, NTH_OF_TYPE_MARKER, parseInt(nthOfType, 10)].map(b => b.toString(16).padStart(2, '0')).join('');
            })
            .join('');

        const oHex = o.toString(16).padStart(2, '0');
        const cHex = c?.toString(16)?.padStart(2, '0') ?? '';

        return `${encodedSelector}${oHex}${cHex}`;
    }

    decodeSelectorWithCO(encoded: string): HtmlElementSelectorResult {
        let selector = '';
        let i = 0;
        while (i < encoded.length - 4) {
            const hexValue = encoded.substring(i, i + 2);
            const byteValue = parseInt(hexValue, 16);

            if (byteValue === 0xff) {
                // Handle nth-of-type
                i += 2; // Move to the next byte which represents the nth index
                const nthIndex = parseInt(encoded.substring(i, i + 2), 16);
                selector += `:nth-of-type(${nthIndex})`;
            } else {
                const tag = BYTE_HTML_TAG_MAP[byteValue];
                if (!tag) {
                    throw new Error(`Unknown encoded selector part: ${hexValue}`);
                }
                selector += (selector ? '>' : '') + tag;
            }
            i += 2;
        }
        const offset = parseInt(encoded.substring(encoded.length - 4, encoded.length - 2), 16);
        const c = parseInt(encoded.substring(encoded.length - 2), 16);

        return { s: selector, o: offset, c };
    }
}
