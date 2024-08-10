import { JSDOM } from 'jsdom';
import { Rangee } from '../src/Rangee';
import { RangeeOptions } from '../src/types/RangeeOptions';

describe('Rangee', () => {
    const getRangeeInstance = (
        basicHtml: string = '',
        rangeeOptions: RangeeOptions = {
            document: new JSDOM(basicHtml, { url: 'http://localhost/' }).window.document,
        },
    ) => [new Rangee(rangeeOptions), rangeeOptions.document] as const;

    test('serialize empty range', () => {
        const [rangee, document] = getRangeeInstance();
        const range = document.createRange();
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('');
    });

    test('atomic serialize / atomic deserialize - single node', () => {
        const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
        const [rangee, document] = getRangeeInstance(basicHtml);
        const range = document.createRange();
        const heading = document.body.querySelector('h1')!;
        range.setStart(heading.firstChild!, 0);
        range.setEnd(heading.firstChild!, 14);

        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('Example Domain');
    });

    test('atomic serialize / atomic deserialize - single node exact', () => {
        const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
        const [rangee, document] = getRangeeInstance(basicHtml);
        const range = document.createRange();
        const heading = document.body.querySelector('h1')!;
        range.setStart(heading, 0);
        range.setEnd(heading, 0);
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('Example Domain');
    });

    test('atomic serialize / atomic deserialize - multiple nodes', () => {
        const basicHtml = `<html><body><div><h1><span id="first">Example</span> <span id="second">Domain</span></h1></div></body></html>`;
        const [rangee, document] = getRangeeInstance(basicHtml);
        const range = document.createRange();
        const first = document.body.querySelector('span#first')!;
        const second = document.body.querySelector('span#second')!;
        range.setStart(first.firstChild!, 1);
        range.setEnd(second.firstChild!, 5);
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
        const [rangee, document] = getRangeeInstance(basicHtml);
        const range = document.createRange();
        const endSpan = document.body.querySelector('span')!;
        // selecting "tarten"
        range.setStart(document.body.childNodes[2], 1);
        range.setEnd(endSpan!.firstChild!, 2);
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);
        expect(deserializedAtomic[0].toString()).toStrictEqual('tart');
        expect(deserializedAtomic[1].toString()).toStrictEqual('en');
        expect(deserializedAtomic[2]?.toString()).toStrictEqual(undefined);
    });

    test('atomic serialize / atomic deserialize - issue #7', () => {
        const basicHtml = `<html><body class="whatever"><br/><br/>start<span>end</span></body></html>`;
        const [rangee, document] = getRangeeInstance(basicHtml);
        const range = document.createRange();
        const endSpan = document.body.querySelector('span')!;
        // selecting "tarten"
        range.setStart(document.body.childNodes[2], 1);
        range.setEnd(endSpan!.firstChild!, 2);
        const result = rangee.serializeAtomic(range);
        const deserializedAtomic = rangee.deserializeAtomic(result);

        expect(deserializedAtomic[0].toString()).toStrictEqual('tart');
        expect(deserializedAtomic[1].toString()).toStrictEqual('en');
    });

    test('atomic serialize / atomic deserialize - two empty divs', () => {
        const [rangee, document] = getRangeeInstance();
        const startContainer = document.createElement('div');
        const endContainer = document.createElement('div');
        document.body.appendChild(startContainer);
        document.body.appendChild(endContainer);
        const mockRange: Range = {
            commonAncestorContainer: document.body,
            collapsed: false,
            endContainer,
            endOffset: 0,
            startContainer,
            startOffset: 0,
            cloneContents: jest.fn(),
            cloneRange: jest.fn(),
            collapse: jest.fn(),
            compareBoundaryPoints: jest.fn(),
            comparePoint: jest.fn(),
            createContextualFragment: jest.fn(),
            deleteContents: jest.fn(),
            detach: jest.fn(),
            extractContents: jest.fn(),
            getBoundingClientRect: jest.fn(),
            getClientRects: jest.fn(),
            insertNode: jest.fn(),
            intersectsNode: jest.fn(),
            isPointInRange: jest.fn(),
            selectNode: jest.fn(),
            selectNodeContents: jest.fn(),
            setEnd: jest.fn(),
            setEndAfter: jest.fn(),
            setEndBefore: jest.fn(),
            setStart: jest.fn(),
            setStartAfter: jest.fn(),
            setStartBefore: jest.fn(),
            surroundContents: jest.fn(),
            toString: jest.fn(),
            START_TO_START: 0,
            START_TO_END: 1,
            END_TO_END: 2,
            END_TO_START: 3,
        };
        const result = rangee.serializeAtomic(mockRange);
        const result2 = rangee.deserializeAtomic(result);
        expect(result).toStrictEqual('N4XyAA==');
        expect(result2[0].toString()).toStrictEqual('');
    });
});
