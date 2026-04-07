<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to Emote Converter</h1>
      <p class="page-subtitle mt-1">Resize, compress, and convert GIFs into emotes for Twitch, Discord, Kick, 7TV, and BTTV</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Left Column: Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Drop Zone (hidden when a GIF is loaded) -->
        <div v-if="!gifUrl">
          <DropZone
            @file-selected="handleFileSelected"
            @error="handleUploadError"
          />
        </div>

        <!-- Loaded GIF indicator -->
        <div v-else class="card flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
            <img :src="gifUrl" alt="Selected GIF" class="w-full h-full object-cover" crossorigin="anonymous" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-surface-900 truncate">{{ gifTitle || 'Uploaded GIF' }}</p>
            <p class="text-xs text-surface-500">Ready to optimize</p>
          </div>
          <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" @click="clearGif">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Trimmer / Frame Picker swap: out-in prevents overlap during transitions -->
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <!-- Trim Animation (shown when animated GIF with >1 frame is loaded) -->
          <div v-if="needsTrimmer" key="trimmer" :class="{ 'pointer-events-none opacity-60': optimizer.isProcessing.value }">
            <h3 class="label mb-2">Trim Animation</h3>
            <GifTrimmer
              v-model="trimRange"
              :frames="decodedFrames"
              :is-loading="isDecodingFrames"
            />
          </div>

          <!-- Frame Picker (shown when a GIF is loaded and a static platform is selected) -->
          <div v-else-if="needsFramePicker" key="framepicker" :class="{ 'pointer-events-none opacity-60': optimizer.isProcessing.value }">
            <h3 class="label mb-2">Select Frame</h3>
            <FramePicker
              v-model="selectedFrameIndex"
              :frames="sampledFrames"
              :is-loading="isDecodingFrames"
            />
          </div>
        </Transition>

        <!-- Platform Selector -->
        <div>
          <h3 class="label">Target Platform</h3>
          <PlatformSelector
            ref="platformSelectorRef"
            v-model="selectedPlatformId"
            :disabled-platforms="disabledPlatformIds"
          />
        </div>

        <!-- Resize Mode Selector (shown only for non-square GIFs) -->
        <div v-if="gifUrl && isNonSquare" :class="{ 'pointer-events-none opacity-60': optimizer.isProcessing.value }">
          <h3 class="label">Resize Mode</h3>
          <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Resize mode">
            <!-- Fill & Crop -->
            <button
              class="platform-card text-center"
              :class="{ 'platform-card-active': resizeMode === 'crop' }"
              role="radio"
              :aria-checked="resizeMode === 'crop'"
              aria-label="Fill and crop"
              title="Scale to cover the square and center-crop overflow"
              @click="selectResizeMode('crop')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                <rect x="2" y="6" width="28" height="20" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2" class="text-surface-300" />
                <rect x="6" y="4" width="20" height="24" rx="1" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
              </svg>
              <div class="text-xs font-semibold text-surface-700">Fill & Crop</div>
              <span class="badge badge-primary text-[10px] mt-1">Recommended</span>
            </button>

            <!-- Fit & Pad -->
            <button
              class="platform-card text-center"
              :class="{ 'platform-card-active': resizeMode === 'pad' }"
              role="radio"
              :aria-checked="resizeMode === 'pad'"
              aria-label="Fit and pad"
              title="Scale to fit within the square with padding"
              @click="selectResizeMode('pad')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2" class="text-surface-300" />
                <rect x="9" y="7" width="14" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
              </svg>
              <div class="text-xs font-semibold text-surface-700">Fit & Pad</div>
            </button>

            <!-- Stretch -->
            <button
              class="platform-card text-center"
              :class="{ 'platform-card-active': resizeMode === 'stretch' }"
              role="radio"
              :aria-checked="resizeMode === 'stretch'"
              aria-label="Stretch to fill"
              title="Stretch to fill, may distort non-square images"
              @click="selectResizeMode('stretch')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2" class="text-surface-300" />
                <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
                <!-- Horizontal squeeze arrows -->
                <path d="M8 16H2M24 16H30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-warning-500" />
                <path d="M4 14L2 16L4 18M28 14L30 16L28 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-warning-500" />
              </svg>
              <div class="text-xs font-semibold text-surface-700">Stretch</div>
              <span class="badge badge-warning text-[10px] mt-1">Distorts</span>
            </button>
          </div>

          <!-- Padding Color Presets (shown only in pad mode) -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div v-if="resizeMode === 'pad'" class="mt-3">
              <label class="label">Padding Color</label>
              <div class="flex gap-2 flex-wrap">
                <!-- Transparent -->
                <button
                  class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                  :class="{ 'pill-active': padColorPreset === 'transparent' }"
                  @click="selectPadColor('transparent')"
                >
                  <span class="inline-block w-4 h-4 rounded-sm checkerboard border border-surface-200/50" />
                  <span class="text-xs">Transparent</span>
                </button>

                <!-- White -->
                <button
                  class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                  :class="{ 'pill-active': padColorPreset === 'white' }"
                  @click="selectPadColor('white')"
                >
                  <span class="inline-block w-4 h-4 rounded-sm border border-surface-300" style="background: #ffffff;" />
                  <span class="text-xs">White</span>
                </button>

                <!-- Black -->
                <button
                  class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                  :class="{ 'pill-active': padColorPreset === 'black' }"
                  @click="selectPadColor('black')"
                >
                  <span class="inline-block w-4 h-4 rounded-sm" style="background: #000000;" />
                  <span class="text-xs">Black</span>
                </button>

                <!-- Custom -->
                <label
                  class="pill flex items-center gap-1.5 !px-3 !py-1.5 cursor-pointer"
                  :class="{ 'pill-active': padColorPreset === 'custom' }"
                >
                  <span
                    class="inline-block w-4 h-4 rounded-sm border border-surface-200/50"
                    :style="{ background: padColorPreset === 'custom' ? padColor : '#cccccc' }"
                  />
                  <span class="text-xs">Custom</span>
                  <input
                    type="color"
                    class="w-4 h-4 rounded cursor-pointer border border-surface-200"
                    :value="padColor === 'transparent' ? '#cccccc' : padColor"
                    @input="handleCustomColor"
                  />
                </label>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Optimize Button -->
        <button
          class="btn btn-primary w-full btn-lg"
          :disabled="!gifUrl || !selectedPlatform || optimizer.isProcessing.value || isSmartCompressing"
          @click="handleOptimize"
        >
          <template v-if="optimizer.isProcessing.value">
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing... {{ optimizer.progress.value }}%
          </template>
          <template v-else>
            <IconSparkle :size="18" />
            Optimize & Download
          </template>
        </button>

        <!-- Download All button (shown after optimization) -->
        <button
          v-if="optimizer.results.value.length > 1"
          class="btn btn-secondary w-full"
          @click="optimizer.downloadAll(optimizer.results.value, gifTitle || 'emote')"
        >
          <IconDownload :size="16" />
          Download All Sizes
        </button>
      </div>

      <!-- Right Column: Preview -->
      <div class="lg:col-span-3">
        <PreviewPanel
          :gif-url="effectiveGifUrl"
          :platform="selectedPlatform"
          :results="optimizer.results.value"
          :resize-mode="resizeMode"
          :pad-color="padColor"
          :source-width="sourceWidth"
          :source-height="sourceHeight"
          :selected-frame="needsFramePicker ? sampledFrames[selectedFrameIndex] : null"
          :preview-override-url="previewOverrideUrl"
          @download-single="(result) => optimizer.downloadSingle(result, gifTitle || 'emote')"
          @smart-compress="handleSmartCompress"
          @smart-compress-cancel="handleSmartCompressCancel"
          @smart-compress-undo="handleSmartCompressUndo"
        />
      </div>
    </div>

    <!-- Platform Specs Table -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">Emote Size Requirements by Platform</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-surface-200">
              <th class="py-2 pr-4 font-semibold text-surface-700">Platform</th>
              <th class="py-2 pr-4 font-semibold text-surface-700">Dimensions</th>
              <th class="py-2 pr-4 font-semibold text-surface-700">Max Size</th>
              <th class="py-2 font-semibold text-surface-700">Format</th>
            </tr>
          </thead>
          <tbody class="text-surface-500">
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">Twitch (animated)</td><td class="py-2 pr-4">112px (auto-resizes to 28/56/112)</td><td class="py-2 pr-4">1 MB</td><td class="py-2">GIF</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">Twitch (static)</td><td class="py-2 pr-4">112px (auto-resizes to 28/56/112)</td><td class="py-2 pr-4">1 MB</td><td class="py-2">PNG</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">Twitch (badges)</td><td class="py-2 pr-4">18, 36, 72px</td><td class="py-2 pr-4">25 KB each</td><td class="py-2">PNG</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">Discord</td><td class="py-2 pr-4">128px</td><td class="py-2 pr-4">256 KB</td><td class="py-2">GIF / PNG</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">Kick</td><td class="py-2 pr-4">500px (auto-resizes)</td><td class="py-2 pr-4">1 MB</td><td class="py-2">GIF / PNG</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">7TV</td><td class="py-2 pr-4">128px (recommended)</td><td class="py-2 pr-4">Varies</td><td class="py-2">GIF, AVIF, WebP</td></tr>
            <tr><td class="py-2 pr-4">BTTV</td><td class="py-2 pr-4">112-128px</td><td class="py-2 pr-4">1 MB</td><td class="py-2">GIF / PNG</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-surface-400 mt-3">
        Don't have a GIF yet? <NuxtLink to="/search" class="text-primary-500 hover:underline">Search our GIF library</NuxtLink> to find the perfect animation for your emote.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'GIF to Emote Converter — Resize for Twitch, Discord & Kick',
  meta: [
    { name: 'description', content: 'Convert and resize GIFs into emotes for Twitch, Discord, and Kick. Compress animated emotes to meet file size limits. Free browser-based tool, no signup.' },
    { property: 'og:title', content: 'GIF to Emote Converter — EmoteSizer' },
    { property: 'og:description', content: 'Resize and compress GIFs for Twitch emotes, Discord emoji, and Kick emotes.' },
    { property: 'og:url', content: 'https://emotesizer.com/optimizer' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/optimizer' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://emotesizer.com" },
        { "@type": "ListItem", "position": 2, "name": "Emote Optimizer", "item": "https://emotesizer.com/optimizer" }
      ]
    }),
  }],
})

