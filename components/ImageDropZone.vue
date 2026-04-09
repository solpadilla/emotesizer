<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone-active': isDragging }"
    @click="triggerFileInput"
    @dragover.prevent="isDragging = true"
    @dragenter.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div class="flex flex-col items-center gap-3 text-center">
      <!-- Stacked images icon -->
      <div class="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <rect x="2" y="2" width="14" height="14" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <polyline points="16 12 13 9 5 16" />
        </svg>
      </div>

      <div>
        <p class="text-sm font-medium text-surface-700">Drag & drop images here</p>
        <p class="text-xs text-surface-400 mt-1">or click to browse files</p>
      </div>

      <p class="text-xs text-surface-400">PNG, JPEG, WEBP, GIF up to {{ maxSizeMB }} MB each (max {{ maxFiles }} files)</p>

      <button type="button" class="btn btn-secondary btn-sm" @click.stop="triggerFileInput">
        Browse Files
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      multiple
      class="hidden"
      @change="handleFileInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useImageValidation } from '~/composables/useImageValidation'

const props = withDefaults(defineProps<{
  maxSize?: number
  maxFiles?: number
}>(), {
  maxSize: 20971520,
  maxFiles: 100,
})

const emit = defineEmits<{
  'files-selected': [files: File[]]
  error: [message: string]
}>()

const accept = 'image/png,image/jpeg,image/webp,image/gif'

const { validateImageFiles } = useImageValidation()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const maxSizeMB = computed(() => (props.maxSize / 1024 / 1024).toFixed(0))

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function processFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList)

  if (files.length > props.maxFiles) {
    emit('error', `Too many files selected (${files.length}). Maximum is ${props.maxFiles}.`)
    return
  }

  const validFiles = await validateImageFiles(
    files,
    msg => emit('error', msg),
    props.maxSize,
  )

  if (validFiles.length > 0) {
    emit('files-selected', validFiles)
  }
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await processFiles(files)
  }
}

async function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    await processFiles(files)
  }
  // Reset input so the same files can be selected again
  input.value = ''
}
</script>
