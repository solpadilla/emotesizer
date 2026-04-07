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
      <!-- Upload icon -->
      <div class="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div>
        <p class="text-sm font-medium text-surface-700">Drag & drop a GIF here</p>
        <p class="text-xs text-surface-400 mt-1">or click to browse files</p>
      </div>

      <button type="button" class="btn btn-secondary btn-sm" @click.stop="triggerFileInput">
        Browse Files
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileInput"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  accept?: string
  maxSize?: number
}>(), {
  accept: 'image/gif,image/png',
  maxSize: 10485760,
})

const emit = defineEmits<{
  'file-selected': [file: File]
  error: [message: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function triggerFileInput() {
  fileInputRef.value?.click()
}

/**
 * Reads the first few bytes of a file and verifies the binary magic number
 * matches the declared MIME type. This prevents files that have been renamed
 * or have a spoofed Content-Type from being processed.
 */
async function validateMagicNumber(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer())

  if (file.type === 'image/gif') {
    // GIF files start with "GIF" (0x47 0x49 0x46)
    if (header[0] !== 0x47 || header[1] !== 0x49 || header[2] !== 0x46) {
      emit('error', 'File header does not match GIF format. The file may be corrupted or mislabeled.')
      return false
    }
  } else if (file.type === 'image/png') {
    // PNG files start with 0x89 0x50 0x4E 0x47
    if (header[0] !== 0x89 || header[1] !== 0x50 || header[2] !== 0x4E || header[3] !== 0x47) {
      emit('error', 'File header does not match PNG format. The file may be corrupted or mislabeled.')
      return false
    }
  }

  return true
}

async function validateFile(file: File): Promise<boolean> {
  // Validate file type using MIME type only (not extension, which can be spoofed)
  const acceptedMimeTypes: string[] = ['image/gif', 'image/png']
  if (!acceptedMimeTypes.includes(file.type)) {
    emit('error', `Invalid file type "${file.type || 'unknown'}". Please upload a GIF or PNG image.`)
    return false
  }

  // Validate file size
  if (file.size > props.maxSize) {
    const maxMB = (props.maxSize / 1024 / 1024).toFixed(1)
    emit('error', `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${maxMB} MB.`)
    return false
  }

  // Validate binary magic number to guard against spoofed MIME types
  if (!(await validateMagicNumber(file))) {
    return false
  }

  return true
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && (await validateFile(file))) {
    emit('file-selected', file)
  }
}

async function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && (await validateFile(file))) {
    emit('file-selected', file)
  }
  // Reset input so the same file can be selected again
  input.value = ''
}
</script>