import type { DecodedFrame } from 'modern-gif'
import { decodeFrames } from 'modern-gif'
import type { Platform, ResizeMode, OptimizationResult } from '~/types/optimizer'
import { isValidMediaUrl } from '~/utils/url'

const route = useRoute()
const { error: toastError, success: toastSuccess } = useToast()
const optimizer = useGifOptimizer()

const gifUrl = ref('')
const gifTitle = ref('')
const selectedPlatformId = ref('twitch-animated')
const platformSelectorRef = ref<{ platforms: Platform[] } | null>(null)

/**
 * Whether the uploaded source is an animated image (multi-frame GIF).
 * Defaults to true since most uploads will be GIFs. Set to false for
 * static images (PNG, JPEG) or single-frame GIFs.
 */
const isAnimatedSource = ref(true)

// Frame picker state
const selectedFrameIndex = ref(0)
const decodedFrames = ref<DecodedFrame[]>([])
const isDecodingFrames = ref(false)

// Trim range state: [startFrame, endFrame] inclusive
const trimRange = ref<[number, number]>([0, 0])

// Resize mode state
const resizeMode = ref<ResizeMode>('crop')
const padColor = ref('transparent')
const sourceWidth = ref<number | null>(null)
const sourceHeight = ref<number | null>(null)
const userOverrodeMode = ref(false)
/** Tracks which padding color preset is selected; 'custom' when using the color picker */
const padColorPreset = ref<'transparent' | 'white' | 'black' | 'custom'>('transparent')

