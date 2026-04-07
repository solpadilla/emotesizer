<template>
  <div class="space-y-6">
    <!-- Source Preview -->
    <div v-if="gifUrl && isValidGifUrl(gifUrl)" class="space-y-3">
      <h3 class="text-sm font-semibold text-surface-700">Source Preview</h3>
      <div class="rounded-xl overflow-hidden bg-surface-100 border border-surface-200/50">
        <img
          :src="previewSrc"
          alt="Source GIF preview"
          class="max-w-full max-h-[300px] mx-auto block"
          crossorigin="anonymous"
          @load="handleImageLoad"
        />
      </div>
      <div v-if="sourceInfo.width" class="space-y-1">
        <div class="flex gap-4 text-xs text-surface-500">
          <span>{{ sourceInfo.width }} x {{ sourceInfo.height }}px</span>
          <span v-if="sourceInfo.fileSize">{{ formatBytes(sourceInfo.fileSize) }}</span>
        </div>
        <!-- Aspect ratio indicator shown when the image is not square -->
        <div v-if="sourceInfo.width !== sourceInfo.height" class="text-xs text-surface-400">
          <span>Aspect ratio {{ simplifyRatio(sourceInfo.width, sourceInfo.height) }}</span>
          <span v-if="resizeNote" class="ml-2 text-surface-500 italic">{{ resizeNote }}</span>
        </div>
      </div>
    </div>

    <!-- No source placeholder -->
    <div v-else class="rounded-xl border-2 border-dashed border-surface-200 p-12 text-center">
      <div class="text-surface-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p class="text-sm">Upload a GIF or select one from search</p>
      </div>
    </div>

    <!-- Target Size Previews -->
    <div v-if="gifUrl && platform" class="space-y-3">
      <h3 class="text-sm font-semibold text-surface-700">Target Sizes</h3>
      <div class="flex flex-wrap gap-4 items-end">
        <div
          v-for="size in platform.sizes"
          :key="size"
          class="flex flex-col items-center gap-2"
        >
          <!-- Minimum 40px display size ensures tiny previews (18x18, 28x28) remain visible and interactive -->
          <div
            class="rounded-lg overflow-hidden border border-surface-200/50 flex items-center justify-center"
            :class="{ checkerboard: !padContainerBg }"
            :style="{
              width: `${Math.max(size, 40)}px`,
              height: `${Math.max(size, 40)}px`,
              backgroundColor: padContainerBg || undefined,
            }"
          >
            <img
              :src="previewSrc"
              :alt="`Preview at ${size}x${size} pixels`"
              :style="{
                width: `${size}px`,
                height: `${size}px`,
                objectFit: previewObjectFit,
                objectPosition: 'center',
              }"
              class="block"
              crossorigin="anonymous"
            />
          </div>
          <span class="text-xs text-surface-500">{{ size }}px</span>
        </div>
      </div>
    </div>

    <!-- Optimization Results -->
    <div v-if="results.length > 0" class="space-y-3">
      <h3 class="text-sm font-semibold text-surface-700">Results</h3>
      <div class="rounded-xl border border-surface-200/50 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-100/50">
              <th class="text-left py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Size</th>
              <th class="text-left py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Format</th>
              <th class="text-left py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">File Size</th>
              <th class="text-center py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
              <th class="text-right py-2.5 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="result in results" :key="result.size">
              <!-- Main result row -->
              <tr
                class="border-t border-surface-200/50"
                :class="{
                  'bg-primary-50/30': result.smartCompress?.state === 'compressing',
                }"
              >
                <!-- Size cell (always visible) -->
                <td class="py-2.5 px-4 text-surface-900 font-medium">{{ result.size }}x{{ result.size }}</td>

                <!-- Compressing state: merge Format + File Size + Status + Action into one cell -->
                <template v-if="result.smartCompress?.state === 'compressing'">
                  <td colspan="4" class="py-2.5 px-4">
                    <div class="flex items-center gap-3">
                      <!-- Spinner -->
                      <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span class="text-surface-700 font-medium text-xs">Compressing...</span>
                      <span v-if="result.smartCompress.currentStrategy" class="text-xs text-surface-400">
                        {{ result.smartCompress.currentStrategy }}
                      </span>
                      <button
                        class="text-xs text-surface-400 hover:text-error-500 transition-colors ml-auto"
                        @click="$emit('smart-compress-cancel', result)"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </template>

                <!-- Normal / idle / success / failed state: show all columns -->
                <template v-else>
                  <td class="py-2.5 px-4 text-surface-600">{{ result.format }}</td>
                  <td class="py-2.5 px-4 text-surface-600">{{ formatBytes(result.fileSize) }}</td>
                  <td class="py-2.5 px-4 text-center">
                    <span v-if="result.withinLimit" class="badge badge-success">Pass</span>
                    <span v-else class="badge badge-error">Over Limit</span>
                  </td>
                  <td class="py-2.5 px-4 text-right">
                    <!-- Over limit + idle/no smart compress: show Smart Compress + Download -->
                    <div
                      v-if="!result.withinLimit && (!result.smartCompress || result.smartCompress.state === 'idle')"
                      class="flex flex-col items-end gap-1"
                    >
                      <button
                        class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style="background: rgba(var(--color-primary-500), 0.1); color: rgb(var(--color-primary-600));"
                        @click="$emit('smart-compress', result)"
                      >
                        <IconSparkle :size="12" />
                        Smart Compress
                      </button>
                      <button
                        class="text-primary-500 hover:text-primary-600 font-medium text-xs transition-colors"
                        @click="$emit('download-single', result)"
                      >
                        Download
                      </button>
                    </div>
                    <!-- Over limit + failed: just Download -->
                    <div v-else-if="!result.withinLimit && result.smartCompress?.state === 'failed'" class="flex flex-col items-end gap-1">
                      <button
                        class="text-primary-500 hover:text-primary-600 font-medium text-xs transition-colors"
                        @click="$emit('download-single', result)"
                      >
                        Download
                      </button>
                    </div>
                    <!-- Within limit (pass or success): just Download -->
                    <div v-else>
                      <button
                        class="text-primary-500 hover:text-primary-600 font-medium text-xs transition-colors"
                        @click="$emit('download-single', result)"
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <!-- Success sub-row -->
              <tr
                v-if="result.smartCompress?.state === 'success'"
                class="border-t border-surface-200/50"
                :style="{ background: 'rgba(var(--color-success-500), 0.04)' }"
              >
                <td colspan="5" class="py-2 px-4">
                  <div class="flex items-center justify-between gap-4 text-xs">
                    <div class="flex items-center gap-3 text-surface-600">
                      <span>
                        {{ formatBytes(result.smartCompress.originalFileSize ?? 0) }}
                        <span class="text-surface-400 mx-1">&rarr;</span>
                        {{ formatBytes(result.fileSize) }}
                      </span>
                      <span class="text-surface-400">|</span>
                      <span class="text-surface-500">
                        {{ result.smartCompress.strategiesApplied?.join(', ') }}
                      </span>
                    </div>
                    <button
                      class="text-surface-400 hover:text-surface-600 font-medium transition-colors"
                      @click="$emit('smart-compress-undo', result)"
                    >
                      Undo
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Failed sub-row -->
              <tr
                v-if="result.smartCompress?.state === 'failed'"
                class="border-t border-surface-200/50"
                :style="{ background: 'rgba(var(--color-warning-500), 0.04)' }"
              >
                <td colspan="5" class="py-2 px-4">
                  <div class="flex items-center justify-between gap-4 text-xs">
                    <div class="text-surface-600">
                      <span>
                        Could not meet the {{ formatBytes(platform?.maxFileSizeBytes ?? 0) }} limit.
                        Best result: {{ formatBytes(result.smartCompress.bestAchievedSize ?? result.fileSize) }}.
                      </span>
                      <span class="text-surface-400 ml-2">Consider using a shorter or simpler source GIF.</span>
                    </div>
                    <button
                      class="text-surface-400 hover:text-surface-600 font-medium transition-colors flex-shrink-0"
                      @click="$emit('smart-compress-undo', result)"
                    >
                      Undo
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'
import type { Platform, OptimizationResult, ResizeMode } from '~/types/optimizer'

