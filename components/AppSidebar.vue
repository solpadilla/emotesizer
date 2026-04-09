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

    <!-- Scrollable Tools Section -->
    <div class="overflow-y-auto flex-1 no-scrollbar mt-4">
      <!-- Category Accordions -->
      <div v-for="category in activeCategories" :key="category.key" class="mb-1">
        <!-- Category Header -->
        <button
          class="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[11px] uppercase tracking-wide font-semibold text-surface-400 hover:text-surface-600 hover:bg-surface-200/30 transition-colors"
          :aria-expanded="expandedCategory === category.key"
          @click="toggleCategory(category.key)"
        >
          <IconChevronRight
            :size="12"
            class="transition-transform duration-200 flex-shrink-0"
            :class="{ 'rotate-90': expandedCategory === category.key }"
          />
          <span class="flex-1 text-left">{{ category.label }}</span>
          <span class="text-[10px] bg-surface-200/50 text-surface-400 rounded-full px-1.5 min-w-[20px] text-center font-normal normal-case tracking-normal">
            {{ category.tools.length }}
          </span>
        </button>

        <!-- Collapsible Tool Links -->
        <div
          class="overflow-hidden transition-all duration-200 ease-in-out"
          :style="{ maxHeight: expandedCategory === category.key ? (category.tools.length * 44 + 8) + 'px' : '0px' }"
        >
          <div class="pt-1 pb-1">
            <NuxtLink
              v-for="tool in category.tools"
              :key="tool.to"
              :to="tool.to"
              class="relative h-10 pl-7 pr-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors"
              :class="isToolActive(tool.to)
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-surface-500 hover:bg-surface-200/50 hover:text-surface-700'"
            >
              <!-- Active accent pill -->
              <span
                v-if="isToolActive(tool.to)"
                class="absolute left-0 w-[3px] h-5 bg-primary-500 rounded-full"
              />
              <component :is="iconMap[tool.icon]" :size="18" />
              {{ tool.label }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- All Tools Link -->
      <NuxtLink
        to="/tools"
        class="flex items-center gap-2 px-3 h-11 rounded-xl text-sm transition-colors mt-2"
        :class="route.path === '/tools'
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-surface-400 hover:text-primary-500 hover:bg-primary-500/5'"
      >
        <IconGrid :size="18" />
        <span>All Tools</span>
      </NuxtLink>
    </div>

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
const { activeCategories } = useToolsNav()

// Pre-resolve all icon components used in the tools nav so that dynamic
// `<component :is="...">` lookups work correctly. Nuxt tree-shakes
// auto-imported components that aren't statically referenced, so calling
// resolveComponent() with a runtime string in the template fails.
// Resolving them here during setup keeps them in the registry.
const iconMap: Record<string, ReturnType<typeof resolveComponent>> = {
  IconScissors: resolveComponent('IconScissors'),
  IconResize: resolveComponent('IconResize'),
  IconCrop: resolveComponent('IconCrop'),
  IconRotate: resolveComponent('IconRotate'),
  IconGauge: resolveComponent('IconGauge'),
  IconReverse: resolveComponent('IconReverse'),
  IconLoop: resolveComponent('IconLoop'),
  IconFrame: resolveComponent('IconFrame'),
  IconCompress: resolveComponent('IconCompress'),
}

const expandedCategory = ref<string | null>(null)

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

const secondaryNav = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/contact', label: 'Contact' },
]

/** Check if a tool route is currently active */
function isToolActive(toolPath: string): boolean {
  return route.path === toolPath || route.path.startsWith(toolPath + '/')
}

/** Find which category contains the current route */
function findCategoryForRoute(path: string): string | null {
  for (const cat of activeCategories.value) {
    if (cat.tools.some(t => path === t.to || path.startsWith(t.to + '/'))) {
      return cat.key
    }
  }
  return null
}

/** Toggle a category open/closed */
function toggleCategory(key: string) {
  expandedCategory.value = expandedCategory.value === key ? null : key
}

// Auto-expand the category containing the current tool page
watch(() => route.path, (path) => {
  const cat = findCategoryForRoute(path)
  if (cat) expandedCategory.value = cat
}, { immediate: true })
</script>
