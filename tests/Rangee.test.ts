import { JSDOM } from 'jsdom';
import { Rangee } from '../src/Rangee';

describe('Rangee', () => {
    test('serialize / deserialize', () => {
        const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const heading = dom.window.document.body.querySelector('h1')!;
        range.setStart(heading.firstChild!, 0);
        range.setEnd(heading.firstChild!, 14);
        const rangee = new Rangee({ document: dom.window.document });
        let compressedResult = new Uint8Array();
        rangee.onCompression(compressed => {
            compressedResult = compressed;
        });
        let serializedResult = '';
        rangee.onSerialization(serialized => {
            serializedResult = serialized;
        });
        const result = rangee.serialize(range);
        const deserialized = rangee.deserialize(result);
        expect(deserialized.toString()).toStrictEqual('Example Domain');
        expect(serializedResult).toStrictEqual(`{"s":{"s":"body>div>h1","c":0,"o":0},"e":{"s":"body>div>h1","c":0,"o":14}}`);
        expect(compressedResult).toStrictEqual(
            new Uint8Array([
                55, 130, 32, 206, 32, 92, 161, 146, 4, 96, 123, 0, 152, 19, 192, 124, 200, 37, 128, 221, 208, 11, 1, 24, 64, 6, 132, 1, 140, 160, 1,
                140, 197, 168, 23, 204, 129, 76, 161, 138, 4, 80, 219, 60, 141, 34, 235, 105, 68, 32, 5, 158, 189, 32, 0, 0,
            ]),
        );
    });

    test('atomic serialize / atomic deserialize - single node', () => {
        const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const heading = dom.window.document.body.querySelector('h1')!;
        range.setStart(heading.firstChild!, 0);
        range.setEnd(heading.firstChild!, 14);
        const rangee = new Rangee({ document: dom.window.document });
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('Example Domain');
    });

    test('atomic serialize / atomic deserialize - single node exact', () => {
        const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const heading = dom.window.document.body.querySelector('h1')!;
        range.setStart(heading, 0);
        range.setEnd(heading, 0);
        const rangee = new Rangee({ document: dom.window.document });
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('Example Domain');
    });

    test('atomic serialize / atomic deserialize - multiple nodes', () => {
        const basicHtml = `<html><body><div><h1><span id="first">Example</span> <span id="second">Domain</span></h1></div></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const first = dom.window.document.body.querySelector('span#first')!;
        const second = dom.window.document.body.querySelector('span#second')!;
        range.setStart(first.firstChild!, 1);
        range.setEnd(second.firstChild!, 5);
        const rangee = new Rangee({ document: dom.window.document });
        let compressedResult = new Uint8Array();
        rangee.onCompression(compressed => {
            compressedResult = compressed;
        });
        let serializedResult = '';
        rangee.onSerialization(serialized => {
            serializedResult = serialized;
        });
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('xample');
        expect(deserializedAtomic[1].toString()).toStrictEqual('Domai');
        expect(serializedResult).toStrictEqual(
            `{"s":{"s":"body>div>h1>span","c":0,"o":1},"e":{"s":"body>div>h1>span","c":0,"o":7}}|{"s":{"s":"body>div>h1>span:nth-of-type(2)","c":0,"o":0},"e":{"s":"body>div>h1>span:nth-of-type(2)","c":0,"o":5}}`,
        );
        expect(compressedResult).toStrictEqual(
            new Uint8Array([
                55, 130, 32, 206, 32, 92, 161, 146, 4, 96, 123, 0, 152, 19, 192, 124, 200, 37, 128, 221, 208, 11, 1, 25, 211, 0, 7, 1, 12, 3, 177, 0,
                26, 16, 6, 50, 128, 6, 59, 18, 144, 129, 124, 232, 20, 202, 24, 160, 66, 131, 54, 60, 68, 72, 86, 167, 81, 164, 22, 32, 218, 64, 14,
                193, 195, 128, 31, 126, 209, 192, 10, 70, 147, 46, 2, 196, 201, 84, 137, 64, 11, 190, 0, 180, 136, 1, 155, 153, 58, 148, 183, 0, 20,
                0, 152, 2, 82, 208, 108, 213, 179, 46, 33, 120, 109, 132, 17, 209, 23, 215, 18, 53, 48, 182, 181, 183, 178, 115, 112, 246, 149, 151,
                144, 5, 102, 82, 0, 0,
            ]),
        );
    });

    test('atomic / atomic - issue #7', () => {
        const basicHtml = `<html><body class="whatever"><br/><br/>start<span>end</span></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const endSpan = dom.window.document.body.querySelector('span')!;
        // selecting "tarten"
        range.setStart(dom.window.document.body.childNodes[2], 1);
        range.setEnd(endSpan!.firstChild!, 2);
        const rangee = new Rangee({ document: dom.window.document });
        const result = rangee.serialize(range);
        const deserializedAtomic = rangee.deserialize(result);

        expect(deserializedAtomic.toString()).toStrictEqual('tarten');
    });

    test('atomic serialize / atomic deserialize - issue #7', () => {
        const basicHtml = `<html><body class="whatever"><br/><br/>start<span>end</span></body></html>`;
        const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
        const range = dom.window.document.createRange();
        const endSpan = dom.window.document.body.querySelector('span')!;
        // selecting "tarten"
        range.setStart(dom.window.document.body.childNodes[2], 1);
        range.setEnd(endSpan!.firstChild!, 2);
        const rangee = new Rangee({ document: dom.window.document });
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);

        expect(deserializedAtomic[0].toString()).toStrictEqual('tart');
        expect(deserializedAtomic[1].toString()).toStrictEqual('en');
    });
});
