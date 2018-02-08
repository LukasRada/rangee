import { serialize } from "../../src/utils/serialize";
import { JSDOM } from "jsdom";

test("serialize empty range", () => {
  const dom = new JSDOM();
  const document = dom.window.document;
  const range = document.createRange();
  expect(serialize(range, document.body)).toStrictEqual({
    e: { c: 0, o: 0, s: "" },
    s: { c: 0, o: 0, s: "" },
  });
});

test("serialize range", () => {
  const dom = new JSDOM();
  const document = dom.window.document;
  const startContainer = document.createElement("div");
  const endContainer = document.createElement("div");
  document.body.appendChild(startContainer);
  document.body.appendChild(endContainer);
  const mockRange: Range = {
    commonAncestorContainer: document.body,
    collapsed: false,
    endContainer: endContainer,
    endOffset: 0,
    startContainer: startContainer,
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
    toString: jest.fn(() => "Mock Range String"),
    START_TO_START: 0,
    START_TO_END: 1,
    END_TO_END: 2,
    END_TO_START: 3,
  };
  expect(serialize(mockRange, document.body)).toStrictEqual({
    e: { c: 1, o: 0, s: "body>div:nth-of-type(2)" },
    s: { c: 0, o: 0, s: "body>div" },
  });
});
