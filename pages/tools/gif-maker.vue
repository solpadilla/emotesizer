<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Maker — Create Animated GIFs from Images Online Free</h1>
      <p class="page-subtitle mt-1">Free animated GIF maker — combine PNG, JPG, or WebP images into a single GIF. Drag to reorder frames, set timing, adjust dimensions, and download. No upload to servers, no watermark, no signup.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- Left Column: Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Upload (shown when no frames are loaded) -->
        <ImageDropZone
          v-if="frames.length === 0"
          @files-selected="handleFilesSelected"
          @error="handleUploadError"
        />

        <!-- Controls (shown when frames are loaded) -->
        <div v-else class="space-y-4">
          <!-- Frames summary card -->
          <div class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
              <img
                v-if="frames[0]"
                :src="frames[0].objectUrl"
                alt="First frame thumbnail"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ frames.length }} images loaded</p>
              <p class="text-xs text-surface-500">
                {{ outputWidth }}&times;{{ outputHeight }}px &middot;
                {{ formatFileSize(totalInputSize) }}
              </p>
            </div>
            <button
              class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              aria-label="Clear all frames"
              @click="clearAll"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Frame filmstrip -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="label !mb-0">Frames</h3>
              <span class="text-xs text-surface-400 font-normal ml-1.5">{{ frames.length }}</span>
              <div class="flex items-center gap-1">
                <button
                  v-if="frames.length >= 2"
                  class="btn-ghost h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs text-surface-500"
                  @click="sortFrames"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h10" />
                    <path d="M3 12h7" />
                    <path d="M3 18h4" />
                    <path d="M17 3v18" />
                    <path d="M21 7l-4-4-4 4" v-if="sortDirection === 'desc'" />
                    <path d="M13 17l4 4 4-4" v-else />
                  </svg>
                  {{ sortDirection === 'desc' ? 'Sort Z-A' : 'Sort A-Z' }}
                </button>
                <button
                  class="btn-ghost h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs text-primary-500"
                  @click="triggerAddMore"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add More
                </button>
              </div>
              <input
                ref="addMoreInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                class="hidden"
                @change="handleAddMore"
              />
            </div>
            <div class="flex flex-wrap gap-2 max-h-[176px] overflow-y-auto pb-1 thin-scrollbar">
              <div
                v-for="(frame, index) in frames"
                :key="frame.id"
                class="group relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-grab border-2 transition-all duration-150"
                :class="{
                  'opacity-40 scale-95': dragIndex === index,
                  'border-primary-500': dropTargetIndex === index && dragIndex !== index,
                  'border-transparent': dropTargetIndex !== index && dragIndex !== index,
                }"
                draggable="true"
                @dragstart="handleDragStart($event, index)"
                @dragover.prevent="handleDragOver(index)"
                @dragend="handleDragEnd"
              >
                <img
                  :src="frame.objectUrl"
                  :alt="`Frame ${index + 1}`"
                  loading="lazy"
                  class="w-full h-full object-cover pointer-events-none"
                />
                <!-- Frame number badge -->
                <span class="absolute bottom-0 left-0 right-0 text-center text-[9px] font-medium leading-none py-px bg-black/50 text-white">
                  {{ index + 1 }}
                </span>
                <!-- Duplicate button -->
                <button
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-primary-500 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  :aria-label="`Duplicate frame ${index + 1}`"
                  @click.stop="duplicateFrame(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <!-- Delete button -->
                <button
                  class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-error-500 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  :aria-label="`Delete frame ${index + 1}`"
                  @click.stop="removeFrame(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <!-- Warning if too many frames -->
            <div
              v-if="frames.length > 50"
              class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 mt-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-warning-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p class="text-xs text-warning-700">
                You have {{ frames.length }} frames. Large frame counts may produce very large GIF files and slow down encoding. Consider keeping it under 50 frames.
              </p>
            </div>
            <!-- Warning if total input size exceeds 100 MB -->
            <div
              v-if="totalInputSize > 104857600"
              class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 mt-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-warning-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p class="text-xs text-warning-700">
                Total input size is {{ formatFileSize(totalInputSize) }}. This may use a lot of memory during encoding and could cause the browser to slow down. Consider using smaller source images or fewer frames.
              </p>
            </div>
          </div>

          <!-- Settings controls — disable interaction during processing -->
          <div class="space-y-4" :class="{ 'pointer-events-none opacity-60': isProcessing }">

          <!-- Reset to defaults — only visible when settings have been changed -->
          <div v-if="hasCustomSettings" class="flex justify-end">
            <button
              class="btn-ghost h-9 px-2 rounded-lg flex items-center gap-1.5 text-xs text-surface-500"
              aria-label="Reset settings to defaults"
              title="Reset to defaults"
              @click="resetSettings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset to defaults
            </button>
          </div>

          <!-- Frame Delay -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="label !mb-0">Frame Delay</h3>
              <div class="segmented-control !p-0.5 !rounded-lg" role="radiogroup" aria-label="Delay unit">
                <button
                  role="radio"
                  :aria-checked="delayUnit === 'ms'"
                  class="segmented-control-item !px-2.5 !py-1 !rounded-md !text-xs"
                  :class="{ 'segmented-control-item-active': delayUnit === 'ms' }"
                  @click="delayUnit = 'ms'"
                >
                  ms
                </button>
                <button
                  role="radio"
                  :aria-checked="delayUnit === 'fps'"
                  class="segmented-control-item !px-2.5 !py-1 !rounded-md !text-xs"
                  :class="{ 'segmented-control-item-active': delayUnit === 'fps' }"
                  @click="delayUnit = 'fps'"
                >
                  fps
                </button>
              </div>
            </div>
            <div class="segmented-control w-full mb-3" role="radiogroup" aria-label="Frame delay mode">
              <button
                role="radio"
                :aria-checked="delayMode === 'global'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': delayMode === 'global' }"
                @click="delayMode = 'global'"
              >
                All Frames
              </button>
              <button
                role="radio"
                :aria-checked="delayMode === 'perFrame'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': delayMode === 'perFrame' }"
                @click="delayMode = 'perFrame'"
              >
                Per Frame
              </button>
            </div>

            <!-- Global mode: preset pills -->
            <template v-if="delayMode === 'global'">
              <!-- ms presets -->
              <template v-if="delayUnit === 'ms'">
                <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Frame delay">
                  <button
                    v-for="preset in delayPresets"
                    :key="preset"
                    role="radio"
                    :aria-checked="globalDelay === preset && !customDelayActive"
                    class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                    :class="{ 'pill-active': globalDelay === preset && !customDelayActive }"
                    @click="setGlobalDelay(preset)"
                  >
                    {{ preset }}ms
                  </button>
                  <button
                    role="radio"
                    :aria-checked="customDelayActive"
                    class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                    :class="{ 'pill-active': customDelayActive }"
                    @click="enableCustomDelay"
                  >
                    Custom
                  </button>
                </div>
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-2"
                >
                  <div v-if="customDelayActive" class="mt-2">
                    <input
                      v-model.number="customDelay"
                      type="number"
                      min="10"
                      max="10000"
                      class="input text-center w-24"
                      aria-label="Custom frame delay in milliseconds"
                      @input="handleCustomDelayInput"
                    />
                    <span class="text-xs text-surface-400 ml-2">ms</span>
                  </div>
                </Transition>
                <p class="text-xs text-surface-400 mt-1.5">
                  {{ globalDelay }}ms per frame (~{{ msToFps(globalDelay) }} fps)
                </p>
              </template>
              <!-- fps presets -->
              <template v-else>
                <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Frame delay in fps">
                  <button
                    v-for="preset in fpsPresets"
                    :key="preset.fps"
                    role="radio"
                    :aria-checked="globalDelay === preset.ms && !customDelayActive"
                    class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                    :class="{ 'pill-active': globalDelay === preset.ms && !customDelayActive }"
                    @click="setGlobalDelay(preset.ms)"
                  >
                    {{ preset.fps }}fps
                  </button>
                  <button
                    role="radio"
                    :aria-checked="customDelayActive"
                    class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                    :class="{ 'pill-active': customDelayActive }"
                    @click="enableCustomDelayFps"
                  >
                    Custom
                  </button>
                </div>
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-2"
                >
                  <div v-if="customDelayActive" class="mt-2">
                    <input
                      v-model.number="customDelayFps"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      class="input text-center w-24"
                      aria-label="Custom frame rate in fps"
                      @input="handleCustomDelayFpsInput"
                    />
                    <span class="text-xs text-surface-400 ml-2">fps</span>
                  </div>
                </Transition>
                <p class="text-xs text-surface-400 mt-1.5">
                  {{ msToFps(globalDelay) }} fps (~{{ globalDelay }}ms per frame)
                </p>
              </template>
            </template>

            <!-- Per-frame mode: scrollable list -->
            <template v-else>
              <div class="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                <div
                  v-for="(frame, index) in frames"
                  :key="frame.id"
                  class="flex items-center gap-2"
                >
                  <span class="text-xs text-surface-500 w-14 flex-shrink-0">Frame {{ index + 1 }}</span>
                  <template v-if="delayUnit === 'ms'">
                    <input
                      v-model.number.lazy="frame.delay"
                      type="number"
                      min="10"
                      max="10000"
                      class="input text-center w-20 !py-1.5 !min-h-[34px] text-xs"
                      :aria-label="`Delay for frame ${index + 1} in milliseconds`"
                      @change="handlePerFrameDelayInput(index)"
                    />
                    <span class="text-xs text-surface-400">ms</span>
                  </template>
                  <template v-else>
                    <input
                      :value="msToFps(frame.delay)"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      class="input text-center w-20 !py-1.5 !min-h-[34px] text-xs"
                      :aria-label="`Frame rate for frame ${index + 1} in fps`"
                      @change="handlePerFrameFpsInput(index, $event)"
                    />
                    <span class="text-xs text-surface-400">fps</span>
                  </template>
                </div>
              </div>
              <p class="text-xs text-surface-400 mt-1.5">
                Set individual {{ delayUnit === 'ms' ? 'delay' : 'frame rate' }} for each frame
              </p>
            </template>
          </div>

          <!-- Output Size -->
          <div>
            <h3 class="label mb-2">Output Size</h3>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  v-model.number="outputWidth"
                  type="number"
                  min="1"
                  max="4096"
                  class="input text-center"
                  aria-label="Output width in pixels"
                  @input="handleWidthChange"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">px</span>
              </div>
              <button
                class="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="aspectLocked ? 'text-primary-500' : 'text-surface-400'"
                aria-label="Toggle aspect ratio lock"
                @click="aspectLocked = !aspectLocked"
              >
                <!-- Link (chain) icon when locked -->
                <svg v-if="aspectLocked" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <!-- Unlink icon when unlocked -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" />
                  <line x1="8" y1="2" x2="8" y2="5" />
                  <line x1="2" y1="8" x2="5" y2="8" />
                  <line x1="16" y1="19" x2="16" y2="22" />
                  <line x1="19" y1="16" x2="22" y2="16" />
                </svg>
              </button>
              <div class="relative flex-1">
                <input
                  v-model.number="outputHeight"
                  type="number"
                  min="1"
                  max="4096"
                  class="input text-center"
                  aria-label="Output height in pixels"
                  @input="handleHeightChange"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">px</span>
              </div>
            </div>
            <p class="text-xs text-surface-400 mt-1.5 text-center">
              {{ aspectLocked ? 'Aspect ratio locked' : 'Freeform dimensions' }}
            </p>
          </div>

          <!-- Quality -->
          <div>
            <h3 class="label mb-2">Quality</h3>
            <div class="segmented-control w-full" role="radiogroup" aria-label="Output quality">
              <button
                v-for="q in qualityOptions"
                :key="q.value"
                role="radio"
                :aria-checked="quality === q.value"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': quality === q.value }"
                @click="quality = q.value"
              >
                {{ q.label }}
              </button>
            </div>
            <p class="text-xs text-surface-400 mt-1.5">
              <template v-if="quality === 'low'">64 colors. Smallest file size, best for simple graphics.</template>
              <template v-else-if="quality === 'medium'">128 colors. Good balance of quality and file size.</template>
              <template v-else>256 colors. Highest quality, larger file size.</template>
            </p>
          </div>

          <!-- Loop Count -->
          <div>
            <h3 class="label mb-2">Loop Count</h3>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Loop count">
              <button
                role="radio"
                :aria-checked="loopPreset === 'infinite'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': loopPreset === 'infinite' }"
                @click="setLoopPreset('infinite')"
              >
                Infinite
              </button>
              <button
                role="radio"
                :aria-checked="loopPreset === 'once'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': loopPreset === 'once' }"
                @click="setLoopPreset('once')"
              >
                Play Once
              </button>
              <button
                role="radio"
                :aria-checked="loopPreset === '3x'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': loopPreset === '3x' }"
                @click="setLoopPreset('3x')"
              >
                3x
              </button>
              <button
                role="radio"
                :aria-checked="loopPreset === 'custom'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': loopPreset === 'custom' }"
                @click="setLoopPreset('custom')"
              >
                Custom
              </button>
            </div>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="loopPreset === 'custom'" class="mt-2">
                <input
                  v-model.number="customLoopCount"
                  type="number"
                  min="1"
                  max="65535"
                  class="input text-center w-24"
                  aria-label="Custom loop count"
                  @input="handleCustomLoopInput"
                />
                <span class="text-xs text-surface-400 ml-2">loops</span>
              </div>
            </Transition>
          </div>

          <!-- Playback Mode -->
          <div>
            <h3 class="label mb-2">Playback Mode</h3>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Playback mode">
              <button
                role="radio"
                :aria-checked="playbackMode === 'normal'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': playbackMode === 'normal' }"
                @click="playbackMode = 'normal'"
              >
                Normal
              </button>
              <button
                role="radio"
                :aria-checked="playbackMode === 'reverse'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': playbackMode === 'reverse' }"
                @click="playbackMode = 'reverse'"
              >
                Reverse
              </button>
              <button
                role="radio"
                :aria-checked="playbackMode === 'pingPong'"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': playbackMode === 'pingPong' }"
                @click="playbackMode = 'pingPong'"
              >
                Ping-Pong
              </button>
            </div>
            <p class="text-xs text-surface-400 mt-1.5">
              <template v-if="playbackMode === 'normal'">Frames play in the order shown above.</template>
              <template v-else-if="playbackMode === 'reverse'">Frames play in reverse order (last to first).</template>
              <template v-else>Frames play forward then backward, creating a boomerang effect.</template>
            </p>
          </div>

          <!-- Estimated output info box -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              {{ effectiveFrameCount }} frames at {{ outputWidth }}&times;{{ outputHeight }}px
              <span v-if="playbackMode !== 'normal'" class="text-primary-500">({{ playbackMode === 'reverse' ? 'reversed' : 'ping-pong' }})</span>
              <span class="text-surface-400">
                &middot; {{ delaySummaryLabel }}
                &middot; {{ effectiveLoopCount === 0 ? 'Infinite loop' : effectiveLoopCount === 1 ? 'Play once' : effectiveLoopCount + 'x loop' }}
              </span>
            </p>
          </div>

          </div><!-- /Settings controls wrapper -->

          <!-- Create GIF button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isProcessing || frames.length < 2"
            @click="createGif"
          >
            <template v-if="isProcessing">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating GIF... {{ progressPercent }}%
            </template>
            <template v-else>
              <IconFrame :size="18" />
              Create GIF
            </template>
          </button>

          <!-- Download button (shown after GIF created) -->
          <button
            v-if="resultGifUrl"
            class="btn btn-primary btn-lg w-full"
            @click="downloadGif"
          >
            <IconDownload :size="18" />
            Download GIF ({{ formatFileSize(resultGifSize) }})
          </button>

          <!-- Tool chaining CTAs -- shown after a result is ready -->
          <div v-if="resultGifUrl" class="pt-1">
            <p class="text-xs text-surface-400 mb-2">Continue editing this GIF</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink to="/tools/compress" aria-label="Continue editing: compress this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCompress :size="14" />
                Compress
              </NuxtLink>
              <NuxtLink to="/tools/crop" aria-label="Continue editing: crop this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCrop :size="14" />
                Crop
              </NuxtLink>
              <NuxtLink to="/tools/resize" aria-label="Continue editing: resize this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconResize :size="14" />
                Resize
              </NuxtLink>
              <NuxtLink to="/tools/speed" aria-label="Continue editing: change GIF speed" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconGauge :size="14" />
                Change Speed
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Preview -->
      <div class="lg:col-span-3">
        <!-- Empty state -->
        <div
          v-if="frames.length === 0"
          class="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-surface-200 text-surface-400 text-sm"
        >
          Upload images to get started
        </div>

        <!-- Processing state -->
        <div
          v-else-if="isProcessing"
          class="rounded-2xl overflow-hidden bg-surface-100/50 p-6 min-h-[200px] flex flex-col items-center justify-center gap-4"
        >
          <div class="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <div class="text-center">
            <p class="text-sm font-medium text-surface-700">Creating your GIF...</p>
            <p class="text-xs text-surface-400 mt-1">Processing frame {{ currentProcessingFrame }} of {{ frames.length }}</p>
          </div>
          <!-- Progress bar -->
          <div class="w-full max-w-xs bg-surface-200/50 rounded-full h-2">
            <div
              class="bg-primary-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
            />
          </div>
        </div>

        <!-- Result state -->
        <template v-else-if="resultGifUrl">
          <div class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px] flex items-center justify-center">
            <img
              :src="resultGifUrl"
              alt="Generated GIF"
              :width="outputWidth"
              :height="outputHeight"
              class="max-w-full max-h-[400px] object-contain rounded-lg"
            />
          </div>
          <!-- Result info card -->
          <div class="mt-4 card !p-3">
            <div class="flex flex-wrap gap-4 text-xs text-surface-500">
              <span>{{ formatFileSize(resultGifSize) }}</span>
              <span>{{ frames.length }} frames</span>
              <span>{{ outputWidth }}&times;{{ outputHeight }}px</span>
            </div>
          </div>
        </template>

        <!-- Pre-creation preview (animated frame cycling) -->
        <template v-else>
          <div class="rounded-2xl overflow-hidden checkerboard min-h-[200px] relative">
            <img
              v-if="previewFrameUrl"
              :src="previewFrameUrl"
              alt="Frame preview"
              class="w-full max-h-[400px] object-contain"
            />
            <!-- Play/pause overlay -->
            <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
              <div class="flex items-center gap-3">
                <button
                  class="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  :aria-label="isPreviewPlaying ? 'Pause preview' : 'Play preview'"
                  @click="togglePreview"
                >
                  <!-- Play icon -->
                  <svg v-if="!isPreviewPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <!-- Pause icon -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                </button>
                <span class="text-xs text-white/80 font-medium">
                  Frame {{ previewFrameIndex + 1 }} / {{ frames.length }}
                </span>
              </div>
            </div>
          </div>

          <!-- File info bar -->
          <div class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
            <span>{{ frames.length }} frames</span>
            <span>{{ outputWidth }}&times;{{ outputHeight }}px</span>
            <span>{{ delaySummaryLabel }}</span>
            <span>{{ effectiveLoopCount === 0 ? 'Infinite loop' : effectiveLoopCount === 1 ? 'Play once' : effectiveLoopCount + 'x loop' }}</span>
            <span>{{ qualityLabel }} quality</span>
          </div>
        </template>
      </div>

    </div>

    <!-- Related tools — GIF maker output often needs frame extraction, text, compression, or resize -->
    <ToolRelated
      current="/tools/gif-maker"
      :tools="[
        { to: '/tools/gif-to-png', label: 'GIF to PNG', icon: 'IconFrame', description: 'Extract individual frames as PNG images' },
        { to: '/tools/add-text-to-gif', label: 'Add Text to GIF', icon: 'IconText', description: 'Add text, captions, and meme text to animated GIFs' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/resize', label: 'GIF Resize', icon: 'IconResize', description: 'Change GIF dimensions with crop, pad, or stretch' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Make a GIF from Pictures</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your images</strong> — drag and drop or click to browse. This free online GIF maker accepts PNG, JPG, WebP, and GIF images up to 20 MB each. The image to GIF conversion runs entirely in your browser, so your pictures never leave your device.</li>
        <li><strong>Arrange the frames</strong> — drag thumbnails in the filmstrip to reorder your image sequence. Remove unwanted frames with the delete button, duplicate frames for emphasis, or add more images at any time. This frame-by-frame GIF maker gives you full control over every step of the animation.</li>
        <li><strong>Set timing and options</strong> — choose a global frame delay or set per-frame timing to control the GIF speed. Adjust the output dimensions, quality level (which controls the GIF color palette and 256-color encoding), and loop count to match your needs.</li>
        <li><strong>Create and download</strong> — click "Create GIF" and watch the GIF encoder process each frame in real time. Download your animated GIF instantly. Completely free, no watermark, no signup required.</li>
      </ol>
      <p class="text-sm text-surface-600 mt-3">
        After creating your GIF, continue editing with our other free tools. Use the <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to reduce file size for sharing, the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> to hit exact pixel dimensions, the <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">GIF cropper</NuxtLink> to trim the canvas, or the <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">GIF speed changer</NuxtLink> to fine-tune animation timing. Need to start from a video instead? Try our <NuxtLink to="/tools/video-to-gif" class="text-primary-500 hover:underline">video to GIF converter</NuxtLink>.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Use EmoteSizer's Free Online GIF Maker?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Create animated emotes</strong> — combine hand-drawn frames, screenshots, or pixel art into animated emotes for Discord, Twitch, Kick, 7TV, BTTV, and FFZ. This animated emote maker gives you frame-by-frame control over every detail of your emote animation.</li>
        <li><strong>Build GIF slideshows</strong> — turn a series of photos, product images, or illustrations into an auto-playing GIF slideshow for presentations, social media posts, or websites. Set per-frame delays to control how long each slide stays visible.</li>
        <li><strong>Frame-by-frame animation</strong> — create pixel art animations, flipbook-style cartoons, or stop-motion sequences from an image sequence. Artists and illustrators can import their individual frames and fine-tune the timing for each one independently.</li>
        <li><strong>No software needed</strong> — forget Photoshop, GIMP, or desktop apps. This GIF maker from images runs entirely in your web browser. Just open the page, upload your pictures, and create your animated GIF in seconds.</li>
        <li><strong>100% free and private</strong> — no watermark, no signup, no server upload. Your images are processed entirely on your device using client-side JavaScript. Nothing is stored, nothing leaves your browser. Close the tab and everything is gone.</li>
        <li><strong>Works on any device</strong> — use this image to GIF converter on your desktop, laptop, tablet, or phone. It runs in any modern browser on Windows, Mac, Linux, iOS, and Android.</li>
      </ul>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">Supported Image Formats — PNG, JPG, WebP to GIF</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>PNG to GIF</strong> is the ideal path for artwork, logos, and illustrations. PNG files preserve transparency and lossless source quality, so your GIF frames start from the best possible source. If your PNG has a transparent background, the GIF will render that area as the background color — perfect for transparent GIF animations and emote overlays.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>JPG/JPEG to GIF</strong> works great for converting photo sequences, product showcases, and reaction images into animated GIFs. Keep in mind that the GIF format is limited to a 256-color palette per frame, so photos with subtle gradients may show slight banding. Use the High quality preset (256 colors) and the encoder will build an optimal palette to minimize visible artifacts.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>WebP to GIF</strong> conversion is fully supported for modern screenshots, web downloads, and images exported from design tools. You can even use existing <strong>static GIF frames</strong> as input to remix or recombine animations. Mix and match formats freely in the same project — this image to GIF converter handles PNG, JPG, WebP, and GIF together and combines multiple images into a single animated GIF online.
      </p>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">GIF Settings for Discord, Twitch & Social Media</h2>
      <p class="text-sm text-surface-600 mb-3">
        Each platform has different size and dimension requirements for animated images. Here is a quick reference to help you configure the right output settings in this GIF maker for Discord, Twitch, and other popular platforms:
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Discord animated emoji</strong> — must be exactly 128x128 pixels and under 256 KB. Set the output dimensions to 128x128, keep the frame count low (5-15 frames), and use the Low or Medium quality preset. After creating, run the result through our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to hit the Discord GIF size limit.</li>
        <li><strong>Discord stickers</strong> — up to 320x320 pixels and under 500 KB (Lottie) or 10 MB (APNG/GIF). Set output to 320x320 for a full-size sticker. You have more room for frames and quality here compared to emoji.</li>
        <li><strong>Twitch / 7TV / BTTV emotes</strong> — animated emotes are typically required at 28x28, 56x56, and 112x112 pixels with a file size limit around 1 MB (varies by platform). Create your GIF at the largest size first (112x112), then use the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> to generate the smaller variants.</li>
        <li><strong>Instagram, Twitter/X, Reddit</strong> — these platforms generally accept GIFs up to 15 MB, but smaller files load faster and look sharper on mobile. Aim for 480px width or less, 10-20 frames, and use the Medium quality setting for the best balance of clarity and file size.</li>
      </ul>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">Quality & File Size Tips</h2>
      <p class="text-sm text-surface-600 mb-3">
        GIF files can grow large quickly because each frame is stored as a full image. Here are practical ways to keep your animated GIF file size under control:
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Fewer frames = smaller file</strong> — every frame adds to the total size. If your animation looks smooth at 10 frames, there is no need for 30. Remove duplicate or unnecessary frames to cut the GIF file size significantly.</li>
        <li><strong>Lower resolution = smaller file</strong> — a 128x128 GIF is dramatically smaller than a 480x480 one. Set the output dimensions to the smallest size that still looks good for your use case.</li>
        <li><strong>Adjust the color palette</strong> — the Low quality preset uses 64 colors and produces the smallest files, which works well for simple graphics, logos, and text. The High preset uses a full 256-color GIF palette and is better for photographic content where you need smooth gradients.</li>
        <li><strong>Use ping-pong mode</strong> — the ping-pong (boomerang) playback mode plays your frames forward then backward, creating a longer-looking animation from fewer source frames. This is a great way to make an engaging loop without doubling the frame count.</li>
        <li><strong>Compress afterward</strong> — after creating your GIF, run it through our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> for further GIF optimization. It can often reduce the file size by 30-60% with minimal visual impact by applying lossy compression and frame diffing.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        For the best workflow, create your GIF with the settings that look right, then fine-tune the file size with our companion tools: <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink>, <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink>, <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">GIF cropper</NuxtLink>, <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">GIF speed changer</NuxtLink>, and <NuxtLink to="/tools/video-to-gif" class="text-primary-500 hover:underline">video to GIF converter</NuxtLink>.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF from images?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your PNG, JPG, or WebP images, drag to reorder the frames, set the frame delay and output size, then click "Create GIF." The GIF encoder runs entirely in your browser and produces a downloadable animated GIF in seconds. No software to install, no account to create.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the best free GIF maker online?</h3>
          <p class="text-sm text-surface-500 mt-1">EmoteSizer is a fully free, browser-based GIF maker with no watermark, no signup, and no server upload. Unlike most online GIF creators, your images are processed entirely on your device using client-side JavaScript, giving you complete privacy. You get per-frame timing controls, multiple playback modes, quality presets, and custom loop settings.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I create a GIF without a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer never adds watermarks, logos, or branding to your files. The output GIF is clean and ready to use on any platform — Discord, Twitch, Instagram, Twitter/X, Reddit, or anywhere else.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What image formats can I use to make a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">This GIF maker supports PNG, JPG/JPEG, WebP, and GIF images. You can freely mix formats in the same project — for example, combine PNG artwork with JPG photos. The tool decodes each image in your browser and converts them all into a single animated GIF.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF for Discord?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your frames and create the GIF here, then use our <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> to set it to 128x128 pixels and our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to get the file under 256 KB. Discord animated emoji must be exactly 128x128 pixels and under 256 KB. The same workflow applies to Twitch, Kick, 7TV, and BTTV emotes.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How many frames can a GIF have?</h3>
          <p class="text-sm text-surface-500 mt-1">There is no hard limit in the GIF format itself, but we recommend keeping it under 50 frames for best performance. Each frame is stored as a full image, so large frame counts produce very large files and can slow down the GIF encoder. You can always add or remove frames after the initial upload.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What frame delay should I use for a smooth GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">For smooth animation, use 50-100ms per frame (10-20 fps). A GIF frame delay of 100ms (10 fps) works well for most animations, while 50ms (20 fps) creates very smooth motion. For slideshows, 500-1000ms gives viewers time to read each frame. You can also set different delays per frame for variable-speed effects.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why is my GIF file so large?</h3>
          <p class="text-sm text-surface-500 mt-1">GIFs store each frame as a full image with up to 256 colors, so they are inherently larger than compressed video. To reduce file size: lower the output dimensions, reduce the number of frames, use a lower quality preset (fewer colors in the GIF color palette), or increase the frame delay. You can also run the result through our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> afterward.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Do my images need to be the same size?</h3>
          <p class="text-sm text-surface-500 mt-1">No. Images of different sizes are automatically scaled to fit the output dimensions you set. By default, the output size matches your first image, but you can change the width and height to any value. Lock the aspect ratio to prevent stretching, or unlock it for freeform dimensions.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is my data private when using this GIF maker?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes, completely. This is a 100% browser-based, client-side tool. Your images are never uploaded to any server — the GIF encoder runs locally in your browser using JavaScript. No data leaves your device, no cloud processing is involved, and nothing is stored. Close the tab and everything is gone.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I make a GIF on my phone or tablet?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. This GIF maker is fully browser-based and works on any device — iPhone, iPad, Android phones and tablets, laptops, and desktops. There is no app to install. Just open the page in your mobile browser, upload your images from your camera roll or files, arrange the frames, and create your animated GIF. The same features and quality settings are available on every device.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I reduce the file size of my GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Start by using fewer frames, smaller output dimensions, and a lower quality preset (fewer colors). The ping-pong playback mode can also help by creating a longer animation from fewer source frames. If the GIF is still too large after creation, run it through our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> — it applies lossy compression and frame diffing to shrink the file further, often by 30-60%, without noticeable quality loss.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { encode as encodeGif } from 'modern-gif'
import { useImageValidation } from '~/composables/useImageValidation'

useHead({
  title: 'GIF Maker — Create Animated GIFs from Images Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF maker — combine PNG, JPG, WebP images into animated GIFs instantly. No watermark, no signup, no upload. Works for Discord & Twitch emotes.' },
    { key: 'og:title', property: 'og:title', content: 'Free Animated GIF Maker — Create GIFs from Images Online | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF maker — combine PNG, JPG, WebP images into animated GIFs. Frame-by-frame control, no watermark, no signup, 100% browser-based.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/gif-maker' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Maker — Create Animated GIFs from Images Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free animated GIF maker — convert images to GIF online. Drag to reorder, set frame delay, no watermark, no upload. Works for Discord, Twitch & social media.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/gif-maker' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Maker — Animated GIF Creator from Images',
        'url': 'https://emotesizer.com/tools/gif-maker',
        'description': 'Free online GIF maker that combines PNG, JPG, and WebP images into animated GIFs. Frame-by-frame editor with drag-to-reorder, per-frame timing, quality presets, and loop control. Browser-based, no upload, no watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Create GIF from images',
          'PNG to GIF conversion',
          'JPG to GIF conversion',
          'WebP to GIF conversion',
          'Animated GIF maker no watermark',
          'Frame-by-frame GIF editor',
          'Drag to reorder frames',
          'Per-frame delay control',
          'Global and per-frame timing (ms and fps)',
          'Custom output dimensions',
          'Quality presets (64, 128, 256 colors)',
          'GIF loop count control',
          'Normal, Reverse, and Ping-Pong playback',
          'Browser-based client-side processing',
          'No signup required',
          'Works on any device — Mac, Windows, iPhone, Android',
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'How do I make a GIF from images?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your PNG, JPG, or WebP images, drag to reorder the frames, set the frame delay and output size, then click "Create GIF." The GIF encoder runs entirely in your browser and produces a downloadable animated GIF in seconds. No software to install, no account to create.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the best free GIF maker online?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'EmoteSizer is a fully free, browser-based GIF maker with no watermark, no signup, and no server upload. Unlike most online GIF creators, your images are processed entirely on your device using client-side JavaScript, giving you complete privacy. You get per-frame timing controls, multiple playback modes, quality presets, and custom loop settings.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I create a GIF without a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer never adds watermarks, logos, or branding to your files. The output GIF is clean and ready to use on any platform — Discord, Twitch, Instagram, Twitter/X, Reddit, or anywhere else.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What image formats can I use to make a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'This GIF maker supports PNG, JPG/JPEG, WebP, and GIF images. You can freely mix formats in the same project. The tool decodes each image in your browser and converts them all into a single animated GIF.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF for Discord?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your frames and create the GIF here, then use the GIF resizer to set it to 128x128 pixels and the GIF compressor to get the file under 256 KB. Discord animated emoji must be exactly 128x128 pixels and under 256 KB. The same workflow applies to Twitch, Kick, 7TV, and BTTV emotes.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How many frames can a GIF have?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'There is no hard limit in the GIF format itself, but we recommend keeping it under 50 frames for best performance. Each frame is stored as a full image, so large frame counts produce very large files and can slow down the GIF encoder.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What frame delay should I use for a smooth GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'For smooth animation, use 50-100ms per frame (10-20 fps). A GIF frame delay of 100ms works well for most animations, while 50ms creates very smooth motion. For slideshows, 500-1000ms gives viewers time to read each frame. You can also set different delays per frame for variable-speed effects.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why is my GIF file so large?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'GIFs store each frame as a full image with up to 256 colors, so they are inherently larger than compressed video. To reduce file size: lower the output dimensions, reduce the number of frames, use a lower quality preset (fewer colors in the GIF color palette), or increase the frame delay. You can also run the result through the GIF compressor afterward.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Do my images need to be the same size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. Images of different sizes are automatically scaled to fit the output dimensions you set. By default, the output size matches your first image, but you can change the width and height to any value.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is my data private when using this GIF maker?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, completely. This is a 100% browser-based, client-side tool. Your images are never uploaded to any server — the GIF encoder runs locally in your browser using JavaScript. No data leaves your device, no cloud processing is involved, and nothing is stored.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I make a GIF on my phone or tablet?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. This GIF maker is fully browser-based and works on any device — iPhone, iPad, Android phones and tablets, laptops, and desktops. There is no app to install. Just open the page in your mobile browser, upload your images, arrange the frames, and create your animated GIF.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I reduce the file size of my GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Start by using fewer frames, smaller output dimensions, and a lower quality preset (fewer colors). The ping-pong playback mode can also help by creating a longer animation from fewer source frames. If the GIF is still too large after creation, run it through the GIF compressor — it applies lossy compression and frame diffing to shrink the file further, often by 30-60%, without noticeable quality loss.',
            },
          },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to Make a GIF from Pictures',
        'description': 'Create an animated GIF from PNG, JPG, or WebP images using EmoteSizer\'s free online GIF maker. Drag to reorder frames, set timing, and download. No signup, no watermark, no software to install.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your images',
            'text': 'Drag and drop or click to browse. This free GIF maker accepts PNG, JPG, WebP, and GIF images up to 20 MB each. The image to GIF conversion runs entirely in your browser, so your pictures never leave your device.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Arrange the frame sequence',
            'text': 'Drag thumbnails in the filmstrip to reorder your image sequence. Remove unwanted frames, duplicate frames for emphasis, or add more images at any time.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Set frame delay and options',
            'text': 'Choose a global frame delay or set per-frame timing to control the GIF frame rate. Adjust output dimensions, quality (which sets the GIF color palette), and loop count.',
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Create and download your animated GIF',
            'text': 'Click "Create GIF" and watch the GIF encoder process each frame. Download your animated GIF instantly. Completely free, no watermark, no signup required.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Maker' },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://emotesizer.com' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': 'https://emotesizer.com/tools' },
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Maker', 'item': 'https://emotesizer.com/tools/gif-maker' },
        ],
      }),
    },
  ],
})

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()
const { validateImageFiles } = useImageValidation()

