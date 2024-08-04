import { DOM_NODE_TEXT_NODE } from '../constants';
import { RangeSerialized } from '../types/RangeSerialized';
import { findNodeBySelector } from './findNodeBySelector';

export const deserialize = (result: RangeSerialized, document: Document): Range => {
    const range = document.createRange();
    let startNode = findNodeBySelector(result.s, document);
    let endNode = findNodeBySelector(result.e, document);

    if (startNode.nodeType !== DOM_NODE_TEXT_NODE && startNode.firstChild) {
        startNode = startNode.firstChild;
    }
    if (endNode.nodeType !== DOM_NODE_TEXT_NODE && endNode.firstChild) {
        endNode = endNode.firstChild;
    }
    if (startNode) {
        range.setStart(startNode, result.s.o);
    }
    if (endNode) {
        range.setEnd(endNode, result.e.o);
    }

    return range;
};
