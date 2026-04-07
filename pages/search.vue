<template>
  <div class="min-h-screen">
    <!-- Sticky Search Bar -->
    <div class="sticky top-14 md:top-16 z-30 bg-surface-50 border-b border-surface-200/50">
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <SearchBar
          v-model="store.query"
          :autofocus="!store.query"
          @search="handleSearch"
        />

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
      <h1 class="sr-only">Search GIFs for Streaming Emotes</h1>

      <!-- Results Header -->
      <div class="mb-4">
        <h2 class="text-base font-bold text-surface-900">
          <template v-if="store.query">
            Results for "{{ store.query }}"
          </template>
          <template v-else>
            Trending
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
        <p class="text-sm text-surface-500">No GIFs found. Try a different search term.</p>
      </div>

      <!-- Results Grid -->
      <div v-else
           class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3
                  transition-opacity duration-150"
           :class="{ 'opacity-40 pointer-events-none': store.isPageTransitioning }">
        <GifCard
          v-for="gif in store.gifs"
          :key="gif.id"
          :gif="gif"
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
        <h2 class="text-base font-bold text-surface-900 mb-3">Find the Perfect GIF for Your Emotes</h2>
        <p class="text-sm text-surface-500 leading-relaxed">
          Browse thousands of trending GIFs or search for exactly what you need.
          Found the perfect one? Click the optimize button to resize it for
          <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">Twitch emotes</NuxtLink>,
          Discord emoji, or Kick channel emotes. All processing happens in your browser — fast, free, and private.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Search GIFs for Twitch, Discord & Kick Emotes — EmoteSizer',
  meta: [
    { name: 'description', content: 'Search thousands of trending GIFs to use as Twitch emotes, Discord emoji, or Kick emotes. Find the perfect GIF and resize it instantly.' },
    { property: 'og:title', content: 'Search GIFs for Streaming Emotes — EmoteSizer' },
    { property: 'og:description', content: 'Search thousands of GIFs and convert them into emotes for Twitch, Discord, and Kick.' },
    { property: 'og:url', content: 'https://emotesizer.com/search' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/search' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://emotesizer.com" },
        { "@type": "ListItem", "position": 2, "name": "Search GIFs", "item": "https://emotesizer.com/search" }
      ]
    }),
  }],
})

const route = useRoute()
const router = useRouter()
const store = useSearchStore()
const klipy = useKlipy()

let abortController: AbortController | null = null

async function handleSearch(query: string) {
  router.replace({ query: query ? { q: query } : {} })
  store.query = query
  store.selectedCategory = null
  await fetchGifs()
}

async function handleCategoryChange(slug: string | null) {
  // Category slugs are treated as search queries in the KLIPY API --
  // selecting a category triggers a search for that category's name
  if (slug) {
    store.query = slug
    router.replace({ query: { q: slug } })
  } else {
    store.query = ''
    router.replace({ query: {} })
  }
  await fetchGifs()
}

async function fetchGifs() {
  // Abort any in-flight request before starting a new one
  abortController?.abort()
  abortController = new AbortController()

  store.reset()
  store.isLoading = true

  try {
    const response = store.query
      ? await klipy.searchGifs(store.query, 1, 24, { signal: abortController.signal })
      : await klipy.getTrending(1, 24, { signal: abortController.signal })

    store.gifs = response.data.data
    store.currentPage = response.data.current_page
    store.hasMore = response.data.has_next
  } catch (e: unknown) {
    // Silently ignore aborted requests
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (import.meta.dev) console.error('fetchGifs:', e)
    store.error = e instanceof Error ? e.message : 'Failed to load GIFs'
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
      ? await klipy.searchGifs(store.query, page, 24, { signal: abortController.signal })
      : await klipy.getTrending(page, 24, { signal: abortController.signal })

    store.gifs = response.data.data
    store.hasMore = response.data.has_next

    // Update URL -- omit page param when on page 1 for cleaner URLs
    const query: Record<string, string> = {}
    if (store.query) query.q = store.query
    if (page > 1) query.page = String(page)
    router.replace({ query })

    // Scroll to top so the user sees the new page from the beginning
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (import.meta.dev) console.error('goToPage:', e)
    if (e instanceof Error) store.error = e.message
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

  const pageParam = route.query.page as string | undefined
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  // Fetch categories (non-blocking)
  klipy.getCategories().then(cats => {
    store.categories = cats
  }).catch(() => {
    // Categories are non-critical
  })

  // Fetch initial GIFs -- if a page param was provided, go directly to that page
  if (initialPage > 1) {
    store.currentPage = initialPage
    abortController = new AbortController()
    store.isLoading = true
    try {
      const response = store.query
        ? await klipy.searchGifs(store.query, initialPage, 24, { signal: abortController.signal })
        : await klipy.getTrending(initialPage, 24, { signal: abortController.signal })

      store.gifs = response.data.data
      store.currentPage = response.data.current_page
      store.hasMore = response.data.has_next
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      if (import.meta.dev) console.error('fetchGifs:', e)
      store.error = e instanceof Error ? e.message : 'Failed to load GIFs'
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
