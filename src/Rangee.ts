import { DOM_NODE_FILTER_ACCEPT, DOM_NODE_FILTER_SHOW_ALL, DOM_NODE_TEXT_NODE } from './constants';
import { RangeeOptions } from './types/RangeeOptions';
import { DefaultCompressionStrategy } from './utils/compression/DefaultCompressionStrategy';
import { DefaultEncodingStrategy } from './utils/encoding/DefaultEncodingStrategy';
import { DefaultSerializationStrategy } from './utils/serialization/DefaultSerializationStrategy';

// TODO: Implement debug mode with nice debug line log

export class Rangee {
    private options: Readonly<RangeeOptions>;
    private serializationCallback: ((serialized: string) => void) | null;
    private compressionCallback: ((compressed: Uint8Array) => void) | null;

    constructor(options: RangeeOptions) {
        this.options = {
            ...options,
            serializeStrategy: options.serializeStrategy || new DefaultSerializationStrategy(),
            encodingStrategy: options.encodingStrategy || new DefaultEncodingStrategy(),
            compressionsStrategy: options.compressionsStrategy || new DefaultCompressionStrategy(),
        };
        this.serializationCallback = null;
        this.compressionCallback = null;
    }

    onSerialization = (callback: (serialized: string) => void) => (this.serializationCallback = callback);
    onCompression = (callback: (compressed: Uint8Array) => void) => (this.compressionCallback = callback);

    serializeAtomic = (range: Range): string => {
        const atomicRanges = this.createAtomicRanges(range);
        const { compressionsStrategy, serializeStrategy, encodingStrategy } = this.options;

        if (!serializeStrategy) {
            throw new Error('Serialization strategy is not defined');
        }
        const serialized = serializeStrategy.serialize(atomicRanges, this.options.document.body);
        this.serializationCallback?.(serialized);

        if (!compressionsStrategy) {
            throw new Error('Compression strategy is not defined');
        }
        const compressed = compressionsStrategy.compress(serialized);
        this.compressionCallback?.(compressed);

        if (!encodingStrategy) {
            throw new Error('Encoding strategy is not defined');
        }
        const encoded = encodingStrategy.encode(compressed);
        return encoded;
    };

    deserializeAtomic = (representation: string): Range[] => {
        const { compressionsStrategy, serializeStrategy, encodingStrategy } = this.options;
        if (!encodingStrategy) {
            throw new Error('Encoding strategy is not defined');
        }
        const decoded = encodingStrategy.decode(representation);
        if (!compressionsStrategy) {
            throw new Error('Compression strategy is not defined');
        }
        const decompressed = compressionsStrategy.decompress(decoded);
        if (!serializeStrategy) {
            throw new Error('Serialization strategy is not defined');
        }
        return serializeStrategy.deserialize(decompressed, this.options.document);
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
