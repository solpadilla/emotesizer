<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900 mb-4">
      About EmoteSizer
    </h1>
    <p class="text-sm text-surface-600 leading-relaxed mb-10">
      EmoteSizer is a free, browser-based emote maker built for streamers and content creators. We help you find the perfect GIF or sticker and resize it into an emote for Twitch, Discord, Kick, 7TV, BTTV, and FFZ — all without signing up or installing anything.
    </p>

    <!-- What We Do -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-6">What We Do</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Feature 1: Search -->
      <div class="card text-center">
        <div class="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-500">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-surface-900 mb-1">Search GIFs &amp; Stickers</h3>
        <p class="text-xs text-surface-500 mt-1">
          Search thousands of GIFs and stickers powered by KLIPY. Browse trending content, filter by categories, and discover the perfect animation for your emote.
        </p>
      </div>

      <!-- Feature 2: Optimize -->
      <div class="card text-center">
        <div class="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-500">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-surface-900 mb-1">Smart Emote Optimizer</h3>
        <p class="text-xs text-surface-500 mt-1">
          Upload any GIF or image and our optimizer automatically resizes it to meet platform requirements. Choose between fill &amp; crop, fit &amp; pad, or stretch modes. Trim animations, pick specific frames, and compress to fit file size limits.
        </p>
      </div>

      <!-- Feature 3: Download -->
      <div class="card text-center">
        <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-surface-900 mb-1">Platform-Ready Downloads</h3>
        <p class="text-xs text-surface-500 mt-1">
          Get your emotes sized and formatted for Twitch (28/56/112px), Discord (128px), Kick (500px), and more. Our Smart Compress feature automatically reduces file size while preserving quality.
        </p>
      </div>
    </div>

    <!-- Why EmoteSizer -->
    <h2 class="text-lg font-bold text-surface-900 mt-12 mb-4">Why EmoteSizer?</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="flex items-start gap-3 text-sm text-surface-600">
        <div class="w-6 h-6 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span><strong class="text-surface-900">100% free</strong> — no signup, no watermarks, no limits</span>
      </div>
      <div class="flex items-start gap-3 text-sm text-surface-600">
        <div class="w-6 h-6 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span><strong class="text-surface-900">Private</strong> — all processing happens in your browser, files never leave your device</span>
      </div>
      <div class="flex items-start gap-3 text-sm text-surface-600">
        <div class="w-6 h-6 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span><strong class="text-surface-900">Fast</strong> — resize and compress in seconds, not minutes</span>
      </div>
      <div class="flex items-start gap-3 text-sm text-surface-600">
        <div class="w-6 h-6 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-success-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span><strong class="text-surface-900">Multi-platform</strong> — supports Twitch, Discord, Kick, 7TV, BTTV, and FFZ</span>
      </div>
    </div>

    <!-- Built for the Streaming Community -->
    <h2 class="text-lg font-bold text-surface-900 mt-12 mb-3">Built for the Streaming Community</h2>
    <p class="text-sm text-surface-600 leading-relaxed mb-4">
      EmoteSizer was created because existing emote tools were either too basic, too expensive, or didn't combine GIF discovery with optimization. We wanted a single tool where streamers could find a GIF, resize it, and have it ready to upload — all in one flow.
    </p>
    <p class="text-sm text-surface-600 leading-relaxed">
      Whether you're a Twitch Affiliate uploading your first emote or a Partner managing hundreds, EmoteSizer has you covered.
    </p>

    <!-- CTA -->
    <div class="mt-10 flex flex-col sm:flex-row gap-3">
      <NuxtLink to="/search" class="btn btn-secondary">
        Browse GIFs &amp; Stickers
      </NuxtLink>
      <NuxtLink to="/optimizer" class="btn btn-primary">
        Open Emote Optimizer
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About EmoteSizer — Free Emote Maker for Streamers',
  meta: [
    { name: 'description', content: 'EmoteSizer is a free, browser-based emote maker for Twitch, Discord, Kick, 7TV, BTTV, and FFZ. Search GIFs, resize emotes, and compress — all in one tool. No signup required.' },
    { property: 'og:title', content: 'About EmoteSizer — Free Emote Maker for Streamers' },
    { property: 'og:description', content: 'Free emote maker for streamers — search GIFs, resize emotes, and compress for Twitch, Discord, Kick, and more.' },
    { property: 'og:url', content: 'https://emotesizer.com/about' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/about' }],
})
</script>
