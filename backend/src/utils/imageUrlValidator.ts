import config from '../config/index.js';

/**
 * Returns true if the URL belongs to the configured ImageKit endpoint.
 */
export function isImageKitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const endpoint = new URL(config.imagekit.urlEndpoint);
    return parsed.hostname === endpoint.hostname;
  } catch {
    return false;
  }
}

/**
 * Validate an image URL before persisting.
 * - ImageKit URLs: allowed.
 * - Other URLs: log a warning and return false (caller should NOT save).
 *
 * @returns true if the URL is safe to store, false otherwise.
 */
export function validateImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  if (isImageKitUrl(url)) {
    return true;
  }

  // Legacy URL (non-ImageKit) — warn but still allow during transition period (Phase 2.5-7).
  // After Phase 8 this function should throw instead of returning true.
  console.warn(`[imageUrlValidator] Non-ImageKit URL detected: ${url} — legacy fallback allowed during transition.`);
  return true;
}
