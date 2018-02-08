export const encode = (buffer: Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
