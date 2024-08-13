import { Bench } from 'tinybench';
import { JSDOM } from 'jsdom';
import { Rangee } from '../src/Rangee';
import { DefaultSerializationStrategy } from '../src/utils/serialization/DefaultSerializationStrategy';
import { ByteSerializationStrategy } from '../src/utils/serialization/ByteSerializationStrategy';
import { PakoCompressionStrategy } from '../src/utils/compression/PakoCompressionStrategy';
import { SerializationStrategy } from '../src/types/SerializationStrategy';
import { CompressionStrategy } from '../src/types/CompressionStrategy';
import { DefaultCompressionStrategy } from '../src/utils/compression/DefaultCompressionStrategy';

const dom = await JSDOM.fromFile('./index.html');
const range = dom.window.document.createRange();

/** From "Complex HTML Page" to "Ordered list item 3" */
const start = dom.window.document.body.querySelector('h1')!;
const end = dom.window.document.body.querySelector('body>div>main>section:nth-of-type(3)>ol>li:nth-of-type(3)')!;
range.setStart(start.firstChild!, 3);
range.setEnd(end.firstChild!, 11);
const serializeBench = new Bench();
const deserializeBench = new Bench();

const serializationStrategies: SerializationStrategy[] = [new DefaultSerializationStrategy(), new ByteSerializationStrategy()];

const compressionStrategies: CompressionStrategy[] = [new PakoCompressionStrategy(), new DefaultCompressionStrategy()];

const matrix: [SerializationStrategy, CompressionStrategy][] = serializationStrategies.flatMap(serializationStrategy =>
    compressionStrategies.map(compressionStrategy => [serializationStrategy, compressionStrategy] as [SerializationStrategy, CompressionStrategy]),
);
const lengths: Array<{ name: string; length: number }> = [];
await Promise.all(
    matrix.map(async ([serializationStrategy, compressionStrategy]) => {
        const rangee = new Rangee({
            document: dom.window.document,
            serializeStrategy: serializationStrategy,
            compressionsStrategy: compressionStrategy,
        });
        serializeBench.add(`serializeAtomic - ${serializationStrategy.constructor.name} - ${compressionStrategy.constructor.name}`, () => {
            rangee.serializeAtomic(range);
        });
        // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
        await serializeBench.warmup();
        await serializeBench.run();

        const defaultResult = rangee.serializeAtomic(range);

        lengths.push({
            name: `${serializationStrategy.constructor.name} - ${compressionStrategy.constructor.name}`,
            length: defaultResult.length,
        });

        deserializeBench.add(`deserializeAtomic - ${serializationStrategy.constructor.name} - ${compressionStrategy.constructor.name}`, () => {
            rangee.deserializeAtomic(defaultResult);
        });

        await deserializeBench.warmup();
        await deserializeBench.run();
    }),
);

console.table(serializeBench.table());
console.table(deserializeBench.table());

console.table(lengths);
