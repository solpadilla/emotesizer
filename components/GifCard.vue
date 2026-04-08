<template>
  <!-- Ad: Compact variant -->
  <div
    ref="adContainerRef"
    v-if="isAd && variant === 'compact'"
    class="w-44 md:w-48 h-32 md:h-36 flex-shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center bg-surface-200"
  >
    <iframe
      :srcdoc="(gif as KlipyAdItem).content"
      :style="{
        width: (gif as KlipyAdItem).width + 'px',
        height: (gif as KlipyAdItem).height + 'px',
        transform: `scale(${adScale})`,
        transformOrigin: 'center center',
        border: 'none',
        overflow: 'hidden',
        flexShrink: '0',
      }"
      scrolling="no"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      title="Advertisement"
    />
    <span class="absolute top-2 left-2 badge badge-neutral text-[10px] z-10">Ad</span>
  </div>

  <!-- Ad: Default variant -->
  <div
    ref="adContainerRef"
    v-else-if="isAd"
    class="rounded-xl overflow-hidden relative aspect-[4/3] flex items-center justify-center bg-surface-200"
  >
    <iframe
      :srcdoc="(gif as KlipyAdItem).content"
      :style="{
        width: (gif as KlipyAdItem).width + 'px',
        height: (gif as KlipyAdItem).height + 'px',
        transform: `scale(${adScale})`,
        transformOrigin: 'center center',
        border: 'none',
        overflow: 'hidden',
        flexShrink: '0',
      }"
      scrolling="no"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      title="Advertisement"
    />
    <span class="absolute top-2 left-2 badge badge-neutral text-[10px] z-10">Ad</span>
  </div>

  <!-- Regular GIF: Compact variant — fixed-size card for trending strip -->
  <NuxtLink
    v-else-if="variant === 'compact'"
    :to="detailUrl"
    class="w-44 md:w-48 h-32 md:h-36 flex-shrink-0 rounded-xl overflow-hidden relative block"
    :class="isSticker ? 'checkerboard' : 'bg-surface-200'"
  >
    <img
      v-if="!isSticker && gifItem.blur_preview && isValidMediaUrl(gifItem.blur_preview)"
      :src="gifItem.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
    <img
      v-if="isValidMediaUrl(compactImgSrc)"
      :src="compactImgSrc"
      :alt="gifItem.title"
      class="relative w-full h-full"
      :class="isSticker ? 'object-contain p-2' : 'object-cover'"
      loading="lazy"
      crossorigin="anonymous"
      draggable="false"
    />
  </NuxtLink>

  <!-- Regular GIF: Default variant — uniform grid card with hover overlay -->
  <NuxtLink
    v-else
    :to="detailUrl"
    class="rounded-xl overflow-hidden relative group aspect-[4/3] block"
    :class="isSticker ? 'checkerboard' : 'bg-surface-200'"
  >
    <!-- Blur placeholder (GIFs only — stickers have transparent backgrounds) -->
    <img
      v-if="!isSticker && gifItem.blur_preview && isValidMediaUrl(gifItem.blur_preview)"
      :src="gifItem.blur_preview"
      class="absolute inset-0 w-full h-full object-cover"
      alt=""
      aria-hidden="true"
    />

    <!-- Actual image -->
    <img
      v-if="isValidMediaUrl(defaultImgSrc)"
      :src="defaultImgSrc"
      :alt="gifItem.title"
      class="w-full h-full"
      :class="isSticker ? 'object-contain p-2' : 'object-cover'"
      loading="lazy"
      crossorigin="anonymous"
    />

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
      <div class="p-3 flex gap-2 w-full">
        <!-- Optimize button -->
        <NuxtLink
          :to="`/optimizer?gif=${encodeURIComponent(optimizeUrl)}&title=${encodeURIComponent(gifItem.slug)}`"
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
import type { KlipyItem, KlipyGifItem, KlipyAdItem } from '~/types/klipy'
import { isValidMediaUrl } from '~/utils/url'

const props = withDefaults(defineProps<{
  gif: KlipyItem
  variant?: 'default' | 'compact'
  contentType?: 'gifs' | 'stickers'
}>(), {
  variant: 'default',
  contentType: 'gifs',
})

const { success, error: toastError } = useToast()
const { downloadUrl } = useDownload()
const { share } = useKlipy()

const isAd = computed(() => props.gif.type === 'ad')
const isSticker = computed(() => props.contentType === 'stickers')
const gifItem = computed(() => props.gif as KlipyGifItem)

// Ad scaling — dynamically scale the iframe to fit inside the card container
const adContainerRef = ref<HTMLElement | null>(null)
const adScale = ref(1)
let adResizeObserver: ResizeObserver | null = null

function updateAdScale() {
  if (!adContainerRef.value || !isAd.value) return
  const ad = props.gif as KlipyAdItem
  const cw = adContainerRef.value.clientWidth
  const ch = adContainerRef.value.clientHeight
  if (cw > 0 && ch > 0) {
    adScale.value = Math.min(cw / ad.width, ch / ad.height, 1)
  }
}

onMounted(() => {
  if (isAd.value && adContainerRef.value) {
    updateAdScale()
    adResizeObserver = new ResizeObserver(updateAdScale)
    adResizeObserver.observe(adContainerRef.value)
  }
})

onUnmounted(() => {
  adResizeObserver?.disconnect()
})

// Detail page URL for this item (ads have no detail page)
const detailUrl = computed(() => {
  if (isAd.value) return '#'
  return `/${props.contentType}/${gifItem.value.slug}`
})

// Display URLs — always use animated GIF so users see the animation
const defaultImgSrc = computed(() => {
  if (isAd.value) return ''
  return gifItem.value.file.md.gif.url
})

const compactImgSrc = computed(() => {
  if (isAd.value) return ''
  return gifItem.value.file.sm.gif.url
})

// HD URL — always use the GIF regardless of content type
const hdUrl = computed(() => {
  if (isAd.value) return ''
  return gifItem.value.file.hd.gif.url
})

// The URL sent to the optimizer page
const optimizeUrl = computed(() => hdUrl.value)

/** Fire-and-forget revenue share tracking — failures must never break UX. */
function trackInteraction() {
  if (isAd.value) return
  share(props.contentType, gifItem.value.slug).catch(() => {})
}

function downloadGif() {
  if (isAd.value) return
  trackInteraction()
  downloadUrl(hdUrl.value, `${gifItem.value.slug}.gif`)
}

async function copyLink() {
  if (isAd.value) return
  trackInteraction()
  try {
    await navigator.clipboard.writeText(hdUrl.value)
    success('Link copied to clipboard')
  } catch {
    toastError('Failed to copy link')
  }
}
</script>
