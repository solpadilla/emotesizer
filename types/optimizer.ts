export type ResizeMode = 'crop' | 'pad' | 'stretch'

export interface ChatDisplaySize {
  label: string
  size: number
  context: string
}

export interface Platform {
  id: string
  name: string
  icon: string
  sizes: number[]
  maxFileSize: string
  maxFileSizeBytes: number
  format: string
  maxFrames: number | null
  /** Short human-readable note shown below the specs (e.g. upload instructions) */
  description?: string
  /** Override for the sizes display text (e.g. "112px (Twitch auto-resizes)") */
  sizesLabel?: string
  /** Sizes at which this emote appears in actual platform chat UI */
  chatDisplaySizes?: ChatDisplaySize[]
}

export interface SmartCompressState {
  state: 'idle' | 'compressing' | 'success' | 'failed'
  currentStrategy?: string
  originalFileSize?: number
  strategiesApplied?: string[]
  bestAchievedSize?: number
}

export interface OptimizationResult {
  size: number
  format: string
  blob: Blob
  fileSize: number
  withinLimit: boolean
  smartCompress?: SmartCompressState
}
