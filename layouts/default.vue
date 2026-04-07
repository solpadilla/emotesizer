<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Top Navigation -->
    <AppNav />

    <!-- Main Content -->
    <main class="pb-20 md:pb-0">
      <slot />
    </main>

    <!-- Bottom Tab Bar (mobile only) -->
    <AppBottomBar />

    <!-- Toast Notifications -->
    <ToastNotification />

    <!-- Footer -->
    <footer class="border-t border-surface-200/50 py-8 pb-24 md:pb-8">
      <div class="max-w-5xl mx-auto px-4 text-center">
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-surface-400 mb-4">
          <NuxtLink to="/" class="hover:text-surface-600 transition-colors">Emote Resizer</NuxtLink>
          <NuxtLink to="/search" class="hover:text-surface-600 transition-colors">Search GIFs</NuxtLink>
          <NuxtLink to="/optimizer" class="hover:text-surface-600 transition-colors">GIF Optimizer</NuxtLink>
          <NuxtLink to="/about" class="hover:text-surface-600 transition-colors">About</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-surface-600 transition-colors">Privacy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-surface-600 transition-colors">Terms</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-surface-600 transition-colors">Contact</NuxtLink>
        </div>
        <p class="text-xs text-surface-400">
          <span class="font-semibold">EmoteSizer</span> — Free emote resizer for Twitch, Discord, and Kick.
          Not affiliated with Twitch, Discord, or Kick.
        </p>
      </div>
    </footer>
  </div>
</template>
