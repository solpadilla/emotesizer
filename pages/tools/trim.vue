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

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Trim a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Set your trim range</strong> — drag the start and end handles to select exactly which frames to keep.</li>
        <li><strong>Preview the result</strong> — see your trimmed animation play in real time before downloading.</li>
        <li><strong>Download</strong> — click "Download Trimmed GIF" to save your shortened GIF. No watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Use Our GIF Cutter?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>100% free</strong> — no hidden costs, no premium tiers for basic trimming.</li>
        <li><strong>No watermark</strong> — your trimmed GIF is clean, no branding added.</li>
        <li><strong>Browser-based</strong> — all processing happens locally. Your GIF never leaves your device.</li>
        <li><strong>Instant preview</strong> — see the trimmed animation before downloading.</li>
        <li><strong>No signup required</strong> — just upload, trim, and download.</li>
      </ul>

      <p class="text-sm text-surface-500 mt-6">
        Need more than just trimming? Try our <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">full emote optimizer</NuxtLink> to resize and compress GIFs for Twitch, Discord, and Kick emotes.
      </p>
      <p class="text-sm text-surface-500 mt-6">
        Need to edit more? Try our
        <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink>,
        <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink>,
        or <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed changer</NuxtLink>.
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
  title: 'GIF Trimmer — Cut, Trim & Shorten GIFs Online Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Trim and cut animated GIFs online for free. Remove frames from the start and end, shorten GIF duration, and download instantly. No signup, no watermark — works in your browser.' },
    { key: 'og:title', property: 'og:title', content: 'Free GIF Cutter — Trim & Cut Animated GIFs Online' },
    { key: 'og:description', property: 'og:description', content: 'Cut and shorten GIF animations online. Remove unwanted frames, trim duration, preview changes, and download — free, no watermark.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/trim' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'Free GIF Trimmer — Cut & Shorten GIFs Online' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Trim animated GIFs online. Cut frames, shorten duration, download instantly. Free browser-based tool.' },
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
