<template>
  <header class="sticky top-0 z-40 glass-surface border-b border-surface-200/50">
    <div class="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex justify-between items-center">
      <!-- Brand -->
      <NuxtLink to="/" class="flex items-center gap-1">
        <span class="text-xl font-extrabold tracking-tight">
          <span class="text-primary-500">Emote</span><span class="text-accent-500">Sizer</span>
        </span>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-1">
        <NuxtLink
          to="/search"
          title="Search GIFs for emotes"
          class="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="isActiveRoute('/search') ? 'text-primary-500' : 'text-surface-500 hover:text-surface-700'"
        >
          Search
          <span
            v-if="isActiveRoute('/search')"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary-500"
          />
        </NuxtLink>
        <NuxtLink
          to="/optimizer"
          title="Resize and optimize GIFs"
          class="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="isActiveRoute('/optimizer') ? 'text-primary-500' : 'text-surface-500 hover:text-surface-700'"
        >
          Optimize
          <span
            v-if="isActiveRoute('/optimizer')"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary-500"
          />
        </NuxtLink>
      </nav>

      <!-- Theme Toggle -->
      <button class="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center" aria-label="Toggle theme" @click="cycleTheme">
        <!-- Sun icon (shown in dark mode) -->
        <IconSun v-if="isDark" />
        <!-- Moon icon (shown in light mode) -->
        <IconMoon v-else />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const { isDark, cycleTheme } = useTheme()

function isActiveRoute(path: string): boolean {
  return route.path === path
}
</script>