// -- Types --

interface FrameData {
  id: number
  file: File
  objectUrl: string
  /** Natural width of the source image */
  naturalWidth: number
  /** Natural height of the source image */
  naturalHeight: number
  /** Per-frame delay in ms (used in per-frame mode) */
  delay: number
}

// -- Reactive state --

let nextFrameId = 0
const frames = ref<FrameData[]>([])
const isProcessing = ref(false)
const currentProcessingFrame = ref(0)
const progressPercent = ref(0)
const resultGifUrl = ref<string | null>(null)
const resultGifBlob = ref<Blob | null>(null)
const resultGifSize = ref(0)

// Settings
const delayMode = ref<'global' | 'perFrame'>('global')
const delayUnit = ref<'ms' | 'fps'>('ms')
const globalDelay = ref(200)
const customDelayActive = ref(false)
const customDelay = ref(200)
const customDelayFps = ref(5)
const outputWidth = ref(0)
const outputHeight = ref(0)
const aspectLocked = ref(true)
const quality = ref<'low' | 'medium' | 'high'>('medium')
const loopPreset = ref<'infinite' | 'once' | '3x' | 'custom'>('infinite')
const customLoopCount = ref(3)
const playbackMode = ref<'normal' | 'reverse' | 'pingPong'>('normal')
const sortDirection = ref<'none' | 'asc' | 'desc'>('none')

