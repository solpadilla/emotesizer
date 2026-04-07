<template>
  <div class="flex flex-col items-center gap-3">
    <!-- Frame preview canvas -->
    <div v-if="!isLoading" class="checkerboard rounded-xl overflow-hidden border border-surface-200/50">
      <canvas
        ref="canvasRef"
        width="120"
        height="120"
        class="block"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-else class="w-[120px] h-[120px] bg-surface-200 animate-pulse rounded-xl" />

    <!-- Frame count text -->
    <p class="text-xs text-surface-500">
      <template v-if="isLoading">Decoding frames...</template>
      <template v-else-if="isTrimmed">
        Keeping {{ keptFrameCount }} of {{ frames.length }} frames
      </template>
      <template v-else>
        All {{ frames.length }} frames (no trim)
      </template>
    </p>

    <!-- Dual-handle range slider -->
    <div
      ref="trackContainerRef"
      class="relative w-full h-5 flex items-center select-none touch-none"
      @pointerdown="handlePointerDown"
      @keydown="handleKeydown"
    >
      <!-- Track background -->
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-surface-200/60" />

      <!-- Active fill between handles -->
      <div
        class="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary-500 rounded-full"
        :style="{ left: startPercent + '%', right: (100 - endPercent) + '%' }"
      />

      <!-- Start handle — outer div provides a 44px touch target (WCAG 2.5.8) -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center z-10"
        :style="{ left: startPercent + '%' }"
      >
        <button
          ref="startHandleRef"
          class="w-5 h-5 rounded-full bg-white border-2 border-primary-500 shadow-sm cursor-grab focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          role="slider"
          aria-label="Trim start"
          :aria-valuemin="0"
          :aria-valuemax="frames.length - 1"
          :aria-valuenow="modelValue[0]"
          :aria-valuetext="`Frame ${modelValue[0] + 1}`"
          tabindex="0"
          data-handle="start"
        />
      </div>

      <!-- End handle — outer div provides a 44px touch target (WCAG 2.5.8) -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center z-10"
        :style="{ left: endPercent + '%' }"
      >
        <button
          ref="endHandleRef"
          class="w-5 h-5 rounded-full bg-white border-2 border-primary-500 shadow-sm cursor-grab focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          role="slider"
          aria-label="Trim end"
          :aria-valuemin="0"
          :aria-valuemax="frames.length - 1"
          :aria-valuenow="modelValue[1]"
          :aria-valuetext="`Frame ${modelValue[1] + 1}`"
          tabindex="0"
          data-handle="end"
        />
      </div>
    </div>

    <!-- Labels -->
    <div class="text-xs text-surface-500 flex justify-between w-full">
      <span>Start</span>
      <span>End</span>
    </div>

    <!-- Reset button (only when trimmed) -->
    <button
      v-if="isTrimmed"
      class="text-xs text-primary-600 hover:text-primary-700 transition-colors"
      @click="resetRange"
    >
      Reset to full range
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'

const props = defineProps<{
  frames: DecodedFrame[]
  modelValue: [number, number]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: [number, number]]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const trackContainerRef = ref<HTMLElement | null>(null)
const startHandleRef = ref<HTMLElement | null>(null)
const endHandleRef = ref<HTMLElement | null>(null)

const PREVIEW_SIZE = 120

/** Which handle is currently being dragged, if any */
const activeHandle = ref<'start' | 'end' | null>(null)

/** Reusable temporary canvas for rendering frame pixel data */
let srcCanvas: HTMLCanvasElement | null = null
let srcCtx: CanvasRenderingContext2D | null = null

const totalFrames = computed(() => props.frames.length)

const isTrimmed = computed(() => {
  if (totalFrames.value === 0) return false
  return props.modelValue[0] !== 0 || props.modelValue[1] !== totalFrames.value - 1
})

const keptFrameCount = computed(() => {
  return props.modelValue[1] - props.modelValue[0] + 1
})

/** Handle positions as percentages of the track width */
const startPercent = computed(() => {
  if (totalFrames.value <= 1) return 0
  return (props.modelValue[0] / (totalFrames.value - 1)) * 100
})

const endPercent = computed(() => {
  if (totalFrames.value <= 1) return 100
  return (props.modelValue[1] / (totalFrames.value - 1)) * 100
})

/** The frame index to display in the preview canvas */
const previewFrameIndex = computed(() => {
  if (activeHandle.value === 'end') return props.modelValue[1]
  return props.modelValue[0]
})

/**
 * Draws the specified frame onto the 120x120 preview canvas.
 * Uses a reusable temporary source canvas at the frame's native resolution,
 * then scales to fit (contain) within the display canvas via drawImage.
 */
function drawFrame(frame: DecodedFrame) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

  // Lazily create or reuse the temporary source canvas
  if (!srcCanvas) {
    srcCanvas = document.createElement('canvas')
    srcCtx = srcCanvas.getContext('2d')
  }
  if (!srcCtx) return

  srcCanvas.width = frame.width
  srcCanvas.height = frame.height

  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  srcCtx.putImageData(imageData, 0, 0)

  // Scale to fit (contain) within the preview canvas while preserving aspect ratio
  const scale = Math.min(PREVIEW_SIZE / frame.width, PREVIEW_SIZE / frame.height)
  const scaledW = frame.width * scale
  const scaledH = frame.height * scale
  const offsetX = (PREVIEW_SIZE - scaledW) / 2
  const offsetY = (PREVIEW_SIZE - scaledH) / 2

  ctx.drawImage(srcCanvas, offsetX, offsetY, scaledW, scaledH)
}

