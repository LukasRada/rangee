import { findNodeBySelector } from '../../src/utils/findNodeBySelector';
import { JSDOM } from 'jsdom';

test('findNodeBySelector', () => {
    const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
    const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
    const heading = dom.window.document.querySelector('h1');
    const result = findNodeBySelector(
        {
            s: 'body>div>h1',
            o: 0,
        },
        dom.window.document,
    );
    expect(result).toStrictEqual(heading);
});

test('findNodeBySelector childNode', () => {
    const basicHtml = `<html><body><div><h1><span>Example</span> <span>Domain</span></h1></div></body></html>`;
    const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
    const heading = dom.window.document.querySelector('h1')?.lastChild;
    const result = findNodeBySelector(
        {
            s: 'body>div>h1>span:nth-child(2)',
            o: 0,
            c: 0,
        },
        dom.window.document,
    );
    expect(result).toStrictEqual(heading?.childNodes[0]);
});

test('findNodeBySelector throws', () => {
    const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;
    const dom = new JSDOM(basicHtml, { url: 'http://localhost/' });
    expect(() => {
        findNodeBySelector(
            {
                s: 'body>div>h1>code',
                o: 0,
            },
            dom.window.document,
        );
    }).toThrow('Unable to find element with selector: body>div>h1>code');
});
