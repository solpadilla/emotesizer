<template>
  <div
    ref="containerRef"
    class="relative select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-sm"
    style="touch-action: none;"
    tabindex="0"
    aria-label="Crop region. Use arrow keys to move, Shift+arrow for larger steps."
    @keydown="handleKeydown"
  >
    <!-- Animated GIF canvas -->
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="block"
    />

    <!-- Dark overlay: 4 divs covering the area OUTSIDE the crop region -->
    <!-- Top -->
    <div
      class="absolute bg-black/50 pointer-events-none"
      :style="{
        top: 0,
        left: 0,
        right: 0,
        height: Math.round(displayCropY) + 'px',
      }"
    />
    <!-- Bottom -->
    <div
      class="absolute bg-black/50 pointer-events-none"
      :style="{
        top: Math.round(displayCropY + displayCropH) + 'px',
        left: 0,
        right: 0,
        bottom: 0,
      }"
    />
    <!-- Left -->
    <div
      class="absolute bg-black/50 pointer-events-none"
      :style="{
        top: Math.round(displayCropY) + 'px',
        left: 0,
        width: Math.round(displayCropX) + 'px',
        height: Math.round(displayCropH) + 'px',
      }"
    />
    <!-- Right -->
    <div
      class="absolute bg-black/50 pointer-events-none"
      :style="{
        top: Math.round(displayCropY) + 'px',
        left: Math.round(displayCropX + displayCropW) + 'px',
        right: 0,
        height: Math.round(displayCropH) + 'px',
      }"
    />

    <!-- Crop border -->
    <div
      class="absolute border-2 border-primary-500 pointer-events-none"
      :style="{
        top: Math.round(displayCropY) + 'px',
        left: Math.round(displayCropX) + 'px',
        width: Math.round(displayCropW) + 'px',
        height: Math.round(displayCropH) + 'px',
      }"
    />

    <!-- Drag area: invisible div over crop region for moving -->
    <div
      class="absolute cursor-move"
      :style="{
        top: Math.round(displayCropY) + 'px',
        left: Math.round(displayCropX) + 'px',
        width: Math.round(displayCropW) + 'px',
        height: Math.round(displayCropH) + 'px',
      }"
      @pointerdown="startDrag($event, 'move')"
    />

    <!-- 8 resize handles -->
    <!-- Corners: always visible -->
    <div
      v-for="handle in visibleHandles"
      :key="handle.id"
      class="absolute flex items-center justify-center"
      :style="{
        top: Math.round(handle.y - 22) + 'px',
        left: Math.round(handle.x - 22) + 'px',
        width: '44px',
        height: '44px',
        cursor: handle.cursor,
      }"
      @pointerdown="startDrag($event, handle.id)"
    >
      <div class="w-3 h-3 bg-primary-500 border-2 border-white rounded-sm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'

const props = defineProps<{
  gifUrl: string
  frames: DecodedFrame[]
  cropX: number
  cropY: number
  cropW: number
  cropH: number
  aspectRatio: number | null
}>()

