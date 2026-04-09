export interface ConvertOptions {
  inputFile: File
  startTime: number
  duration: number
  fps: number
  width: number
  quality: 'small' | 'balanced' | 'best'
  loopCount: number   // 0 = infinite, -1 = no loop (play once), N = loop N times
  maxColors: number   // 16-256, used in palettegen for balanced/best quality
}

export interface ConvertToMp4Options {
  inputFile: File
  crf: number  // 18 (best), 23 (better), or 28 (good)
}

// Maximum time (ms) to wait for FFmpeg WASM core to initialize.
// With local files this should be fast, but keep a safety net for edge cases.
const LOAD_TIMEOUT_MS = 30_000

/**
 * Composable for managing FFmpeg.wasm lifecycle, conversion, and cleanup.
 *
 * FFmpeg.wasm runs entirely in the browser via WebAssembly + SharedArrayBuffer.
 * SharedArrayBuffer requires Cross-Origin-Opener-Policy and
 * Cross-Origin-Embedder-Policy headers to be set on the page. If those headers
 * are missing, ffmpeg.load() will fail and this composable surfaces the error.
 *
 * All @ffmpeg/* imports are dynamic to prevent SSR failures — FFmpeg.wasm is
 * browser-only and cannot be imported at the top level in a Nuxt SSR context.
 */
