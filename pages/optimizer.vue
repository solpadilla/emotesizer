<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to Emote Converter</h1>
      <p class="page-subtitle mt-1">Free online gif editor — resize, compress, and convert animated GIFs into emotes for Twitch, Discord, Kick, 7TV, BTTV, and FFZ. Use our gif compressor to reduce file size and make gif smaller in seconds.</p>
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

        <!-- Crop Image Toggle -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="gifUrl && decodedFrames.length > 0" class="card flex items-center gap-3 cursor-pointer select-none" @click="toggleCrop" role="switch" :aria-checked="isCropActive" aria-label="Toggle crop mode">
            <svg class="w-5 h-5 flex-shrink-0" :class="isCropActive ? 'text-primary-500' : 'text-surface-400'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2v4h12v12h4" /><path d="M18 22v-4H6V6H2" />
            </svg>
            <span class="text-sm font-medium text-surface-700 flex-1">Crop Image</span>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full transition-colors" :class="isCropActive ? 'bg-primary-500 text-white' : 'bg-surface-200 text-surface-500'">
              {{ isCropActive ? 'On' : 'Off' }}
            </span>
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
      <div class="lg:col-span-3 space-y-6">
        <!-- Crop canvas (replaces source preview when active) -->
        <div v-if="isCropActive && decodedFrames.length" class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-700">Crop Preview</h3>
          <div class="relative rounded-2xl overflow-hidden border border-surface-200/50 checkerboard flex items-center justify-center min-h-[200px]">
            <GifCropCanvas
              :gif-url="effectiveGifUrl"
              :frames="trimmedFrames.length ? trimmedFrames : decodedFrames"
              :crop-x="cropX"
              :crop-y="cropY"
              :crop-w="cropW"
              :crop-h="cropH"
              :aspect-ratio="null"
              @update:crop="handleCropUpdate"
            />
            <!-- Loading overlay while crop preview is generating -->
            <Transition
              enter-active-class="transition-opacity duration-200 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-200 ease-out"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div v-if="isCropGenerating" class="absolute inset-0 flex items-center justify-center bg-surface-900/30 rounded-2xl">
                <svg class="w-8 h-8 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </Transition>
          </div>
          <div class="flex justify-between items-center">
            <p v-if="hasCropApplied" class="text-xs text-surface-500">
              Crop: {{ cropW }} x {{ cropH }}px ({{ Math.round((cropW * cropH) / ((sourceWidth || 1) * (sourceHeight || 1)) * 100) }}% of original)
            </p>
            <p v-else class="text-xs text-surface-400 italic">Drag on the preview to crop</p>
            <button v-if="hasCropApplied" class="text-xs text-primary-500 hover:underline" @click="resetCrop">Reset</button>
          </div>
        </div>

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
          :hide-source-preview="isCropActive"
          :is-preview-loading="isCropGenerating"
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
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">BTTV</td><td class="py-2 pr-4">112-128px</td><td class="py-2 pr-4">1 MB</td><td class="py-2">GIF / PNG</td></tr>
            <tr class="border-b border-surface-100"><td class="py-2 pr-4">FFZ</td><td class="py-2 pr-4">128x128px (recommended)</td><td class="py-2 pr-4">Varies</td><td class="py-2">GIF / PNG</td></tr>
            <tr><td class="py-2 pr-4">YouTube</td><td class="py-2 pr-4">128x128px</td><td class="py-2 pr-4">1 MB</td><td class="py-2">GIF / PNG</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-surface-400 mt-3">
        Emote too large? If your Twitch animated emote is over 1 MB or your Discord custom emoji exceeds 256 KB, use Smart Compress to reduce the GIF file size automatically. Our GIF optimizer handles compression so you never have to worry about upload limits.
      </p>
      <p class="text-xs text-surface-400 mt-2">
        Don't have a GIF yet? <NuxtLink to="/search" class="text-primary-500 hover:underline">Search our GIF library</NuxtLink> to find the perfect animation for your emote.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Common Problems</h2>

      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-surface-700">Twitch emote too large?</h3>
          <p class="text-xs text-surface-500 mt-1">If your GIF exceeds Twitch's 1 MB limit, use our Smart Compress feature to automatically reduce the file size. The gif compressor trims frames, lowers color depth, and adjusts quality until your emote fits. This also works when your 7TV emote upload size or BTTV emote dimensions don't meet platform requirements.</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-surface-700">Discord emoji too big?</h3>
          <p class="text-xs text-surface-500 mt-1">Discord requires custom emoji under 256 KB at 128x128 pixels. Upload your image and EmoteSizer will compress it automatically. If the result is still too big, Smart Compress will reduce gif file size further until it fits Discord's limit.</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-surface-700">How to upload emotes to Twitch?</h3>
          <p class="text-xs text-surface-500 mt-1">After resizing and compressing your emote with EmoteSizer, go to the Twitch Creator Dashboard, navigate to Viewer Rewards > Emotes, and upload your optimized files. Twitch accepts GIFs between 112x112 and 4096x4096 pixels, under 1 MB. Our emote size converter prepares your files so they're ready for upload.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'GIF to Emote Converter — Resize for Twitch, Discord & Kick',
  meta: [
    { name: 'description', content: 'Free gif compressor and emote size converter — compress gif online to reduce gif file size and make gif smaller. Resize image for Twitch emotes (28x28, 56x56, 112x112), Discord emoji (128x128), Kick (500x500), 7TV, BTTV, and FFZ. Convert GIF to PNG and resize Twitch sub badges.' },
    { property: 'og:title', content: 'GIF to Emote Converter — EmoteSizer' },
    { property: 'og:description', content: 'Free animated emote maker — resize and compress GIFs for Twitch emotes, sub badges, Discord emoji, Kick, 7TV, BTTV, and FFZ.' },
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
import { decodeFrames, encode } from 'modern-gif'
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

// Crop state — optional pre-processing step before optimization
const isCropActive = ref(false)
/** True while the debounced crop preview is being generated, used to show loading state in PreviewPanel */
const isCropGenerating = ref(false)
const cropX = ref(0)
const cropY = ref(0)
const cropW = ref(0)
const cropH = ref(0)

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
let trimPreviewTimeout: ReturnType<typeof setTimeout> | null = null
let cropPreviewTimeout: ReturnType<typeof setTimeout> | null = null
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

/** Whether the user has actually defined a crop region smaller than the full image */
const hasCropApplied = computed(() => {
  if (!isCropActive.value) return false
  return cropX.value !== 0 || cropY.value !== 0
    || cropW.value !== sourceWidth.value || cropH.value !== sourceHeight.value
})

/** Effective dimensions after crop (used for isNonSquare calculation) */
const effectiveWidth = computed(() => isCropActive.value && hasCropApplied.value ? cropW.value : sourceWidth.value)
const effectiveHeight = computed(() => isCropActive.value && hasCropApplied.value ? cropH.value : sourceHeight.value)

/** Whether the loaded GIF is non-square (and thus the resize mode selector should be shown) */
const isNonSquare = computed(() => {
  return effectiveWidth.value !== null && effectiveHeight.value !== null && effectiveWidth.value !== effectiveHeight.value
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

function toggleCrop() {
  if (!isCropActive.value && (!sourceWidth.value || !sourceHeight.value)) return
  isCropActive.value = !isCropActive.value
  if (isCropActive.value && cropW.value === 0) {
    // Initialize crop to full image on first activation
    cropX.value = 0
    cropY.value = 0
    cropW.value = sourceWidth.value || 0
    cropH.value = sourceHeight.value || 0
  }
  // When deactivating crop, clear the crop-generated preview so the
  // original (or trim-adjusted) image is shown again
  if (!isCropActive.value) {
    isCropGenerating.value = false
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
      previewOverrideUrl.value = null
    }
  }
}

function resetCrop() {
  cropX.value = 0
  cropY.value = 0
  cropW.value = sourceWidth.value || 0
  cropH.value = sourceHeight.value || 0
  isCropGenerating.value = false
  // Clear the crop preview so the original (or trimmed) image is shown
  if (previewOverrideUrl.value) {
    URL.revokeObjectURL(previewOverrideUrl.value)
    previewOverrideUrl.value = null
  }
}

function handleCropUpdate(region: { x: number; y: number; w: number; h: number }) {
  cropX.value = region.x
  cropY.value = region.y
  cropW.value = region.w
  cropH.value = region.h
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
  if (trimPreviewTimeout) {
    clearTimeout(trimPreviewTimeout)
    trimPreviewTimeout = null
  }
  smartCompressAbort?.abort()
})

// Reset frame picker selection whenever the trim range changes so the
// index doesn't point outside the new trimmed subset.
// Also update the source preview to reflect the trimmed content: when the
// user has trimmed to a sub-range, re-encode the trimmed frames into an
// animated GIF so the preview plays the trimmed animation (not a still).
// The re-encode is debounced (500ms) to avoid expensive work on every
// slider tick while the user is still dragging.
watch(trimRange, () => {
  selectedFrameIndex.value = 0

  // Don't override the preview when optimization results already exist
  // (smart compress sets its own preview URL that should take priority)
  if (optimizer.results.value.length) return

  // Don't override a crop preview with a trim preview — crop takes priority
  // because it represents the latest spatial adjustment the user made
  if (isCropActive.value && hasCropApplied.value) return

  // When the trimmer isn't active or there are no decoded frames, clear any
  // existing trim preview so the original animated GIF shows again
  if (!needsTrimmer.value || !decodedFrames.value.length) {
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
      previewOverrideUrl.value = null
    }
    return
  }

  const [start, end] = trimRange.value
  const fullRange = start === 0 && end === decodedFrames.value.length - 1

  if (fullRange) {
    // Full range selected — show the original animated GIF
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
      previewOverrideUrl.value = null
    }
    return
  }

  // Debounce the re-encode — wait for user to stop dragging
  if (trimPreviewTimeout) clearTimeout(trimPreviewTimeout)
  trimPreviewTimeout = setTimeout(async () => {
    try {
      const frames = trimmedFrames.value
      if (!frames.length) return

      // Encode trimmed frames into an animated GIF for a live preview
      const encodedGif = await encode({
        width: frames[0].width,
        height: frames[0].height,
        frames: frames.map(f => ({
          data: f.data,
          delay: f.delay || 100,
        })),
      })

      const blob = new Blob([encodedGif], { type: 'image/gif' })

      // Revoke the previous override URL to prevent memory leaks
      if (previewOverrideUrl.value) {
        URL.revokeObjectURL(previewOverrideUrl.value)
      }
      previewOverrideUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      if (import.meta.dev) console.error('Trim preview encode failed:', e)
    }
  }, 500)
}, { deep: true })

