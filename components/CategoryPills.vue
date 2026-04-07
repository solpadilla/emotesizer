<template>
  <div class="overflow-x-auto no-scrollbar flex gap-2" style="scroll-snap-type: x mandatory;">
    <!-- "All" pill is always first -->
    <button
      class="pill"
      :class="{ 'pill-active': !modelValue }"
      style="scroll-snap-align: start;"
      @click="emit('update:modelValue', null)"
    >
      All
    </button>

    <button
      v-for="category in categories"
      :key="category.slug"
      class="pill"
      :class="{ 'pill-active': modelValue === category.slug }"
      style="scroll-snap-align: start;"
      @click="emit('update:modelValue', category.slug)"
    >
      {{ category.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { KlipyCategory } from '~/types/klipy'

defineProps<{
  categories: KlipyCategory[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()
</script>