// Aspect ratio tracking (based on first image or user-unlocked)
const sourceAspectRatio = ref(1)

// Drag-and-drop reordering state
const dragIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)

// Preview animation state
const previewFrameIndex = ref(0)
const isPreviewPlaying = ref(true)
// previewDirection is only used inside the animation loop — no reactivity needed (Fix 9)
let previewDirection: 1 | -1 = 1
let previewAnimId: number | null = null
let previewLastTime = 0

// Add-more file input ref
const addMoreInputRef = ref<HTMLInputElement | null>(null)

// -- Presets --

const delayPresets = [100, 200, 500, 1000] as const
const fpsPresets = [
  { fps: 24, ms: 42 },
  { fps: 15, ms: 67 },
  { fps: 10, ms: 100 },
  { fps: 5, ms: 200 },
] as const

// -- FPS conversion helpers --

function msToFps(ms: number): number {
  return Math.round((1000 / ms) * 10) / 10
}

function fpsToMs(fps: number): number {
  return Math.round(1000 / fps)
}

const qualityOptions = [
  { label: 'Low', value: 'low' as const },
  { label: 'Medium', value: 'medium' as const },
  { label: 'High', value: 'high' as const },
]

// -- Computed --

const totalInputSize = computed(() => frames.value.reduce((sum, f) => sum + f.file.size, 0))

