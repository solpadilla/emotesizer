/**
 * Shared text-rendering utilities used by both the GifTextCanvas preview
 * component and the add-text-to-gif page's export encoder.
 *
 * These are stateless pure functions — no Vue reactivity needed.
 */

/** Minimal interface covering only the properties getAnimationState reads. */
interface AnimatableTextLayer {
  text: string
  frameStart: number
  frameEnd: number
  animation: 'none' | 'fade-in' | 'fade-out' | 'fade-in-out' | 'typewriter' | 'slide-up'
}

/**
 * Computes the animation alpha, visible text substring, and vertical offset
 * for a given layer at a given frame index.
 */
export function getAnimationState(layer: AnimatableTextLayer, frameIndex: number): { alpha: number; text: string; yOffset: number } {
  const totalVisibleFrames = layer.frameEnd - layer.frameStart + 1
  const localFrame = frameIndex - layer.frameStart
  const progress = totalVisibleFrames > 1 ? localFrame / (totalVisibleFrames - 1) : 1

  let alpha = 1
  let text = layer.text
  let yOffset = 0

  switch (layer.animation) {
    case 'fade-in': {
      // Alpha 0->1 over first 20%
      const fadeEnd = 0.2
      alpha = progress <= fadeEnd ? progress / fadeEnd : 1
      break
    }
    case 'fade-out': {
      // Alpha 1->0 over last 20%
      const fadeStart = 0.8
      alpha = progress >= fadeStart ? (1 - progress) / (1 - fadeStart) : 1
      break
    }
    case 'fade-in-out': {
      const fadeInEnd = 0.2
      const fadeOutStart = 0.8
      if (progress <= fadeInEnd) {
        alpha = progress / fadeInEnd
      } else if (progress >= fadeOutStart) {
        alpha = (1 - progress) / (1 - fadeOutStart)
      }
      break
    }
    case 'typewriter': {
      // Show text.slice(0, charCount) where charCount increases
      const charCount = Math.ceil(layer.text.length * progress)
      text = layer.text.slice(0, charCount)
      break
    }
    case 'slide-up': {
      // Y offset from +50 to 0 over first 15%
      const slideEnd = 0.15
      yOffset = progress <= slideEnd ? 50 * (1 - progress / slideEnd) : 0
      break
    }
  }

  return { alpha: Math.max(0, Math.min(1, alpha)), text, yOffset }
}

/**
 * Wraps text to fit within maxWidth, returning an array of lines.
 * Uses the canvas context's current font for measurement.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

/**
 * Draws a rounded rectangle path using quadratic curves.
 * Polyfill for browsers that don't support ctx.roundRect().
 * Caller must invoke ctx.fill() or ctx.stroke() after this.
 */
export function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
