<template>
  <div class="min-h-screen">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="max-w-5xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left column skeleton -->
        <div class="rounded-2xl bg-surface-200 animate-pulse aspect-[4/3]" />

        <!-- Right column skeleton -->
        <div class="space-y-4">
          <div class="h-4 w-48 bg-surface-200 animate-pulse rounded" />
          <div class="h-8 w-full bg-surface-200 animate-pulse rounded" />
          <div class="h-6 w-20 bg-surface-200 animate-pulse rounded-full" />
          <div class="flex flex-wrap gap-2 mt-4">
            <div v-for="i in 5" :key="i" class="h-8 w-20 bg-surface-200 animate-pulse rounded-full" />
          </div>
          <div class="card mt-6 space-y-3">
            <div v-for="i in 3" :key="i" class="h-5 w-full bg-surface-200/50 animate-pulse rounded" />
          </div>
          <div class="h-12 w-full bg-surface-200 animate-pulse rounded-xl mt-4" />
          <div class="grid grid-cols-3 gap-2">
            <div v-for="i in 3" :key="i" class="h-10 bg-surface-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="text-center py-20 px-4">
      <p class="text-4xl mb-3">&#xAF;\_(&#x30C4;)_/&#xAF;</p>
      <p class="text-lg font-bold text-surface-900 mb-2">{{ typeLabel }} Not Found</p>
      <p class="text-sm text-surface-500 mb-6">We couldn't find the {{ typeLabel.toLowerCase() }} you're looking for.</p>
      <NuxtLink
        :to="`/search${contentType === 'stickers' ? '?type=stickers' : ''}`"
        class="btn btn-primary"
      >
        Search {{ typeLabel }}s
      </NuxtLink>
    </div>

    <!-- Main content -->
    <div v-else-if="item" class="max-w-5xl mx-auto px-4 py-8">
      <!-- Two-column grid: hero preview + info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left column: Hero preview -->
        <div
          class="rounded-2xl overflow-hidden relative"
          :class="isSticker ? 'checkerboard' : 'bg-surface-200'"
        >
          <!-- Blur placeholder background (GIFs only) -->
          <img
            v-if="!isSticker && item.blur_preview && isValidMediaUrl(item.blur_preview)"
            :src="item.blur_preview"
            class="absolute inset-0 w-full h-full object-cover"
            alt=""
            aria-hidden="true"
            draggable="false"
          />

          <!-- Hero image -->
          <img
            v-if="isValidMediaUrl(item.file.hd.gif.url)"
            :src="item.file.hd.gif.url"
            :alt="item.title"
            class="relative w-full h-full"
            :class="isSticker ? 'object-contain p-4' : 'object-cover'"
            :style="{ aspectRatio: `${item.file.hd.gif.width} / ${item.file.hd.gif.height}` }"
            loading="eager"
            crossorigin="anonymous"
            draggable="false"
          />

          <!-- KLIPY attribution -->
          <img
            src="/KLIPY.png"
            alt="Powered by KLIPY"
            class="absolute bottom-3 right-3 h-5 opacity-60 pointer-events-none"
          />
        </div>

        <!-- Right column: Info & actions -->
        <div>
          <!-- Breadcrumb -->
          <nav class="text-sm text-surface-500 mb-3" aria-label="Breadcrumb">
            <NuxtLink to="/" class="hover:text-surface-700 transition-colors">Home</NuxtLink>
            <span class="mx-1.5">/</span>
            <NuxtLink
              :to="`/search${contentType === 'stickers' ? '?type=stickers' : ''}`"
              class="hover:text-surface-700 transition-colors"
            >
              Search {{ typeLabel }}s
            </NuxtLink>
            <span class="mx-1.5">/</span>
            <span class="text-surface-400">{{ item.title }}</span>
          </nav>

          <!-- Title -->
          <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900">
            {{ item.title }}
          </h1>

          <!-- Type badge -->
          <div class="mt-3">
            <span :class="isSticker ? 'badge badge-accent' : 'badge badge-info'">
              {{ typeLabel }}
            </span>
          </div>

          <!-- Tags (auto-generated from title/slug when API returns empty) -->
          <div v-if="displayTags.length > 0" class="flex flex-wrap gap-2 mt-4">
            <NuxtLink
              v-for="tag in displayTags"
              :key="tag"
              :to="`/search?q=${encodeURIComponent(tag)}${contentType === 'stickers' ? '&type=stickers' : ''}`"
              class="pill !py-1.5 !px-3 text-xs"
            >
              #{{ tag }}
            </NuxtLink>
          </div>

          <!-- File info card -->
          <div class="card mt-6">
            <div class="flex justify-between py-2 border-b border-surface-200/50">
              <span class="text-sm text-surface-500">Format</span>
              <span class="text-sm font-medium text-surface-900">GIF</span>
            </div>
            <div class="flex justify-between py-2 border-b border-surface-200/50">
              <span class="text-sm text-surface-500">Dimensions</span>
              <span class="text-sm font-medium text-surface-900">
                {{ item.file.hd.gif.width }} &times; {{ item.file.hd.gif.height }}
              </span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-sm text-surface-500">HD Size</span>
              <span class="text-sm font-medium text-surface-900">
                {{ formatFileSize(item.file.hd.gif.size) }}
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="mt-6 space-y-3">
            <!-- Primary: Optimize for Streaming -->
            <NuxtLink
              :to="`/optimizer?gif=${encodeURIComponent(item.file.hd.gif.url)}&title=${encodeURIComponent(item.slug)}`"
              class="btn btn-primary w-full"
              @click="trackAction"
            >
              <IconSparkle :size="18" />
              Optimize for Streaming
            </NuxtLink>

            <!-- Secondary row: Download, Copy Link, Share -->
            <div class="grid grid-cols-3 gap-2">
              <button class="btn btn-secondary" @click="handleDownload">
                <IconDownload :size="16" />
                <span class="hidden sm:inline">Download</span>
              </button>
              <button class="btn btn-secondary" @click="handleCopyLink">
                <IconLink :size="16" />
                <span class="hidden sm:inline">Copy Link</span>
              </button>
              <button class="btn btn-secondary" @click="handleShare">
                <!-- Share icon (inline SVG since we don't have an IconShare component) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span class="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Related content section -->
      <section v-if="relatedLoading || relatedItems.length > 0" class="mt-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg md:text-xl font-bold text-surface-900">
            Related {{ typeLabel }}s
          </h2>
          <NuxtLink
            v-if="relatedSearchQuery"
            :to="`/search?q=${encodeURIComponent(relatedSearchQuery)}${contentType === 'stickers' ? '&type=stickers' : ''}`"
            class="link text-sm"
          >
            See All
          </NuxtLink>
        </div>

        <!-- Loading state -->
        <div
          v-if="relatedLoading"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3"
        >
          <SkeletonCard v-for="i in 8" :key="i" />
        </div>

        <!-- Related grid -->
        <div
          v-else-if="relatedItems.length > 0"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3"
        >
          <GifCard
            v-for="gif in relatedItems"
            :key="gif.id"
            :gif="gif"
            :content-type="contentType"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KlipyGif } from '~/types/klipy'
