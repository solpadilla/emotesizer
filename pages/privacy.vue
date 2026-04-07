<template>
  <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900 mb-2">
      Privacy Policy
    </h1>
    <p class="text-xs text-surface-400 mb-8">Last updated: April 2026</p>

    <p class="text-sm text-surface-600 leading-relaxed mb-8">
      EmoteSizer ("we", "us", "our") operates emotesizer.com. This page explains how we handle your information.
    </p>

    <!-- Information We Collect -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Information We Collect</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>We do not require registration or collect personal information</li>
      <li>All GIF/image processing happens in your browser — files are never uploaded to our servers</li>
      <li>We use KLIPY's API for GIF/sticker search, which may collect anonymous usage data per their privacy policy</li>
      <li>We use Google AdSense for advertising, which uses cookies to serve relevant ads</li>
    </ul>

    <!-- Cookies & Third-Party Services -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Cookies &amp; Third-Party Services</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>Google AdSense may use cookies to personalize ads based on your browsing history</li>
      <li>KLIPY generates an anonymous session ID stored in your browser's sessionStorage</li>
      <li>We use Google Search Console to understand how users find our site</li>
      <li>No personally identifiable information is collected or stored by EmoteSizer</li>
    </ul>

    <!-- Your Data -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Your Data</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>All image processing is client-side (in your browser)</li>
      <li>We do not store, transmit, or have access to any images you upload or optimize</li>
      <li>Theme preferences are stored locally in your browser's localStorage</li>
    </ul>

    <!-- Third-Party Links -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Third-Party Links</h2>
    <ul class="space-y-2 text-sm text-surface-600 leading-relaxed list-disc list-inside">
      <li>Our service links to external platforms (Twitch, Discord, Kick)</li>
      <li>We are not responsible for the privacy practices of these platforms</li>
    </ul>

    <!-- Contact -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Contact</h2>
    <p class="text-sm text-surface-600 leading-relaxed">
      For privacy questions, visit our
      <NuxtLink to="/contact" class="link">Contact page</NuxtLink>.
    </p>

    <!-- Changes -->
    <h2 class="text-lg font-bold text-surface-900 mt-8 mb-3">Changes</h2>
    <p class="text-sm text-surface-600 leading-relaxed">
      We may update this policy. Changes will be posted on this page with an updated date.
    </p>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy — EmoteSizer',
  meta: [
    { name: 'description', content: 'EmoteSizer privacy policy — learn how we handle your data. All image processing is browser-based. No personal information collected.' },
    { property: 'og:title', content: 'Privacy Policy — EmoteSizer' },
    { property: 'og:description', content: 'EmoteSizer privacy policy — learn how we handle your data. All processing is browser-based.' },
    { property: 'og:url', content: 'https://emotesizer.com/privacy' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/privacy' }],
})
</script>
