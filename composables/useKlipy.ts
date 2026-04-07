import type { KlipyGif, KlipySearchResponse, KlipyCategoriesResponse, KlipyAutocompleteResponse, KlipyCategory } from '~/types/klipy'

export function useKlipy() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.klipyApiBaseUrl || 'https://api.klipy.com/api/v1'
  const appKey = config.public.klipyApiKey || ''

  // Warn developers if the API key is missing
  if (import.meta.dev && !appKey) {
    console.warn('[useKlipy] KLIPY_API_KEY is not configured. Set it via the KLIPY_API_KEY environment variable.')
  }

  // Generate a consistent customer_id per session
  const customerId = useState<string>('klipy-customer-id', () => {
    if (import.meta.client) {
      let id = sessionStorage.getItem('klipy_customer_id')
      if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem('klipy_customer_id', id)
      }
      return id
    }
    return crypto.randomUUID()
  })

  /** Guards against making API calls without a configured key */
  function assertApiKey(): void {
    if (!appKey) {
      throw new Error(
        'KLIPY API key is not configured. Please set the KLIPY_API_KEY environment variable and restart the server.'
      )
    }
  }

  async function searchGifs(
    query: string,
    page = 1,
    perPage = 24,
    options?: { signal?: AbortSignal }
  ): Promise<KlipySearchResponse> {
    assertApiKey()
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      per_page: String(perPage),
      customer_id: customerId.value,
      content_filter: 'medium',
    })
    const response = await $fetch<KlipySearchResponse>(
      `${baseUrl}/${appKey}/gifs/search?${params}`,
      { signal: options?.signal }
    )
    return response
  }

  async function getTrending(
    page = 1,
    perPage = 24,
    options?: { signal?: AbortSignal }
  ): Promise<KlipySearchResponse> {
    assertApiKey()
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      customer_id: customerId.value,
      content_filter: 'medium',
    })
    const response = await $fetch<KlipySearchResponse>(
      `${baseUrl}/${appKey}/gifs/trending?${params}`,
      { signal: options?.signal }
    )
    return response
  }

  async function getCategories(): Promise<KlipyCategory[]> {
    assertApiKey()
    const response = await $fetch<KlipyCategoriesResponse>(
      `${baseUrl}/${appKey}/gifs/categories?customer_id=${customerId.value}`
    )
    return response.data
  }

  async function getAutocomplete(query: string): Promise<string[]> {
    if (!query || query.length < 2) return []
    assertApiKey()
    const response = await $fetch<KlipyAutocompleteResponse>(
      `${baseUrl}/${appKey}/autocomplete/${encodeURIComponent(query)}?customer_id=${customerId.value}`
    )
    return response.data
  }

  async function shareGif(slug: string): Promise<void> {
    assertApiKey()
    await $fetch(`${baseUrl}/${appKey}/gifs/share/${slug}`, {
      method: 'POST',
      body: { customer_id: customerId.value },
    })
  }

  return { searchGifs, getTrending, getCategories, getAutocomplete, shareGif }
}
