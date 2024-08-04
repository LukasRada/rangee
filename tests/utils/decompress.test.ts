import { decompress } from '../../src/utils/decompress';

test('decompress', () => {
    expect(decompress(new Uint8Array([35, 2, 96, 204, 64, 0]))).toStrictEqual('123');
});
