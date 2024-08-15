import { DefaultSerializationStrategy } from '../../../src/utils/serialization/DefaultSerializationStrategy';
import { JSDOM } from 'jsdom';

describe('DefaultSerializationStrategy', () => {
    jest.clearAllMocks();
    let strategy: DefaultSerializationStrategy;
    let doc: Document;

    beforeEach(() => {
        strategy = new DefaultSerializationStrategy();
        doc = new JSDOM().window.document;
    });

    it('should not update startNode if it is a text node', () => {
        // Create a parent node
        const parentNode = doc.createElement('div');

        // Create a text node for startNode directly
        const startWrapperNode = doc.createElement('p');
        const startNode = doc.createTextNode('Start Text');
        startWrapperNode.appendChild(startNode);
        const endWrapperNode = doc.createElement('p');
        const endNode = doc.createTextNode('End Text');
        endWrapperNode.appendChild(endNode);

        // Append to parent node
        parentNode.appendChild(startWrapperNode);
        parentNode.appendChild(endWrapperNode);
        doc.body.appendChild(parentNode);

        // Serialize the range
        const range = doc.createRange();
        range.setStart(startNode, 0);
        range.setEnd(endNode, 0);

        const serializedString = strategy.serialize([range], parentNode);

        const deserializedRanges = strategy.deserialize(serializedString, doc);

        expect(deserializedRanges.length).toBe(1);
        const deserializedRange = deserializedRanges[0];

        expect(deserializedRange.startContainer).toBe(startNode);
        expect(deserializedRange.endContainer).toBe(endNode);
        expect(deserializedRange.startOffset).toBe(0);
        expect(deserializedRange.endOffset).toBe(0);
    });
});
