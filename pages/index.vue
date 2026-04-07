<template>
  <div>
    <!-- Hero Section -->
    <section class="pt-12 md:pt-20 pb-16 md:pb-24 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          <span class="text-surface-900">Twitch Emote Resizer & GIF Optimizer</span>
        </h1>
        <p class="mt-4 md:mt-6 text-surface-500 text-base md:text-lg max-w-xl mx-auto">
          Search thousands of GIFs and resize them into emotes for Twitch, Discord, Kick, 7TV, and BTTV — free, in your browser.
        </p>

        <!-- Search Bar -->
        <div class="mt-8 max-w-lg mx-auto">
          <SearchBar
            v-model="searchQuery"
            size="lg"
            :autofocus="true"
            @search="handleSearch"
          />
        </div>

        <!-- CTA Buttons -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/search" class="btn btn-secondary">
            Search GIFs for Emotes
          </NuxtLink>
          <NuxtLink to="/optimizer" class="btn btn-primary">
            Resize a GIF for Twitch
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Trending Preview Section -->
    <section class="py-10 md:py-16 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg md:text-xl font-bold text-surface-900 flex items-center gap-2">
            <!-- Fire icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            Trending Now
          </h2>
          <NuxtLink to="/search" class="link text-sm">
            See All
          </NuxtLink>
        </div>

        <!-- Horizontal scroll strip with gradient fades -->
        <div class="relative">
          <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-50 to-transparent z-10 pointer-events-none" />
          <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-50 to-transparent z-10 pointer-events-none" />

          <div v-if="trendingLoading" class="flex gap-3 overflow-hidden">
            <div v-for="i in 8" :key="i" class="w-44 md:w-48 h-32 md:h-36 flex-shrink-0 rounded-xl bg-surface-200 animate-pulse" />
          </div>

          <div
            v-else
            ref="scrollRef"
            class="flex gap-3 overflow-x-auto no-scrollbar pb-2 cursor-grab select-none"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointerleave="onPointerUp"
          >
            <GifCard
              v-for="gif in trendingGifs"
              :key="gif.id"
              :gif="gif"
              variant="compact"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Platform Cards Section -->
    <section class="py-10 md:py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-lg md:text-xl font-bold text-surface-900 text-center mb-8">
          Emote Size Requirements by Platform
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <!-- Twitch -->
          <div class="card text-center">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="text-purple-500">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-surface-900">Twitch Emote Sizes</h3>
            <p class="text-xs text-surface-500 mt-1">Resize animated GIFs to 28px, 56px, and 112px for Twitch emotes. Compress to under 1 MB.</p>
            <p class="text-xs text-surface-400 mt-2">28, 56, 112px &middot; Up to 1 MB</p>
            <NuxtLink to="/optimizer" class="link text-sm mt-3 inline-block">Resize Twitch Emotes</NuxtLink>
          </div>

          <!-- Discord -->
          <div class="card text-center">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="text-indigo-500">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-surface-900">Discord Emoji Sizes</h3>
            <p class="text-xs text-surface-500 mt-1">Convert GIFs to 128px Discord emoji. Compress to under 256 KB.</p>
            <p class="text-xs text-surface-400 mt-2">128px &middot; Up to 256 KB</p>
            <NuxtLink to="/optimizer" class="link text-sm mt-3 inline-block">Resize Discord Emoji</NuxtLink>
          </div>

          <!-- Kick -->
          <div class="card text-center">
            <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="text-green-500">
                <path d="M2 2h6v6h2V6h2V4h2V2h6v6h-2v2h-2v4h2v2h2v6h-6v-2h-2v-2h-2v-2H8v6H2V2z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-surface-900">Kick Emote Sizes</h3>
            <p class="text-xs text-surface-500 mt-1">Optimize GIFs to 500px for Kick emotes. Compress to under 1 MB.</p>
            <p class="text-xs text-surface-400 mt-2">128px &middot; Up to 256 KB</p>
            <NuxtLink to="/optimizer" class="link text-sm mt-3 inline-block">Resize Kick Emotes</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-10 md:py-16 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-lg md:text-xl font-bold text-surface-900 text-center mb-10">
          How to Resize GIFs Into Emotes
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          <!-- Dashed connectors (desktop only) -->
          <div class="hidden md:block absolute top-10 left-[calc(33.33%+8px)] right-[calc(66.66%-8px)] border-t-2 border-dashed border-surface-300" />
          <div class="hidden md:block absolute top-10 left-[calc(66.66%+8px)] right-[calc(33.33%-8px)] border-t-2 border-dashed border-surface-300" />

          <!-- Step 1: Search -->
          <div class="text-center relative">
            <div class="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <IconSearch :size="28" class="text-primary-500" />
            </div>
            <h3 class="text-sm font-bold text-surface-900">1. Search for the Perfect GIF</h3>
            <p class="text-xs text-surface-500 mt-1">Find the perfect GIF from thousands of results</p>
          </div>

          <!-- Step 2: Optimize -->
          <div class="text-center relative">
            <div class="w-20 h-20 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <IconSparkle :size="28" class="text-accent-500" />
            </div>
            <h3 class="text-sm font-bold text-surface-900">2. Resize & Compress for Your Platform</h3>
            <p class="text-xs text-surface-500 mt-1">Resize and convert for your target platform</p>
          </div>

          <!-- Step 3: Download -->
          <div class="text-center relative">
            <div class="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <IconDownload :size="28" class="text-green-500" />
            </div>
            <h3 class="text-sm font-bold text-surface-900">3. Download All Required Sizes</h3>
            <p class="text-xs text-surface-500 mt-1">Get all required sizes in one click</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-10 md:py-16 px-4 pb-20 md:pb-16">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-lg md:text-xl font-bold text-surface-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div class="space-y-6">
          <div>
            <h3 class="text-sm font-bold text-surface-900">What size do Twitch emotes need to be?</h3>
            <p class="text-sm text-surface-500 mt-1">Twitch requires animated emotes as square GIFs between 112x112 and 4096x4096 pixels, under 1 MB. Twitch auto-resizes to 28x28, 56x56, and 112x112.</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-900">How do I compress a GIF for Twitch emotes?</h3>
            <p class="text-sm text-surface-500 mt-1">Upload your GIF to EmoteSizer, select Twitch as your platform, and click Optimize. Use Smart Compress if the file is too large.</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-900">What is the maximum file size for Discord emoji?</h3>
            <p class="text-sm text-surface-500 mt-1">Discord emoji must be 128x128px and under 256 KB for both static and animated.</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-900">Does EmoteSizer work with 7TV and BTTV?</h3>
            <p class="text-sm text-surface-500 mt-1">Yes. Use the Twitch animated emote preset for 7TV and BTTV compatibility.</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-900">Is EmoteSizer free?</h3>
            <p class="text-sm text-surface-500 mt-1">Yes, completely free. All processing happens in your browser — no account, no uploads to servers, no watermarks.</p>
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-900">Can I trim a GIF before converting to an emote?</h3>
            <p class="text-sm text-surface-500 mt-1">Yes. Use the Trim Animation slider to select which frames to keep, reducing file size.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { KlipyGif } from '~/types/klipy'

