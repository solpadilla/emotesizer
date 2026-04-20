<template>
  <div class="min-h-screen">
    <!-- Sticky Search Bar -->
    <div class="sticky top-[56px] lg:top-0 z-30 bg-surface-50 border-b border-surface-200/50">
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <SearchBar
          v-model="store.query"
          :autofocus="!store.query"
          @search="handleSearch"
        />

        <!-- Content Type Toggle -->
        <div class="segmented-control mt-3" role="radiogroup" aria-label="Content type">
          <button
            class="segmented-control-item"
            :class="{ 'segmented-control-item-active': store.contentType === 'gifs' }"
            role="radio"
            :aria-checked="store.contentType === 'gifs'"
            @click="switchContentType('gifs')"
          >
            GIFs
          </button>
          <button
            class="segmented-control-item"
            :class="{ 'segmented-control-item-active': store.contentType === 'stickers' }"
            role="radio"
            :aria-checked="store.contentType === 'stickers'"
            @click="switchContentType('stickers')"
          >
            Stickers
          </button>
        </div>

        <!-- Category Pills -->
        <div v-if="store.categories.length > 0" class="mt-3">
          <CategoryPills
            v-model="store.selectedCategory"
            :categories="store.categories"
            @update:model-value="handleCategoryChange"
          />
        </div>
      </div>
    </div>

    <!-- Results Area -->
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <h1 class="sr-only">Search {{ store.contentType === 'stickers' ? 'Stickers' : 'GIFs' }} for Streaming Emotes</h1>

      <!--
        Popular Categories pill row — only shown when there's no active query
        or category, i.e. when the page is landing on trending/browse mode.
        Gives users (and crawlers) a set of canonical entry points so the
        bare /search page isn't a dead end of generic trending content.
      -->
      <section
        v-if="!store.query && !store.selectedCategory"
        class="mb-6"
      >
        <h2 class="text-sm font-bold text-surface-900 mb-3">Popular Categories</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in popularCategories"
            :key="category"
            type="button"
            class="pill text-xs !px-3 !py-1.5 !min-h-[36px] capitalize"
            @click="jumpToCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </section>

      <!-- Results Header -->
      <div class="mb-4">
        <h2 class="text-base font-bold text-surface-900">
          <template v-if="store.query">
            Results for "{{ store.query }}" in {{ store.contentType === 'stickers' ? 'Stickers' : 'GIFs' }}
          </template>
          <template v-else>
            Trending {{ store.contentType === 'stickers' ? 'Stickers' : 'GIFs' }}
          </template>
        </h2>
      </div>

      <!-- Error State -->
      <div v-if="store.error" class="text-center py-20">
        <div class="text-surface-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p class="text-sm text-surface-500 mb-4">{{ store.error }}</p>
        <button class="btn btn-secondary btn-sm" @click="retry">
          Try Again
        </button>
      </div>

      <!-- Loading State -->
      <div v-else-if="store.isLoading"
           class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        <SkeletonCard v-for="i in 24" :key="i" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!store.isLoading && store.gifs.length === 0 && (store.query || store.selectedCategory)" class="text-center py-20">
        <p class="text-4xl mb-3">&#xAF;\_(&#x30C4;)_/&#xAF;</p>
        <p class="text-sm text-surface-500">No {{ store.contentType === 'stickers' ? 'stickers' : 'GIFs' }} found. Try a different search term.</p>
      </div>

      <!-- Results Grid -->
      <div v-else
           class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3
                  transition-opacity duration-150"
           :class="{ 'opacity-40 pointer-events-none': store.isPageTransitioning }">
        <GifCard
          v-for="(gif, idx) in store.gifs"
          :key="gif.type === 'ad' ? `ad-${idx}` : gif.id"
          :gif="gif"
          :content-type="store.contentType"
        />
      </div>

      <!-- Pagination Bar -->
      <div v-if="store.gifs.length > 0" class="flex items-center justify-between mt-8 mb-4 px-2">
        <button class="btn btn-secondary btn-sm min-w-[110px]"
                :disabled="store.currentPage <= 1 || store.isPageTransitioning"
                @click="goToPage(store.currentPage - 1)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>
        <span class="text-sm font-medium text-surface-500">Page {{ store.currentPage }}</span>
        <button class="btn btn-secondary btn-sm min-w-[110px]"
                :disabled="!store.hasMore || store.isPageTransitioning"
                @click="goToPage(store.currentPage + 1)">
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- SEO content (shown when no active search query) -->
      <section v-if="!store.query" class="mt-12 mb-8 max-w-3xl mx-auto text-center">
        <h2 class="text-base font-bold text-surface-900 mb-3">Free GIF Tools — Find and Resize Images for Twitch Emotes</h2>
        <p class="text-sm text-surface-500 leading-relaxed">
          Find GIFs for emotes by browsing thousands of trending animations, or search stickers for Discord, Twitch, and Kick.
          Looking for animated emotes for Twitch? Search by keyword to discover the perfect clip, then use our
          <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">free online gif editor and emote resizer</NuxtLink>
          to resize it for Twitch, Discord emoji, Kick channel emotes, 7TV, BTTV, or FFZ. EmoteSizer is the easiest emote creator for streamers — a free gif editor with gif tools that handle everything from search to compression, entirely in your browser with no signup required.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const store = useSearchStore()

