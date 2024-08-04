import { decode } from '../../src/utils/decode';

test('decode', () => {
    expect(decode('AQID')).toStrictEqual(new Uint8Array([1, 2, 3]));
});