const qualityLabel = computed(() => {
  switch (quality.value) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    default: return 'Medium'
  }
})

/** Maps quality setting to maxColors for modern-gif */
const maxColors = computed(() => {
  switch (quality.value) {
    case 'low': return 64
    case 'medium': return 128
    case 'high': return 256
    default: return 128
  }
})

/**
 * Maps the loop preset to the modern-gif loopCount value.
 * modern-gif: undefined or 0 = infinite, positive N = loop N times.
 * For "play once" we set loopCount to 1.
 */
const effectiveLoopCount = computed(() => {
  switch (loopPreset.value) {
    case 'infinite': return 0
    case 'once': return 1
    case '3x': return 3
    case 'custom': return customLoopCount.value
    default: return 0
  }
})

/** Effective frame count accounting for playback mode */
const effectiveFrameCount = computed(() => {
  const n = frames.value.length
  if (n <= 1) return n
  if (playbackMode.value === 'pingPong') {
    // forward + backward minus endpoints: n + (n - 2) = 2n - 2
    return 2 * n - 2
  }
  return n
})

/** Summary text for delay configuration */
const delaySummaryLabel = computed(() => {
  if (delayMode.value === 'global') {
    return `${globalDelay.value}ms (~${(1000 / globalDelay.value).toFixed(1)} fps)`
  }
  const delays = frames.value.map(f => f.delay)
  const minDelay = Math.min(...delays)
  const maxDelay = Math.max(...delays)
  if (minDelay === maxDelay) {
    return `${minDelay}ms per frame`
  }
  return `${minDelay}-${maxDelay}ms per frame`
})

