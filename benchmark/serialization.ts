import { Bench } from 'tinybench';
import { JSDOM } from 'jsdom';
import { Rangee } from '../src/Rangee';
import { DefaultSerializationStrategy } from '../src/utils/serialization/DefaultSerializationStrategy';
import { ByteSerializationStrategy } from '../src/utils/serialization/ByteSerializationStrategy';
import { PakoCompressionStrategy } from '../src/utils/compression/PakoCompressionStrategy';

const serializeBench = new Bench();

const dom = await JSDOM.fromFile('./index.html');
const range = dom.window.document.createRange();

/** From "Complex HTML Page" to "Ordered list item 3" */
const start = dom.window.document.body.querySelector('h1')!;
const end = dom.window.document.body.querySelector('body>div>main>section:nth-of-type(3)>ol>li:nth-of-type(3)')!;
range.setStart(start.firstChild!, 3);
range.setEnd(end.firstChild!, 11);

const rangeeDefaultSerialization = new Rangee({
    document: dom.window.document,
    serializeStrategy: new DefaultSerializationStrategy(),
    compressionsStrategy: new PakoCompressionStrategy(),
});
const rangeeByteSerialization = new Rangee({
    document: dom.window.document,
    serializeStrategy: new ByteSerializationStrategy(),
    compressionsStrategy: new PakoCompressionStrategy(),
});

serializeBench
    .add('serialize - default strategy', () => {
        rangeeDefaultSerialization.serializeAtomic(range);
    })
    .add('serialize - byte strategy', () => {
        rangeeByteSerialization.serializeAtomic(range);
    });

// make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
await serializeBench.warmup();
await serializeBench.run();

console.table(serializeBench.table());

const defaultResult = rangeeDefaultSerialization.serializeAtomic(range);
const byteResult = rangeeByteSerialization.serializeAtomic(range);

console.log('Default result:', defaultResult);
console.log('Byte result:', byteResult);

const deserializeBench = new Bench();
deserializeBench
    .add('deserialize - default strategy', () => {
        rangeeDefaultSerialization.deserializeAtomic(defaultResult);
    })
    .add('deserialize - byte strategy', () => {
        rangeeByteSerialization.deserializeAtomic(byteResult);
    });
await deserializeBench.warmup();
await deserializeBench.run();

console.table(deserializeBench.table());
