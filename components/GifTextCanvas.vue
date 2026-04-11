<template>
  <div
    ref="containerRef"
    class="relative select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-sm"
    style="touch-action: none;"
    tabindex="0"
    aria-label="Text overlay canvas. Drag text to reposition, use arrow keys to nudge."
    @keydown="handleKeydown"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
  >
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="block"
      :style="{ cursor: cursorStyle }"
    />
  </div>
</template>

<script setup lang="ts">
import type { DecodedFrame } from 'modern-gif'
import { getAnimationState, wrapText, drawRoundRect } from '~/composables/useTextRendering'

interface TextLayer {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  x: number
  y: number
  visible: boolean
  outlineColor: string
  outlineWidth: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  backgroundEnabled: boolean
  backgroundColor: string
  backgroundOpacity: number
  backgroundPaddingX: number
  backgroundPaddingY: number
  backgroundBorderRadius: number
  frameStart: number
  frameEnd: number
  animation: 'none' | 'fade-in' | 'fade-out' | 'fade-in-out' | 'typewriter' | 'slide-up'
}

const props = defineProps<{
  frames: DecodedFrame[]
  textLayers: TextLayer[]
  activeLayerIndex: number
  gifWidth: number
  gifHeight: number
}>()

const emit = defineEmits<{
  'update:position': [payload: { layerIndex: number; x: number; y: number }]
  'select-layer': [index: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Container dimensions tracked via ResizeObserver
const containerWidth = ref(0)
const containerHeight = ref(0)

// Playback state (exposed for parent to control)
const currentFrameIndex = ref(0)
const isPlaying = ref(true)

// Scale factor: fit the source image within the container
const scale = computed(() => {
  if (!props.gifWidth || !props.gifHeight || !containerWidth.value) return 1
  const maxH = window.innerWidth >= 1024 ? 500 : Infinity
  const availH = Math.min(containerHeight.value || 600, maxH)
  return Math.min(containerWidth.value / props.gifWidth, availH / props.gifHeight, 1)
})

// Canvas dimensions in CSS/display pixels
const canvasWidth = computed(() => Math.round(props.gifWidth * scale.value))
const canvasHeight = computed(() => Math.round(props.gifHeight * scale.value))

// Expose playback state and controls to the parent
defineExpose({
  currentFrameIndex,
  isPlaying,
  togglePlay,
  seekToFrame,
})

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    lastFrameTime = 0
    accumulatedTime = 0
    startAnimation()
  }
}

function seekToFrame(index: number) {
  currentFrameIndex.value = Math.max(0, Math.min(index, props.frames.length - 1))
  drawFrame(currentFrameIndex.value)
}

// -- Animation loop --

let srcCanvas: HTMLCanvasElement | null = null
let srcCtx: CanvasRenderingContext2D | null = null
let cachedImageData: ImageData | null = null
let resizeObserver: ResizeObserver | null = null
let animationId: number | null = null
let lastFrameTime = 0
let accumulatedTime = 0
let needsRedraw = true

let prefersReducedMotion = false
let mqlListener: ((e: MediaQueryListEvent) => void) | null = null
let mql: MediaQueryList | null = null

