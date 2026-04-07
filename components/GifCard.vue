<template>
  <!-- Compact variant: fixed-size card for trending strip -->
  <NuxtLink
    v-if="variant === 'compact'"
    :to="`/search?q=${encodeURIComponent(gif.tags?.[0] || gif.title)}`"
    class="w-44 md:w-48 h-32 md:h-36 flex-shrink-0 rounded-xl overflow-hidden relative bg-surface-200 block"
  >
    <img
      v-if="gif.blur_preview && isValidGifUrl(gif.blur_preview)"
      :src="gif.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
    <img
      v-if="isValidGifUrl(gif.file.sm.gif.url)"
      :src="gif.file.sm.gif.url"
      :alt="gif.title"
      class="relative w-full h-full object-cover"
      loading="lazy"
      crossorigin="anonymous"
      draggable="false"
    />

    <!-- Ad badge for compact variant -->
    <span
      v-if="gif.type === 'ad'"
      class="absolute top-2 left-2 badge badge-neutral text-[10px]"
    >
      Ad
    </span>
  </NuxtLink>

  <!-- Default variant: uniform grid card with hover overlay -->
  <div
    v-else
    class="rounded-xl overflow-hidden relative group bg-surface-200 aspect-[4/3]"
  >
    <!-- Blur placeholder -->
    <img
      v-if="gif.blur_preview && isValidGifUrl(gif.blur_preview)"
      :src="gif.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
    />

    <!-- Actual GIF -->
    <img
      v-if="isValidGifUrl(gif.file.md.gif.url)"
      :src="gif.file.md.gif.url"
      :alt="gif.title"
      class="w-full h-full object-cover"
      loading="lazy"
      crossorigin="anonymous"
    />

    <!-- Ad badge -->
    <span
      v-if="gif.type === 'ad'"
      class="absolute top-2 left-2 badge badge-neutral text-[10px]"
    >
      Ad
    </span>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
      <div class="p-3 flex gap-2 w-full">
        <!-- View button for ads (opens HD URL in new tab) -->
        <button
          v-if="gif.type === 'ad'"
          class="gif-action-btn"
          title="View"
          aria-label="View ad"
          @click="openAd"
        >
          <IconExternalLink :size="16" />
        </button>

        <!-- Optimize button for regular GIFs -->
        <NuxtLink
          v-else
          :to="`/optimizer?gif=${encodeURIComponent(gif.file.hd.gif.url)}&title=${encodeURIComponent(gif.slug)}`"
          class="gif-action-btn"
          title="Optimize"
          aria-label="Optimize for streaming"
          @click="trackInteraction"
        >
          <IconSparkle :size="16" />
        </NuxtLink>

        <!-- Download button -->
        <button
          class="gif-action-btn"
          title="Download"
          aria-label="Download GIF"
          @click="downloadGif"
        >
          <IconDownload :size="16" />
        </button>

        <!-- Copy link button -->
        <button
          class="gif-action-btn"
          title="Copy link"
          aria-label="Copy link"
          @click="copyLink"
        >
          <IconLink :size="16" />
        </button>
      </div>
    </div>

    <!-- KLIPY attribution — always visible, non-interactive -->
    <img
      src="/KLIPY.png"
      alt="Powered by KLIPY"
      class="absolute bottom-2 right-2 h-4 opacity-60 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import type { KlipyGif } from '~/types/klipy'

const props = withDefaults(defineProps<{
  gif: KlipyGif
  variant?: 'default' | 'compact'
}>(), {
  variant: 'default',
})

const { success, error: toastError } = useToast()
const { downloadUrl } = useDownload()
const { shareGif } = useKlipy()

/** Fire-and-forget revenue share tracking — failures must never break UX. */
function trackInteraction() {
  shareGif(props.gif.slug).catch(() => {})
}

/** Only render images served over HTTPS to prevent mixed-content XSS vectors. */
function isValidGifUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Open ad GIF in a new tab instead of sending it to the optimizer. */
function openAd() {
  trackInteraction()
  window.open(props.gif.file.hd.gif.url, '_blank', 'noopener')
}

function downloadGif() {
  trackInteraction()
  downloadUrl(props.gif.file.hd.gif.url, `${props.gif.slug}.gif`)
}

async function copyLink() {
  trackInteraction()
  try {
    await navigator.clipboard.writeText(props.gif.file.hd.gif.url)
    success('Link copied to clipboard')
  } catch {
    toastError('Failed to copy link')
  }
}
</script>