/** Currently visible preview frame URL */
const previewFrameUrl = computed(() => {
  if (frames.value.length === 0) return null
  const idx = Math.min(previewFrameIndex.value, frames.value.length - 1)
  return frames.value[idx]?.objectUrl ?? null
})

/**
 * True when any setting differs from its default value.
 * Defaults: globalDelay=200, delayMode='global', quality='medium',
 * loopPreset='infinite', aspectLocked=true, and dimensions match first image.
 */
const hasCustomSettings = computed(() => {
  if (frames.value.length === 0) return false

  const firstFrame = frames.value[0]
  const defaultWidth = firstFrame.naturalWidth
  const defaultHeight = firstFrame.naturalHeight

  const delayChanged = globalDelay.value !== 200 || customDelayActive.value || delayMode.value !== 'global'
  const sizeChanged = outputWidth.value !== defaultWidth || outputHeight.value !== defaultHeight
  const qualityChanged = quality.value !== 'medium'
  const loopChanged = loopPreset.value !== 'infinite'
  const lockChanged = !aspectLocked.value
  const playbackChanged = playbackMode.value !== 'normal'
  // delayUnit (ms/fps) is a UI display preference that doesn't affect output — omitted intentionally

  return delayChanged || sizeChanged || qualityChanged || loopChanged || lockChanged || playbackChanged
})