// Smart compress state
/** Blob URL pointing to the compressed result for preview; revoked on undo/cancel/clear */
const previewOverrideUrl = ref<string | null>(null)
/** Active AbortController for the currently-running smart compression, if any */
let smartCompressAbort: AbortController | null = null
/** Stores the original blob before smart compression so Undo can restore it */
const originalBlobs = new Map<number, { blob: Blob; fileSize: number }>()
/** Whether any smart compression is currently in progress (disables the Optimize button) */
const isSmartCompressing = computed(() =>
  optimizer.results.value.some(r => r.smartCompress?.state === 'compressing'),
)

/**
 * Platform IDs that should be disabled based on the source file type.
 * Platforms requiring GIF-only format are disabled when the source is a static image.
 */
const disabledPlatformIds = computed(() => {
  if (isAnimatedSource.value) return []
  // Disable platforms that only accept GIF format (not GIF / PNG)
  return ['twitch-animated']
})

/**
 * When the source type changes from animated to static, auto-switch
 * away from any platform that is now incompatible.
 */
watch(isAnimatedSource, (animated) => {
  if (!animated && disabledPlatformIds.value.includes(selectedPlatformId.value)) {
    selectedPlatformId.value = 'twitch-static'
  }
})

/** Effective GIF URL for preview — shows compressed result when available, otherwise the original */
const effectiveGifUrl = computed(() => previewOverrideUrl.value || gifUrl.value)

