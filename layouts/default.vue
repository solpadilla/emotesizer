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
    <footer class="lg:ml-[240px] border-t border-surface-200/50 py-10 pb-24 lg:pb-10">
      <div class="max-w-5xl mx-auto px-4">
        <!--
          Three-column footer: brand blurb, popular tools, and company
          links. The explicit Tools and Company columns help both humans
          (reach every important page in one click) and search engines
          (clear internal linking to editorial hubs from every page).
        -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <!-- Brand blurb -->
          <div class="sm:col-span-2 md:col-span-1">
            <p class="text-sm font-bold text-surface-900 mb-2">EmoteSizer</p>
            <p class="text-xs text-surface-500 leading-relaxed">
              Free browser-based GIF and emote tools for streamers. Search, resize, compress, and convert — all in your browser, no signup, no watermark.
            </p>
          </div>

          <!-- Tools column -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Tools</p>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/tools/compress" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Compressor</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/resize" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Resizer</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/crop" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Cropper</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/trim" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Trimmer</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/speed" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Speed</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/reverse" class="text-surface-600 hover:text-surface-900 transition-colors">GIF Reverser</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/gif-to-png" class="text-surface-600 hover:text-surface-900 transition-colors">GIF to PNG</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools" class="text-primary-500 hover:underline">All tools &rarr;</NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company column -->
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Company</p>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/about" class="text-surface-600 hover:text-surface-900 transition-colors">About</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-surface-600 hover:text-surface-900 transition-colors">Contact</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/privacy" class="text-surface-600 hover:text-surface-900 transition-colors">Privacy</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms" class="text-surface-600 hover:text-surface-900 transition-colors">Terms</NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom fineprint row -->
        <div class="pt-6 border-t border-surface-200/50 text-center">
          <p class="text-xs text-surface-400">
            <span class="font-semibold">EmoteSizer</span> — Free emote resizer for Twitch, Discord, and Kick.
            Not affiliated with Twitch, Discord, or Kick.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
