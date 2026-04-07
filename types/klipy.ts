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
}

export interface KlipyGif {
  id: number
  slug: string
  title: string
  type: 'gif' | 'ad'
  tags: string[]
  blur_preview: string
  file: {
    hd: KlipyGifFile
    md: KlipyGifFile
    sm: KlipyGifFile
    xs: KlipyGifFile
  }
}

export interface KlipyCategory {
  name: string
  slug: string
  preview_gif?: string
}

export interface KlipySearchResponse {
  result: boolean
  data: {
    data: KlipyGif[]
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
