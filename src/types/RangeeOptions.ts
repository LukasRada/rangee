import { CompressionStrategy } from './CompressionStrategy';
import { EncodingStrategy } from './EncodingStrategy';
import { SerializationStrategy } from './SerializationStrategy';

export interface RangeeOptions {
    document: Document;
    serializeStrategy?: SerializationStrategy;
    compressionsStrategy?: CompressionStrategy;
    encodingStrategy?: EncodingStrategy;
}
