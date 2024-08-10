import { DOM_NODE_TEXT_NODE } from '../../constants';
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
                    let startNode = findNodeBySelector(range.s, document);
                    let endNode = findNodeBySelector(range.e, document);
                    if (startNode.nodeType !== DOM_NODE_TEXT_NODE && startNode.firstChild) {
                        startNode = startNode.firstChild;
                    }
                    if (endNode.nodeType !== DOM_NODE_TEXT_NODE && endNode.firstChild) {
                        endNode = endNode.firstChild;
                    }
                    if (startNode) {
                        resultRange.setStart(startNode, range.s.o);
                    }
                    if (endNode) {
                        resultRange.setEnd(endNode, range.e.o);
                    }
                }
                // TODO: Consider to handle single node Range
                // if (this.isHtmlElementSelectorResult(range)) {
                //     // single node
                //     const element = document.querySelector(range.s);
                //     if (!element) {
                //         // TODO: Create RangeeError and throw here
                //         throw new Error(`Unable to find element with selector: ${range.s}`);
                //     }
                //     if (range.c !== undefined && range.c !== null) {
                //         const child = element.childNodes[range.c];
                //         resultRange.setStart(child, range.o);
                //         resultRange.setEnd(child, range.o);
                //     }
                // }
                return resultRange;
            });
    }

    private isRangeSerialized(range: RangeSerialized | HtmlElementSelectorResult): range is RangeSerialized {
        return (range as RangeSerialized).s !== undefined && (range as RangeSerialized).e !== undefined;
    }

    private isHtmlElementSelectorResult(range: RangeSerialized | HtmlElementSelectorResult): range is HtmlElementSelectorResult {
        return (range as HtmlElementSelectorResult).s !== undefined && (range as HtmlElementSelectorResult).o !== undefined;
    }
}