/** Whether the loaded GIF is non-square (and thus the resize mode selector should be shown) */
const isNonSquare = computed(() => {
  return sourceWidth.value !== null && sourceHeight.value !== null && sourceWidth.value !== sourceHeight.value
})

/**
 * Aspect ratio thresholds for auto-selecting resize mode.
 * Images with a ratio outside this range are extremely tall or wide,
 * so cropping to a square would discard too much content — 'pad' is safer.
 * Within the range, 'crop' produces cleaner emotes with no letterboxing.
 */
const ASPECT_RATIO_MIN_FOR_CROP = 0.5 // taller than 1:2 → pad
const ASPECT_RATIO_MAX_FOR_CROP = 2.0 // wider  than 2:1 → pad

/**
 * Automatically picks a sensible resize mode based on aspect ratio.
 * Very tall or very wide images default to 'pad' to avoid losing too much content;
 * moderately non-square images default to 'crop' which looks better for emotes.
 */
function autoSelectResizeMode(width: number, height: number) {
  if (userOverrodeMode.value) return
  const ratio = width / height
  if (ratio < ASPECT_RATIO_MIN_FOR_CROP || ratio > ASPECT_RATIO_MAX_FOR_CROP) {
    resizeMode.value = 'pad'
  } else {
    resizeMode.value = 'crop'
  }
}

/** Loads the natural dimensions of a GIF from its URL and triggers auto-mode selection */
function detectSourceDimensions(url: string) {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  // Prevent the Image element from holding references after it has served its purpose
  const cleanup = () => {
    img.onload = null
    img.onerror = null
    img.src = ''
  }

  img.onload = () => {
    // Guard against broken or zero-dimension images (can occur with corrupt files or SVGs without intrinsic size)
    if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) {
      sourceWidth.value = null
      sourceHeight.value = null
      cleanup()
      return
    }
    sourceWidth.value = img.naturalWidth
    sourceHeight.value = img.naturalHeight
    autoSelectResizeMode(img.naturalWidth, img.naturalHeight)
    cleanup()
  }
  img.onerror = () => {
    sourceWidth.value = null
    sourceHeight.value = null
    cleanup()
  }
  img.src = url
}

function selectResizeMode(mode: ResizeMode) {
  resizeMode.value = mode
  userOverrodeMode.value = true
}

