/**
 * Shared download utility composable.
 *
 * Centralises the "create-a-link-and-click-it" pattern used across GifCard,
 * PreviewPanel, and useGifOptimizer so blob-URL cleanup happens in exactly
 * one place.
 */
export function useDownload() {
  /**
   * Triggers a browser download for the given URL.
   * If the URL is a blob: URL it will be revoked shortly after the click
   * to avoid leaking memory.
   */
  function downloadUrl(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    // Cleanup blob URLs to prevent memory leaks
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }
  }

  /**
   * Creates a temporary blob URL, triggers a download, then cleans up.
   */
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    downloadUrl(url, filename)
  }

  return { downloadUrl, downloadBlob }
}
