<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to PNG Converter — Extract Frames from Animated GIFs</h1>
      <p class="page-subtitle mt-1">Free online GIF to PNG converter and frame extractor — pick any frame from an animated GIF and save it as a lossless PNG image with transparency preserved. Perfect for thumbnails, profile pictures, and still captures. No watermark, no signup, no upload.</p>
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
              <p class="text-xs text-surface-500">{{ decodedFrames.length }} frames</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Frame picker (only for multi-frame GIFs) -->
          <div v-if="decodedFrames.length > 1">
            <!-- Selection mode toggle -->
            <h3 class="label mb-2">Pick Frames</h3>
            <div class="segmented-control w-full mb-4" role="radiogroup" aria-label="Frame selection mode">
              <button
                role="radio"
                :aria-checked="selectionMode === 'single'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': selectionMode === 'single' }"
                @click="setSelectionMode('single')"
              >
                Single Frame
              </button>
              <button
                role="radio"
                :aria-checked="selectionMode === 'multi'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': selectionMode === 'multi' }"
                @click="setSelectionMode('multi')"
              >
                Multiple Frames
              </button>
            </div>

            <!-- Single-frame slider picker -->
            <FramePicker
              v-if="selectionMode === 'single'"
              v-model="selectedFrameIndex"
              :frames="decodedFrames"
              :is-loading="isDecoding"
            />

            <!-- Multi-frame thumbnail grid -->
            <template v-else>
              <FrameGrid
                :frames="decodedFrames"
                :selected-indices="selectedFrameIndices"
                @toggle-frame="toggleFrame"
              />

              <!-- Bulk controls -->
              <div class="flex items-center justify-between mt-3">
                <p class="text-xs text-surface-500">
                  {{ selectedFrameIndices.size }} of {{ decodedFrames.length }} frames selected
                </p>
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-sm" @click="selectAllFrames">Select All</button>
                  <button class="btn btn-secondary btn-sm" :disabled="selectedFrameIndices.size === 0" @click="deselectAllFrames">Deselect All</button>
                </div>
              </div>
            </template>
          </div>

          <!-- Single-frame notice -->
          <p v-else-if="decodedFrames.length === 1 && !isDecoding" class="text-sm text-surface-500">
            This GIF has only 1 frame. It will be exported as-is.
          </p>

          <!-- Download button: single mode -->
          <button
            v-if="selectionMode === 'single'"
            class="btn btn-primary btn-lg w-full"
            :disabled="isDecoding || !previewPngBlob"
            @click="downloadAsPng"
          >
            <IconDownload :size="18" />
            Download as PNG
          </button>

          <!-- Download button: multi mode -->
          <button
            v-else
            class="btn btn-primary btn-lg w-full"
            :disabled="isZipping || selectedFrameIndices.size === 0"
            @click="downloadAsZip"
          >
            <IconDownload :size="18" />
            {{ isZipping ? 'Creating ZIP...' : `Download ${selectedFrameIndices.size} PNG${selectedFrameIndices.size !== 1 ? 's' : ''} as ZIP` }}
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

        <!-- PNG preview on checkerboard background -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <!-- Multi mode: prompt or preview last-clicked frame -->
          <template v-if="selectionMode === 'multi'">
            <div v-if="selectedFrameIndices.size === 0" class="text-surface-400 text-sm">
              Select frames from the grid
            </div>
            <img
              v-else-if="multiPreviewPngUrl"
              :src="multiPreviewPngUrl"
              alt="Selected frame as PNG"
              class="max-w-full max-h-[400px] object-contain"
            />
            <div v-else class="text-surface-400 text-sm">Rendering preview...</div>
          </template>

          <!-- Single mode: standard preview -->
          <template v-else>
            <img
              v-if="previewPngUrl"
              :src="previewPngUrl"
              alt="Selected frame as PNG"
              class="max-w-full max-h-[400px] object-contain"
            />
            <div v-else class="text-surface-400 text-sm">Decoding frames...</div>
          </template>
        </div>

        <!-- File info -->
        <div v-if="decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <template v-if="selectionMode === 'multi' && selectedFrameIndices.size > 0">
            <span>Previewing frame {{ lastClickedIndex + 1 }} &mdash; {{ selectedFrameIndices.size }} frame{{ selectedFrameIndices.size !== 1 ? 's' : '' }} selected</span>
          </template>
          <template v-else-if="selectionMode === 'single'">
            <span>Showing frame {{ selectedFrameIndex + 1 }}</span>
          </template>
        </div>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Extract a Frame from a GIF</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click. Supports up to 10 MB. File never leaves your device.</li>
        <li><strong>Pick the frame you want</strong> — use the slider to scrub through frames. Preview updates live.</li>
        <li><strong>Download as PNG</strong> — click to save a lossless, full-resolution PNG. No watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Convert GIF to PNG?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Grab the perfect still</strong> — freeze on exactly the right frame.</li>
        <li><strong>Lossless quality</strong> — PNG preserves every pixel, including transparency.</li>
        <li><strong>Great for thumbnails and profile pictures</strong> — extract the best moment from any animation.</li>
        <li><strong>100% free, no watermark</strong> — download clean PNG files every time.</li>
        <li><strong>Browser-based and private</strong> — your GIF never leaves your device.</li>
        <li><strong>No signup required</strong> — just upload, pick, and download.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF vs PNG — When to Convert</h2>
      <div class="overflow-x-auto rounded-xl border border-surface-200/80">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="bg-surface-100/50 text-surface-600">
              <th class="px-4 py-2 font-semibold">Feature</th>
              <th class="px-4 py-2 font-semibold">GIF</th>
              <th class="px-4 py-2 font-semibold">PNG</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-200/50 text-surface-500">
            <tr><td class="px-4 py-2">Animation</td><td class="px-4 py-2">Yes</td><td class="px-4 py-2">No (static only)</td></tr>
            <tr><td class="px-4 py-2">Colors</td><td class="px-4 py-2">256 max</td><td class="px-4 py-2">16.7 million</td></tr>
            <tr><td class="px-4 py-2">Transparency</td><td class="px-4 py-2">Binary (on/off)</td><td class="px-4 py-2">Full alpha channel</td></tr>
            <tr><td class="px-4 py-2">Compression</td><td class="px-4 py-2">Lossless (LZW)</td><td class="px-4 py-2">Lossless (Deflate)</td></tr>
            <tr><td class="px-4 py-2">Best for</td><td class="px-4 py-2">Short animations, emotes</td><td class="px-4 py-2">Thumbnails, profile pictures, web graphics</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-surface-400 mt-2">Converting a GIF frame to PNG gives you higher color fidelity and better transparency — ideal for static emotes, avatars, and social media images.</p>

      <p class="text-sm text-surface-500 mt-6">
        Need to edit the animation itself? Use our <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer</NuxtLink> to cut frames, the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> to change dimensions, or the <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to reduce file size. Or try our <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">full emote optimizer</NuxtLink> for one-click emote formatting for Twitch, Discord, and Kick.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I convert a GIF to PNG?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, pick the frame you want with the slider, then click "Download as PNG". The selected frame is saved as a lossless PNG at the original resolution.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this extract all frames or just one?</h3>
          <p class="text-sm text-surface-500 mt-1">Both. In Single Frame mode, use the slider to pick one frame. Switch to Multiple Frames mode to select any combination of frames and download them all as a ZIP file of PNGs.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is the PNG the same quality as the original GIF frame?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. The PNG is exported at the GIF's native resolution with lossless quality. Transparency is preserved.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I use this for single-frame (static) GIFs?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. If the GIF has only one frame, the frame picker is skipped and you can download the PNG directly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 10 MB. All processing happens in your browser, so larger files may take a moment to decode.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does converting add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks or branding. The PNG you download is exactly the frame you selected.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does GIF to PNG keep transparency?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. PNG supports full alpha channel transparency, which is actually better than GIF's binary (on/off) transparency. If your GIF has transparent areas, the PNG output preserves them perfectly. This makes it ideal for extracting emote frames or sticker thumbnails with clean transparent backgrounds.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the difference between GIF and PNG?</h3>
          <p class="text-sm text-surface-500 mt-1">GIF supports animation and is limited to 256 colors with binary transparency. PNG is a static format that supports 16.7 million colors with full alpha transparency and lossless compression. Converting a GIF frame to PNG gives you higher color fidelity and better transparency handling — perfect for thumbnails, profile pictures, and web graphics.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I get a still image from a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your animated GIF to our GIF to PNG converter, use the frame picker slider to find the exact frame you want, then click "Download as PNG." You get a full-resolution, lossless still image of that specific moment in the animation.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I use this as a GIF splitter to extract all frames?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Switch to Multiple Frames mode, click "Select All," and download every frame as a ZIP of PNGs. You can also pick specific frames if you only need a few. Each PNG is named with its frame number for easy sorting.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decodeFrames } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'GIF to PNG Converter — Extract GIF Frames Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Convert GIF to PNG online free. Extract any frame from animated GIFs with our frame picker. Lossless quality, transparency preserved. No watermark, no signup.' },
    { key: 'og:title', property: 'og:title', content: 'GIF to PNG Converter — Extract Frames from Animated GIFs Free' },
    { key: 'og:description', property: 'og:description', content: 'Free GIF to PNG converter and frame extractor. Pick any frame, download as lossless PNG with transparency. Browser-based, no signup.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/gif-to-png' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF to PNG Converter — Extract Frames from Animated GIFs Free' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free GIF to PNG converter and frame extractor. Pick any frame, download as lossless PNG with transparency. Browser-based, no signup.' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/gif-to-png' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF to PNG Converter',
        'url': 'https://emotesizer.com/tools/gif-to-png',
        'description': 'Free online GIF to PNG converter. Extract any frame from an animated GIF and download as a high-quality, lossless PNG image. No signup, no watermark — processed in your browser.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Convert GIF to PNG online free',
          'GIF to PNG converter no watermark',
          'Extract frame from animated GIF',
          'GIF frame extractor online',
          'GIF frame picker with slider',
          'GIF splitter — extract individual frames',
          'Extract all frames as ZIP',
          'Multi-frame selection with ZIP download',
          'GIF to PNG lossless quality',
          'GIF to PNG with transparency preserved',
          'GIF to still image converter',
          'GIF thumbnail extractor',
          'Download frame as PNG',
          'Select specific frame from GIF',
          'Save GIF frame as image',
          'Browser-based processing — no upload required',
          'No signup required',
          'Client-side — files never leave your device',
        ],
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
            'name': 'How do I convert a GIF to PNG?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, pick the frame you want with the slider, then click "Download as PNG". The selected frame is saved as a lossless PNG at the original resolution.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this extract all frames or just one?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Both. In Single Frame mode, use the slider to pick one frame. Switch to Multiple Frames mode to select any combination of frames and download them all as a ZIP file of PNGs.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is the PNG the same quality as the original GIF frame?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. The PNG is exported at the GIF\'s native resolution with lossless quality. Transparency is preserved.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I use this for single-frame (static) GIFs?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. If the GIF has only one frame, the frame picker is skipped and you can download the PNG directly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 10 MB. All processing happens in your browser, so larger files may take a moment to decode.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does converting add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks or branding. The PNG you download is exactly the frame you selected.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does GIF to PNG keep transparency?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. PNG supports full alpha channel transparency, which is actually better than GIF\'s binary (on/off) transparency. If your GIF has transparent areas, the PNG output preserves them perfectly. This makes it ideal for extracting emote frames or sticker thumbnails with clean transparent backgrounds.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the difference between GIF and PNG?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'GIF supports animation and is limited to 256 colors with binary transparency. PNG is a static format that supports 16.7 million colors with full alpha transparency and lossless compression. Converting a GIF frame to PNG gives you higher color fidelity and better transparency handling — perfect for thumbnails, profile pictures, and web graphics.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I get a still image from a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your animated GIF to our GIF to PNG converter, use the frame picker slider to find the exact frame you want, then click "Download as PNG." You get a full-resolution, lossless still image of that specific moment in the animation.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I use this as a GIF splitter to extract all frames?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Switch to Multiple Frames mode, click "Select All," and download every frame as a ZIP of PNGs. You can also pick specific frames if you only need a few. Each PNG is named with its frame number for easy sorting.',
            },
          },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to Convert GIF to PNG Online',
        'description': 'Extract any frame from an animated GIF and save it as a lossless PNG image using EmoteSizer\'s free GIF to PNG converter.',
        'step': [
          { '@type': 'HowToStep', 'position': 1, 'name': 'Upload your GIF', 'text': 'Drag and drop or click to browse. Supports animated GIFs up to 10 MB. Your file never leaves your device — all processing happens in your browser.' },
          { '@type': 'HowToStep', 'position': 2, 'name': 'Pick the frame you want', 'text': 'Use the frame picker slider to scrub through every frame of the animation. The preview updates live so you can find the perfect moment to capture.' },
          { '@type': 'HowToStep', 'position': 3, 'name': 'Download as PNG', 'text': 'Click Download as PNG to save a lossless, full-resolution PNG of the selected frame with transparency preserved. No watermark, no account needed.' },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF to PNG Converter' },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://emotesizer.com' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': 'https://emotesizer.com/tools' },
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF to PNG', 'item': 'https://emotesizer.com/tools/gif-to-png' },
        ],
      }),
    },
  ],
})