onMounted(() => {
  mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion = mql.matches
  mqlListener = (e) => { prefersReducedMotion = e.matches }
  mql.addEventListener('change', mqlListener)

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

  if (mql && mqlListener) {
    mql.removeEventListener('change', mqlListener)
    mqlListener = null
    mql = null
  }

  resizeObserver?.disconnect()
  resizeObserver = null

  if (containerRef.value && capturedPointerId !== null) {
    try { containerRef.value.releasePointerCapture(capturedPointerId) } catch {}
    capturedPointerId = null
  }

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
  if (!props.frames.length) return

  // For reduced motion or single-frame GIFs, draw once and stop
  if (prefersReducedMotion || props.frames.length <= 1) {
    drawFrame(0)
    return
  }

  // When paused, only redraw if something changed (text edits, frame seek, etc.)
  if (!isPlaying.value) {
    if (needsRedraw) {
      drawFrame(currentFrameIndex.value)
      needsRedraw = false
    }
    animationId = requestAnimationFrame(animationLoop)
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

  const currentDelay = props.frames[currentFrameIndex.value]?.delay || 100

  if (accumulatedTime >= currentDelay) {
    accumulatedTime -= currentDelay
    currentFrameIndex.value = (currentFrameIndex.value + 1) % props.frames.length
    drawFrame(currentFrameIndex.value)
  } else {
    // Still redraw to reflect any text changes
    drawFrame(currentFrameIndex.value)
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

  // Reuse cached ImageData to avoid allocation every frame
  if (!cachedImageData || cachedImageData.width !== frame.width || cachedImageData.height !== frame.height) {
    cachedImageData = new ImageData(frame.width, frame.height)
  }
  cachedImageData.data.set(frame.data)
  srcCtx.putImageData(cachedImageData, 0, 0)

  // Draw scaled to the display canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  ctx.drawImage(srcCanvas, 0, 0, canvasWidth.value, canvasHeight.value)

  // Draw text layers on top
  drawTextLayers(ctx, index)
}

function drawTextLayers(ctx: CanvasRenderingContext2D, frameIndex: number) {
  const s = scale.value

  for (let i = 0; i < props.textLayers.length; i++) {
    const layer = props.textLayers[i]
    if (!layer.visible || !layer.text) continue

    // Check frame range
    if (frameIndex < layer.frameStart || frameIndex > layer.frameEnd) continue

    const { alpha, text, yOffset } = getAnimationState(layer, frameIndex)
    if (alpha <= 0 || !text) continue

    // Build font string
    const fontStyle = layer.italic ? 'italic' : ''
    const fontWeight = layer.bold ? 'bold' : ''
    const fontSize = layer.fontSize * s
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px "${layer.fontFamily}", sans-serif`.trim()
    ctx.font = fontString
    ctx.textBaseline = 'middle'

    // Wrap text to canvas width (with some padding)
    const maxWidth = canvasWidth.value - 20
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = fontSize * 1.25

    // Calculate bounding box
    let maxLineWidth = 0
    for (const line of lines) {
      const lw = ctx.measureText(line).width
      if (lw > maxLineWidth) maxLineWidth = lw
    }

    const totalTextHeight = lines.length * lineHeight
    const x = layer.x * s
    const y = (layer.y + yOffset) * s

    // Offset the background box based on alignment direction
    let alignOffsetX = 0
    if (layer.align === 'center') alignOffsetX = -maxLineWidth / 2
    else if (layer.align === 'right') alignOffsetX = -maxLineWidth
    // left: alignOffsetX = 0 (background starts at lx, extends right)

    // Single save/restore pair for background + text rendering
    ctx.save()
    ctx.globalAlpha = alpha

    // Draw background box if enabled
    if (layer.backgroundEnabled) {
      const padX = layer.backgroundPaddingX * s
      const padY = layer.backgroundPaddingY * s
      const margin = 10 * s
      let bgAnchorX: number
      if (layer.align === 'center') bgAnchorX = props.gifWidth * s / 2
      else if (layer.align === 'left') bgAnchorX = margin
      else bgAnchorX = props.gifWidth * s - margin
      const bgX = bgAnchorX + alignOffsetX - padX
      const bgY = y - totalTextHeight / 2 - padY
      const bgW = maxLineWidth + padX * 2
      const bgH = totalTextHeight + padY * 2
      const radius = layer.backgroundBorderRadius * s

      ctx.fillStyle = layer.backgroundColor
      ctx.globalAlpha = alpha * (layer.backgroundOpacity / 100)
      drawRoundRect(ctx, bgX, bgY, bgW, bgH, radius)
      ctx.fill()
      ctx.globalAlpha = alpha // Reset for text
    }

    // Shadow settings
    if (layer.shadowEnabled) {
      ctx.shadowColor = layer.shadowColor
      ctx.shadowBlur = layer.shadowBlur * s
      ctx.shadowOffsetX = layer.shadowOffsetX * s
      ctx.shadowOffsetY = layer.shadowOffsetY * s
    }

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      let lx = x
      const ly = y - totalTextHeight / 2 + lineIdx * lineHeight + lineHeight / 2

      // Per-line alignment: snap left/right to GIF edges with margin
      const margin = 10 * s
      if (layer.align === 'center') {
        lx = props.gifWidth * s / 2
        ctx.textAlign = 'center'
      } else if (layer.align === 'left') {
        lx = margin
        ctx.textAlign = 'left'
      } else {
        lx = props.gifWidth * s - margin
        ctx.textAlign = 'right'
      }

      // Draw outline first (behind fill)
      if (layer.outlineWidth > 0) {
        ctx.strokeStyle = layer.outlineColor
        ctx.lineWidth = layer.outlineWidth * 2 * s
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(line, lx, ly)
      }

      // Draw fill
      ctx.fillStyle = layer.color
      ctx.fillText(line, lx, ly)
    }

    ctx.restore()

    // Draw dashed selection border for active layer (NOT baked into output)
    if (i === props.activeLayerIndex) {
      const padX = 6
      const padY = 4
      let selX: number
      if (layer.align === 'center') selX = props.gifWidth * s / 2 - maxLineWidth / 2 - padX
      else if (layer.align === 'left') selX = (10 * s) - padX
      else selX = props.gifWidth * s - (10 * s) - maxLineWidth - padX

      const selY = y - totalTextHeight / 2 - padY
      const selW = maxLineWidth + padX * 2
      const selH = totalTextHeight + padY * 2

      ctx.save()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(selX, selY, selW, selH)
      ctx.restore()
    }
  }
}

/**
 * Computes the bounding box for a given text layer in display (canvas) coordinates.
 */
function getLayerBounds(layer: TextLayer): { x: number; y: number; w: number; h: number } | null {
  if (!layer.text || !layer.visible) return null

  const canvas = canvasRef.value
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const s = scale.value
  const fontStyle = layer.italic ? 'italic' : ''
  const fontWeight = layer.bold ? 'bold' : ''
  const fontSize = layer.fontSize * s
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${layer.fontFamily}", sans-serif`.trim()

  const maxWidth = canvasWidth.value - 20
  const lines = wrapText(ctx, layer.text, maxWidth)
  const lineHeight = fontSize * 1.25

  let maxLineWidth = 0
  for (const line of lines) {
    const lw = ctx.measureText(line).width
    if (lw > maxLineWidth) maxLineWidth = lw
  }

  const totalTextHeight = lines.length * lineHeight
  const x = layer.x * s
  const y = layer.y * s

  const pad = 8
  let bx: number
  if (layer.align === 'center') bx = props.gifWidth * s / 2 - maxLineWidth / 2 - pad
  else if (layer.align === 'left') bx = (10 * s) - pad
  else bx = (props.gifWidth * s) - (10 * s) - maxLineWidth - pad

  return {
    x: bx,
    y: y - totalTextHeight / 2 - pad,
    w: maxLineWidth + pad * 2,
    h: totalTextHeight + pad * 2,
  }
}

// -- Cursor style --
const cursorStyle = ref('default')

// -- Pointer interactions --

let isDragging = false
let dragLayerIndex = -1
let dragStartX = 0
let dragStartY = 0
let dragStartLayerX = 0
let dragStartLayerY = 0
let capturedPointerId: number | null = null

function handlePointerDown(event: PointerEvent) {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const px = event.clientX - rect.left
  const py = event.clientY - rect.top

  // Check if click is on any text layer (check from top to bottom in layer order, preferring active)
  let hitIndex = -1

  // First check the active layer
  if (props.activeLayerIndex >= 0 && props.activeLayerIndex < props.textLayers.length) {
    const bounds = getLayerBounds(props.textLayers[props.activeLayerIndex])
    if (bounds && px >= bounds.x && px <= bounds.x + bounds.w && py >= bounds.y && py <= bounds.y + bounds.h) {
      hitIndex = props.activeLayerIndex
    }
  }

  // If not on active layer, check all layers (reverse order for top-most hit)
  if (hitIndex === -1) {
    for (let i = props.textLayers.length - 1; i >= 0; i--) {
      const layer = props.textLayers[i]
      if (!layer.visible || !layer.text) continue
      const bounds = getLayerBounds(layer)
      if (bounds && px >= bounds.x && px <= bounds.x + bounds.w && py >= bounds.y && py <= bounds.y + bounds.h) {
        hitIndex = i
        break
      }
    }
  }

  if (hitIndex >= 0) {
    // Select and start dragging
    emit('select-layer', hitIndex)

    isDragging = true
    dragLayerIndex = hitIndex
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragStartLayerX = props.textLayers[hitIndex].x
    dragStartLayerY = props.textLayers[hitIndex].y

    capturedPointerId = event.pointerId
    containerRef.value?.setPointerCapture(event.pointerId)

    event.preventDefault()
  }
}

function handlePointerMove(event: PointerEvent) {
  // Update cursor based on hover
  if (!isDragging) {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect) return
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top

    let onText = false
    for (let i = props.textLayers.length - 1; i >= 0; i--) {
      const layer = props.textLayers[i]
      if (!layer.visible || !layer.text) continue
      const bounds = getLayerBounds(layer)
      if (bounds && px >= bounds.x && px <= bounds.x + bounds.w && py >= bounds.y && py <= bounds.y + bounds.h) {
        onText = true
        break
      }
    }
    cursorStyle.value = onText ? 'move' : 'default'
    return
  }

  // Dragging
  if (dragLayerIndex < 0) return

  const s = scale.value
  const deltaX = (event.clientX - dragStartX) / s
  const deltaY = (event.clientY - dragStartY) / s

  let newX = Math.round(dragStartLayerX + deltaX)
  let newY = Math.round(dragStartLayerY + deltaY)

  // Clamp to GIF bounds (loosely -- allow text center to go anywhere in the image)
  newX = Math.max(0, Math.min(newX, props.gifWidth))
  newY = Math.max(0, Math.min(newY, props.gifHeight))

  // All alignments snap to fixed horizontal positions — only allow vertical dragging
  const draggedLayer = props.textLayers[dragLayerIndex]
  if (draggedLayer) {
    newX = draggedLayer.x
  }

  emit('update:position', { layerIndex: dragLayerIndex, x: newX, y: newY })
}

function handlePointerUp(event: PointerEvent) {
  if (isDragging && capturedPointerId !== null) {
    containerRef.value?.releasePointerCapture(capturedPointerId)
    capturedPointerId = null
  }
  isDragging = false
  dragLayerIndex = -1
}

// -- Keyboard navigation --

function handleKeydown(event: KeyboardEvent) {
  if (props.activeLayerIndex < 0 || props.activeLayerIndex >= props.textLayers.length) return

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

  const layer = props.textLayers[props.activeLayerIndex]
  let newX = layer.x + deltaX
  let newY = layer.y + deltaY

  newX = Math.max(0, Math.min(newX, props.gifWidth))
  newY = Math.max(0, Math.min(newY, props.gifHeight))

  // All alignments snap — don't move horizontally
  newX = layer.x

  if (newX !== layer.x || newY !== layer.y) {
    emit('update:position', { layerIndex: props.activeLayerIndex, x: newX, y: newY })
  }
}

// Restart animation when frames change
watch(() => props.frames, () => {
  cachedImageData = null
  currentFrameIndex.value = 0
  needsRedraw = true
  startAnimation()
})

// Redraw when scale changes
watch(scale, () => {
  needsRedraw = true
  if (props.frames.length > 0) {
    drawFrame(currentFrameIndex.value)
  }
})

// Mark redraw needed when text layers or active layer change
watch(
  () => [props.textLayers, props.activeLayerIndex],
  () => {
    needsRedraw = true
  },
  { deep: true },
)

// Mark redraw needed when frame changes while paused
watch(currentFrameIndex, () => {
  needsRedraw = true
})
</script>
