<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Desktop Sidebar -->
    <AppSidebar />

    <!-- Mobile Top Bar -->
    <AppMobileHeader />

    <!-- Main Content -->
    <main class="pb-20 lg:pb-0 lg:ml-[240px]">
      <slot />
    </main>

    <!-- Mobile Bottom Bar -->
    <AppBottomBar />

    <!-- Toast Notifications -->
    <ToastNotification />

    <!-- Footer -->
    <footer class="lg:ml-[240px] border-t border-surface-200/50 py-8 pb-24 lg:pb-8">
      <div class="max-w-5xl mx-auto px-4 text-center">
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-surface-400 mb-4">
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