useHead({
  title: 'EmoteSizer — Free Twitch Emote Resizer & GIF Optimizer',
  meta: [
    { name: 'description', content: 'Resize and compress GIFs into emotes for Twitch, Discord, Kick, 7TV, and BTTV. Free browser-based emote resizer — no signup, no download required.' },
    { property: 'og:title', content: 'EmoteSizer — Free Twitch Emote Resizer & GIF Optimizer' },
    { property: 'og:description', content: 'Resize and compress GIFs into emotes for Twitch, Discord, Kick, 7TV, and BTTV. Free browser-based emote resizer.' },
    { property: 'og:url', content: 'https://emotesizer.com' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "EmoteSizer",
        "url": "https://emotesizer.com",
        "description": "Free browser-based tool to resize and compress GIFs into emotes for Twitch, Discord, Kick, 7TV, and BTTV.",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "Any (browser-based)",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "featureList": ["GIF search", "Twitch emote resizer", "Discord emoji resizer", "Kick emote optimizer", "Smart compression", "GIF trimmer", "No signup required"]
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What size do Twitch emotes need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Twitch requires animated emotes as square GIFs between 112x112 and 4096x4096 pixels, under 1 MB. Twitch auto-resizes to 28x28, 56x56, and 112x112." }},
          { "@type": "Question", "name": "How do I compress a GIF for Twitch emotes?", "acceptedAnswer": { "@type": "Answer", "text": "Upload your GIF to EmoteSizer, select Twitch as your platform, and click Optimize. Use Smart Compress if the file is too large." }},
          { "@type": "Question", "name": "What is the maximum file size for Discord emoji?", "acceptedAnswer": { "@type": "Answer", "text": "Discord emoji must be 128x128px and under 256 KB for both static and animated." }},
          { "@type": "Question", "name": "Does EmoteSizer work with 7TV and BTTV?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Use the Twitch animated emote preset for 7TV and BTTV compatibility." }},
          { "@type": "Question", "name": "Is EmoteSizer free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely free. All processing happens in your browser — no account, no uploads to servers, no watermarks." }},
          { "@type": "Question", "name": "Can I trim a GIF before converting to an emote?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Use the Trim Animation slider to select which frames to keep, reducing file size." }}
        ]
      }),
    },
  ],
})

