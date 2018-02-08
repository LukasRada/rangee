import { compress } from "../../src/utils/compress";

test("compress", () => {
  expect(compress("123")).toStrictEqual(
    new Uint8Array([35, 2, 96, 204, 64, 0])
  );
});
