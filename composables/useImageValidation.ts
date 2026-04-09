/**
 * Shared image validation composable.
 *
 * Extracts duplicated file validation logic (MIME type checking, magic byte
 * verification, file size limits) that was previously inlined in both
 * ImageDropZone.vue and gif-maker.vue into a single reusable composable.
 */

export const ACCEPTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** 20 MB in bytes */
export const MAX_IMAGE_FILE_SIZE = 20971520

export function useImageValidation() {
  /**
   * Reads the first 12 bytes of a file and verifies the binary magic number
   * matches the declared MIME type. This prevents files that have been renamed
   * or have a spoofed Content-Type from being processed.
   *
   * Returns `true` if the magic bytes match, or an error message string if not.
   */
  async function validateMagicBytes(file: File): Promise<true | string> {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())

    if (file.type === 'image/jpeg') {
      // JPEG: starts with 0xFF 0xD8
      if (header[0] !== 0xFF || header[1] !== 0xD8) {
        return `"${file.name}" does not match JPEG format. The file may be corrupted or mislabeled.`
      }
    } else if (file.type === 'image/png') {
      // PNG: starts with 0x89 0x50 0x4E 0x47
      if (header[0] !== 0x89 || header[1] !== 0x50 || header[2] !== 0x4E || header[3] !== 0x47) {
        return `"${file.name}" does not match PNG format. The file may be corrupted or mislabeled.`
      }
    } else if (file.type === 'image/webp') {
      // WEBP: starts with "RIFF" (bytes 0-3) and "WEBP" (bytes 8-11)
      const isRiff = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
      const isWebp = header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
      if (!isRiff || !isWebp) {
        return `"${file.name}" does not match WEBP format. The file may be corrupted or mislabeled.`
      }
    } else if (file.type === 'image/gif') {
      // GIF: starts with "GIF" (0x47 0x49 0x46)
      if (header[0] !== 0x47 || header[1] !== 0x49 || header[2] !== 0x46) {
        return `"${file.name}" does not match GIF format. The file may be corrupted or mislabeled.`
      }
    }

    return true
  }

  /**
   * Validates a single image file for MIME type, file size, and magic bytes.
   * Returns `{ valid: true }` or `{ valid: false, error: '...' }`.
   */
  async function validateImageFile(
    file: File,
    maxSize: number = MAX_IMAGE_FILE_SIZE,
  ): Promise<{ valid: boolean; error?: string }> {
    // Check MIME type
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_MIME_TYPES[number])) {
      return {
        valid: false,
        error: `Invalid file type "${file.type || 'unknown'}" for "${file.name}". Please upload PNG, JPEG, WEBP, or GIF images.`,
      }
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1)
      return {
        valid: false,
        error: `"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${maxMB} MB.`,
      }
    }

    // Validate binary magic bytes
    const magicResult = await validateMagicBytes(file)
    if (magicResult !== true) {
      return { valid: false, error: magicResult }
    }

    return { valid: true }
  }

  /**
   * Validates an array of files and returns only those that pass all checks.
   * Calls `onError` for each rejected file so the caller can surface the message
   * via toast, emit, or any other mechanism.
   */
  async function validateImageFiles(
    files: File[],
    onError: (message: string) => void,
    maxSize: number = MAX_IMAGE_FILE_SIZE,
  ): Promise<File[]> {
    const validFiles: File[] = []

    for (const file of files) {
      const result = await validateImageFile(file, maxSize)
      if (result.valid) {
        validFiles.push(file)
      } else if (result.error) {
        onError(result.error)
      }
    }

    return validFiles
  }

  return {
    validateMagicBytes,
    validateImageFile,
    validateImageFiles,
    ACCEPTED_IMAGE_MIME_TYPES,
    MAX_IMAGE_FILE_SIZE,
  }
}