const props = defineProps<{
  gifUrl: string
  platform: Platform | null
  results: OptimizationResult[]
  resizeMode: ResizeMode
  padColor: string
  sourceWidth: number | null
  sourceHeight: number | null
  /** When provided, previews show this static frame instead of the animated GIF */
  selectedFrame: DecodedFrame | null
  /** When set, overrides all other preview sources (used to show the compressed result) */
  previewOverrideUrl: string | null
}>()

defineEmits<{
  'download-single': [result: OptimizationResult]
  'smart-compress': [result: OptimizationResult]
  'smart-compress-cancel': [result: OptimizationResult]
  'smart-compress-undo': [result: OptimizationResult]
}>()

const sourceInfo = reactive({
  width: 0,
  height: 0,
  fileSize: 0,
})

/** CSS object-fit value matching the selected resize mode so previews approximate the final output */
const previewObjectFit = computed(() => {
  switch (props.resizeMode) {
    case 'crop': return 'cover'
    case 'pad': return 'contain'
    case 'stretch': return 'fill'
    default: return 'cover'
  }
})

/**
 * Container background for 'pad' mode thumbnails.
 * Uses the chosen pad color, or falls back to transparent (shown via checkerboard class).
 */
const padContainerBg = computed(() => {
  if (props.resizeMode !== 'pad') return undefined
  if (!props.padColor || props.padColor === 'transparent') return undefined
  return props.padColor
})

