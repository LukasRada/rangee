import { generateSelector } from "../utils/generateSelector";
import { RangeSerialized } from "../types/RangeSerialized";

export const serialize = (
  range: Range,
  relativeTo: HTMLElement
): RangeSerialized => {
  const start = generateSelector(range.startContainer, relativeTo);
  start.o = range.startOffset;
  const end = generateSelector(range.endContainer, relativeTo);
  end.o = range.endOffset;

  return { s: start, e: end };
};