/** Converts a pointer clientX position to a frame index based on track geometry */
function clientXToFrameIndex(clientX: number): number {
  const track = trackContainerRef.value
  if (!track || totalFrames.value <= 1) return 0

  const rect = track.getBoundingClientRect()
  const ratio = (clientX - rect.left) / rect.width
  const clamped = Math.max(0, Math.min(1, ratio))
  return Math.round(clamped * (totalFrames.value - 1))
}

/** Determines which handle is closer to a given clientX position */
function nearestHandle(clientX: number): 'start' | 'end' {
  const startEl = startHandleRef.value
  const endEl = endHandleRef.value

  if (!startEl || !endEl) return 'start'

  const startRect = startEl.getBoundingClientRect()
  const endRect = endEl.getBoundingClientRect()

  const distToStart = Math.abs(clientX - (startRect.left + startRect.width / 2))
  const distToEnd = Math.abs(clientX - (endRect.left + endRect.width / 2))

  return distToStart <= distToEnd ? 'start' : 'end'
}

/** RAF handle for throttling pointer move updates */
let rafId: number | null = null

function handlePointerDown(event: PointerEvent) {
  if (props.isLoading || totalFrames.value <= 1) return

  event.preventDefault()

  // Determine which handle to drag — either from clicking a handle (or its
  // wrapping touch-target div) or whichever handle is nearest to the pointer.
  const target = event.target as HTMLElement
  const handleAttr = (target.dataset?.handle
    || target.closest('[data-handle]')?.getAttribute('data-handle')) as 'start' | 'end' | undefined
  const handle = handleAttr || nearestHandle(event.clientX)

  activeHandle.value = handle

  // Capture pointer on the container for reliable tracking outside bounds
  const container = trackContainerRef.value
  if (container) {
    container.setPointerCapture(event.pointerId)
  }

  // Apply the initial position
  updateHandlePosition(event.clientX)

  const onPointerMove = (e: PointerEvent) => {
    // Throttle updates using requestAnimationFrame for smooth scrubbing
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      updateHandlePosition(e.clientX)
    })
  }

  const onPointerUp = () => {
    activeHandle.value = null
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

/** Updates the active handle's value based on pointer position, enforcing constraints */
function updateHandlePosition(clientX: number) {
  const frameIndex = clientXToFrameIndex(clientX)
  const [start, end] = props.modelValue

  if (activeHandle.value === 'start') {
    // Start handle cannot pass end handle, minimum 1 frame gap
    const clamped = Math.min(frameIndex, end - 1)
    const newStart = Math.max(0, clamped)
    if (newStart !== start) {
      emit('update:modelValue', [newStart, end])
    }
  } else if (activeHandle.value === 'end') {
    // End handle cannot go before start handle, minimum 1 frame gap
    const clamped = Math.max(frameIndex, start + 1)
    const newEnd = Math.min(totalFrames.value - 1, clamped)
    if (newEnd !== end) {
      emit('update:modelValue', [start, newEnd])
    }
  }
}

/** Keyboard navigation: arrow keys adjust handle position by 1 frame */
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const handleAttr = target.dataset?.handle as 'start' | 'end' | undefined
  if (!handleAttr) return

  let delta = 0
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -1
  else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = 1
  else return

  event.preventDefault()

  const [start, end] = props.modelValue

  if (handleAttr === 'start') {
    const newStart = Math.max(0, Math.min(end - 1, start + delta))
    if (newStart !== start) {
      activeHandle.value = 'start'
      emit('update:modelValue', [newStart, end])
      // Clear active handle after a tick so the preview shows the correct frame
      nextTick(() => { activeHandle.value = null })
    }
  } else {
    const newEnd = Math.max(start + 1, Math.min(totalFrames.value - 1, end + delta))
    if (newEnd !== end) {
      activeHandle.value = 'end'
      emit('update:modelValue', [start, newEnd])
      nextTick(() => { activeHandle.value = null })
    }
  }
}

function resetRange() {
  emit('update:modelValue', [0, totalFrames.value - 1])
}

// When a new GIF is loaded the frames array changes, but modelValue may still
// reference indices from the previous (longer) GIF. Clamp to valid bounds.
watch(() => props.frames.length, (newLen) => {
  if (newLen === 0) return
  const [start, end] = props.modelValue
  const clampedStart = Math.min(start, newLen - 1)
  const clampedEnd = Math.min(end, newLen - 1)
  if (clampedStart !== start || clampedEnd !== end) {
    emit('update:modelValue', [clampedStart, Math.max(clampedEnd, clampedStart)])
  }
})

// Redraw the preview canvas whenever the preview frame changes
watch(
  () => [previewFrameIndex.value, props.frames] as const,
  () => {
    const idx = previewFrameIndex.value
    if (props.frames.length > 0 && idx >= 0 && idx < props.frames.length) {
      drawFrame(props.frames[idx])
    }
  },
  { flush: 'post' },
)

// Draw the initial frame once mounted
onMounted(() => {
  if (props.frames.length > 0) {
    const idx = previewFrameIndex.value
    if (idx >= 0 && idx < props.frames.length) {
      drawFrame(props.frames[idx])
    }
  }
})

// Clean up the reusable source canvas on unmount
onBeforeUnmount(() => {
  if (srcCanvas) {
    srcCanvas.width = 0
    srcCanvas.height = 0
    srcCanvas = null
    srcCtx = null
  }
})
</script>