function selectPadColor(preset: 'transparent' | 'white' | 'black' | 'custom', color?: string) {
  padColorPreset.value = preset
  if (preset === 'transparent') padColor.value = 'transparent'
  else if (preset === 'white') padColor.value = '#ffffff'
  else if (preset === 'black') padColor.value = '#000000'
  else if (color) padColor.value = color
}

function handleCustomColor(event: Event) {
  const input = event.target as HTMLInputElement
  padColor.value = input.value
  padColorPreset.value = 'custom'
}

// Derive the selected platform object from the ID
const selectedPlatform = computed<Platform | null>(() => {
  if (!platformSelectorRef.value) return null
  return platformSelectorRef.value.platforms.find(p => p.id === selectedPlatformId.value) || null
})

/**
 * Whether the frame picker should be shown. True when a GIF is loaded,
 * the selected platform only allows 1 frame (static), and the GIF
 * has more than one frame to choose from.
 */
const needsFramePicker = computed(() => {
  return gifUrl.value
    && selectedPlatform.value?.maxFrames === 1
    && decodedFrames.value.length > 1
})

/** Whether the GIF trimmer should be shown (animated GIF with more than 1 frame, excluding static platforms) */
const needsTrimmer = computed(() => {
  return gifUrl.value
    && !isDecodingFrames.value
    && decodedFrames.value.length > 1
    && selectedPlatform.value?.maxFrames !== 1
})

/** The subset of decoded frames within the user's trim range */
const trimmedFrames = computed(() => {
  if (decodedFrames.value.length === 0) return []
  const [start, end] = trimRange.value
  return decodedFrames.value.slice(start, end + 1)
})

/**
 * Pre-decoded trimmed frames to pass to the optimizer, or undefined when no
 * trim is active. Extracted as a computed so both handleOptimize and
 * handleSmartCompress share the same logic.
 */
const framesToOptimize = computed(() => {
  if (!needsTrimmer.value) return undefined
  if (trimmedFrames.value.length >= decodedFrames.value.length) return undefined
  return trimmedFrames.value
})

/**
 * For GIFs with a very large frame count, sample down to at most 60 frames
 * for the picker UI. The sampled array holds the same DecodedFrame object
 * references, so passing them to the optimizer works directly.
 *
 * When the trimmer is active, operates on the trimmed subset rather than
 * the full frame array so the frame picker only shows frames within the
 * trim range.
 */
const sampledFrames = computed(() => {
  const source = needsTrimmer.value ? trimmedFrames.value : decodedFrames.value
  if (source.length <= 60) return source
  const step = source.length / 60
  return Array.from({ length: 60 }, (_, i) => source[Math.round(i * step)])
})

/**
 * Decodes all frames from the current GIF for the frame picker.
 * Called whenever a new GIF is loaded (upload or URL param).
 */
async function decodeGifFrames() {
  if (!gifUrl.value) return
  isDecodingFrames.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const frames = decodeFrames(new Uint8Array(buffer))
    decodedFrames.value = frames
    selectedFrameIndex.value = 0
    trimRange.value = [0, frames.length - 1]
    // A single-frame GIF is effectively static — disable animated-only platforms
    isAnimatedSource.value = frames.length > 1
  } catch (e: unknown) {
    decodedFrames.value = []
    toastError('Failed to decode GIF frames. The file may be corrupted.')
    if (import.meta.dev) console.error('Frame decode failed:', e)
  } finally {
    isDecodingFrames.value = false
  }
}

// Read query params to pre-load from search
onMounted(() => {
  const gifParam = route.query.gif as string | undefined
  const titleParam = route.query.title as string | undefined

  if (gifParam && isValidMediaUrl(gifParam)) {
    gifUrl.value = gifParam
    detectSourceDimensions(gifParam)

    // Detect source type from the URL extension. URLs ending in .png or .jpg/.jpeg
    // are static; .gif URLs are decoded to check frame count.
    const urlPath = gifParam.split('?')[0].toLowerCase()
    if (urlPath.endsWith('.png') || urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) {
      isAnimatedSource.value = false
      selectedPlatformId.value = 'twitch-static'
    } else {
      // Assume animated; decodeGifFrames will correct this for single-frame GIFs
      isAnimatedSource.value = true
    }

    decodeGifFrames()
  }
  if (titleParam) {
    gifTitle.value = titleParam
  }
})

