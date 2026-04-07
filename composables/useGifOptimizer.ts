import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame, UnencodedFrame } from 'modern-gif'
import type { Platform, OptimizationResult, ResizeMode } from '~/types/optimizer'

export function useGifOptimizer() {
  const isProcessing = ref(false)
  const progress = ref(0)
  const results = ref<OptimizationResult[]>([])
  const { downloadBlob } = useDownload()

  /**
   * Draws a single image source onto a canvas at the target size using the
   * specified resize mode. Returns the canvas context for further operations.
   *
   * This helper centralises the crop/pad/stretch math so it can be reused
   * for both static (PNG) and per-frame (animated GIF) processing.
   */
  function drawResized(
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    targetSize: number,
    resizeMode: ResizeMode,
    padColor: string,
  ): void {
    // Clear the canvas to avoid ghosting between frames
    ctx.clearRect(0, 0, targetSize, targetSize)

    if (resizeMode === 'crop') {
      // Math.max ensures the image covers the entire square (overflow is cropped)
      const scale = Math.max(targetSize / sourceWidth, targetSize / sourceHeight)
      const scaledW = sourceWidth * scale
      const scaledH = sourceHeight * scale
      const offsetX = (targetSize - scaledW) / 2
      const offsetY = (targetSize - scaledH) / 2
      ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH)
    } else if (resizeMode === 'pad') {
      // Fill the background first; leave transparent if no solid color requested
      if (padColor && padColor !== 'transparent') {
        ctx.fillStyle = padColor
        ctx.fillRect(0, 0, targetSize, targetSize)
      }
      // Math.min ensures the image fits entirely within the square (remaining area = padding)
      const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight)
      const scaledW = sourceWidth * scale
      const scaledH = sourceHeight * scale
      const offsetX = (targetSize - scaledW) / 2
      const offsetY = (targetSize - scaledH) / 2
      ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH)
    } else {
      // 'stretch' — fill the entire canvas, potentially distorting the image
      ctx.drawImage(source, 0, 0, targetSize, targetSize)
    }
  }

  /**
   * Compares two RGBA pixel buffers and returns the fraction of pixels that are
   * visually similar (0.0 = completely different, 1.0 = identical).
   *
   * For performance on large frames (> 256x256), only every 4th pixel is sampled.
   * This is a compression heuristic, not a scientific measurement — approximate
   * is perfectly fine for deciding whether to drop a near-duplicate frame.
   *
   * @param a - RGBA pixel data of the first frame
   * @param b - RGBA pixel data of the second frame
   * @returns Similarity ratio between 0.0 and 1.0
   */
  function compareFrames(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
    if (a.length !== b.length) return 0 // Different dimensions = not similar

    const totalPixels = a.length / 4 // RGBA = 4 bytes per pixel
    // Sample every 4th pixel for frames larger than 256x256 (65 536 pixels)
    const step = totalPixels > 65536 ? 4 : 1
    let matchingPixels = 0
    const tolerance = 10 // Allow RGB channels to differ by up to 10 (out of 255)

    for (let i = 0; i < a.length; i += 4 * step) {
      const dr = Math.abs(a[i] - b[i])         // R
      const dg = Math.abs(a[i + 1] - b[i + 1]) // G
      const db = Math.abs(a[i + 2] - b[i + 2]) // B
      // Skip alpha — focus on visible color difference

      if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
        matchingPixels++
      }
    }

    const sampledPixels = Math.ceil(totalPixels / step)
    return matchingPixels / sampledPixels
  }

  /**
   * Drops frames that are near-duplicates of the previous kept frame, absorbing
   * their delay into the predecessor. This preserves animation timing while
   * eliminating visually redundant frames that waste bytes.
   *
   * The first frame is always kept. The result is guaranteed to contain at
   * least 2 frames (the minimum for a valid animated GIF).
   *
   * @param frames - Decoded GIF frames in display order
   * @param similarityThreshold - Fraction of pixels that must match to consider
   *   a frame a near-duplicate (e.g. 0.95 = 95% of pixels must be similar)
   * @returns A new array of frames with near-duplicates removed
   */
  function dropNearDuplicateFrames(
    frames: DecodedFrame[],
    similarityThreshold: number,
  ): DecodedFrame[] {
    // Never drop below 2 frames — a 1-frame "animated" GIF is nonsensical
    if (frames.length <= 2) return frames

    const kept: DecodedFrame[] = [frames[0]] // Always keep the first frame

    for (let i = 1; i < frames.length; i++) {
      const prev = kept[kept.length - 1]
      const curr = frames[i]

      const similarity = compareFrames(
        prev.data as Uint8ClampedArray,
        curr.data as Uint8ClampedArray,
      )

      if (similarity >= similarityThreshold) {
        // Near-duplicate — drop this frame, add its delay to the previous
        kept[kept.length - 1] = {
          ...prev,
          delay: prev.delay + curr.delay,
        }
      } else {
        kept.push(curr)
      }
    }

    // Safety: ensure we never return fewer than 2 frames even if the threshold
    // was extremely aggressive (shouldn't happen with reasonable thresholds)
    if (kept.length < 2 && frames.length >= 2) {
      return [frames[0], frames[frames.length - 1]]
    }

    return kept
  }

  /**
   * Reduces the frame count to stay within a platform's maxFrames limit by
   * evenly sampling frames from the original sequence. Frame delays are scaled
   * proportionally so the overall animation duration stays roughly the same.
   *
   * For example, a 120-frame GIF limited to 60 frames keeps every 2nd frame,
   * each with doubled delay.
   */
  function reduceFrames(
    frames: DecodedFrame[],
    maxFrames: number,
  ): DecodedFrame[] {
    if (frames.length <= maxFrames) return frames

    const step = frames.length / maxFrames
    const reduced: DecodedFrame[] = []

    for (let i = 0; i < maxFrames; i++) {
      // Pick evenly-spaced indices, rounding to the nearest original frame
      const srcIndex = Math.min(Math.round(i * step), frames.length - 1)
      const frame = frames[srcIndex]

      // Scale the delay to compensate for dropped frames so total duration
      // stays approximately the same: new_delay = original_delay * (total / kept)
      const scaledDelay = Math.round(frame.delay * (frames.length / maxFrames))

      reduced.push({ ...frame, delay: scaledDelay })
    }

    return reduced
  }

  /**
   * Optimizes a GIF for a specific streaming platform by resizing it to each
   * required dimension and converting to the platform's target format.
   *
   * For animated GIF output, every frame is decoded, individually resized on
   * a canvas, and re-encoded into a new animated GIF. This preserves the
   * animation (unlike the old canvas.toBlob approach which captured only a
   * single frame).
   *
   * For PNG/static output (e.g. Twitch Static Emote, Twitch Sub Badge), a
   * single-frame canvas approach is used since animation is not needed.
   *
   * @param gifUrl - URL of the source GIF (can be a remote URL or a blob URL)
   * @param platform - Target platform configuration containing sizes, format, and file size limits
   * @param resizeMode - How to fit the image into the square canvas:
   *   - 'crop': Scale to cover the square, then center-crop (no distortion, some edges lost)
   *   - 'pad': Scale to fit within the square, pad remaining area (no distortion, no cropping)
   *   - 'stretch': Stretch to fill the square exactly (distorts non-square images)
   * @param padColor - Background color for 'pad' mode; 'transparent' leaves the canvas clear
   * @param selectedFrame - Optional decoded frame for static export. When provided and the
   *   platform requires PNG, this frame's pixel data is used instead of the GIF's first frame.
   *   Ignored for animated GIF platforms.
   * @param preDecodedFrames - Optional pre-decoded frames (e.g. from the trimmer). When
   *   provided for animated GIF platforms, the fetch+decode step is skipped and these
   *   frames are used directly. This is backwards compatible — omit or pass undefined
   *   to preserve existing behavior.
   * @returns Array of optimization results, one per required size
   * @throws Error if the image cannot be loaded or GIF decoding/encoding fails
   */
  async function optimizeGif(
    gifUrl: string,
    platform: Platform,
    resizeMode: ResizeMode = 'crop',
    padColor: string = 'transparent',
    selectedFrame?: DecodedFrame,
    preDecodedFrames?: DecodedFrame[],
  ): Promise<OptimizationResult[]> {
    isProcessing.value = true
    progress.value = 0
    results.value = []

    try {
      // Fetch the original GIF as an ArrayBuffer — needed by modern-gif decoder
      let response: Response
      try {
        response = await fetch(gifUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Network error'
        throw new Error(`Failed to load GIF: ${msg}. Check the URL and try again.`)
      }
      const arrayBuffer = await response.arrayBuffer()

      const needsAnimatedGif = platform.format.toLowerCase().includes('gif')

      // --- Static / PNG path ---
      // For platforms that need PNG (e.g. Twitch Static Emote, Twitch Sub Badge),
      // the single-frame canvas approach is correct and efficient.
      if (!needsAnimatedGif) {
        return await optimizeStatic(arrayBuffer, platform, resizeMode, padColor, selectedFrame)
      }

      // --- Animated GIF path ---
      // Decode the GIF metadata (needed for loop settings) and frames.
      // When pre-decoded frames are provided (e.g. from the trimmer), skip
      // the expensive decodeFrames() call and use them directly.
      const gif = decode(new Uint8Array(arrayBuffer))
      let frames: DecodedFrame[]

      if (preDecodedFrames && preDecodedFrames.length > 0) {
        frames = preDecodedFrames
      } else {
        frames = decodeFrames(new Uint8Array(arrayBuffer), { gif })
      }

      if (!frames.length) {
        throw new Error('The GIF contains no frames. Please try a different file.')
      }

      // Enforce platform frame limit (e.g. Twitch animated emotes max 60 frames)
      if (platform.maxFrames !== null && platform.maxFrames > 0 && frames.length > platform.maxFrames) {
        frames = reduceFrames(frames, platform.maxFrames)
      }

      const optimizedResults: OptimizationResult[] = []
      const totalWork = platform.sizes.length * frames.length
      let completed = 0

      // Process one target size at a time to limit peak memory usage
      for (const size of platform.sizes) {
        // Reusable canvas for resizing frames at this target dimension.
        // Creating a single canvas per size and reusing it avoids the overhead
        // of allocating a new GPU-backed surface for every frame.
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        if (!ctx) {
          throw new Error(
            'Failed to create canvas rendering context. Your browser may not support this operation.',
          )
        }

        // A temporary canvas to convert each frame's raw RGBA data into a
        // drawable ImageBitmap. We draw the decoded frame data onto this
        // source-sized canvas, then draw that onto the target-sized canvas
        // with the resize mode applied.
        const srcCanvas = document.createElement('canvas')
        const srcCtx = srcCanvas.getContext('2d')
        if (!srcCtx) {
          throw new Error('Failed to create source canvas rendering context.')
        }

        // Build the resized frames array for encoding
        const encodingFrames: Array<{ data: Uint8ClampedArray; delay: number }> = []

        for (const frame of frames) {
          // Set source canvas to the decoded frame's actual dimensions.
          // Frames in a GIF can have varying sizes (partial updates), but
          // decodeFrames composites them to the full GIF dimensions, so
          // frame.width/height equals the GIF's logical screen size.
          srcCanvas.width = frame.width
          srcCanvas.height = frame.height

          // Paint the decoded RGBA pixel data onto the source canvas
          const imageData = new ImageData(
            new Uint8ClampedArray(frame.data),
            frame.width,
            frame.height,
          )
          srcCtx.putImageData(imageData, 0, 0)

          // Resize onto the target canvas using the chosen resize mode
          drawResized(ctx, srcCanvas, frame.width, frame.height, size, resizeMode, padColor)

          // Extract the resized RGBA pixel data for encoding
          const resizedData = ctx.getImageData(0, 0, size, size)
          encodingFrames.push({
            data: resizedData.data,
            delay: frame.delay,
          })

          // Update progress and yield to the browser to prevent frame drops
          completed++
          progress.value = Math.round((completed / totalWork) * 100)
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        // Release the temporary canvases to free GPU/memory resources
        srcCanvas.width = 0
        srcCanvas.height = 0
        canvas.width = 0
        canvas.height = 0

        // Re-encode all resized frames into an animated GIF.
        // The type assertion is necessary because TypeScript 5.7+ has stricter
        // ArrayBufferLike vs ArrayBuffer checks that make Uint8ClampedArray
        // incompatible with BufferSource, even though it works at runtime.
        const encodedBuffer = await encode({
          width: size,
          height: size,
          looped: gif.looped ?? true,
          loopCount: gif.loopCount ?? 0,
          frames: encodingFrames.map(f => ({
            data: f.data,
            delay: f.delay,
          })) as UnencodedFrame[],
        })

        const blob = new Blob([encodedBuffer], { type: 'image/gif' })

        optimizedResults.push({
          size,
          format: 'GIF',
          blob,
          fileSize: blob.size,
          withinLimit: blob.size <= platform.maxFileSizeBytes,
        })
      }

      results.value = optimizedResults
      return optimizedResults
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Handles the static / PNG optimisation path. Resizes a single frame
   * via canvas and exports as PNG.
   *
   * This path is used for platforms that require a non-animated format
   * (e.g. Twitch Static Emote, Twitch Sub Badge).
   *
   * @param selectedFrame - Optional decoded frame to export. When provided,
   *   the frame's raw RGBA pixel data is used instead of loading the GIF as
   *   an `<img>` (which always renders frame 0). This enables the frame
   *   picker to control which frame gets exported.
   */
  async function optimizeStatic(
    arrayBuffer: ArrayBuffer,
    platform: Platform,
    resizeMode: ResizeMode,
    padColor: string,
    selectedFrame?: DecodedFrame,
  ): Promise<OptimizationResult[]> {
    const optimizedResults: OptimizationResult[] = []

    // When a specific frame is provided, build a source canvas from its
    // raw RGBA pixel data once and reuse it for every target size.
    let frameSrcCanvas: HTMLCanvasElement | null = null
    let frameSrcWidth = 0
    let frameSrcHeight = 0

    if (selectedFrame) {
      frameSrcCanvas = document.createElement('canvas')
      frameSrcCanvas.width = selectedFrame.width
      frameSrcCanvas.height = selectedFrame.height
      frameSrcWidth = selectedFrame.width
      frameSrcHeight = selectedFrame.height

      const srcCtx = frameSrcCanvas.getContext('2d')
      if (!srcCtx) {
        throw new Error('Failed to create source canvas rendering context.')
      }

      const imageData = new ImageData(
        new Uint8ClampedArray(selectedFrame.data),
        selectedFrame.width,
        selectedFrame.height,
      )
      srcCtx.putImageData(imageData, 0, 0)
    }

    for (let i = 0; i < platform.sizes.length; i++) {
      const size = platform.sizes[i]
      progress.value = Math.round(((i + 1) / platform.sizes.length) * 100)

      // Yield to the browser between iterations to prevent frame drops
      await new Promise(resolve => setTimeout(resolve, 0))

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error(
          'Failed to create canvas rendering context. Your browser may not support this operation.',
        )
      }

      if (frameSrcCanvas) {
        // Use the pre-built source canvas from the selected frame
        try {
          drawResized(ctx, frameSrcCanvas, frameSrcWidth, frameSrcHeight, size, resizeMode, padColor)
        } catch (_e) {
          throw new Error(
            `Failed to draw selected frame at ${size}x${size}.`,
          )
        }
      } else {
        // Fallback: load the GIF as an <img> (renders frame 0)
        const blob = new Blob([arrayBuffer], { type: 'image/gif' })
        const img = new Image()
        img.crossOrigin = 'anonymous'
        let objectUrl: string | null = null

        try {
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () =>
              reject(
                new Error(
                  'Failed to load image. This may be caused by a CORS restriction on the source URL. ' +
                  'Try downloading the GIF first and uploading it directly.',
                ),
              )
            objectUrl = URL.createObjectURL(blob)
            img.src = objectUrl
          })
        } finally {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
          }
        }

        try {
          drawResized(ctx, img, img.width, img.height, size, resizeMode, padColor)
        } catch (_e) {
          throw new Error(
            `Failed to draw image at ${size}x${size}. The image may be tainted by CORS. ` +
            'Try uploading the GIF directly instead of using a remote URL.',
          )
        }
      }

      // Convert the canvas to PNG
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        try {
          canvas.toBlob(
            (b) => {
              if (b) {
                resolve(b)
              } else {
                reject(new Error(`Failed to convert canvas to PNG blob at ${size}x${size}.`))
              }
            },
            'image/png',
          )
        } catch (_e) {
          reject(
            new Error(
              `Canvas export failed at ${size}x${size}. The image may be tainted by cross-origin data.`,
            ),
          )
        }
      })

      // Release canvas GPU/memory resources
      canvas.width = 0
      canvas.height = 0

      optimizedResults.push({
        size,
        format: 'PNG',
        blob: pngBlob,
        fileSize: pngBlob.size,
        withinLimit: pngBlob.size <= platform.maxFileSizeBytes,
      })
    }

    // Release the shared source canvas
    if (frameSrcCanvas) {
      frameSrcCanvas.width = 0
      frameSrcCanvas.height = 0
    }

    results.value = optimizedResults
    return optimizedResults
  }

  /**
   * Iteratively applies compression strategies to bring an over-limit GIF
   * under the platform's file size cap. Strategies are tried in order of
   * increasing aggressiveness; the first one that gets the blob under
   * `maxFileSize` wins.
   *
   * The function works with already-decoded frame data so it never re-fetches
   * or re-decodes the source GIF. Each strategy builds on the previous one
   * (e.g. frame dropping operates on the already-color-reduced frames).
   *
   * @param gifUrl - URL of the source GIF (blob: or https:)
   * @param targetSize - Target pixel dimensions (e.g. 112)
   * @param maxFileSize - Platform file size limit in bytes
   * @param resizeMode - How to fit the image into the square canvas
   * @param padColor - Background color for 'pad' mode
   * @param maxFrames - Platform frame limit (null = unlimited)
   * @param onProgress - Called before each strategy with a human-readable label
   * @param signal - Optional AbortSignal to cancel the operation
   * @param preDecodedFrames - Optional pre-decoded frames (e.g. from the trimmer). When
   *   provided, the fetch+decode step is skipped and these frames are used directly.
   * @returns The best blob achieved, its size, which strategies were applied, and whether it fit
   */
  async function smartCompressGif(
    gifUrl: string,
    targetSize: number,
    maxFileSize: number,
    resizeMode: ResizeMode,
    padColor: string,
    maxFrames: number | null,
    onProgress: (strategy: string) => void,
    signal?: AbortSignal,
    preDecodedFrames?: DecodedFrame[],
  ): Promise<{ blob: Blob; fileSize: number; strategiesApplied: string[]; success: boolean }> {
    if (targetSize <= 0) throw new Error('Target size must be positive')
    if (maxFileSize <= 0) throw new Error('Max file size must be positive')

    // --- Fetch and decode the source GIF ---
    const response = await fetch(gifUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()

    // Decode metadata (needed for loop settings in re-encoding)
    const gif = decode(new Uint8Array(arrayBuffer))

    // When pre-decoded frames are provided (e.g. from the trimmer), skip
    // the expensive decodeFrames() call and use them directly.
    let frames: DecodedFrame[]
    if (preDecodedFrames && preDecodedFrames.length > 0) {
      frames = preDecodedFrames
    } else {
      frames = decodeFrames(new Uint8Array(arrayBuffer), { gif })
    }

    if (!frames.length) {
      throw new Error('The GIF contains no frames.')
    }

    // Enforce platform frame limit before we begin
    if (maxFrames !== null && maxFrames > 0 && frames.length > maxFrames) {
      frames = reduceFrames(frames, maxFrames)
    }

    const strategiesApplied: string[] = []
    let bestBlob: Blob | null = null
    let bestSize = Infinity

    // Working copies that accumulate across strategies
    let currentFrames = frames
    let currentSize = targetSize
    let currentMaxColors: number | undefined

    /**
     * Helper: re-encode the current working frames at `currentSize` dimensions
     * with optional maxColors. Returns the encoded blob.
     */
    async function encodeWithSettings(): Promise<Blob> {
      const canvas = document.createElement('canvas')
      canvas.width = currentSize
      canvas.height = currentSize
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Failed to create canvas context.')

      const srcCanvas = document.createElement('canvas')
      const srcCtx = srcCanvas.getContext('2d')
      if (!srcCtx) throw new Error('Failed to create source canvas context.')

      const encodingFrames: Array<{ data: Uint8ClampedArray; delay: number }> = []

      for (const frame of currentFrames) {
        // Check for cancellation between frames to stay responsive
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

        srcCanvas.width = frame.width
        srcCanvas.height = frame.height
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.data),
          frame.width,
          frame.height,
        )
        srcCtx.putImageData(imageData, 0, 0)
        drawResized(ctx, srcCanvas, frame.width, frame.height, currentSize, resizeMode, padColor)

        const resizedData = ctx.getImageData(0, 0, currentSize, currentSize)
        encodingFrames.push({ data: resizedData.data, delay: frame.delay })

        // Yield to the browser periodically
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Release temporary canvases
      srcCanvas.width = 0
      srcCanvas.height = 0
      canvas.width = 0
      canvas.height = 0

      const encodeOptions: Parameters<typeof encode>[0] = {
        width: currentSize,
        height: currentSize,
        looped: gif.looped ?? true,
        loopCount: gif.loopCount ?? 0,
        frames: encodingFrames.map(f => ({
          data: f.data,
          delay: f.delay,
        })) as UnencodedFrame[],
      }

      if (currentMaxColors !== undefined) {
        encodeOptions.maxColors = currentMaxColors
      }

      const encodedBuffer = await encode(encodeOptions)
      return new Blob([encodedBuffer], { type: 'image/gif' })
    }

    /**
     * Helper: try encoding, track the best result, and return true if under limit.
     */
    async function tryStrategy(label: string): Promise<boolean> {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      onProgress(label)
      // Small delay so the UI can paint the strategy label before heavy work starts
      await new Promise(resolve => setTimeout(resolve, 16))

      const blob = await encodeWithSettings()
      strategiesApplied.push(label)

      if (blob.size < bestSize) {
        bestBlob = blob
        bestSize = blob.size
      }

      return blob.size <= maxFileSize
    }

    const isAnimated = currentFrames.length > 1

    // --- Strategy 1: Smart frame drop at 95% similarity ---
    // Near-zero quality loss — only truly duplicate frames are removed.
    // Skipped entirely for single-frame (static) GIFs.
    if (isAnimated) {
      const beforeCount = currentFrames.length
      const deduped95 = dropNearDuplicateFrames(currentFrames, 0.95)

      if (deduped95.length < beforeCount) {
        // Frames were actually removed — re-encode and check
        currentFrames = deduped95
        if (await tryStrategy('Removing duplicate frames (95%)')) {
          return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
        }
      }
      // If no frames were dropped, skip straight to the next strategy
    }

    // --- Strategy 2: Smart frame drop at 85% similarity ---
    // More aggressive — drops frames that are very similar but not identical.
    // Minimal quality loss for most animations.
    if (isAnimated) {
      const beforeCount = currentFrames.length
      const deduped85 = dropNearDuplicateFrames(currentFrames, 0.85)

      if (deduped85.length < beforeCount) {
        // Additional frames were removed beyond the 95% pass
        currentFrames = deduped85
        if (await tryStrategy('Removing duplicate frames (85%)')) {
          return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
        }
      }
      // If no additional frames were dropped, skip to color reduction
    }

    // --- Strategy 3: Reduce colors to 128 ---
    currentMaxColors = 128
    if (await tryStrategy('Reducing colors (128)')) {
      return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
    }

    // --- Strategy 4: Reduce colors to 64 ---
    currentMaxColors = 64
    if (await tryStrategy('Reducing colors (64)')) {
      return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
    }

    // --- Strategy 5: Reduce colors to 32 ---
    currentMaxColors = 32
    if (await tryStrategy('Reducing colors (32)')) {
      return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
    }

    // --- Strategy 6: Reduce resolution to 75% ---
    const size75 = Math.round(targetSize * 0.75)
    if (size75 > 0 && size75 !== currentSize) {
      currentSize = size75

      if (await tryStrategy('Reducing resolution (75%)')) {
        return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
      }
    }

    // --- Strategy 7: Reduce resolution to 60% ---
    const size60 = Math.round(targetSize * 0.60)
    if (size60 > 0 && size60 !== currentSize) {
      currentSize = size60

      if (await tryStrategy('Reducing resolution (60%)')) {
        return { blob: bestBlob!, fileSize: bestSize, strategiesApplied, success: true }
      }
    }

    // All strategies exhausted — return the best (smallest) result we achieved
    return {
      blob: bestBlob!,
      fileSize: bestSize,
      strategiesApplied,
      success: false,
    }
  }

  async function downloadAll(optimizedResults: OptimizationResult[], name = 'emotes') {
    for (const result of optimizedResults) {
      downloadBlob(result.blob, `${name}_${result.size}x${result.size}.${result.format.toLowerCase()}`)
    }
  }

  function downloadSingle(result: OptimizationResult, name = 'emote') {
    downloadBlob(result.blob, `${name}_${result.size}x${result.size}.${result.format.toLowerCase()}`)
  }

  return { isProcessing, progress, results, optimizeGif, smartCompressGif, downloadAll, downloadSingle }
}