const emit = defineEmits<{
  'update:crop': [{ x: number; y: number; w: number; h: number }]
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Container dimensions tracked via ResizeObserver
const containerWidth = ref(0)
const containerHeight = ref(0)

// Source image dimensions (from first frame)
const srcWidth = computed(() => props.frames[0]?.width ?? 0)
const srcHeight = computed(() => props.frames[0]?.height ?? 0)

// Scale factor: fit the source image within the container
const scale = computed(() => {
  if (!srcWidth.value || !srcHeight.value || !containerWidth.value) return 1
  const maxH = window.innerWidth >= 1024 ? 500 : Infinity
  const availH = Math.min(containerHeight.value || 600, maxH)
  return Math.min(containerWidth.value / srcWidth.value, availH / srcHeight.value, 1)
})

// Canvas dimensions in CSS/display pixels
const canvasWidth = computed(() => Math.round(srcWidth.value * scale.value))
const canvasHeight = computed(() => Math.round(srcHeight.value * scale.value))

// Display positions for the crop region (source coords * scale).
// Raw floats here; rounding is applied only in template :style bindings
// to avoid cumulative rounding drift during resize drags.
const displayCropX = computed(() => props.cropX * scale.value)
const displayCropY = computed(() => props.cropY * scale.value)
const displayCropW = computed(() => props.cropW * scale.value)
const displayCropH = computed(() => props.cropH * scale.value)

// Visible handles: corners always, edge midpoints only when aspect ratio is not locked
type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move'

const cornerHandles = computed(() => [
  { id: 'nw' as HandleId, x: displayCropX.value, y: displayCropY.value, cursor: 'nw-resize' },
  { id: 'ne' as HandleId, x: displayCropX.value + displayCropW.value, y: displayCropY.value, cursor: 'ne-resize' },
  { id: 'sw' as HandleId, x: displayCropX.value, y: displayCropY.value + displayCropH.value, cursor: 'sw-resize' },
  { id: 'se' as HandleId, x: displayCropX.value + displayCropW.value, y: displayCropY.value + displayCropH.value, cursor: 'se-resize' },
])

const edgeHandles = computed(() => [
  { id: 'n' as HandleId, x: displayCropX.value + displayCropW.value / 2, y: displayCropY.value, cursor: 'n-resize' },
  { id: 's' as HandleId, x: displayCropX.value + displayCropW.value / 2, y: displayCropY.value + displayCropH.value, cursor: 's-resize' },
  { id: 'e' as HandleId, x: displayCropX.value + displayCropW.value, y: displayCropY.value + displayCropH.value / 2, cursor: 'e-resize' },
  { id: 'w' as HandleId, x: displayCropX.value, y: displayCropY.value + displayCropH.value / 2, cursor: 'w-resize' },
])

const visibleHandles = computed(() => {
  if (props.aspectRatio !== null) return cornerHandles.value
  return [...cornerHandles.value, ...edgeHandles.value]
})

// -- Animation --

/** Reusable temporary canvas for rendering frame pixel data at source resolution */
let srcCanvas: HTMLCanvasElement | null = null
let srcCtx: CanvasRenderingContext2D | null = null

/** Cached ImageData to avoid allocating a new one every frame */
let cachedImageData: ImageData | null = null

/** ResizeObserver for tracking container dimensions */
let resizeObserver: ResizeObserver | null = null

let animationId: number | null = null
let currentFrameIndex = 0
let lastFrameTime = 0
let accumulatedTime = 0

/** Whether the user prefers reduced motion */
const prefersReducedMotion = ref(false)

/** Media query listener refs for cleanup */
let mqlListener: ((e: MediaQueryListEvent) => void) | null = null
let mql: MediaQueryList | null = null

onMounted(() => {
  // Check reduced motion preference
  mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mql.matches
  mqlListener = (e) => { prefersReducedMotion.value = e.matches }
  mql.addEventListener('change', mqlListener)

  // Set up ResizeObserver to track container dimensions
  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        containerWidth.value = entry.contentRect.width
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }

  startAnimation()
})

onBeforeUnmount(() => {
  stopAnimation()

  // Clean up media query listener
  if (mql && mqlListener) {
    mql.removeEventListener('change', mqlListener)
    mqlListener = null
    mql = null
  }

  // Clean up ResizeObserver
  resizeObserver?.disconnect()
  resizeObserver = null

  // Release pointer capture if still held
  if (containerRef.value && capturedPointerId !== null) {
    try { containerRef.value.releasePointerCapture(capturedPointerId) } catch {}
    capturedPointerId = null
  }

  // Clear drag safety timeout
  if (dragSafetyTimeout) { clearTimeout(dragSafetyTimeout); dragSafetyTimeout = null }

  activeOperation = null

  if (srcCanvas) {
    srcCanvas.width = 0
    srcCanvas.height = 0
    srcCanvas = null
    srcCtx = null
  }

  cachedImageData = null
})

