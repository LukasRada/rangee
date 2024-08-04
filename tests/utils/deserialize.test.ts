import { RangeSerialized } from "../../src/types/RangeSerialized";
import { deserialize } from "../../src/utils/deserialize";
import { JSDOM } from "jsdom";

describe("deserialize", () => {
  test("with child index", () => {
    const basicHtml = `<html><body><div>1</div><div>2</div></body></html>`;

    const dom = new JSDOM(basicHtml, {
      url: "http://localhost/",
    });
    const document = dom.window.document;
    const rangeSerialized: RangeSerialized = {
      s: { c: 0, o: 0, s: "body>div" },
      e: { c: 0, o: 0, s: "body>div:nth-of-type(2)" },
    };

    const range = deserialize(rangeSerialized, document);

    expect(range.startContainer.textContent).toStrictEqual("1");
    expect(range.endContainer.textContent).toStrictEqual("2");
  });

  test("without child index", () => {
    const basicHtml = `<html><body><div><h1>Example Domain</h1></div></body></html>`;

    const dom = new JSDOM(basicHtml, {
      url: "http://localhost/",
    });
    const document = dom.window.document;
    const rangeSerialized: RangeSerialized = {
      s: { o: 0, s: "body>div>h1" },
      e: { o: 14, s: "body>div>h1" },
    };

    const range = deserialize(rangeSerialized, document);
    expect(range.toString()).toStrictEqual("Example Domain");
  });
});
