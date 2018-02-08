import { encode } from "../../src/utils/encode";

test("encode", () => {
  expect(encode(new Uint8Array([1, 2, 3]))).toStrictEqual("AQID");
});
