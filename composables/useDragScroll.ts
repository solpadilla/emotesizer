/**
 * Composable that adds mouse-based drag-to-scroll behavior to a
 * horizontal overflow container. Touch/pen input is left to the
 * browser's native scroll handling.
 *
 * Returns a template ref and three pointer-event handlers that should
 * be bound to the scrollable element.
 */
export function useDragScroll() {
  const scrollEl = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  let startX = 0
  let startScrollLeft = 0
  let dragged = false

  function preventClick(e: Event) {
    e.stopPropagation()
    e.preventDefault()
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !scrollEl.value) return
    e.preventDefault()
    isDragging.value = true
    dragged = false
    startX = e.pageX - scrollEl.value.offsetLeft
    startScrollLeft = scrollEl.value.scrollLeft
    scrollEl.value.style.cursor = 'grabbing'
    scrollEl.value.style.userSelect = 'none'
  }

  function onMove(e: PointerEvent) {
    if (!isDragging.value || !scrollEl.value) return
    e.preventDefault()
    const x = e.pageX - scrollEl.value.offsetLeft
    if (Math.abs(x - startX) > 5) dragged = true
    scrollEl.value.scrollLeft = startScrollLeft - (x - startX) * 1.5
  }

  function onUp() {
    if (!isDragging.value) return
    isDragging.value = false
    if (scrollEl.value) {
      scrollEl.value.style.cursor = 'grab'
      scrollEl.value.style.removeProperty('user-select')
      if (dragged) {
        // Remove any stale listener before adding a fresh one-shot guard
        scrollEl.value.removeEventListener('click', preventClick, { capture: true })
        scrollEl.value.addEventListener('click', preventClick, { capture: true, once: true })
      }
    }
  }

  return { scrollEl, onDown, onMove, onUp }
}
