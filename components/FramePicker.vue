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

    <!-- Frame counter -->
    <p class="text-xs text-surface-500">
      <template v-if="isLoading">Decoding frames...</template>
      <template v-else>Frame {{ modelValue + 1 }} of {{ frames.length }}</template>
    </p>

    <!-- Frame scrubber -->
    <input
      type="range"
      :min="0"
      :max="Math.max(frames.length - 1, 0)"
      :value="modelValue"
      :disabled="isLoading || frames.length === 0"
      class="w-full"
      aria-label="Select GIF frame"
      :aria-valuetext="`Frame ${modelValue + 1} of ${frames.length}`"
      @input="handleSliderInput"
    />

    <!-- First / Last labels -->
    <div class="text-xs text-surface-500 flex justify-between w-full">
      <span>First</span>
      <span>Last</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'

const props = defineProps<{
  frames: DecodedFrame[]
  modelValue: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const PREVIEW_SIZE = 120

/**
 * Draws the specified frame onto the preview canvas.
 * Uses a temporary source canvas at the frame's native resolution,
 * then scales to fit (contain) within the display canvas via drawImage.
 */
function drawFrame(frame: DecodedFrame) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear the display canvas
  ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

  // Create a temporary canvas at the frame's native dimensions
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = frame.width
  srcCanvas.height = frame.height
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) return

  // Paint the raw RGBA pixel data onto the source canvas
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

  // Release the temporary canvas
  srcCanvas.width = 0
  srcCanvas.height = 0
}

function handleSliderInput(event: Event) {
  const input = event.target as HTMLInputElement
  emit('update:modelValue', Number(input.value))
}

// Redraw whenever the selected frame changes or frames array is swapped
watch(
  () => [props.modelValue, props.frames] as const,
  () => {
    if (props.frames.length > 0 && props.modelValue < props.frames.length) {
      drawFrame(props.frames[props.modelValue])
    }
  },
  { flush: 'post' },
)

// Draw the initial frame once the canvas is mounted
onMounted(() => {
  if (props.frames.length > 0 && props.modelValue < props.frames.length) {
    drawFrame(props.frames[props.modelValue])
  }
})
</script>