import { formatFileSize } from '~/utils/format'
import { isValidMediaUrl } from '~/utils/url'

const props = defineProps<{
  contentType: 'gifs' | 'stickers'
  item: KlipyGif | null
  isLoading: boolean
}>()

const klipy = useKlipy()
const { success, error: toastError } = useToast()
const { downloadUrl } = useDownload()

const isSticker = computed(() => props.contentType === 'stickers')
const typeLabel = computed(() => isSticker.value ? 'Sticker' : 'GIF')

// Item and loading state come from the parent page via props.
// useAsyncData and useHead live in the page files so Nuxt's SSR
// properly awaits the data fetch and renders OG tags in the HTML.
const item = computed(() => props.item)
const notFound = computed(() => !props.isLoading && !props.item)

/** Stop-words excluded from auto-generated tags. */
const TAG_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this',
  'are', 'but', 'not', 'you', 'all',
  'can', 'her', 'was', 'one', 'our', 'out',
])

/**
 * Returns API-provided tags when available, otherwise generates
 * meaningful tags from the item's title and slug so the detail
 * page always has clickable discovery links.
 */
const displayTags = computed<string[]>(() => {
  // Prefer API tags when they exist
  if (item.value?.tags && item.value.tags.length > 0) {
    return item.value.tags
  }

  if (!item.value) return []

  const tags = new Set<string>()

  // Parse slug: "bug-cat-5" -> ["bug", "cat"] (strip trailing number suffix)
  const slugWords = item.value.slug
    .replace(/-\d+$/, '')
    .split('-')
    .filter(w => w.length > 1)
  slugWords.forEach(w => tags.add(w.toLowerCase()))

  // Parse title: "Bug Cat" -> ["bug", "cat"], excluding stop-words
  const titleWords = item.value.title
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 2)
    .filter(w => !TAG_STOP_WORDS.has(w))
  titleWords.forEach(w => tags.add(w))

  // Always include content-type tag for discovery
  tags.add(isSticker.value ? 'sticker' : 'gif')
  tags.add('emote')

  return Array.from(tags).slice(0, 10)
})

