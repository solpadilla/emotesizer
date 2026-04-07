<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center p-4">
    <div class="text-center max-w-md">
      <div class="text-6xl mb-4">&#x1F635;</div>
      <h1 class="text-2xl font-bold text-surface-900 mb-2">Something went wrong</h1>
      <p class="text-surface-500 mb-6">{{ error?.message || 'An unexpected error occurred.' }}</p>
      <button class="btn btn-primary" @click="handleError">Go Home</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: any }>()

function handleError() {
  clearError({ redirect: '/' })
}
</script>
