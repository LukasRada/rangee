import { DOM_NODE_FILTER_ACCEPT, DOM_NODE_FILTER_SHOW_ALL, DOM_NODE_TEXT_NODE } from './constants';
import { RangeSerialized } from './types/RangeSerialized';
import { RangeeOptions } from './types/RangeeOptions';
import { compress } from './utils/compress';
import { decode } from './utils/decode';
import { decompress } from './utils/decompress';
import { deserialize } from './utils/deserialize';
import { encode } from './utils/encode';
import { serialize } from './utils/serialize';

// TODO: Implement debug mode with nice debug line log

export class Rangee {
    private options: Readonly<RangeeOptions>;
    private serializationCallback: ((serialized: string) => void) | null;
    private compressionCallback: ((compressed: Uint8Array) => void) | null;

    constructor(options: RangeeOptions) {
        this.options = options;
        this.serializationCallback = null;
        this.compressionCallback = null;
    }

    onSerialization = (callback: (serialized: string) => void) => (this.serializationCallback = callback);
    onCompression = (callback: (compressed: Uint8Array) => void) => (this.compressionCallback = callback);

    serializeAtomic = (range: Range): string => {
        const atomicRanges = this.createAtomicRanges(range);
        const serialized = atomicRanges
            .map(range => serialize(range.cloneRange(), this.options.document.body))
            .map(serializedRange => JSON.stringify(serializedRange))
            .join('|');

        this.serializationCallback?.(serialized);

        const compressed = compress(serialized);

        this.compressionCallback?.(compressed);

        const encoded = encode(compressed);

        return encoded;
    };

    deserializeAtomic = (representation: string): Range[] => {
        const decoded = decode(representation);
        const decompressed = decompress(decoded);
        const serializedRanges = decompressed!
            .split('|')
            .map(decompressedRangeRepresentation => JSON.parse(decompressedRangeRepresentation) as RangeSerialized)
            .map(serializedRange => deserialize(serializedRange, this.options.document));
        return serializedRanges;
    };

    serialize = (range: Range): string => {
        const serialized = serialize(range.cloneRange(), this.options.document.body);

        const serializedStringified = JSON.stringify(serialized);
        this.serializationCallback?.(serializedStringified);

        const compressed = compress(serializedStringified);
        this.compressionCallback?.(compressed);

        const encoded = encode(compressed);
        return encoded;
    };

    deserialize = (serialized: string): Range => {
        const decoded = decode(serialized);
        const decompressed = decompress(decoded);
        const decompressedParsed = JSON.parse(decompressed!) as RangeSerialized;
        const deserialized = deserialize(decompressedParsed, this.options.document);
        return deserialized;
    };

    private createAtomicRanges = (range: Range): Range[] => {
        if (range.startContainer === range.endContainer) {
            // text
            if (range.startContainer.nodeType === DOM_NODE_TEXT_NODE) {
                return [range];
            }
            // exact element
            const atomicRange = this.options.document.createRange();
            const first = range.startContainer.firstChild!;
            const last = range.startContainer.lastChild!;
            if (first === last) {
                atomicRange.setStart(first, 0);
                atomicRange.setEnd(last, (last as Text).length);
                return [atomicRange];
            }
        }

        const documentAsAny = this.options.document as any; // IE does not know the right spec signature for createTreeWalker

        // element texts
        const treeWalker = documentAsAny.createTreeWalker(
            range.commonAncestorContainer,
            DOM_NODE_FILTER_SHOW_ALL,
            () => DOM_NODE_FILTER_ACCEPT,
            false,
        ) as TreeWalker;

        const atomicRanges: Range[] = [];
        let startFound = false;
        let endFound = false;
        let node: Node | null = treeWalker.root;
        do {
            if (range.startContainer === node) {
                startFound = true;
            }
            if (startFound && !endFound && node.nodeType === DOM_NODE_TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
                const atomicRange = this.options.document.createRange();
                atomicRange.setStart(node, node === range.startContainer ? range.startOffset : 0);
                atomicRange.setEnd(node, node === range.endContainer ? range.endOffset : (node as Text).length);
                atomicRanges.push(atomicRange);
            }

            if (range.endContainer === node) {
                endFound = true;
            }
            node = treeWalker.nextNode();
        } while (node);

        return atomicRanges;
    };
}
