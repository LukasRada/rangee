import { generateSelector } from '../../src/utils/generateSelector';
import { JSDOM } from 'jsdom';

test('generateSelector', () => {
    const dom = new JSDOM();
    const document = dom.window.document;
    const nestedNode = document.createElement('div');
    const node = document.createElement('div');
    node.appendChild(nestedNode);
    dom.window.document.body.appendChild(node);

    expect(generateSelector(nestedNode, dom.window.document.body)).toStrictEqual({
        s: 'body>div>div',
        c: 0,
        o: 0,
    });
});
