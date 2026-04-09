<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <h1 class="page-title">GIF Tools</h1>
    <p class="page-subtitle mt-1">Free online tools to edit, convert, and optimize animated GIFs</p>

    <div v-for="category in activeCategories" :key="category.key" class="mt-8 first:mt-6">
      <h2 class="text-sm font-bold text-surface-900 flex items-center gap-2 mb-3">
        <component :is="iconMap[category.icon]" :size="16" class="text-primary-500" />
        {{ category.label }}
        <span class="text-[10px] bg-surface-200/50 text-surface-400 rounded-full px-1.5 min-w-[20px] text-center">
          {{ category.tools.length }}
        </span>
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <NuxtLink
          v-for="tool in category.tools"
          :key="tool.to"
          :to="tool.to"
          class="card p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">
            <component :is="iconMap[tool.icon]" :size="20" class="text-primary-500" />
          </div>
          <p class="text-sm font-bold text-surface-900">{{ tool.label }}</p>
          <p class="text-xs text-surface-500 mt-1">{{ tool.description }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { activeCategories } = useToolsNav()

// Pre-resolve all icon components used in the tools nav so that dynamic
// `<component :is="...">` lookups work correctly. Nuxt tree-shakes
// auto-imported components that aren't statically referenced, so calling
// resolveComponent() with a runtime string in the template fails.
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

useHead({
  title: 'GIF Tools — Free Online GIF Editor Suite | EmoteSizer',
  meta: [
    {
      name: 'description',
      content: 'Free online GIF tools — trim, resize, crop, rotate, compress, change speed, reverse, and convert animated GIFs. No upload limits, no watermarks.',
    },
  ],
  link: [
    { rel: 'canonical', href: 'https://emotesizer.com/tools' },
  ],
})
</script>
