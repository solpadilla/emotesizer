import type { KlipyGif, KlipySearchResponse, KlipyCategoriesResponse, KlipyAutocompleteResponse, KlipyCategory } from '~/types/klipy'

// Klipy only serves ads to mobile devices, so a mobile User-Agent is required
const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'

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

  type ContentType = 'gifs' | 'stickers'

  async function search(
    type: ContentType,
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
    // Ad params — Klipy only serves ads on page 1
    if (page === 1) {
      params.set('ad-min-width', '200')
      params.set('ad-max-width', '400')
      params.set('ad-min-height', '150')
      params.set('ad-max-height', '300')
    }
    const response = await $fetch<KlipySearchResponse>(
      `${baseUrl}/${appKey}/${type}/search?${params}`,
      {
        signal: options?.signal,
        headers: { 'User-Agent': MOBILE_USER_AGENT },
      }
    )
    return response
  }

  async function trending(
    type: ContentType,
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
    // Ad params — Klipy only serves ads on page 1
    if (page === 1) {
      params.set('ad-min-width', '200')
      params.set('ad-max-width', '400')
      params.set('ad-min-height', '150')
      params.set('ad-max-height', '300')
    }
    const response = await $fetch<KlipySearchResponse>(
      `${baseUrl}/${appKey}/${type}/trending?${params}`,
      {
        signal: options?.signal,
        headers: { 'User-Agent': MOBILE_USER_AGENT },
      }
    )
    return response
  }

  async function categories(type: ContentType): Promise<KlipyCategory[]> {
    assertApiKey()
    const response = await $fetch<KlipyCategoriesResponse>(
      `${baseUrl}/${appKey}/${type}/categories?customer_id=${customerId.value}`
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

  async function getItemBySlug(
    type: ContentType,
    slug: string,
    options?: { signal?: AbortSignal }
  ): Promise<KlipyGif | null> {
    assertApiKey()
    const response = await $fetch<KlipySearchResponse>(
      `${baseUrl}/${appKey}/${type}/items?slugs=${encodeURIComponent(slug)}&customer_id=${customerId.value}`,
      { signal: options?.signal }
    )
    return response.data.data[0] || null
  }

  async function share(type: ContentType, slug: string): Promise<void> {
    assertApiKey()
    await $fetch(`${baseUrl}/${appKey}/${type}/share/${slug}`, {
      method: 'POST',
      body: { customer_id: customerId.value },
    })
  }

  return { search, trending, categories, getAutocomplete, getItemBySlug, share }
}