// Live crop preview: when the user adjusts the crop region, generate a
// cropped preview image so Target Sizes and Chat Preview reflect the crop
// instead of showing the original uncropped image. Debounced at 300ms for
// a good balance between responsiveness and avoiding excessive re-encodes.
watch([isCropActive, cropX, cropY, cropW, cropH], () => {
  // Don't override when optimization results exist
  if (optimizer.results.value.length) return

  // When crop is not active or not meaningfully applied, clear any
  // crop-generated preview and fall back to the trim preview or original
  if (!isCropActive.value || !hasCropApplied.value) {
    isCropGenerating.value = false
    if (cropPreviewTimeout) {
      clearTimeout(cropPreviewTimeout)
      cropPreviewTimeout = null
    }
    // Only clear the override if we need to — if trim is active with a
    // sub-range, let the trim watcher regenerate its own preview
    if (previewOverrideUrl.value) {
      URL.revokeObjectURL(previewOverrideUrl.value)
      previewOverrideUrl.value = null
    }
    return
  }

  // Show loading state immediately when crop coordinates change,
  // before the debounce fires, so the user gets instant visual feedback
  isCropGenerating.value = true

  if (cropPreviewTimeout) clearTimeout(cropPreviewTimeout)
  cropPreviewTimeout = setTimeout(async () => {
    try {
      const frames = trimmedFrames.value?.length ? trimmedFrames.value : decodedFrames.value
      if (!frames.length) return

      const cx = cropX.value
      const cy = cropY.value
      const cw = cropW.value
      const ch = cropH.value
      if (cw <= 0 || ch <= 0) return

      // Animated GIF: crop ALL frames so the preview plays back without
      // skipping.  Processing is batched with main-thread yields between
      // batches so the UI stays responsive even for GIFs with many frames.
      if (frames.length > 1 && selectedPlatform.value?.maxFrames !== 1) {
        const srcCanvas = new OffscreenCanvas(frames[0].width, frames[0].height)
        const srcCtx = srcCanvas.getContext('2d')!
        const cropCanvas = new OffscreenCanvas(cw, ch)
        const cropCtx = cropCanvas.getContext('2d')!

        // Process in batches of 5 frames, yielding between batches
        const batchSize = 5
        const croppedFrames: { data: Uint8ClampedArray; delay: number }[] = []
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i]
          srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height)
          const imgData = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height)
          srcCtx.putImageData(imgData, 0, 0)
          cropCtx.clearRect(0, 0, cw, ch)
          cropCtx.drawImage(srcCanvas, cx, cy, cw, ch, 0, 0, cw, ch)
          const croppedData = cropCtx.getImageData(0, 0, cw, ch)
          croppedFrames.push({
            data: croppedData.data,
            delay: frame.delay || 100,
          })
          // Yield every batchSize frames to keep the UI responsive
          if ((i + 1) % batchSize === 0) await new Promise(r => setTimeout(r, 0))
        }

        const encodedGif = await encode({
          width: cw,
          height: ch,
          frames: croppedFrames,
        })

        const blob = new Blob([encodedGif], { type: 'image/gif' })
        if (previewOverrideUrl.value) URL.revokeObjectURL(previewOverrideUrl.value)
        previewOverrideUrl.value = URL.createObjectURL(blob)
        isCropGenerating.value = false
      } else {
        // Static image: crop a single frame and produce a PNG blob
        const frame = frames[selectedFrameIndex.value] || frames[0]
        const srcCanvas = new OffscreenCanvas(frame.width, frame.height)
        const srcCtx = srcCanvas.getContext('2d')!
        const imgData = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height)
        srcCtx.putImageData(imgData, 0, 0)

        const cropCanvas = new OffscreenCanvas(cw, ch)
        const cropCtx = cropCanvas.getContext('2d')!
        cropCtx.drawImage(srcCanvas, cx, cy, cw, ch, 0, 0, cw, ch)

        const blob = await cropCanvas.convertToBlob({ type: 'image/png' })
        if (previewOverrideUrl.value) URL.revokeObjectURL(previewOverrideUrl.value)
        previewOverrideUrl.value = URL.createObjectURL(blob)
        isCropGenerating.value = false
      }
    } catch (e) {
      isCropGenerating.value = false
      if (import.meta.dev) console.error('Crop preview encode failed:', e)
    }
  }, 300)
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
  // Reset crop state for the new file
  isCropActive.value = false
  cropX.value = 0
  cropY.value = 0
  cropW.value = 0
  cropH.value = 0
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
  // Cancel any pending trim or crop preview re-encode
  if (trimPreviewTimeout) {
    clearTimeout(trimPreviewTimeout)
    trimPreviewTimeout = null
  }
  if (cropPreviewTimeout) {
    clearTimeout(cropPreviewTimeout)
    cropPreviewTimeout = null
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
  // Reset crop state
  isCropActive.value = false
  cropX.value = 0
  cropY.value = 0
  cropW.value = 0
  cropH.value = 0
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
    // Build crop region if the user has defined one
    const scCropRegion = hasCropApplied.value
      ? { x: cropX.value, y: cropY.value, w: cropW.value, h: cropH.value }
      : undefined

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
      scCropRegion,
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

    // Build crop region if the user has defined one
    const cropRegion = hasCropApplied.value
      ? { x: cropX.value, y: cropY.value, w: cropW.value, h: cropH.value }
      : undefined

    // Pass pre-decoded trimmed frames to skip re-fetching and respect user's trim selection
    await optimizer.optimizeGif(gifUrl.value, selectedPlatform.value, resizeMode.value, padColor.value, selectedFrame, framesToOptimize.value, cropRegion)
    toastSuccess('Optimization complete!')
  } catch (e: unknown) {
    if (import.meta.dev) console.error('Optimization failed:', e)
    const message = e instanceof Error ? e.message : 'Optimization failed. Please try again.'
    toastError(message)
  }
}
</script>
