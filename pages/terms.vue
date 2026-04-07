<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900 mb-2">
      Terms of Service
    </h1>
    <p class="text-xs text-surface-400 mb-8">Last updated: April 2026</p>

    <p class="text-sm text-surface-600 leading-relaxed mb-8">
      By using EmoteSizer, you agree to these terms.
    </p>

    <!-- Use of Service -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Use of Service</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>EmoteSizer is a free browser-based tool for searching GIFs/stickers and resizing them as emotes</li>
      <li>You may use the service for personal and commercial purposes (e.g., creating Twitch emotes)</li>
      <li>You are responsible for ensuring you have the right to use any images you download or optimize</li>
    </ul>

    <!-- Content & Copyright -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Content &amp; Copyright</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>GIFs and stickers are provided by KLIPY and are subject to their terms and content policies</li>
      <li>EmoteSizer does not claim ownership of any images processed through our tool</li>
      <li>You are responsible for complying with platform-specific terms (Twitch, Discord, Kick) when uploading emotes</li>
      <li>If you believe content infringes your copyright, please contact us</li>
    </ul>

    <!-- Disclaimer -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Disclaimer</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>EmoteSizer is provided "as is" without warranties of any kind</li>
      <li>We are not responsible for any issues arising from the use of emotes created with our tool</li>
      <li>Platform requirements (sizes, file limits) may change — we strive to keep our tool updated but cannot guarantee accuracy</li>
    </ul>

    <!-- Limitation of Liability -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Limitation of Liability</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>EmoteSizer shall not be liable for any damages arising from use of the service</li>
      <li>All image processing occurs locally in your browser — we have no access to your files</li>
    </ul>

    <!-- Changes -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Changes</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>We reserve the right to modify these terms at any time</li>
      <li>Continued use of the service constitutes acceptance of updated terms</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Terms of Service — EmoteSizer',
  meta: [
    { name: 'description', content: 'EmoteSizer terms of service — free browser-based emote maker for Twitch, Discord, and Kick. No warranties, no data collection.' },
    { property: 'og:title', content: 'Terms of Service — EmoteSizer' },
    { property: 'og:description', content: 'Terms of service for EmoteSizer — the free emote maker for streamers.' },
    { property: 'og:url', content: 'https://emotesizer.com/terms' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/terms' }],
})
</script>