// Related content state (loaded client-side only — not needed for OG tags)
const relatedItems = ref<KlipyGif[]>([])
const relatedLoading = ref(false)
const relatedSearchQuery = ref('')

let abortController: AbortController | null = null

/** The canonical page URL for this item. */
const pageUrl = computed(() => {
  if (!item.value) return ''
  return `https://emotesizer.com/${props.contentType}/${item.value.slug}`
})

/** Fire-and-forget revenue share tracking. */
function trackAction() {
  if (!item.value) return
  klipy.share(props.contentType, item.value.slug).catch(() => {})
}

function handleDownload() {
  if (!item.value) return
  trackAction()
  downloadUrl(item.value.file.hd.gif.url, `${item.value.slug}.gif`)
}

async function handleCopyLink() {
  if (!item.value) return
  trackAction()
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    success('Link copied to clipboard')
  } catch {
    toastError('Failed to copy link')
  }
}

async function handleShare() {
  if (!item.value) return
  trackAction()

  const shareData = {
    title: item.value.title,
    text: `Check out "${item.value.title}" on EmoteSizer`,
    url: pageUrl.value,
  }

  // Use native share if available, otherwise fall back to clipboard
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (e: unknown) {
      // User cancelled the share dialog — not an error
      if (e instanceof DOMException && e.name === 'AbortError') return
      // Fallback to clipboard on any other error
      await handleCopyLink()
    }
  } else {
    await handleCopyLink()
  }
}

async function fetchRelated(currentItem: KlipyGif) {
  // Determine the search query for related content:
  // prefer the first API tag, then the first auto-generated tag, then the title
  const query = (currentItem.tags?.length ? currentItem.tags[0] : null)
    || displayTags.value[0]
    || currentItem.title
  relatedSearchQuery.value = query

  relatedLoading.value = true
  try {
    const response = await klipy.search(
      props.contentType,
      query,
      1,
      8,
      { signal: abortController?.signal }
    )
    // Filter out the current item from related results
    relatedItems.value = response.data.data
      .filter(g => g.id !== currentItem.id)
      .slice(0, 8)
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (import.meta.dev) console.error('fetchRelated:', e)
    // Related content is non-critical — silently fail
  } finally {
    relatedLoading.value = false
  }
}

// Related content is non-critical — fetch client-side only after mount
onMounted(() => {
  abortController = new AbortController()
  if (item.value) {
    fetchRelated(item.value)
  }
})

onUnmounted(() => {
  abortController?.abort()
})
</script>
