/**
 * Validates that a URL is safe to render in an <img> or similar element.
 * Allows blob: URLs (local uploads) and https: URLs (API content).
 * Rejects everything else to prevent mixed-content and XSS vectors.
 */
export function isValidMediaUrl(url: string): boolean {
  if (url.startsWith('blob:')) return true
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}