const { error: toastError, success: toastSuccess } = useToast()
const { downloadBlob } = useDownload()

let isMounted = true

// -- Reactive state --

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const selectedFrameIndex = ref(0)
const isDecoding = ref(false)
const previewPngBlob = ref<Blob | null>(null)
const previewPngUrl = ref<string | null>(null)

// Multi-frame selection state
type SelectionMode = 'single' | 'multi'
const selectionMode = ref<SelectionMode>('single')
const selectedFrameIndices = ref<Set<number>>(new Set())
const isZipping = ref(false)
const lastClickedIndex = ref(0)
const multiPreviewPngUrl = ref<string | null>(null)

// -- File handling --

function handleFileSelected(file: File) {
  // Revoke any existing blob URLs to prevent memory leaks
  clearGif()

  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

/** Decodes all frames from the current GIF */
async function decodeGifFrames() {
  isDecoding.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
    selectedFrameIndex.value = 0

    // Render the first frame immediately (the watcher won't fire since
    // selectedFrameIndex is already 0 from its initial value)
    renderFrameAsPng()
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- PNG preview rendering --
// Renders the selected frame to a canvas at native resolution and converts
// to a PNG blob URL. Updates live as the slider moves (no debounce needed
// since a single-frame canvas render is fast).

// Reusable canvas for PNG rendering — created once, reused across frame changes
let pngCanvas: HTMLCanvasElement | null = null
let pngCtx: CanvasRenderingContext2D | null = null

function getPngCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!pngCanvas) {
    pngCanvas = document.createElement('canvas')
    pngCtx = pngCanvas.getContext('2d', { willReadFrequently: true })
  }
  if (!pngCtx) return null
  return { canvas: pngCanvas, ctx: pngCtx }
}