onUnmounted(() => {
  if (gifUrl.value && gifUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(gifUrl.value)
  }
  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
  }
  smartCompressAbort?.abort()
})

// Reset frame picker selection whenever the trim range changes so the
// index doesn't point outside the new trimmed subset.
watch(trimRange, () => {
  selectedFrameIndex.value = 0
})

// Clear optimization results and smart compress state when the user
// switches platforms so stale previews from the previous platform
// don't persist.
watch(selectedPlatformId, () => {
  // Clear optimization results when platform changes
  optimizer.results.value = []

  // Reset preview override back to original source
  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
    previewOverrideUrl.value = null
  }

  // Clear smart compress state and stored original blobs
  originalBlobs.clear()

  // Cancel any running smart compression
  if (smartCompressAbort) {
    smartCompressAbort.abort()
    smartCompressAbort = null
  }
})

function handleFileSelected(file: File) {
  const url = URL.createObjectURL(file)
  gifUrl.value = url
  gifTitle.value = file.name.replace(/\.[^/.]+$/, '')
  // Reset results and resize mode override for the new file
  optimizer.results.value = []
  userOverrodeMode.value = false
  padColor.value = 'transparent'
  padColorPreset.value = 'transparent'
  detectSourceDimensions(url)

  // Detect whether the source is animated based on MIME type.
  // Non-GIF files (PNG, JPEG) are always static. GIF files will be
  // further validated by decodeGifFrames which checks actual frame count.
  if (file.type !== 'image/gif') {
    isAnimatedSource.value = false
    selectedPlatformId.value = 'twitch-static'
  } else {
    // Assume animated until decodeGifFrames confirms frame count
    isAnimatedSource.value = true
    selectedPlatformId.value = 'twitch-animated'
  }

  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

function clearGif() {
  // Abort any running smart compression
  if (smartCompressAbort) {
    smartCompressAbort.abort()
    smartCompressAbort = null
  }
  originalBlobs.clear()

  // Revoke preview override blob URL to prevent memory leaks
  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
    previewOverrideUrl.value = null
  }
  // Revoke object URL if it was created locally
  if (gifUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(gifUrl.value)
  }
  gifUrl.value = ''
  gifTitle.value = ''
  optimizer.results.value = []
  // Reset resize mode state
  sourceWidth.value = null
  sourceHeight.value = null
  userOverrodeMode.value = false
  resizeMode.value = 'crop'
  padColor.value = 'transparent'
  padColorPreset.value = 'transparent'
  // Reset frame picker and trim state
  decodedFrames.value = []
  selectedFrameIndex.value = 0
  trimRange.value = [0, 0]
  // Reset animated source detection to default (true)
  isAnimatedSource.value = true
}

/**
 * Handles the "Smart Compress" button click. Initiates iterative compression
 * on a single over-limit result. Only one compression can run at a time.
 */
