<template>
  <div class="flex flex-col gap-3">
    <!-- Dual-handle range slider -->
    <div
      ref="trackContainerRef"
      class="relative w-full h-8 flex items-center select-none touch-none"
      @pointerdown="handlePointerDown"
      @keydown="handleKeydown"
    >
      <!-- Track background -->
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-surface-200/60" />

      <!-- Dimmed area: before start -->
      <div
        class="absolute top-1/2 -translate-y-1/2 h-2 rounded-l-full bg-surface-900/30"
        :style="{ left: '0%', width: startPercent + '%' }"
      />

      <!-- Active fill between handles -->
      <div
        class="absolute top-1/2 -translate-y-1/2 h-2 bg-primary-500/20 rounded-full"
        :style="{ left: startPercent + '%', right: (100 - endPercent) + '%' }"
      />

      <!-- Dimmed area: after end -->
      <div
        class="absolute top-1/2 -translate-y-1/2 h-2 rounded-r-full bg-surface-900/30"
        :style="{ left: endPercent + '%', width: (100 - endPercent) + '%' }"
      />

      <!-- Start handle -- outer div provides 44px touch target (WCAG 2.5.8) -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center z-10"
        :style="{ left: startPercent + '%' }"
      >
        <button
          ref="startHandleRef"
          class="w-5 h-5 rounded-full bg-white border-2 border-primary-500 shadow-sm cursor-grab focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          role="slider"
          aria-label="Trim start time"
          :aria-valuemin="0"
          :aria-valuemax="duration"
          :aria-valuenow="modelValue[0]"
          :aria-valuetext="formatTime(modelValue[0])"
          tabindex="0"
          data-handle="start"
        />
      </div>

      <!-- End handle -- outer div provides 44px touch target (WCAG 2.5.8) -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center z-10"
        :style="{ left: endPercent + '%' }"
      >
        <button
          ref="endHandleRef"
          class="w-5 h-5 rounded-full bg-white border-2 border-primary-500 shadow-sm cursor-grab focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          role="slider"
          aria-label="Trim end time"
          :aria-valuemin="0"
          :aria-valuemax="duration"
          :aria-valuenow="modelValue[1]"
          :aria-valuetext="formatTime(modelValue[1])"
          tabindex="0"
          data-handle="end"
        />
      </div>
    </div>

    <!-- Time labels -->
    <div class="text-xs text-surface-500 text-center">
      Start: {{ formatTime(modelValue[0]) }} | Duration: {{ trimDurationLabel }} | End: {{ formatTime(modelValue[1]) }}
    </div>

    <!-- Reset button (only when trimmed) -->
    <button
      v-if="isTrimmed"
      class="text-xs text-primary-600 hover:text-primary-700 transition-colors self-center"
      @click="resetRange"
    >
      Reset to full range
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  duration: number
  modelValue: [number, number]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: [number, number]]
}>()

const trackContainerRef = ref<HTMLElement | null>(null)
const startHandleRef = ref<HTMLElement | null>(null)
const endHandleRef = ref<HTMLElement | null>(null)

/** Minimum gap between start and end handles in seconds */
const MIN_GAP = 0.1

/** Which handle is currently being dragged */
const activeHandle = ref<'start' | 'end' | null>(null)

const isTrimmed = computed(() => {
  if (props.duration <= 0) return false
  return props.modelValue[0] > 0.01 || props.modelValue[1] < props.duration - 0.01
})

const trimDuration = computed(() => props.modelValue[1] - props.modelValue[0])

const trimDurationLabel = computed(() => `${trimDuration.value.toFixed(1)}s`)

/** Handle positions as percentages of the track width */
const startPercent = computed(() => {
  if (props.duration <= 0) return 0
  return (props.modelValue[0] / props.duration) * 100
})

const endPercent = computed(() => {
  if (props.duration <= 0) return 100
  return (props.modelValue[1] / props.duration) * 100
})

/** Formats a time value in seconds to M:SS.t format */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const whole = Math.floor(secs)
  const tenths = Math.floor((secs - whole) * 10)
  return `${mins}:${String(whole).padStart(2, '0')}.${tenths}`
}

/** Converts a pointer clientX position to a time value based on track geometry */
function clientXToTime(clientX: number): number {
  const track = trackContainerRef.value
  if (!track || props.duration <= 0) return 0

  const rect = track.getBoundingClientRect()
  const ratio = (clientX - rect.left) / rect.width
  const clamped = Math.max(0, Math.min(1, ratio))
  // Round to 0.1s precision for clean values
  return Math.round(clamped * props.duration * 10) / 10
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
  if (props.duration <= 0) return

  event.preventDefault()

  // Determine which handle to drag
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
  const time = clientXToTime(clientX)
  const [start, end] = props.modelValue

  if (activeHandle.value === 'start') {
    const clamped = Math.min(time, end - MIN_GAP)
    const newStart = Math.max(0, clamped)
    if (Math.abs(newStart - start) > 0.001) {
      emit('update:modelValue', [newStart, end])
    }
  } else if (activeHandle.value === 'end') {
    const clamped = Math.max(time, start + MIN_GAP)
    const newEnd = Math.min(props.duration, clamped)
    if (Math.abs(newEnd - end) > 0.001) {
      emit('update:modelValue', [start, newEnd])
    }
  }
}

/** Keyboard navigation: arrow keys adjust by 0.1s, Shift+arrow by 1s */
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const handleAttr = target.dataset?.handle as 'start' | 'end' | undefined
  if (!handleAttr) return

  let delta = 0
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') delta = -1
  else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') delta = 1
  else return

  event.preventDefault()

  // Shift multiplies the step to 1s, otherwise 0.1s
  const step = event.shiftKey ? 1 : 0.1
  delta *= step

  const [start, end] = props.modelValue

  if (handleAttr === 'start') {
    const newStart = Math.max(0, Math.min(end - MIN_GAP, start + delta))
    const rounded = Math.round(newStart * 10) / 10
    if (Math.abs(rounded - start) > 0.001) {
      emit('update:modelValue', [rounded, end])
    }
  } else {
    const newEnd = Math.max(start + MIN_GAP, Math.min(props.duration, end + delta))
    const rounded = Math.round(newEnd * 10) / 10
    if (Math.abs(rounded - end) > 0.001) {
      emit('update:modelValue', [start, rounded])
    }
  }
}

function resetRange() {
  emit('update:modelValue', [0, props.duration])
}
</script>