watch(selectedFrameIndex, () => {
  renderFrameAsPng()
})

/**
 * Renders the currently selected frame onto an offscreen canvas at native
 * resolution, then converts to a PNG blob URL for preview and download.
 */
function renderFrameAsPng() {
  const frame = decodedFrames.value[selectedFrameIndex.value]
  if (!frame) return

  const result = getPngCanvas()
  if (!result) return
  const { canvas, ctx } = result

  // Resize canvas only if dimensions changed
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }

  // Paint raw RGBA pixel data onto the canvas
  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  ctx.putImageData(imageData, 0, 0)

  // Convert to PNG blob
  canvas.toBlob((blob) => {
    if (!isMounted || !blob) return

    // Revoke previous preview URL to prevent memory leaks
    if (previewPngUrl.value) {
      URL.revokeObjectURL(previewPngUrl.value)
    }
    previewPngBlob.value = blob
    previewPngUrl.value = URL.createObjectURL(blob)
  }, 'image/png')
}

// -- Selection mode --

function setSelectionMode(mode: SelectionMode) {
  if (selectionMode.value === mode) return

  if (mode === 'multi') {
    // Pre-select the currently viewed single frame
    selectedFrameIndices.value = new Set([selectedFrameIndex.value])
    lastClickedIndex.value = selectedFrameIndex.value
    renderMultiPreview(selectedFrameIndex.value)
  } else {
    // Switching to single: clear multi selection
    selectedFrameIndices.value = new Set()
    revokeMultiPreview()
  }

  selectionMode.value = mode
}

