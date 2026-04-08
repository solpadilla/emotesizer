import { defineStore } from 'pinia'
import type { KlipyItem, KlipyCategory } from '~/types/klipy'

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const gifs = ref<KlipyItem[]>([])
  const categories = ref<KlipyCategory[]>([])
  const selectedCategory = ref<string | null>(null)
  const currentPage = ref(1)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isPageTransitioning = ref(false)
  const error = ref<string | null>(null)
  const contentType = ref<'gifs' | 'stickers'>('gifs')

  function reset() {
    gifs.value = []
    currentPage.value = 1
    hasMore.value = true
    error.value = null
    // Intentionally not resetting contentType — preserve the user's selection across searches
  }

  return {
    query, gifs, categories, selectedCategory,
    currentPage, hasMore, isLoading, isPageTransitioning, error,
    contentType,
    reset,
  }
})
