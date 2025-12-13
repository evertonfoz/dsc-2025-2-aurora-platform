// Ensure Node's crypto API is available on globalThis for libraries
// (some builds/environments may not expose globalThis.crypto)
try {
  if (typeof (globalThis as any).crypto === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (globalThis as any).crypto = require('crypto');
  }
} catch (err) {
  // nothing we can do here; downstream code will throw if crypto is required
}
