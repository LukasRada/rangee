export const decode = (base64: string) => new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
