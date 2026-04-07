<template>
  <div class="space-y-2">
    <div
      v-for="platform in platforms"
      :key="platform.id"
      class="platform-card"
      :class="{
        'platform-card-active': modelValue === platform.id,
        'opacity-50 pointer-events-none cursor-not-allowed': isDisabled(platform.id),
      }"
      @click="selectPlatform(platform.id)"
    >
      <div class="flex items-start gap-3">
        <!-- Platform icon -->
        <div class="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <!-- Twitch -->
          <svg v-if="platform.icon === 'twitch'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-purple-500">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          <!-- Discord -->
          <svg v-else-if="platform.icon === 'discord'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-indigo-500">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
          </svg>
          <!-- Kick -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-green-500">
            <path d="M2 2h6v6h2V6h2V4h2V2h6v6h-2v2h-2v4h2v2h2v6h-6v-2h-2v-2h-2v-2H8v6H2V2z"/>
          </svg>
        </div>

        <!-- Platform info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-semibold text-surface-900 truncate">{{ platform.name }}</h4>
            <!-- Checkmark for selected -->
            <svg
              v-if="modelValue === platform.id"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-primary-500 flex-shrink-0"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span class="text-xs text-surface-500">
              {{ platform.sizesLabel || platform.sizes.map(s => `${s}px`).join(', ') }}
            </span>
            <span class="text-xs text-surface-400">|</span>
            <span class="text-xs text-surface-500">{{ platform.maxFileSize }}</span>
            <span class="text-xs text-surface-400">|</span>
            <span class="text-xs text-surface-500">{{ platform.format }}</span>
            <template v-if="platform.maxFrames !== null">
              <span class="text-xs text-surface-400">|</span>
              <span class="text-xs text-surface-500">Max {{ platform.maxFrames }} frames</span>
            </template>
          </div>
          <p v-if="platform.description" class="text-[11px] text-surface-400 mt-1 leading-snug">
            {{ platform.description }}
          </p>
          <p v-if="isDisabled(platform.id)" class="text-xs text-surface-400 mt-1">
            Requires GIF
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { platforms } from '~/config/platforms'

const props = withDefaults(defineProps<{
  modelValue: string
  disabledPlatforms?: string[]
}>(), {
  disabledPlatforms: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** Whether a given platform ID is currently disabled */
function isDisabled(platformId: string): boolean {
  return props.disabledPlatforms.includes(platformId)
}

/** Select a platform, but only if it's not disabled */
function selectPlatform(platformId: string) {
  if (isDisabled(platformId)) return
  emit('update:modelValue', platformId)
}

/**
 * When the disabled list changes and the currently selected platform
 * becomes disabled, auto-switch to the first enabled platform.
 */
watch(() => props.disabledPlatforms, (disabled) => {
  if (disabled.includes(props.modelValue)) {
    const firstEnabled = platforms.find(p => !disabled.includes(p.id))
    if (firstEnabled) {
      emit('update:modelValue', firstEnabled.id)
    }
  }
})

// Expose platforms so parent components can look up the selected platform
defineExpose({ platforms })
</script>