function toggleFrame(index: number) {
  const next = new Set(selectedFrameIndices.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selectedFrameIndices.value = next
  lastClickedIndex.value = index

  // Update the multi-mode preview to show the last-clicked frame
  if (next.size > 0) {
    renderMultiPreview(index)
  } else {
    revokeMultiPreview()
  }
}

function selectAllFrames() {
  selectedFrameIndices.value = new Set(decodedFrames.value.map((_, i) => i))
  // Keep the current preview as-is, or show frame 0 if none was shown
  if (!multiPreviewPngUrl.value && decodedFrames.value.length > 0) {
    renderMultiPreview(0)
    lastClickedIndex.value = 0
  }
}

function deselectAllFrames() {
  selectedFrameIndices.value = new Set()
  revokeMultiPreview()
}

// -- Multi-mode preview --

// Version counter to guard against stale toBlob callbacks when the user
// clicks frames faster than the async blob conversion can resolve.
let multiPreviewVersion = 0

function revokeMultiPreview() {
  if (multiPreviewPngUrl.value) {
    URL.revokeObjectURL(multiPreviewPngUrl.value)
    multiPreviewPngUrl.value = null
  }
}

/**
 * Renders a specific frame as a PNG blob URL for the multi-mode preview.
 * Reuses the same offscreen canvas infrastructure as single-mode rendering.
 */
function renderMultiPreview(index: number) {
  const version = ++multiPreviewVersion

  const frame = decodedFrames.value[index]
  if (!frame) return

  const result = getPngCanvas()
  if (!result) return
  const { canvas, ctx } = result

  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }

  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  ctx.putImageData(imageData, 0, 0)

  canvas.toBlob((blob) => {
    // Discard stale renders: if a newer call has incremented the version
    // since this blob started, this callback is outdated.
    if (!isMounted || !blob || version !== multiPreviewVersion) return
    revokeMultiPreview()
    multiPreviewPngUrl.value = URL.createObjectURL(blob)
  }, 'image/png')
}