// -- Watch for setting changes to clear result --
// Split into focused watchers to avoid expensive deep traversal of the entire
// frames array on every settings change.

/** Helper to clear the result GIF when any encoding-relevant setting changes */
function clearResult() {
  if (resultGifUrl.value) {
    URL.revokeObjectURL(resultGifUrl.value)
    resultGifUrl.value = null
    resultGifBlob.value = null
    resultGifSize.value = 0
  }
}

// Settings that are plain refs — a shallow watch is sufficient
watch([globalDelay, customDelay, customDelayActive, delayMode, delayUnit, outputWidth, outputHeight, quality, loopPreset, customLoopCount, playbackMode], clearResult)

// Structural change: frame added/removed
watch(() => frames.value.length, clearResult)

// Per-frame delay changes: only watch the mapped delay array (small, shallow)
watch(() => frames.value.map(f => f.delay), clearResult, { deep: true })

// -- Preview animation --

function startPreview() {
  stopPreview()
  if (frames.value.length === 0) return
  isPreviewPlaying.value = true
  previewDirection = 1
  previewLastTime = 0
  scheduleNextFrame()
}

function stopPreview() {
  if (previewAnimId !== null) {
    cancelAnimationFrame(previewAnimId)
    previewAnimId = null
  }
  isPreviewPlaying.value = false
}

/**
 * Uses requestAnimationFrame for smoother, more efficient preview animation.
 * Tracks elapsed time to determine when to advance to the next frame,
 * rather than relying on setTimeout which can drift and is throttled
 * by the browser when the tab is in the background.
 */
