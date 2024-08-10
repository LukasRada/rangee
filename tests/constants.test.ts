import { HTML_TAG_BYTE_MAP, BYTE_HTML_TAG_MAP } from '../src/constants';

describe('HTML_TAG_BYTE_MAP and BYTE_HTML_TAG_MAP', () => {
    it('should be exact inverses of each other', () => {
        // Check if HTML_TAG_BYTE_MAP is the inverse of BYTE_HTML_TAG_MAP
        // eslint-disable-next-line no-restricted-syntax
        for (const [tag, byte] of Object.entries(HTML_TAG_BYTE_MAP)) {
            expect(BYTE_HTML_TAG_MAP[byte]).toBe(tag);
        }

        // Check if BYTE_HTML_TAG_MAP is the inverse of HTML_TAG_BYTE_MAP
        // eslint-disable-next-line no-restricted-syntax
        for (const [byte, tag] of Object.entries(BYTE_HTML_TAG_MAP)) {
            expect(HTML_TAG_BYTE_MAP[tag]).toBe(parseInt(byte, 10));
        }
    });
});
