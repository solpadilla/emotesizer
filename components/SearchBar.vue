<template>
  <div class="relative" ref="containerRef">
    <form @submit.prevent="handleSubmit">
      <div class="relative">
        <!-- Search icon -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
          <IconSearch :size="18" />
        </div>

        <input
          ref="inputRef"
          :value="modelValue"
          @input="handleInput"
          @keydown="handleKeydown"
          @focus="showSuggestions = true"
          class="input pl-12 pr-12"
          :class="size === 'lg' ? 'text-lg py-4' : ''"
          :placeholder="placeholder"
          :autofocus="autofocus"
          type="text"
          autocomplete="off"
        />

        <!-- Clear button -->
        <button
          v-if="modelValue"
          type="button"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
          aria-label="Clear search"
          @click="handleClear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </form>

    <!-- Autocomplete dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute top-full left-0 right-0 mt-2 glass-surface rounded-xl border border-surface-200 shadow-lg max-h-60 overflow-y-auto z-50"
      >
        <button
          v-for="(suggestion, index) in suggestions"
          :key="suggestion"
          class="w-full text-left px-4 py-3 text-sm transition-colors text-surface-700"
          :class="index === activeIndex ? 'bg-surface-100' : 'hover:bg-surface-100'"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  autofocus?: boolean
  size?: 'default' | 'lg'
}>(), {
  placeholder: 'Search KLIPY',
  autofocus: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
}>()

const { getAutocomplete } = useKlipy()

const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const activeIndex = ref(-1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  activeIndex.value = -1

  // Debounced autocomplete
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    if (value.length >= 2) {
      try {
        suggestions.value = await getAutocomplete(value)
        showSuggestions.value = true
      } catch {
        suggestions.value = []
      }
    } else {
      suggestions.value = []
    }
  }, 300)
}

function handleKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || suggestions.value.length === 0) {
    if (e.key === 'Escape') {
      showSuggestions.value = false
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, -1)
      break
    case 'Enter':
      if (activeIndex.value >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions.value[activeIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      activeIndex.value = -1
      break
  }
}

function selectSuggestion(suggestion: string) {
  emit('update:modelValue', suggestion)
  showSuggestions.value = false
  activeIndex.value = -1
  emit('search', suggestion)
}

function handleSubmit() {
  showSuggestions.value = false
  emit('search', props.modelValue)
}

function handleClear() {
  emit('update:modelValue', '')
  suggestions.value = []
  inputRef.value?.focus()
}

// Close suggestions when clicking outside
function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