function scheduleNextFrame() {
  previewAnimId = requestAnimationFrame((now) => {
    if (!isPreviewPlaying.value || frames.value.length === 0) return

    // Seed the timestamp on the first tick so the first frame displays immediately
    if (previewLastTime === 0) {
      previewLastTime = now
    }

    const currentIdx = previewFrameIndex.value
    const delay = delayMode.value === 'perFrame'
      ? (frames.value[currentIdx]?.delay ?? globalDelay.value)
      : globalDelay.value

    if (now - previewLastTime >= delay) {
      const len = frames.value.length

      if (playbackMode.value === 'reverse') {
        // Cycle backward: N-1, N-2, ..., 0, N-1, ...
        previewFrameIndex.value = (previewFrameIndex.value - 1 + len) % len
      } else if (playbackMode.value === 'pingPong') {
        // Ping-pong: forward then backward, excluding endpoints on reversal
        const nextIdx = previewFrameIndex.value + previewDirection
        if (nextIdx >= len) {
          previewDirection = -1
          previewFrameIndex.value = previewFrameIndex.value - 1
        } else if (nextIdx < 0) {
          previewDirection = 1
          previewFrameIndex.value = previewFrameIndex.value + 1
        } else {
          previewFrameIndex.value = nextIdx
        }
      } else {
        // Normal: cycle forward
        previewFrameIndex.value = (previewFrameIndex.value + 1) % len
      }

      previewLastTime = now
    }

    scheduleNextFrame()
  })
}

function togglePreview() {
  if (isPreviewPlaying.value) {
    stopPreview()
  } else {
    startPreview()
  }
}

// Restart preview when frames change
watch(() => frames.value.length, (len) => {
  if (len > 0 && !isProcessing.value && !resultGifUrl.value) {
    previewFrameIndex.value = 0
    startPreview()
  } else if (len === 0) {
    stopPreview()
    previewFrameIndex.value = 0
  }
})

// Restart preview when delay settings or playback mode change (to pick up new timing/direction)
watch([globalDelay, delayMode, playbackMode], () => {
  if (isPreviewPlaying.value && frames.value.length > 0) {
    stopPreview()
    startPreview()
  }
})

// Resume preview after GIF creation completes and the result is cleared (Fix 10)
watch(isProcessing, (processing) => {
  if (!processing && !resultGifUrl.value && frames.value.length > 0) {
    startPreview()
  }
})

// -- Format helpers --

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// -- Delay controls --

function setGlobalDelay(value: number) {
  globalDelay.value = value
  customDelayActive.value = false
}

function enableCustomDelay() {
  customDelayActive.value = true
  customDelay.value = globalDelay.value
}

function enableCustomDelayFps() {
  customDelayActive.value = true
  customDelayFps.value = msToFps(globalDelay.value)
}

function handleCustomDelayInput() {
  const clamped = Math.max(10, Math.min(10000, customDelay.value || 200))
  globalDelay.value = clamped
}

function handleCustomDelayFpsInput() {
  const clampedFps = Math.max(0.1, Math.min(100, customDelayFps.value || 5))
  customDelayFps.value = clampedFps
  globalDelay.value = fpsToMs(clampedFps)
}

function handlePerFrameDelayInput(index: number) {
  const frame = frames.value[index]
  if (!frame) return
  frame.delay = Math.max(10, Math.min(10000, frame.delay || 200))
}

function handlePerFrameFpsInput(index: number, event: Event) {
  const frame = frames.value[index]
  if (!frame) return
  const input = event.target as HTMLInputElement
  const fpsValue = Math.max(0.1, Math.min(100, parseFloat(input.value) || 5))
  frame.delay = fpsToMs(fpsValue)
}

// -- Output size controls --

function handleWidthChange() {
  const w = Math.max(1, Math.min(4096, outputWidth.value || 1))
  outputWidth.value = w
  if (aspectLocked.value && sourceAspectRatio.value > 0) {
    outputHeight.value = Math.round(w / sourceAspectRatio.value)
  }
}

function handleHeightChange() {
  const h = Math.max(1, Math.min(4096, outputHeight.value || 1))
  outputHeight.value = h
  if (aspectLocked.value && sourceAspectRatio.value > 0) {
    outputWidth.value = Math.round(h * sourceAspectRatio.value)
  }
}

// -- Loop controls --

function setLoopPreset(preset: 'infinite' | 'once' | '3x' | 'custom') {
  loopPreset.value = preset
}

function handleCustomLoopInput() {
  const clamped = Math.max(1, Math.min(65535, customLoopCount.value || 3))
  customLoopCount.value = clamped
}

// -- Reset settings --

function resetSettings() {
  if (frames.value.length === 0) return

  const firstFrame = frames.value[0]
  delayMode.value = 'global'
  delayUnit.value = 'ms'
  globalDelay.value = 200
  customDelayActive.value = false
  customDelay.value = 200
  customDelayFps.value = 5
  outputWidth.value = firstFrame.naturalWidth
  outputHeight.value = firstFrame.naturalHeight
  sourceAspectRatio.value = firstFrame.naturalWidth / firstFrame.naturalHeight
  aspectLocked.value = true
  quality.value = 'medium'
  loopPreset.value = 'infinite'
  customLoopCount.value = 3
  playbackMode.value = 'normal'

  // Reset per-frame delays
  for (const frame of frames.value) {
    frame.delay = 200
  }
}

// -- Drag-and-drop reordering --

function handleDragStart(e: DragEvent, index: number) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // Required for Firefox drag-and-drop support
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function handleDragOver(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dropTargetIndex.value = null
    return
  }
  dropTargetIndex.value = index
}

function handleDragEnd() {
  if (dragIndex.value !== null && dropTargetIndex.value !== null && dragIndex.value !== dropTargetIndex.value) {
    const arr = [...frames.value]
    const [moved] = arr.splice(dragIndex.value, 1)
    arr.splice(dropTargetIndex.value, 0, moved)
    frames.value = arr
    // Reset sort direction when manually reordered
    sortDirection.value = 'none'
  }
  dragIndex.value = null
  dropTargetIndex.value = null
}

// -- Sort frames --

function sortFrames() {
  if (frames.value.length < 2) return

  const nextDirection = sortDirection.value === 'asc' ? 'desc' : 'asc'

  const sorted = [...frames.value].sort((a, b) => {
    const cmp = a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })
    return nextDirection === 'asc' ? cmp : -cmp
  })

  frames.value = sorted
  sortDirection.value = nextDirection
  toastSuccess(nextDirection === 'asc' ? 'Frames sorted A-Z' : 'Frames sorted Z-A')
}

// -- Duplicate frame --

function duplicateFrame(index: number) {
  const source = frames.value[index]
  if (!source) return

  // Reuse the source frame's object URL instead of creating a new one.
  // removeFrame() checks whether any other frame shares the URL before revoking.
  const clone: FrameData = {
    id: nextFrameId++,
    file: source.file,
    objectUrl: source.objectUrl,
    naturalWidth: source.naturalWidth,
    naturalHeight: source.naturalHeight,
    delay: source.delay,
  }

  frames.value.splice(index + 1, 0, clone)
  toastSuccess('Frame duplicated')
}

// -- Frame management --

