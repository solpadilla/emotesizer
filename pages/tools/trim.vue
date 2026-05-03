<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Trimmer — Cut & Shorten GIFs</h1>
      <p class="page-subtitle mt-1">Trim animated GIFs online for free. Remove frames from the start and end — no signup, no watermark.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- Left Column: Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Upload (shown when no GIF is loaded) -->
        <DropZone
          v-if="!gifUrl"
          accept="image/gif"
          @file-selected="handleFileSelected"
          @error="handleUploadError"
        />

        <!-- Controls (shown when a GIF is loaded) -->
        <div v-else class="space-y-4">
          <!-- Loaded GIF indicator -->
          <div class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
              <img :src="gifUrl" alt="Selected GIF" class="w-full h-full object-cover" crossorigin="anonymous" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ gifFileName }}</p>
              <p class="text-xs text-surface-500">Ready to trim</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- GIF Trimmer (only shown for multi-frame GIFs) -->
          <div v-if="decodedFrames.length > 1">
            <h3 class="label mb-2">Trim Animation</h3>
            <GifTrimmer
              v-model="trimRange"
              :frames="decodedFrames"
              :is-loading="isDecoding"
            />
          </div>

          <!-- Single-frame notice -->
          <p v-else-if="decodedFrames.length === 1 && !isDecoding" class="text-sm text-surface-500">
            This GIF has only 1 frame and cannot be trimmed.
          </p>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isEncoding || isDecoding"
            @click="downloadTrimmed"
          >
            <template v-if="isEncoding">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding...
            </template>
            <template v-else>
              <IconDownload :size="18" />
              {{ isTrimmed ? 'Download Trimmed GIF' : 'Download GIF' }}
            </template>
          </button>
        </div>
      </div>

      <!-- Right Column: Preview -->
      <div class="lg:col-span-3">
        <!-- Empty state -->
        <div
          v-if="!gifUrl"
          class="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-surface-200 text-surface-400 text-sm"
        >
          Upload a GIF to get started
        </div>

        <!-- GIF preview (shows trimmed preview when available, otherwise original) -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <img
            :src="previewUrl || gifUrl"
            alt="GIF preview"
            class="max-w-full max-h-[400px] object-contain"
          />
        </div>

        <!-- File info -->
        <div v-if="decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ decodedFrames.length }} frames total</span>
          <span v-if="isTrimmed">{{ trimmedFrames.length }} frames after trim</span>
          <span>{{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px</span>
        </div>
      </div>

    </div>

    <!-- Related tools — trim pairs naturally with compress, speed, reverse, and crop workflows -->
    <ToolRelated
      current="/tools/trim"
      :tools="[
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/speed', label: 'GIF Speed', icon: 'IconGauge', description: 'Speed up or slow down GIF animation' },
        { to: '/tools/reverse', label: 'GIF Reverse', icon: 'IconReverse', description: 'Play GIFs backwards or create boomerang loops' },
        { to: '/tools/crop', label: 'GIF Crop', icon: 'IconCrop', description: 'Crop a specific region from animated GIFs' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Trim a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Set your trim range</strong> — drag the start and end handles to select exactly which frames to keep.</li>
        <li><strong>Preview the result</strong> — see your trimmed animation play in real time before downloading.</li>
        <li><strong>Download</strong> — click "Download Trimmed GIF" to save your shortened GIF. No watermark, no account needed.</li>
      </ol>
      <p class="text-xs text-surface-400 mt-2">All processing happens in your browser — <NuxtLink to="/tools#how-it-works" class="text-primary-500 hover:underline">see how the in-browser pipeline works</NuxtLink>.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">What You Can Do with a GIF Trimmer</h2>
      <p class="text-sm text-surface-600 mb-3">
        A GIF trimmer is a narrow but surprisingly versatile tool. The most common job is shortening a long screen capture or reaction clip down to the single expressive moment that actually carries the joke — the setup frames and the dead air at the end are almost always trimmable without hurting the animation. Trimming is also the fastest way to pull an emote-sized clip out of a multi-second GIF: pick the six or eight frames where the mouth drops open, discard the rest, and the file will typically land well under Twitch's 1 MB limit without touching quality. Beyond emotes, trimming is useful for cleaning up accidental mouse movement at the start of a tutorial GIF, cutting a transition frame that looks wrong, or turning a five-second loop into a two-second loop that feels punchier in a chat thread. Because our trimmer preserves exact frame data, none of this costs any visible quality.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Trim vs. Crop vs. Speed Change — Which One Do You Need?</h2>
      <p class="text-sm text-surface-600 mb-3">
        These three operations are easy to confuse because all of them "shrink" a GIF, but they shrink it along different axes. <strong>Trimming</strong> reduces the GIF along the time axis — it removes frames from the start or end, shortening the animation's duration while leaving every remaining frame exactly as it was. Use it when you want to say "just keep the middle two seconds." The <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">crop tool</NuxtLink> works along the spatial axes instead, cutting off pixels from the edges of every frame — use it when the subject is in the corner of a widescreen capture and you want a tight square. A <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed change</NuxtLink> keeps all the frames and all the pixels but adjusts how fast they play back, which affects perceived duration without removing anything. For emote work, you'll often use two of these together: trim first to isolate the moment, then crop to square, and only change speed if the loop feels off.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Tips for Making Great Emote Loops by Trimming</h2>
      <p class="text-sm text-surface-600 mb-3">
        A great emote loop feels seamless — the eye can't tell where the animation restarts. The most important rule for trimming toward that goal is to cut on matching poses. Scrub the frame slider until you find a start frame where the character is at rest or mid-motion, then find an end frame that visually continues back to that same pose. When frames one and N are nearly identical, the loop hides the seam. A second trick is to favor odd frame counts for organic motions — an 11-frame or 13-frame loop often feels more natural than a 12-frame one because the eye's rhythm detector lands on slightly different beats each pass. Third, keep an eye on total duration: emotes that run longer than about two seconds tend to feel slow in a fast-moving chat. If the source GIF is gorgeous but too long, trim aggressively and then use our <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed tool</NuxtLink> to tighten up the pace rather than cramming in more frames. Finally, always preview the trimmed GIF once as a real loop (not just scrubbed), because a seam that is invisible frame-by-frame can still catch your eye when the animation actually plays back.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">How Trimming Affects File Size</h2>
      <p class="text-sm text-surface-600 mb-3">
        File-size savings from trimming scale almost linearly with the frames you remove. GIFs store frame data as paletted image strips — dropping half the frames typically drops close to half the final file size, minus a small fixed overhead for the header and palette. That makes trimming the single most effective lossless compression technique available for animated GIFs: unlike quality reduction or color-palette shrinking, it doesn't touch any pixel data, so the surviving frames look identical to the original. If your trimmed GIF is still too large for a target platform, layer our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> on top to apply lossless re-encoding or lossy strategies on the remaining frames.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Use Our GIF Trimmer?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Frame-accurate range selector</strong> — scrub to the exact start and end frame with a draggable slider instead of fighting second-level timestamps.</li>
        <li><strong>Preserves original frame delays</strong> — the per-frame timing from the source GIF is kept intact so the trimmed clip plays back at the same speed.</li>
        <li><strong>Live preview after 500ms debounce</strong> — the preview re-encodes on idle, so you see the real trimmed loop without burning CPU on every slider tick.</li>
        <li><strong>Handles 20 MB GIFs client-side</strong> — decoding and re-encoding run entirely in your browser via WebAssembly, with no server round-trip.</li>
        <li><strong>Outputs identical frames — no re-encoding artifacts</strong> — surviving frames are passed through unchanged, so the result is visually indistinguishable from the original for the parts you kept.</li>
      </ul>

      <p class="text-sm text-surface-500 mt-6">
        Need more than just trimming? Try our <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">full emote optimizer</NuxtLink>, or jump straight to the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink>, <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink>, or <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed changer</NuxtLink>.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I trim a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, drag the start and end handles to select the frames you want to keep, then click download. The trimmed GIF plays back exactly as you previewed it.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How many frames can a Twitch emote have?</h3>
          <p class="text-sm text-surface-500 mt-1">Twitch caps animated emotes at 60 frames. If your source GIF has more, trimming down to 60 (or fewer) is the cleanest way to meet the limit without touching image quality. You can also drop duplicate frames via our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compressor</NuxtLink> for additional savings.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does trimming preserve the original frame delays?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Each surviving frame retains its original delay value from the source GIF, so the playback speed of the trimmed range matches the original exactly. If you want a faster or slower result, use the <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed tool</NuxtLink> after trimming.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I trim a GIF down to a single frame?</h3>
          <p class="text-sm text-surface-500 mt-1">You can, but the result is usually better handled by our <NuxtLink to="/tools/gif-to-png" class="text-primary-500 hover:underline">GIF-to-PNG converter</NuxtLink>, which exports a static PNG with lossless compression and full alpha transparency. Use the trimmer when you want an animated result with two or more frames.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I trim frames from the middle of a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Our trimmer keeps a contiguous range — you pick a start frame and an end frame, and everything between is kept. To remove a section from the middle, trim twice (save the head, trim again for the tail) or use a frame picker workflow via our <NuxtLink to="/tools/gif-to-png" class="text-primary-500 hover:underline">GIF-to-PNG tool</NuxtLink> and <NuxtLink to="/tools/gif-maker" class="text-primary-500 hover:underline">GIF maker</NuxtLink>.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why does my trimmed GIF still look choppy?</h3>
          <p class="text-sm text-surface-500 mt-1">Choppy playback usually traces back to the source: if the original GIF has long per-frame delays, trimming doesn't make them any shorter. Try lowering playback delays with our <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed tool</NuxtLink>, or check whether the source GIF dropped duplicate frames before export (in which case no tool can recover the missing motion).</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to decode.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does trimming add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you trimmed.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'GIF Trimmer — Frame-Accurate Cut & Shorten | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Frame-accurate GIF trimmer. Drag the start and end handles to keep exactly the frames you want, preserve original frame delays, and download a re-encoded clip.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Trimmer — EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Pick the exact start and end frames of any animated GIF and download a re-encoded clip.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/trim' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Trimmer — EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Pick the exact start and end frames of any animated GIF and download a re-encoded clip.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/trim' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Trimmer',
        'url': 'https://emotesizer.com/tools/trim',
        'description': 'Free online GIF trimmer. Cut, trim, and shorten animated GIFs. Remove frames from the start and end of any GIF — no signup, no watermark.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': ['Trim GIF animation', 'Cut GIF frames', 'Shorten GIF duration', 'Remove frames from GIF', 'Preview trimmed animation', 'Download trimmed GIF', 'No watermark', 'No signup required'],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'How do I trim a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, drag the start and end handles to select the frames you want to keep, then click download. The trimmed GIF plays back exactly as you previewed it.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How many frames can a Twitch emote have?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Twitch caps animated emotes at 60 frames. If your source GIF has more, trimming down to 60 (or fewer) is the cleanest way to meet the limit without touching image quality. You can also drop duplicate frames via our compressor for additional savings.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does trimming preserve the original frame delays?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Each surviving frame retains its original delay value from the source GIF, so the playback speed of the trimmed range matches the original exactly. If you want a faster or slower result, use the speed tool after trimming.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I trim a GIF down to a single frame?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can, but the result is usually better handled by our GIF-to-PNG converter, which exports a static PNG with lossless compression and full alpha transparency. Use the trimmer when you want an animated result with two or more frames.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I trim frames from the middle of a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Our trimmer keeps a contiguous range — you pick a start frame and an end frame, and everything between is kept. To remove a section from the middle, trim twice (save the head, trim again for the tail) or use a frame picker workflow via our GIF-to-PNG tool and GIF maker.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why does my trimmed GIF still look choppy?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Choppy playback usually traces back to the source: if the original GIF has long per-frame delays, trimming doesn\'t make them any shorter. Try lowering playback delays with our speed tool, or check whether the source GIF dropped duplicate frames before export (in which case no tool can recover the missing motion).',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to decode.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does trimming add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you trimmed.',
            },
          },
        ],
      }),
    },
  ],
})

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const trimRange = ref<[number, number]>([0, 0])
const isDecoding = ref(false)
const previewUrl = ref<string | null>(null)
const isEncoding = ref(false)
/** Stores the decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

let trimPreviewTimeout: ReturnType<typeof setTimeout> | null = null

// -- Computed --

/** The subset of decoded frames within the user's trim range */
const trimmedFrames = computed(() => {
  if (!decodedFrames.value.length) return []
  const [start, end] = trimRange.value
  return decodedFrames.value.slice(start, end + 1)
})

