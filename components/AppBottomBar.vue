<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-surface border-t border-surface-200/50">
    <nav class="grid grid-cols-3 h-16 pb-[env(safe-area-inset-bottom)]">
      <!-- Home -->
      <NuxtLink
        to="/"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="route.path === '/' ? 'text-primary-500' : 'text-surface-400'"
        aria-label="Home"
        title="EmoteSizer home"
      >
        <IconHome />
        <span class="text-[10px] font-medium">Home</span>
      </NuxtLink>

      <!-- Search -->
      <NuxtLink
        to="/search"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="route.path === '/search' ? 'text-primary-500' : 'text-surface-400'"
        aria-label="Search"
        title="Search GIFs for emotes"
      >
        <IconSearch />
        <span class="text-[10px] font-medium">Search</span>
      </NuxtLink>

      <!-- Optimize -->
      <NuxtLink
        to="/optimizer"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="route.path === '/optimizer' ? 'text-primary-500' : 'text-surface-400'"
        aria-label="Optimize"
        title="Resize GIFs for emotes"
      >
        <IconSparkle />
        <span class="text-[10px] font-medium">Optimize</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