const router = useRouter()
const { getTrending } = useKlipy()

const searchQuery = ref('')
const trendingGifs = ref<KlipyGif[]>([])
const trendingLoading = ref(true)

// --- Drag-to-scroll for the trending GIF strip ---
const scrollRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let dragStartX = 0
let dragScrollLeft = 0
let hasDragged = false

function onPointerDown(e: PointerEvent) {
  // Only enable drag-to-scroll for mouse; touch devices use native momentum scrolling
  if (e.pointerType !== 'mouse' || !scrollRef.value) return
  e.preventDefault() // Prevent native image drag from hijacking the pointer
  isDragging.value = true
  hasDragged = false
  dragStartX = e.pageX - scrollRef.value.offsetLeft
  dragScrollLeft = scrollRef.value.scrollLeft
  scrollRef.value.style.cursor = 'grabbing'
  scrollRef.value.style.userSelect = 'none'
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !scrollRef.value) return
  e.preventDefault()
  const x = e.pageX - scrollRef.value.offsetLeft
  // Mark as a real drag once the pointer moves more than 5px from the start
  if (Math.abs(x - dragStartX) > 5) hasDragged = true
  const walk = (x - dragStartX) * 1.5
  scrollRef.value.scrollLeft = dragScrollLeft - walk
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  if (scrollRef.value) {
    scrollRef.value.style.cursor = 'grab'
    scrollRef.value.style.removeProperty('user-select')
    // If the user dragged, suppress the next click so GIF cards aren't accidentally opened
    if (hasDragged) {
      scrollRef.value.addEventListener('click', preventClick, { capture: true, once: true })
    }
  }
}

function preventClick(e: Event) {
  e.stopPropagation()
  e.preventDefault()
}

function handleSearch(query: string) {
  if (query.trim()) {
    router.push({ path: '/search', query: { q: query.trim() } })
  }
}

onMounted(async () => {
  try {
    const response = await getTrending(1, 12)
    trendingGifs.value = response.data.data
  } catch (e: unknown) {
    if (import.meta.dev) console.error('Failed to load trending GIFs:', e)
    // Trending is non-critical, fail silently in production
  } finally {
    trendingLoading.value = false
  }
})
</script>