// -- Helper: render any frame to a PNG blob --

/**
 * Renders a decoded frame to a PNG Blob. Used by both single download
 * and batch ZIP creation to avoid duplicating canvas logic.
 */
function renderFrameToPngBlob(frame: DecodedFrame): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const result = getPngCanvas()
    if (!result) return reject(new Error('Canvas unavailable'))
    const { canvas, ctx } = result

    if (canvas.width !== frame.width || canvas.height !== frame.height) {
      canvas.width = frame.width
      canvas.height = frame.height
    }

    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height,
    )
    ctx.putImageData(imageData, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

// -- Download --

function downloadAsPng() {
  if (!previewPngBlob.value) return

  const baseName = gifFileName.value.replace(/\.gif$/i, '')
  const filename = decodedFrames.value.length > 1
    ? `${baseName}_frame${selectedFrameIndex.value + 1}.png`
    : `${baseName}.png`

  downloadBlob(previewPngBlob.value, filename)
}

async function downloadAsZip() {
  if (selectedFrameIndices.value.size === 0) return
  isZipping.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const baseName = gifFileName.value.replace(/\.gif$/i, '')
    const sorted = [...selectedFrameIndices.value].sort((a, b) => a - b)
    const padLength = String(decodedFrames.value.length).length

    for (const idx of sorted) {
      const frame = decodedFrames.value[idx]
      if (!frame) continue
      const blob = await renderFrameToPngBlob(frame)
      const padded = String(idx + 1).padStart(padLength, '0')
      zip.file(`${baseName}_frame${padded}.png`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${baseName}_frames.zip`)
    toastSuccess(`Downloaded ${sorted.length} frame${sorted.length !== 1 ? 's' : ''} as ZIP`)
  } catch {
    toastError('Failed to create ZIP file')
  } finally {
    isZipping.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewPngUrl.value) URL.revokeObjectURL(previewPngUrl.value)
  revokeMultiPreview()
  multiPreviewVersion = 0
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  selectedFrameIndex.value = 0
  previewPngBlob.value = null
  previewPngUrl.value = null
  selectionMode.value = 'single'
  selectedFrameIndices.value = new Set()
  isZipping.value = false
  lastClickedIndex.value = 0

  // Release the reusable canvas
  if (pngCanvas) {
    pngCanvas.width = 0
    pngCanvas.height = 0
    pngCanvas = null
    pngCtx = null
  }
}

onUnmounted(() => {
  isMounted = false
  clearGif()
})
</script>
