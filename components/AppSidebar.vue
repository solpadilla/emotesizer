<template>
  <aside
    class="hidden lg:flex fixed top-0 left-0 bottom-0 w-[240px] z-40 glass-surface border-r border-surface-200/50 px-4 py-6 flex-col h-full"
  >
    <!-- Brand -->
    <NuxtLink to="/" class="flex items-center gap-1 px-3">
      <span class="text-xl font-extrabold tracking-tight">
        <span class="text-primary-500">Emote</span><span class="text-accent-500">Sizer</span>
      </span>
    </NuxtLink>

    <!-- Tagline -->
    <p class="text-[11px] text-surface-400 uppercase tracking-wide px-3 mt-1">
      Emote tools for streamers
    </p>

    <!-- Separator -->
    <div class="border-b border-surface-200/30 my-4" />

    <!-- Primary Navigation -->
    <nav class="space-y-1">
      <NuxtLink
        v-for="item in primaryNav"
        :key="item.to"
        :to="item.to"
        class="relative h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors"
        :class="item.isActive
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-surface-500 hover:bg-surface-200/50 hover:text-surface-700'"
      >
        <!-- Active accent pill -->
        <span
          v-if="item.isActive"
          class="absolute left-0 w-[3px] h-5 bg-primary-500 rounded-full"
        />
        <component :is="item.icon" :size="20" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Tools Category -->
    <div class="mt-6">
      <h3 class="text-[11px] text-surface-400 uppercase tracking-wide font-medium px-3 mb-2">Tools</h3>
      <nav class="space-y-1">
        <NuxtLink
          v-for="item in toolsNav"
          :key="item.to"
          :to="item.to"
          class="relative h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors"
          :class="item.isActive
            ? 'bg-primary-500/10 text-primary-500'
            : 'text-surface-500 hover:bg-surface-200/50 hover:text-surface-700'"
        >
          <!-- Active accent pill -->
          <span
            v-if="item.isActive"
            class="absolute left-0 w-[3px] h-5 bg-primary-500 rounded-full"
          />
          <component :is="item.icon" :size="20" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Secondary Links -->
    <nav class="space-y-0.5">
      <NuxtLink
        v-for="link in secondaryNav"
        :key="link.to"
        :to="link.to"
        class="block h-9 px-3 rounded-lg flex items-center text-xs font-medium text-surface-400 hover:text-surface-600 hover:bg-surface-200/50 transition-colors"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <!-- Separator -->
    <div class="border-t border-surface-200/30 my-4" />

    <!-- Theme Toggle -->
    <button
      class="h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-medium text-surface-500 hover:bg-surface-200/50 hover:text-surface-700 transition-colors w-full"
      aria-label="Toggle theme"
      @click="cycleTheme"
    >
      <IconSun v-if="isDark" :size="20" />
      <IconMoon v-else :size="20" />
      {{ isDark ? 'Light' : 'Dark' }}
    </button>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { isDark, cycleTheme } = useTheme()

const primaryNav = computed(() => [
  {
    to: '/',
    label: 'Home',
    icon: resolveComponent('IconHome'),
    isActive: route.path === '/',
  },
  {
    to: '/search',
    label: 'Search',
    icon: resolveComponent('IconSearch'),
    isActive: route.path === '/search' || route.path.startsWith('/gifs/') || route.path.startsWith('/stickers/'),
  },
  {
    to: '/optimizer',
    label: 'Optimize',
    icon: resolveComponent('IconSparkle'),
    isActive: route.path === '/optimizer',
  },
])

const toolsNav = computed(() => [
  {
    to: '/tools/trim',
    label: 'GIF Trim',
    icon: resolveComponent('IconScissors'),
    isActive: route.path === '/tools/trim',
  },
  {
    to: '/tools/resize',
    label: 'GIF Resize',
    icon: resolveComponent('IconResize'),
    isActive: route.path === '/tools/resize',
  },
  {
    to: '/tools/compress',
    label: 'GIF Compress',
    icon: resolveComponent('IconCompress'),
    isActive: route.path === '/tools/compress',
  },
  {
    to: '/tools/gif-to-png',
    label: 'GIF to PNG',
    icon: resolveComponent('IconFrame'),
    isActive: route.path === '/tools/gif-to-png',
  },
  {
    to: '/tools/speed',
    label: 'GIF Speed',
    icon: resolveComponent('IconGauge'),
    isActive: route.path === '/tools/speed',
  },
  {
    to: '/tools/reverse',
    label: 'GIF Reverse',
    icon: resolveComponent('IconReverse'),
    isActive: route.path === '/tools/reverse',
  },
])

const secondaryNav = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
]
</script>
