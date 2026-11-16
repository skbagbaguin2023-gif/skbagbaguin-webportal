export async function calculateFileSha256(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure file verification is unavailable in this browser.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
