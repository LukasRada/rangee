import { HtmlElementSelectorResult } from '../../types/HtmlElementSelectorResult';
import { RangeSerialized } from '../../types/RangeSerialized';
import { SerializationStrategy } from '../../types/SerializationStrategy';
import { findNodeBySelector } from '../findNodeBySelector';
import { generateSelector } from '../generateSelector';

export class DefaultSerializationStrategy implements SerializationStrategy {
    serialize(ranges: Range[], relativeTo: HTMLElement): string {
        if (ranges.length === 0) {
            return '{}';
        }
        return ranges
            .map(range => {
                const start = generateSelector(range.startContainer, relativeTo);
                start.o = range.startOffset;
                const end = generateSelector(range.endContainer, relativeTo);
                end.o = range.endOffset;
                return JSON.stringify({ s: start, e: end });
            })
            .join('|');
    }

    deserialize(serialized: string, document: Document): Range[] {
        return serialized
            .split('|')
            .map(serialized => JSON.parse(serialized) as RangeSerialized | HtmlElementSelectorResult)
            .map(range => {
                const resultRange = document.createRange();
                if (this.isRangeSerialized(range) && range.s.s && range.e.s) {
                    // start & end node
                    const startNode = findNodeBySelector(range.s, document);
                    const endNode = findNodeBySelector(range.e, document);
                    if (startNode) {
                        resultRange.setStart(startNode, range.s.o);
                    }
                    if (endNode) {
                        resultRange.setEnd(endNode, range.e.o);
                    }
                }
                return resultRange;
            });
    }

    private isRangeSerialized(range: RangeSerialized | HtmlElementSelectorResult): range is RangeSerialized {
        return (range as RangeSerialized).s !== undefined && (range as RangeSerialized).e !== undefined;
    }
}
