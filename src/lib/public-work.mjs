/**
 * Public Work snapshot contract (docs/17 §5).
 *
 * This module is the *contract* layer only: it validates and bounds a curated,
 * public, dated checkpoint. It reads no private storage and no authenticated
 * owner operation. The public FACE is rendered by src/startpage-public.mjs
 * against the docs/17 §5 layout.
 */
import { MAX_PUBLIC_WORK_BYTES, validatePublicWorkSnapshot } from './contracts.mjs';

export async function loadPublicWorkSnapshot(url, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok || !response.body) throw new Error('public snapshot unavailable');
  const reader = response.body.getReader();
  const parts = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PUBLIC_WORK_BYTES) throw new Error('public snapshot exceeds bound');
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return validatePublicWorkSnapshot(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}
