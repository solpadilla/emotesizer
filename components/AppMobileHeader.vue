<template>
  <header class="lg:hidden sticky top-0 z-40 glass-surface border-b border-surface-200/50">
    <div class="h-14 flex justify-between items-center px-4">
      <!-- Brand -->
      <NuxtLink to="/" class="flex items-center gap-1">
        <span class="text-xl font-extrabold tracking-tight">
          <span class="text-primary-500">Emote</span><span class="text-accent-500">Sizer</span>
        </span>
      </NuxtLink>

      <!-- Theme Toggle -->
      <button
        class="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center"
        aria-label="Toggle theme"
        @click="cycleTheme"
      >
        <IconSun v-if="isDark" />
        <IconMoon v-else />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const { isDark, cycleTheme } = useTheme()
</script>