// Curated list of common emote-relevant search terms. Rendered as pills
// above the trending grid when the visitor hasn't typed a query yet, so
// the empty /search page has clear directions to go.
const popularCategories = [
  'happy',
  'dance',
  'cat',
  'pepe',
  'laugh',
  'sad',
  'angry',
  'confused',
  'love',
  'fire',
  'sparkle',
  'party',
] as const

/** Programmatically issues a search for one of the popular-category pills. */
function jumpToCategory(term: string) {
  handleSearch(term)
}

// Reactive SEO: title, description, canonical, and OG tags adapt to the
// active content type so search-engine crawlers and social previews
// always reflect whether the user is browsing GIFs or Stickers.
useHead(computed(() => {
  const isStickers = store.contentType === 'stickers'
  const typeLabel = isStickers ? 'Stickers' : 'GIFs'
  const canonicalUrl = isStickers ? 'https://emotesizer.com/search?type=stickers' : 'https://emotesizer.com/search'
  return {
    title: `Search ${typeLabel} for Twitch, Discord & Kick Emotes — EmoteSizer`,
    meta: [
      { name: 'description', content: `Search thousands of trending ${typeLabel.toLowerCase()} to use as Twitch emotes, Discord emoji, or Kick emotes. Find the perfect ${isStickers ? 'sticker' : 'GIF'} and resize it instantly.` },
      { property: 'og:title', content: `Search ${typeLabel} for Streaming Emotes — EmoteSizer` },
      { property: 'og:description', content: `Search thousands of ${typeLabel.toLowerCase()} and convert them into emotes for Twitch, Discord, and Kick.` },
      { property: 'og:url', content: canonicalUrl },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://emotesizer.com" },
          { "@type": "ListItem", "position": 2, "name": `Search ${typeLabel}`, "item": canonicalUrl }
        ]
      }),
    }],
  }
}))
const klipy = useKlipy()

let abortController: AbortController | null = null

/** Build a clean URL query object reflecting the current search state. */
function buildRouteQuery(overrides?: Record<string, string | undefined>): Record<string, string> {
  const q: Record<string, string> = {}
  const query = overrides?.q ?? store.query
  const type = overrides?.type ?? store.contentType
  const page = overrides?.page ?? (store.currentPage > 1 ? String(store.currentPage) : undefined)

  if (query) q.q = query
  if (type === 'stickers') q.type = 'stickers'
  if (page && page !== '1') q.page = page
  return q
}

async function handleSearch(query: string) {
  store.query = query
  store.selectedCategory = null
  router.replace({ query: buildRouteQuery({ q: query || undefined, page: undefined }) })
  await fetchGifs()
}