/** Whether the user has actually trimmed away any frames */
const isTrimmed = computed(() => {
  return trimRange.value[0] > 0 || trimRange.value[1] < decodedFrames.value.length - 1
})

// -- File handling --

function handleFileSelected(file: File) {
  // Revoke any existing blob URLs to prevent memory leaks
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null

  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

/** Decodes all frames from the current GIF for the trimmer and preview */
async function decodeGifFrames() {
  isDecoding.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    // Decode metadata (loop flag, dimensions) and individual frames
    gifMetadata.value = decode(uint8)
    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
    trimRange.value = [0, frames.length - 1]
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Debounced trim preview re-encode --
// When the user adjusts the trim range, re-encode the trimmed frames into a
// new animated GIF for a live preview. Debounced to 500ms to avoid expensive
// encode work on every slider tick while the user is still dragging.

watch(trimRange, () => {
  if (trimPreviewTimeout) clearTimeout(trimPreviewTimeout)

  if (!decodedFrames.value.length) return

  // When no trim is active, revert to the original GIF preview
  if (!isTrimmed.value) {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    return
  }

  trimPreviewTimeout = setTimeout(async () => {
    try {
      const frames = trimmedFrames.value
      if (!frames.length) return

      const encoded = await encode({
        width: frames[0].width,
        height: frames[0].height,
        looped: gifMetadata.value?.looped ?? true,
        frames: frames.map(f => ({ data: f.data, delay: f.delay || 100 })),
      })

      const blob = new Blob([encoded], { type: 'image/gif' })

      // Revoke the previous preview URL to prevent memory leaks
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      if (import.meta.dev) console.error('Trim preview failed:', e)
    }
  }, 500)
}, { deep: true })

// -- Download --

async function downloadTrimmed() {
  if (!isTrimmed.value && gifUrl.value) {
    // No trim applied — download the original file as-is
    const response = await fetch(gifUrl.value)
    const blob = await response.blob()
    downloadBlob(blob, gifFileName.value || 'animation.gif')
    return
  }

  if (previewUrl.value) {
    // Reuse the already-encoded preview blob for a fast download
    const response = await fetch(previewUrl.value)
    const blob = await response.blob()
    downloadBlob(blob, `trimmed_${gifFileName.value || 'animation.gif'}`)
    toastSuccess('Trimmed GIF downloaded!')
    return
  }

  // No cached preview — encode fresh
  isEncoding.value = true
  try {
    const frames = trimmedFrames.value
    const encoded = await encode({
      width: frames[0].width,
      height: frames[0].height,
      looped: gifMetadata.value?.looped ?? true,
      frames: frames.map(f => ({ data: f.data, delay: f.delay || 100 })),
    })
    const blob = new Blob([encoded], { type: 'image/gif' })
    downloadBlob(blob, `trimmed_${gifFileName.value || 'animation.gif'}`)
    toastSuccess('Trimmed GIF downloaded!')
  } catch {
    toastError('Failed to encode trimmed GIF')
  } finally {
    isEncoding.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (trimPreviewTimeout) {
    clearTimeout(trimPreviewTimeout)
    trimPreviewTimeout = null
  }
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  trimRange.value = [0, 0]
  previewUrl.value = null
  gifMetadata.value = null
}

onUnmounted(() => {
  clearGif()
})
</script>