/**
 * When a static frame is selected (for static platforms like Twitch Static Emote),
 * convert the raw pixel data to a PNG data URL so the preview shows the chosen
 * frame as a still image instead of the animated GIF.
 */
const framePreviewUrl = computed(() => {
  const frame = props.selectedFrame
  if (!frame) return null

  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  ctx.putImageData(imageData, 0, 0)
  const dataUrl = canvas.toDataURL('image/png')

  // Release the temporary canvas to free GPU/memory resources
  canvas.width = 0
  canvas.height = 0

  return dataUrl
})

/**
 * The image src to use for previews.
 * Priority: previewOverrideUrl (compressed result) > framePreviewUrl (static frame) > gifUrl (original).
 * After smart compression, the override URL shows the compressed output so both
 * the source preview and target size thumbnails update immediately.
 */
const previewSrc = computed(() => props.previewOverrideUrl ?? framePreviewUrl.value ?? props.gifUrl)

/** Human-readable note about what the resize mode will do to the source image */
const resizeNote = computed(() => {
  const w = props.sourceWidth
  const h = props.sourceHeight
  if (!w || !h || w === h) return null

  if (props.resizeMode === 'crop') {
    // The visible fraction is the ratio of the shorter side to the longer side;
    // everything outside that fraction gets center-cropped away
    const croppedPercent = Math.round((1 - Math.min(w, h) / Math.max(w, h)) * 100)
    return `~${croppedPercent}% of edges will be cropped`
  }

  if (props.resizeMode === 'pad') {
    // When fit inside a square, the image occupies (shorter/longer) fraction of the area
    const padPercent = Math.round((1 - Math.min(w, h) / Math.max(w, h)) * 100)
    return `~${padPercent}% of area will be padding`
  }

  if (props.resizeMode === 'stretch') {
    return 'Image will be distorted'
  }

  return null
})

/** Only render images served over HTTPS (or blob: URLs from local uploads) to prevent XSS. */
function isValidGifUrl(url: string): boolean {
  if (url.startsWith('blob:')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function handleImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  sourceInfo.width = img.naturalWidth
  sourceInfo.height = img.naturalHeight
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

/** Reduces a width:height ratio to its simplest integer form (e.g. 1920x1080 -> "16:9") */
function simplifyRatio(w: number, h: number): string {
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}
</script>
