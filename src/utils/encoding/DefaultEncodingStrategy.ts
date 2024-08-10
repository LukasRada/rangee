import { EncodingStrategy } from '../../types/EncodingStrategy';

export class DefaultEncodingStrategy implements EncodingStrategy {
    encode(buffer: Uint8Array): string {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }
    decode(encoded: string): Uint8Array {
        return Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    }
}
