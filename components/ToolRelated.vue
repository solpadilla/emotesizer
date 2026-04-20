<!--
  ToolRelated.vue — compact "you might also like" card grid that appears at
  the bottom of each individual tool page (above the SEO editorial section).

  The styling matches the tool cards on pages/tools/index.vue so the user
  gets visual continuity between the tool index and per-tool pages. The
  `current` prop lets each consuming page drop itself from the list
  without every consumer having to filter by hand.
-->
<template>
  <section v-if="visibleTools.length" class="mt-12 max-w-7xl mx-auto">
    <h2 class="text-sm font-bold text-surface-900 mb-3">Related Tools</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <NuxtLink
        v-for="tool in visibleTools"
        :key="tool.to"
        :to="tool.to"
        class="card p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer"
      >
        <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">
          <component
            :is="iconMap[tool.icon]"
            :size="20"
            class="text-primary-500"
          />
        </div>
        <p class="text-sm font-bold text-surface-900">{{ tool.label }}</p>
        <p class="text-xs text-surface-500 mt-1">{{ tool.description }}</p>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
interface RelatedTool {
  to: string
  label: string
  description: string
  icon: string
}

const props = defineProps<{
  /**
   * Slug (path) of the current tool page. If provided, any entry in
   * `tools` with a matching `to` value is filtered out so the user isn't
   * shown a link back to the page they're already on.
   */
  current?: string
  tools: RelatedTool[]
}>()

// Pre-resolve icon components — Nuxt tree-shakes auto-imported components
// that are only referenced dynamically via resolveComponent(), so every
// icon we might render must be listed here explicitly to survive the
// production build.
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
  IconVideo: resolveComponent('IconVideo'),
  IconText: resolveComponent('IconText'),
}

const visibleTools = computed(() =>
  props.tools.filter(t => t.to !== props.current),
)
</script>
