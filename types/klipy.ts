export interface KlipyMediaFile {
  url: string
  width: number
  height: number
  size: number
}

export interface KlipyGifFile {
  gif: KlipyMediaFile
  webp: KlipyMediaFile
  jpg: KlipyMediaFile
  mp4: KlipyMediaFile
  webm: KlipyMediaFile
  png?: KlipyMediaFile
}

// Regular GIF/sticker item returned by the Klipy API
export interface KlipyGifItem {
  id: number
  slug: string
  title: string
  type: 'gif'
  tags: string[]
  blur_preview: string
  file: {
    hd: KlipyGifFile
    md: KlipyGifFile
    sm: KlipyGifFile
    xs: KlipyGifFile
  }
}

// Klipy ad item — an HTML ad unit with a completely different structure.
// These are injected into search/trending responses alongside regular items.
export interface KlipyAdItem {
  type: 'ad'
  width: number
  height: number
  content: string
}

// Discriminated union — what the API actually returns in data arrays.
// Discriminate on `type`: 'gif' for regular items, 'ad' for ad units.
export type KlipyItem = KlipyGifItem | KlipyAdItem

// Backwards-compatible alias so existing imports that only deal with
// regular GIF items (e.g. detail pages) continue to work unchanged.
export type KlipyGif = KlipyGifItem

export interface KlipyCategory {
  name: string
  slug: string
  preview_gif?: string
}

export interface KlipySearchResponse {
  result: boolean
  data: {
    data: KlipyItem[]
    current_page: number
    per_page: number
    has_next: boolean
  }
}

export interface KlipyCategoriesResponse {
  result: boolean
  data: KlipyCategory[]
}

export interface KlipyAutocompleteResponse {
  result: boolean
  data: string[]
}