function startAnimation() {
  stopAnimation()
  currentFrameIndex = 0
  lastFrameTime = 0
  accumulatedTime = 0
  animationId = requestAnimationFrame(animationLoop)
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function animationLoop(timestamp: number) {
  if (!props.frames.length) return // Don't reschedule — nothing to draw

  // For reduced motion or single-frame GIFs, draw once and don't reschedule
  if (prefersReducedMotion.value || props.frames.length <= 1) {
    drawFrame(0)
    return
  }

  if (lastFrameTime === 0) {
    lastFrameTime = timestamp
    drawFrame(0)
    animationId = requestAnimationFrame(animationLoop)
    return
  }

  const elapsed = timestamp - lastFrameTime
  lastFrameTime = timestamp
  accumulatedTime += elapsed

  const currentDelay = props.frames[currentFrameIndex]?.delay || 100

  if (accumulatedTime >= currentDelay) {
    accumulatedTime -= currentDelay
    currentFrameIndex = (currentFrameIndex + 1) % props.frames.length
    drawFrame(currentFrameIndex)
  }

  animationId = requestAnimationFrame(animationLoop)
}

function drawFrame(index: number) {
  const canvas = canvasRef.value
  if (!canvas || !props.frames[index]) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const frame = props.frames[index]

  // Lazily create or reuse the temporary source canvas
  if (!srcCanvas) {
    srcCanvas = document.createElement('canvas')
    srcCtx = srcCanvas.getContext('2d')
  }
  if (!srcCtx) return

  srcCanvas.width = frame.width
  srcCanvas.height = frame.height

  // Reuse cached ImageData to avoid a full pixel-data allocation every frame
  if (!cachedImageData || cachedImageData.width !== frame.width || cachedImageData.height !== frame.height) {
    cachedImageData = new ImageData(frame.width, frame.height)
  }
  cachedImageData.data.set(frame.data)
  srcCtx.putImageData(cachedImageData, 0, 0)

  // Draw scaled to the display canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  ctx.drawImage(srcCanvas, 0, 0, canvasWidth.value, canvasHeight.value)
}

// Restart animation when frames change
watch(() => props.frames, () => {
  cachedImageData = null
  startAnimation()
})

// Redraw when scale changes (container resize)
watch(scale, () => {
  if (props.frames.length > 0) {
    drawFrame(currentFrameIndex)
  }
})

// -- Pointer interactions --

let activeOperation: HandleId | null = null
let dragStartX = 0
let dragStartY = 0
let dragStartCropX = 0
let dragStartCropY = 0
let dragStartCropW = 0
let dragStartCropH = 0
let capturedPointerId: number | null = null
let dragSafetyTimeout: ReturnType<typeof setTimeout> | null = null

function startDrag(event: PointerEvent, operation: HandleId) {
  event.preventDefault()
  event.stopPropagation()

  activeOperation = operation
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartCropX = props.cropX
  dragStartCropY = props.cropY
  dragStartCropW = props.cropW
  dragStartCropH = props.cropH

  const target = event.currentTarget as HTMLElement
  capturedPointerId = event.pointerId
  target.setPointerCapture(event.pointerId)

  // Safety timeout: auto-cancel drag after 10s if pointerup never fires
  dragSafetyTimeout = setTimeout(() => { activeOperation = null; capturedPointerId = null }, 10000)

  // Remove before adding to prevent stacking if a prior pointerup was missed
  target.removeEventListener('pointermove', handlePointerMove)
  target.removeEventListener('pointerup', handlePointerUp)
  target.addEventListener('pointermove', handlePointerMove)
  target.addEventListener('pointerup', handlePointerUp)
}

function handlePointerMove(event: PointerEvent) {
  if (!activeOperation) return

  // Convert display-space delta to source-space delta
  const deltaX = Math.round((event.clientX - dragStartX) / scale.value)
  const deltaY = Math.round((event.clientY - dragStartY) / scale.value)

  if (activeOperation === 'move') {
    handleMove(deltaX, deltaY)
  } else {
    handleResize(activeOperation, deltaX, deltaY)
  }
}

function handlePointerUp(event: PointerEvent) {
  activeOperation = null
  capturedPointerId = null
  if (dragSafetyTimeout) { clearTimeout(dragSafetyTimeout); dragSafetyTimeout = null }
  const target = event.currentTarget as HTMLElement
  target.releasePointerCapture(event.pointerId)
  target.removeEventListener('pointermove', handlePointerMove)
  target.removeEventListener('pointerup', handlePointerUp)
}

function handleMove(deltaX: number, deltaY: number) {
  let newX = dragStartCropX + deltaX
  let newY = dragStartCropY + deltaY

  // Clamp to image bounds
  newX = Math.max(0, Math.min(newX, srcWidth.value - dragStartCropW))
  newY = Math.max(0, Math.min(newY, srcHeight.value - dragStartCropH))

  emit('update:crop', {
    x: newX,
    y: newY,
    w: dragStartCropW,
    h: dragStartCropH,
  })
}

function handleResize(handle: HandleId, deltaX: number, deltaY: number) {
  let newX = dragStartCropX
  let newY = dragStartCropY
  let newW = dragStartCropW
  let newH = dragStartCropH

  // Determine which edges are being dragged
  const isLeft = handle === 'nw' || handle === 'sw' || handle === 'w'
  const isRight = handle === 'ne' || handle === 'se' || handle === 'e'
  const isTop = handle === 'nw' || handle === 'ne' || handle === 'n'
  const isBottom = handle === 'sw' || handle === 'se' || handle === 's'

  if (isLeft) {
    newX = dragStartCropX + deltaX
    newW = dragStartCropW - deltaX
  }
  if (isRight) {
    newW = dragStartCropW + deltaX
  }
  if (isTop) {
    newY = dragStartCropY + deltaY
    newH = dragStartCropH - deltaY
  }
  if (isBottom) {
    newH = dragStartCropH + deltaY
  }

  // Enforce minimum 1px
  if (newW < 1) {
    if (isLeft) newX = dragStartCropX + dragStartCropW - 1
    newW = 1
  }
  if (newH < 1) {
    if (isTop) newY = dragStartCropY + dragStartCropH - 1
    newH = 1
  }

  // Apply aspect ratio constraint
  if (props.aspectRatio !== null) {
    const ratio = props.aspectRatio

    // Determine which dimension to derive from the other
    // For corners, use the larger change; for edges, use the edge direction
    if (isTop || isBottom) {
      if (isLeft || isRight) {
        // Corner: use the dimension with the larger change to drive the other
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)
        if (absX >= absY) {
          newH = Math.round(newW / ratio)
        } else {
          newW = Math.round(newH * ratio)
        }
      } else {
        // Pure vertical edge: derive width from height
        newW = Math.round(newH * ratio)
      }
    } else {
      // Pure horizontal edge: derive height from width
      newH = Math.round(newW / ratio)
    }

    // Re-adjust position for left/top handles after ratio correction
    if (isLeft) {
      newX = dragStartCropX + dragStartCropW - newW
    }
    if (isTop) {
      newY = dragStartCropY + dragStartCropH - newH
    }
  }

  // Clamp to image bounds
  if (newX < 0) {
    newX = 0
    if (isLeft) newW = dragStartCropW + dragStartCropX // Max possible width from left edge
  }
  if (newY < 0) {
    newY = 0
    if (isTop) newH = dragStartCropH + dragStartCropY
  }
  if (newX + newW > srcWidth.value) {
    newW = srcWidth.value - newX
  }
  if (newY + newH > srcHeight.value) {
    newH = srcHeight.value - newY
  }

  // Re-enforce aspect ratio after bounds clamping if needed.
  // When clamping broke the ratio, shrink to the largest rect that
  // (a) maintains the ratio, (b) fits within bounds, and (c) stays
  // anchored to the opposite corner from the handle being dragged.
  if (props.aspectRatio !== null) {
    const ratio = props.aspectRatio
    const currentRatio = newW / newH
    if (Math.abs(currentRatio - ratio) > 0.01) {
      // Try fitting by width first — derive height from width
      const hFromW = Math.round(newW / ratio)
      if (hFromW <= newH && (isTop ? newY + newH - hFromW >= 0 : newY + hFromW <= srcHeight.value)) {
        // Width fits, adjust height
        if (isTop) newY = newY + newH - hFromW
        newH = hFromW
      } else {
        // Height constrains, adjust width — derive width from height
        const wFromH = Math.round(newH * ratio)
        if (isLeft) newX = newX + newW - wFromH
        newW = wFromH
      }
    }
  }

  // Final minimum enforcement
  newW = Math.max(1, newW)
  newH = Math.max(1, newH)

  emit('update:crop', { x: newX, y: newY, w: newW, h: newH })
}

// -- Keyboard navigation --

function handleKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 1
  let deltaX = 0
  let deltaY = 0

  switch (event.key) {
    case 'ArrowLeft': deltaX = -step; break
    case 'ArrowRight': deltaX = step; break
    case 'ArrowUp': deltaY = -step; break
    case 'ArrowDown': deltaY = step; break
    default: return
  }

  event.preventDefault()

  let newX = props.cropX + deltaX
  let newY = props.cropY + deltaY

  newX = Math.max(0, Math.min(newX, srcWidth.value - props.cropW))
  newY = Math.max(0, Math.min(newY, srcHeight.value - props.cropH))

  if (newX !== props.cropX || newY !== props.cropY) {
    emit('update:crop', {
      x: newX,
      y: newY,
      w: props.cropW,
      h: props.cropH,
    })
  }
}
</script>
