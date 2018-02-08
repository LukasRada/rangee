import { HtmlElementSelectorResult } from "./HtmlElementSelectorResult";

// naming obscurity is because of minification result of string representation of ranges
export interface RangeSerialized {
  /** start */
  s: HtmlElementSelectorResult;

  /** end */
  e: HtmlElementSelectorResult;
}