async function handleCategoryChange(slug: string | null) {
  // Category slugs are treated as search queries in the KLIPY API --
  // selecting a category triggers a search for that category's name
  if (slug) {
    store.query = slug
  } else {
    store.query = ''
  }
  router.replace({ query: buildRouteQuery({ q: store.query || undefined, page: undefined }) })
  await fetchGifs()
}

async function switchContentType(type: 'gifs' | 'stickers') {
  if (store.contentType === type) return
  store.contentType = type
  store.reset()

  // Update URL to reflect the new content type
  router.replace({ query: buildRouteQuery({ page: undefined }) })

  // Re-fetch categories for the new content type
  klipy.categories(type).then(cats => {
    store.categories = cats
  }).catch(() => {
    // Categories are non-critical
  })

  await fetchGifs()
}

/**
 * Shared error handler for fetch operations. Returns true when the error
 * is an AbortError (i.e. the caller should bail out silently).
 */
function handleFetchError(e: unknown, context: string): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true
  if (import.meta.dev) console.error(`${context}:`, e)
  store.error = e instanceof Error ? e.message : 'An unexpected error occurred'
  return false
}

async function fetchGifs() {
  // Abort any in-flight request before starting a new one
  abortController?.abort()
  abortController = new AbortController()

  store.isLoading = true
  store.reset()

  try {
    const response = store.query
      ? await klipy.search(store.contentType, store.query, 1, 24, { signal: abortController.signal })
      : await klipy.trending(store.contentType, 1, 24, { signal: abortController.signal })

    store.gifs = response.data.data
    store.currentPage = response.data.current_page
    store.hasMore = response.data.has_next
  } catch (e: unknown) {
    if (handleFetchError(e, 'fetchGifs')) return
  } finally {
    store.isLoading = false
  }
}

async function goToPage(page: number) {
  // Abort any in-flight request before starting a new one
  abortController?.abort()
  abortController = new AbortController()

  store.isPageTransitioning = true
  store.currentPage = page

  try {
    const response = store.query
      ? await klipy.search(store.contentType, store.query, page, 24, { signal: abortController.signal })
      : await klipy.trending(store.contentType, page, 24, { signal: abortController.signal })

    store.gifs = response.data.data
    store.hasMore = response.data.has_next

    // Update URL -- omit page param when on page 1 for cleaner URLs
    router.replace({ query: buildRouteQuery({ page: page > 1 ? String(page) : undefined }) })

    // Scroll to top so the user sees the new page from the beginning
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: unknown) {
    if (handleFetchError(e, 'goToPage')) return
  } finally {
    store.isPageTransitioning = false
  }
}

function retry() {
  fetchGifs()
}

// Load categories on mount and fetch initial GIFs
onMounted(async () => {
  // Read query params
  const q = route.query.q as string | undefined
  if (q) {
    store.query = q
  }

  // Read content type from URL, default to 'gifs'
  const typeParam = route.query.type as string | undefined
  if (typeParam === 'stickers') {
    store.contentType = 'stickers'
  }

  const pageParam = route.query.page as string | undefined
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  // Fetch categories for the active content type (non-blocking)
  klipy.categories(store.contentType).then(cats => {
    store.categories = cats
  }).catch(() => {
    // Categories are non-critical
  })

  // Fetch initial content -- if a page param was provided, go directly to that page
  if (initialPage > 1) {
    store.currentPage = initialPage
    abortController = new AbortController()
    store.isLoading = true
    try {
      const response = store.query
        ? await klipy.search(store.contentType, store.query, initialPage, 24, { signal: abortController.signal })
        : await klipy.trending(store.contentType, initialPage, 24, { signal: abortController.signal })

      store.gifs = response.data.data
      store.currentPage = response.data.current_page
      store.hasMore = response.data.has_next
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      if (import.meta.dev) console.error('fetchGifs:', e)
      store.error = e instanceof Error ? e.message : 'Failed to load content'
    } finally {
      store.isLoading = false
    }
  } else {
    await fetchGifs()
  }
})

onUnmounted(() => {
  abortController?.abort()
})
</script>
