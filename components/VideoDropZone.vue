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
      <!-- Video upload icon -->
      <div class="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400">
          <path d="m16 3 6 6-6 6V3Z" />
          <rect width="12" height="18" x="2" y="3" rx="2" />
        </svg>
      </div>

      <div>
        <p class="text-sm font-medium text-surface-700">Drag & drop a video here</p>
        <p class="text-xs text-surface-400 mt-1">or click to browse files</p>
      </div>

      <p class="text-xs text-surface-400">MP4, WebM, MOV, AVI up to 200 MB</p>

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
const MAX_SIZE = 209715200 // 200 MB

const accept = 'video/mp4,video/webm,video/quicktime,video/x-msvideo'

const emit = defineEmits<{
  'file-selected': [file: File]
  error: [message: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function triggerFileInput() {
  fileInputRef.value?.click()
}

/** Accepted MIME types for video validation */
const acceptedMimeTypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]

/**
 * Validates the binary magic number of the file against its declared MIME type.
 * Prevents processing of renamed or spoofed files.
 *
 * Magic numbers:
 * - MP4: bytes 4-7 = "ftyp" (0x66 0x74 0x79 0x70)
 * - WebM: bytes 0-3 = EBML (0x1A 0x45 0xDF 0xA3)
 * - AVI: bytes 0-3 = "RIFF" AND bytes 8-11 = "AVI "
 * - MOV: same ftyp header as MP4 (QuickTime container)
 */
async function validateMagicNumber(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())

  if (file.type === 'video/mp4' || file.type === 'video/quicktime') {
    // MP4/MOV: bytes 4-7 should be "ftyp"
    if (header[4] !== 0x66 || header[5] !== 0x74 || header[6] !== 0x79 || header[7] !== 0x70) {
      emit('error', 'File header does not match MP4/MOV format. The file may be corrupted or mislabeled.')
      return false
    }
  } else if (file.type === 'video/webm') {
    // WebM: starts with EBML header
    if (header[0] !== 0x1A || header[1] !== 0x45 || header[2] !== 0xDF || header[3] !== 0xA3) {
      emit('error', 'File header does not match WebM format. The file may be corrupted or mislabeled.')
      return false
    }
  } else if (file.type === 'video/x-msvideo') {
    // AVI: starts with RIFF and has AVI at bytes 8-11
    const isRiff = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
    const isAvi = header[8] === 0x41 && header[9] === 0x56 && header[10] === 0x49 && header[11] === 0x20
    if (!isRiff || !isAvi) {
      emit('error', 'File header does not match AVI format. The file may be corrupted or mislabeled.')
      return false
    }
  }

  return true
}

async function validateFile(file: File): Promise<boolean> {
  // Validate MIME type
  if (!acceptedMimeTypes.includes(file.type)) {
    emit('error', `Invalid file type "${file.type || 'unknown'}". Please upload an MP4, WebM, MOV, or AVI video.`)
    return false
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    const maxMB = (MAX_SIZE / 1024 / 1024).toFixed(0)
    emit('error', `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${maxMB} MB.`)
    return false
  }

  // Validate binary magic number
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
  // Reset so the same file can be re-selected
  input.value = ''
}
</script>