async function handleSmartCompress(result: OptimizationResult) {
  // Prevent concurrent smart compressions
  if (isSmartCompressing.value) {
    toastError('A compression is already in progress. Please wait or cancel it first.')
    return
  }

  if (!selectedPlatform.value || !gifUrl.value) return

  // Store the original blob so Undo can restore it
  originalBlobs.set(result.size, { blob: result.blob, fileSize: result.fileSize })

  // Set the compressing state
  result.smartCompress = {
    state: 'compressing',
    originalFileSize: result.fileSize,
    strategiesApplied: [],
  }

  // Create an AbortController for cancellation
  smartCompressAbort = new AbortController()
  const startTime = Date.now()

  try {
    // Pass pre-decoded trimmed frames to skip re-fetching and respect user's trim selection
    const compressed = await optimizer.smartCompressGif(
      gifUrl.value,
      result.size,
      selectedPlatform.value.maxFileSizeBytes,
      resizeMode.value,
      padColor.value,
      selectedPlatform.value.maxFrames,
      (strategy) => {
        // Update the strategy label in the UI
        result.smartCompress = {
          ...result.smartCompress!,
          currentStrategy: strategy,
        }
      },
      smartCompressAbort.signal,
      framesToOptimize.value,
    )

    // Enforce minimum 400ms display time to prevent jarring flash
    const elapsed = Date.now() - startTime
    if (elapsed < 400) {
      await new Promise(resolve => setTimeout(resolve, 400 - elapsed))
    }

    // Update the result with the compression output
    result.blob = compressed.blob
    result.fileSize = compressed.fileSize

    // Create a blob URL from the compressed result so the preview updates
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
    }
    previewOverrideUrl.value = URL.createObjectURL(compressed.blob)

    if (compressed.success) {
      result.withinLimit = true
      result.smartCompress = {
        state: 'success',
        originalFileSize: result.smartCompress!.originalFileSize,
        strategiesApplied: compressed.strategiesApplied,
        bestAchievedSize: compressed.fileSize,
      }
      toastSuccess('Smart compression succeeded!')
    } else {
      result.withinLimit = false
      result.smartCompress = {
        state: 'failed',
        originalFileSize: result.smartCompress!.originalFileSize,
        strategiesApplied: compressed.strategiesApplied,
        bestAchievedSize: compressed.fileSize,
      }
    }
  } catch (e: unknown) {
    // AbortError means the user cancelled — handled by handleSmartCompressCancel
    if (e instanceof DOMException && e.name === 'AbortError') return

    if (import.meta.dev) console.error('Smart compression failed:', e)
    const message = e instanceof Error ? e.message : 'Smart compression failed.'
    toastError(message)

    // Restore original state on unexpected error
    const original = originalBlobs.get(result.size)
    if (original) {
      result.blob = original.blob
      result.fileSize = original.fileSize
    }
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
      previewOverrideUrl.value = null
    }
    result.smartCompress = undefined
  } finally {
    smartCompressAbort = null
  }
}

/** Cancels an in-progress smart compression and restores the original result. */
function handleSmartCompressCancel(result: OptimizationResult) {
  if (smartCompressAbort) {
    smartCompressAbort.abort()
    smartCompressAbort = null
  }

  // Restore original blob and fileSize
  const original = originalBlobs.get(result.size)
  if (original) {
    result.blob = original.blob
    result.fileSize = original.fileSize
    originalBlobs.delete(result.size)
  }

  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
    previewOverrideUrl.value = null
  }
  result.smartCompress = undefined
  toastSuccess('Compression cancelled.')
}

/** Undoes a completed smart compression, restoring the original blob. */
function handleSmartCompressUndo(result: OptimizationResult) {
  const original = originalBlobs.get(result.size)
  if (original) {
    result.blob = original.blob
    result.fileSize = original.fileSize
    result.withinLimit = false
    originalBlobs.delete(result.size)
  }
  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
    previewOverrideUrl.value = null
  }
  result.smartCompress = undefined
}

async function handleOptimize() {
  if (!gifUrl.value || !selectedPlatform.value) return

  try {
    // When the frame picker is active, pass the user's chosen frame so the
    // optimizer exports that specific frame instead of always using frame 0.
    // The sampledFrames array holds the same object references as decodedFrames,
    // so we can pass the frame object directly.
    const selectedFrame = needsFramePicker.value
      ? sampledFrames.value[selectedFrameIndex.value]
      : undefined

    // Pass pre-decoded trimmed frames to skip re-fetching and respect user's trim selection
    await optimizer.optimizeGif(gifUrl.value, selectedPlatform.value, resizeMode.value, padColor.value, selectedFrame, framesToOptimize.value)
    toastSuccess('Optimization complete!')
  } catch (e: unknown) {
    if (import.meta.dev) console.error('Optimization failed:', e)
    const message = e instanceof Error ? e.message : 'Optimization failed. Please try again.'
    toastError(message)
  }
}
</script>