export function useFFmpeg() {
  // FFmpeg instance is created lazily in load() via dynamic import.
  // Typed as `any` because the class is only available client-side.
  let ffmpeg: any = null
  const isLoading = ref(false)
  const isReady = ref(false)
  const loadProgress = ref(0)
  const conversionProgress = ref(0)
  const conversionPhase = ref<'idle' | 'loading' | 'palette' | 'encoding' | 'done'>('idle')
  const error = ref<string | null>(null)
  let progressListenerAttached = false

  /**
   * Creates a promise that rejects after `ms` milliseconds.
   * Used as a safety net against unexpectedly slow WASM initialization.
   */
  function createTimeout(ms: number): { promise: Promise<never>; clear: () => void } {
    let timeoutId: ReturnType<typeof setTimeout>
    const promise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`FFmpeg loading timed out after ${ms / 1000} seconds — please try again.`)),
        ms,
      )
    })
    return { promise, clear: () => clearTimeout(timeoutId) }
  }

  async function load() {
    if (isReady.value || isLoading.value) return
    isLoading.value = true
    error.value = null
    loadProgress.value = 0

    // Pre-flight: check SharedArrayBuffer availability before attempting
    // the expensive WASM download, so we fail fast with a clear message.
    if (typeof SharedArrayBuffer === 'undefined') {
      error.value = 'Your browser does not support SharedArrayBuffer, which is required for video conversion. '
        + 'Please use a modern browser (Chrome 92+, Edge 92+, Firefox 79+) and ensure the page is served over HTTPS with the correct security headers.'
      isLoading.value = false
      return
    }

    const timeout = createTimeout(LOAD_TIMEOUT_MS)

    try {
      // Dynamic import — only resolved in the browser, never during SSR
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')

      ffmpeg = new FFmpeg()

      // Track conversion progress via FFmpeg's built-in progress event.
      // Guard against duplicate listeners on repeated load() calls.
      if (!progressListenerAttached) {
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          conversionProgress.value = Math.round(Math.min(progress, 1) * 100)
        })
        progressListenerAttached = true
      }

      // Load FFmpeg core from local public/ directory instead of a CDN.
      // Files are served from the same origin, so there are no CORS issues
      // and no dependency on external CDN availability or speed.
      await Promise.race([
        ffmpeg.load({
          coreURL: '/ffmpeg/ffmpeg-core.js',
          wasmURL: '/ffmpeg/ffmpeg-core.wasm',
        }),
        timeout.promise,
      ])

      isReady.value = true
    } catch (e) {
      // Clean up partial FFmpeg state so the next load() starts fresh
      if (ffmpeg) {
        try { ffmpeg.terminate() } catch { /* already dead */ }
        ffmpeg = null
        progressListenerAttached = false
      }

      const msg = e instanceof Error ? e.message : String(e)

      // Provide targeted messages for known failure modes
      if (msg.includes('SharedArrayBuffer') || msg.includes('crossOriginIsolated')) {
        error.value = 'Your browser does not support SharedArrayBuffer, which is required for video conversion. '
          + 'Please use a modern browser (Chrome 92+, Edge 92+, Firefox 79+) and ensure the page is served over HTTPS with the correct security headers.'
      } else if (msg.includes('timed out')) {
        error.value = msg
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        error.value = 'Failed to download the video engine. Please check your internet connection and try again.'
      } else {
        error.value = `Failed to load video engine: ${msg}`
      }
    } finally {
      timeout.clear()
      isLoading.value = false
    }
  }

  /**
   * Converts a video file to GIF using FFmpeg.wasm.
   *
   * Uses a 2-pass palette-based approach for balanced/best quality, or a
   * single-pass approach for small file size. The palette technique produces
   * significantly better color reproduction than direct conversion.
   */
  async function convertToGif(options: ConvertOptions): Promise<Blob> {
    if (!ffmpeg) throw new Error('FFmpeg not loaded — call load() first')

    const { inputFile, startTime, duration, fps, width, quality, loopCount, maxColors } = options
    const { fetchFile } = await import('@ffmpeg/util')

    // Write the input video to FFmpeg's virtual filesystem
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile))

    conversionPhase.value = 'encoding'
    conversionProgress.value = 0

    try {
      if (quality === 'small') {
        // Single pass -- simpler, smaller output file
        await ffmpeg.exec([
          '-ss', String(startTime),
          '-t', String(duration),
          '-i', 'input.mp4',
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
          '-gifflags', '+transdiff',
          '-loop', String(loopCount),
          '-y', 'output.gif',
        ])
      } else {
        // 2-pass with palette for better quality
        conversionPhase.value = 'palette'
        const dither = quality === 'best' ? 'sierra2_4a' : 'bayer:bayer_scale=5'

        // Pass 1: Generate an optimal palette from the video frames
        await ffmpeg.exec([
          '-ss', String(startTime),
          '-t', String(duration),
          '-i', 'input.mp4',
          '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=${maxColors}:stats_mode=diff`,
          '-y', 'palette.png',
        ])

        // Pass 2: Encode the GIF using the generated palette
        conversionPhase.value = 'encoding'
        conversionProgress.value = 0
        await ffmpeg.exec([
          '-ss', String(startTime),
          '-t', String(duration),
          '-i', 'input.mp4',
          '-i', 'palette.png',
          '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=${dither}`,
          '-loop', String(loopCount),
          '-y', 'output.gif',
        ])
      }

      // Read the output GIF from the virtual filesystem.
      // readFile returns FileData (string | Uint8Array). For binary files it's
      // always Uint8Array, but we cast to satisfy the Blob constructor's types.
      const data = await ffmpeg.readFile('output.gif') as Uint8Array

      return new Blob([data as BlobPart], { type: 'image/gif' })
    } finally {
      // Always clean up virtual filesystem files, even on error
      try { await ffmpeg.deleteFile('input.mp4') } catch {}
      try { await ffmpeg.deleteFile('palette.png') } catch {}
      try { await ffmpeg.deleteFile('output.gif') } catch {}
      conversionPhase.value = 'done'
    }
  }

  /**
   * Converts a GIF file to MP4 using FFmpeg.wasm.
   *
   * Uses H.264 encoding with configurable CRF (Constant Rate Factor) for
   * quality control. The scale filter ensures even dimensions required by
   * yuv420p pixel format, and movflags=faststart enables progressive playback.
   */
  async function convertToMp4(options: ConvertToMp4Options): Promise<Blob> {
    if (!ffmpeg) throw new Error('FFmpeg not loaded — call load() first')

    const { inputFile, crf } = options
    const { fetchFile } = await import('@ffmpeg/util')

    // Write the input GIF to FFmpeg's virtual filesystem
    await ffmpeg.writeFile('input.gif', await fetchFile(inputFile))

    conversionPhase.value = 'encoding'
    conversionProgress.value = 0

    try {
      await ffmpeg.exec([
        '-i', 'input.gif',
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-crf', String(crf),
        '-y', 'output.mp4',
      ])

      // readFile returns FileData (string | Uint8Array). For binary files it's
      // always Uint8Array, but we cast to satisfy the Blob constructor's types.
      const data = await ffmpeg.readFile('output.mp4') as Uint8Array

      return new Blob([data as BlobPart], { type: 'video/mp4' })
    } finally {
      // Always clean up virtual filesystem files, even on error
      try { await ffmpeg.deleteFile('input.gif') } catch {}
      try { await ffmpeg.deleteFile('output.mp4') } catch {}
      conversionPhase.value = 'done'
    }
  }

  /** Terminates the FFmpeg instance, cancelling any in-progress operation */
  function cancelConversion() {
    if (ffmpeg) {
      ffmpeg.terminate()
      // Null out the instance so a fresh one is created on next load(),
      // since terminate() destroys the FFmpeg instance and its listeners.
      ffmpeg = null
    }
    progressListenerAttached = false
    isReady.value = false
    conversionPhase.value = 'idle'
    conversionProgress.value = 0
  }

  return {
    isLoading,
    isReady,
    loadProgress,
    error,
    conversionProgress,
    conversionPhase,
    load,
    convertToGif,
    convertToMp4,
    cancelConversion,
  }
}