function removeFrame(index: number) {
  const frame = frames.value[index]
  if (frame) {
    // Only revoke the object URL if no other frame in the array shares it.
    // Duplicated frames reuse the same URL, so revoking prematurely would
    // break thumbnails and preview for sibling frames.
    const urlStillInUse = frames.value.some((f, i) => i !== index && f.objectUrl === frame.objectUrl)
    if (!urlStillInUse) {
      URL.revokeObjectURL(frame.objectUrl)
    }
  }
  frames.value.splice(index, 1)

  // If all frames removed, reset
  if (frames.value.length === 0) {
    clearAll()
  }
}

function triggerAddMore() {
  addMoreInputRef.value?.click()
}

async function handleAddMore(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  const validFiles = await validateImageFiles(Array.from(files), toastError)
  if (validFiles.length > 0) {
    await loadImageFiles(validFiles, true)
  }
  // Reset input so the same files can be selected again
  input.value = ''
}


/**
 * Loads image files and creates FrameData entries.
 * When append is true, adds to existing frames. Otherwise replaces.
 */
async function loadImageFiles(files: File[], append = false) {
  const newFrames: FrameData[] = []

  for (const file of files) {
    try {
      const dims = await getImageDimensions(file)
      newFrames.push({
        id: nextFrameId++,
        file,
        objectUrl: URL.createObjectURL(file),
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        delay: globalDelay.value,
      })
    } catch {
      toastError(`Failed to load "${file.name}". The file may be corrupted.`)
    }
  }

  if (newFrames.length === 0) return

  if (append) {
    frames.value = [...frames.value, ...newFrames]
    // Reset sort direction when new frames are added
    sortDirection.value = 'none'
  } else {
    // Clean up old object URLs
    for (const f of frames.value) {
      URL.revokeObjectURL(f.objectUrl)
    }
    frames.value = newFrames

    // Set output dimensions from first image
    const first = newFrames[0]
    outputWidth.value = first.naturalWidth
    outputHeight.value = first.naturalHeight
    sourceAspectRatio.value = first.naturalWidth / first.naturalHeight
  }
}

/** Reads natural dimensions from an image file using a temporary Image element */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight }
      // Release the decoded image data and blob URL as soon as possible
      img.src = ''
      URL.revokeObjectURL(url)
      resolve(dims)
    }
    img.onerror = () => {
      img.src = ''
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

// -- File handling --

function handleFilesSelected(files: File[]) {
  loadImageFiles(files, false)
}

function handleUploadError(message: string) {
  toastError(message)
}

function clearAll() {
  stopPreview()
  for (const f of frames.value) {
    URL.revokeObjectURL(f.objectUrl)
  }
  if (resultGifUrl.value) {
    URL.revokeObjectURL(resultGifUrl.value)
  }

  frames.value = []
  isProcessing.value = false
  currentProcessingFrame.value = 0
  progressPercent.value = 0
  resultGifUrl.value = null
  resultGifBlob.value = null
  resultGifSize.value = 0
  delayMode.value = 'global'
  delayUnit.value = 'ms'
  globalDelay.value = 200
  customDelayActive.value = false
  customDelay.value = 200
  customDelayFps.value = 5
  outputWidth.value = 0
  outputHeight.value = 0
  aspectLocked.value = true
  quality.value = 'medium'
  loopPreset.value = 'infinite'
  customLoopCount.value = 3
  playbackMode.value = 'normal'
  sortDirection.value = 'none'
  previewFrameIndex.value = 0
}

// -- GIF encoding --

/**
 * Renders a source image onto an offscreen canvas at the target dimensions.
 * Uses center-cover scaling when the source aspect ratio differs from the
 * target, cropping overflow rather than distorting.
 */
function renderFrameToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!

  // Calculate cover-fit dimensions (center-crop if aspect ratios differ)
  const srcAspect = img.naturalWidth / img.naturalHeight
  const tgtAspect = targetWidth / targetHeight

  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight

  if (srcAspect > tgtAspect) {
    // Source is wider — crop horizontally
    sw = img.naturalHeight * tgtAspect
    sx = (img.naturalWidth - sw) / 2
  } else if (srcAspect < tgtAspect) {
    // Source is taller — crop vertically
    sh = img.naturalWidth / tgtAspect
    sy = (img.naturalHeight - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight)

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

  // Release canvas memory
  canvas.width = 0
  canvas.height = 0

  return imageData
}

/** Loads an image from a URL and returns the HTMLImageElement when ready */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

async function createGif() {
  if (frames.value.length < 2 || isProcessing.value) return

  // Snapshot settings before async work
  const targetWidth = outputWidth.value
  const targetHeight = outputHeight.value
  const currentMaxColors = maxColors.value
  const currentLoopCount = effectiveLoopCount.value
  const currentDelayMode = delayMode.value
  const currentGlobalDelay = globalDelay.value
  const currentPlaybackMode = playbackMode.value

  // Revoke previous result
  if (resultGifUrl.value) {
    URL.revokeObjectURL(resultGifUrl.value)
    resultGifUrl.value = null
    resultGifBlob.value = null
    resultGifSize.value = 0
  }

  stopPreview()
  isProcessing.value = true
  currentProcessingFrame.value = 0
  progressPercent.value = 0

  try {
    // Build frame data array for modern-gif encode()
    const sourceFrames: Array<{ data: Uint8ClampedArray; delay: number }> = []

    for (let i = 0; i < frames.value.length; i++) {
      currentProcessingFrame.value = i + 1
      progressPercent.value = Math.round(((i + 1) / frames.value.length) * 100)

      const frame = frames.value[i]
      const img = await loadImage(frame.objectUrl)
      const imageData = renderFrameToCanvas(img, targetWidth, targetHeight)

      // Delay in ms — modern-gif expects delay in ms
      const delay = currentDelayMode === 'perFrame' ? frame.delay : currentGlobalDelay

      sourceFrames.push({
        data: imageData.data,
        delay,
      })
    }

    // Apply playback mode to frame ordering
    let encodingFrames: Array<{ data: Uint8ClampedArray; delay: number }>
    if (currentPlaybackMode === 'reverse') {
      encodingFrames = [...sourceFrames].reverse()
    } else if (currentPlaybackMode === 'pingPong') {
      encodingFrames = [...sourceFrames, ...sourceFrames.slice(1, -1).reverse()]
    } else {
      encodingFrames = sourceFrames
    }

    // Encode using modern-gif
    const buffer = await encodeGif({
      width: targetWidth,
      height: targetHeight,
      frames: encodingFrames,
      maxColors: currentMaxColors,
      loopCount: currentLoopCount === 0 ? undefined : currentLoopCount,
    })

    const blob = new Blob([buffer], { type: 'image/gif' })
    resultGifBlob.value = blob
    resultGifUrl.value = URL.createObjectURL(blob)
    resultGifSize.value = blob.size
    toastSuccess('GIF created successfully!')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'GIF encoding failed'
    toastError(msg)
  } finally {
    isProcessing.value = false
  }
}

// -- Download --

function downloadGif() {
  if (!resultGifBlob.value) return
  downloadBlob(resultGifBlob.value, 'animated.gif')
  toastSuccess('GIF downloaded!')
}

// -- Cleanup --

onUnmounted(() => {
  stopPreview()
  for (const f of frames.value) {
    URL.revokeObjectURL(f.objectUrl)
  }
  if (resultGifUrl.value) {
    URL.revokeObjectURL(resultGifUrl.value)
  }
})
</script>
