<template>
  <div class="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto p-1">
    <button
      v-for="(frame, index) in frames"
      :key="index"
      type="button"
      class="frame-thumb"
      :class="{ 'frame-thumb-selected': selectedIndices.has(index) }"
      :aria-pressed="selectedIndices.has(index)"
      :aria-label="`Frame ${index + 1}`"
      @click="$emit('toggle-frame', index)"
    >
      <canvas
        :ref="(el) => setCanvasRef(index, el as HTMLCanvasElement | null)"
        width="64"
        height="64"
        class="w-full h-full block"
      />

      <!-- Checkmark overlay for selected frames -->
      <span v-if="selectedIndices.has(index)" class="frame-thumb-check">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <!-- Frame number label -->
      <span class="frame-thumb-label">{{ index + 1 }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'

const props = defineProps<{
  frames: DecodedFrame[]
  selectedIndices: Set<number>
}>()

defineEmits<{ 'toggle-frame': [index: number] }>()

const canvasRefs = new Map<number, HTMLCanvasElement>()

function setCanvasRef(index: number, el: HTMLCanvasElement | null) {
  if (el) {
    canvasRefs.set(index, el)
  } else {
    canvasRefs.delete(index)
  }
}

const THUMB_SIZE = 64

/**
 * Shared offscreen canvas used as source for all frame renders.
 * Created once and reused to avoid allocating a new canvas per frame.
 */
let srcCanvas: HTMLCanvasElement | null = null
let srcCtx: CanvasRenderingContext2D | null = null

function getSrcCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!srcCanvas) {
    srcCanvas = document.createElement('canvas')
    srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })
  }
  if (!srcCtx) return null
  return { canvas: srcCanvas, ctx: srcCtx }
}

/**
 * Draws a single decoded frame onto its thumbnail canvas, scaling to fit
 * (contain) within THUMB_SIZE x THUMB_SIZE while preserving aspect ratio.
 */
function drawThumb(index: number, frame: DecodedFrame) {
  const canvas = canvasRefs.get(index)
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const src = getSrcCanvas()
  if (!src) return

  // Size the source canvas to native frame dimensions
  if (src.canvas.width !== frame.width || src.canvas.height !== frame.height) {
    src.canvas.width = frame.width
    src.canvas.height = frame.height
  }

  // Paint raw RGBA pixel data onto the source canvas
  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  src.ctx.putImageData(imageData, 0, 0)

  // Clear and scale to fit within the thumbnail canvas
  ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE)
  const scale = Math.min(THUMB_SIZE / frame.width, THUMB_SIZE / frame.height)
  const scaledW = frame.width * scale
  const scaledH = frame.height * scale
  const offsetX = (THUMB_SIZE - scaledW) / 2
  const offsetY = (THUMB_SIZE - scaledH) / 2
  ctx.drawImage(src.canvas, offsetX, offsetY, scaledW, scaledH)
}

/**
 * Renders all frame thumbnails using requestAnimationFrame batching.
 * Processes a batch per animation frame to avoid blocking the main thread.
 */
function renderAllThumbs() {
  const frames = props.frames
  if (frames.length === 0) return

  const BATCH_SIZE = 8
  let offset = 0

  function renderBatch() {
    const end = Math.min(offset + BATCH_SIZE, frames.length)
    for (let i = offset; i < end; i++) {
      drawThumb(i, frames[i])
    }
    offset = end
    if (offset < frames.length) {
      requestAnimationFrame(renderBatch)
    }
  }

  requestAnimationFrame(renderBatch)
}

// Render thumbnails when frames change or on mount
watch(() => props.frames, () => {
  nextTick(() => renderAllThumbs())
}, { flush: 'post' })

onMounted(() => {
  nextTick(() => renderAllThumbs())
})

// Cleanup the shared offscreen canvas on unmount
onUnmounted(() => {
  if (srcCanvas) {
    srcCanvas.width = 0
    srcCanvas.height = 0
    srcCanvas = null
    srcCtx = null
  }
})
</script>
