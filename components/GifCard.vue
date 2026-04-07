<template>
  <!-- Compact variant: fixed-size card for trending strip -->
  <NuxtLink
    v-if="variant === 'compact'"
    :to="detailUrl"
    class="w-44 md:w-48 h-32 md:h-36 flex-shrink-0 rounded-xl overflow-hidden relative block"
    :class="isSticker ? 'checkerboard' : 'bg-surface-200'"
  >
    <img
      v-if="!isSticker && gif.blur_preview && isValidMediaUrl(gif.blur_preview)"
      :src="gif.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
    <img
      v-if="isValidMediaUrl(compactImgSrc)"
      :src="compactImgSrc"
      :alt="gif.title"
      class="relative w-full h-full"
      :class="isSticker ? 'object-contain p-2' : 'object-cover'"
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
  <NuxtLink
    v-else
    :to="detailUrl"
    class="rounded-xl overflow-hidden relative group aspect-[4/3] block"
    :class="isSticker ? 'checkerboard' : 'bg-surface-200'"
  >
    <!-- Blur placeholder (GIFs only — stickers have transparent backgrounds) -->
    <img
      v-if="!isSticker && gif.blur_preview && isValidMediaUrl(gif.blur_preview)"
      :src="gif.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
    />

    <!-- Actual image -->
    <img
      v-if="isValidMediaUrl(defaultImgSrc)"
      :src="defaultImgSrc"
      :alt="gif.title"
      class="w-full h-full"
      :class="isSticker ? 'object-contain p-2' : 'object-cover'"
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
          @click.prevent.stop="openAd"
        >
          <IconExternalLink :size="16" />
        </button>

        <!-- Optimize button for regular content -->
        <NuxtLink
          v-else
          :to="`/optimizer?gif=${encodeURIComponent(optimizeUrl)}&title=${encodeURIComponent(gif.slug)}`"
          class="gif-action-btn"
          title="Optimize"
          aria-label="Optimize for streaming"
          @click.stop="trackInteraction"
        >
          <IconSparkle :size="16" />
        </NuxtLink>

        <!-- Download button -->
        <button
          class="gif-action-btn"
          title="Download"
          :aria-label="isSticker ? 'Download sticker' : 'Download GIF'"
          @click.prevent.stop="downloadGif"
        >
          <IconDownload :size="16" />
        </button>

        <!-- Copy link button -->
        <button
          class="gif-action-btn"
          title="Copy link"
          aria-label="Copy link"
          @click.prevent.stop="copyLink"
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
  </NuxtLink>
</template>

<script setup lang="ts">
import type { KlipyGif } from '~/types/klipy'
import { isValidMediaUrl } from '~/utils/url'

const props = withDefaults(defineProps<{
  gif: KlipyGif
  variant?: 'default' | 'compact'
  contentType?: 'gifs' | 'stickers'
}>(), {
  variant: 'default',
  contentType: 'gifs',
})

const { success, error: toastError } = useToast()
const { downloadUrl } = useDownload()
const { share } = useKlipy()

const isSticker = computed(() => props.contentType === 'stickers')

// Detail page URL for this item
const detailUrl = computed(() => `/${props.contentType}/${props.gif.slug}`)

// Display URLs — always use animated GIF so users see the animation
const defaultImgSrc = computed(() => props.gif.file.md.gif.url)
const compactImgSrc = computed(() => props.gif.file.sm.gif.url)

// HD URL — always use the GIF regardless of content type
const hdUrl = computed(() => props.gif.file.hd.gif.url)

// The URL sent to the optimizer page
const optimizeUrl = computed(() => hdUrl.value)

/** Fire-and-forget revenue share tracking — failures must never break UX. */
function trackInteraction() {
  share(props.contentType, props.gif.slug).catch(() => {})
}

/** Open ad content in a new tab instead of sending it to the optimizer. */
function openAd() {
  trackInteraction()
  window.open(hdUrl.value, '_blank', 'noopener')
}

function downloadGif() {
  trackInteraction()
  downloadUrl(hdUrl.value, `${props.gif.slug}.gif`)
}

async function copyLink() {
  trackInteraction()
  try {
    await navigator.clipboard.writeText(hdUrl.value)
    success('Link copied to clipboard')
  } catch {
    toastError('Failed to copy link')
  }
}
</script>
