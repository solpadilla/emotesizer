<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">Add Text to GIF</h1>
      <p class="page-subtitle mt-1">Add custom text, captions, subtitles, and meme text to animated GIFs. Choose from 18 fonts, customize colors and outlines, add text animations — no watermark, no signup.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- Left Column: Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Upload (shown when no GIF is loaded) -->
        <DropZone
          v-if="!gifUrl"
          accept="image/gif"
          @file-selected="handleFileSelected"
          @error="handleUploadError"
        />

        <!-- Controls (shown when a GIF is loaded) -->
        <div v-else class="space-y-4">
          <!-- GIF info card -->
          <div class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
              <img :src="gifUrl" alt="Selected GIF" class="w-full h-full object-cover" crossorigin="anonymous" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ gifFileName }}</p>
              <p class="text-xs text-surface-500">{{ sourceWidth }}&times;{{ sourceHeight }}px &middot; {{ decodedFrames.length }} frames</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Text Layers Panel -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="label !mb-0">Text Layers</h3>
              <div class="flex items-center gap-1">
                <button
                  class="btn-ghost h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600"
                  aria-label="Reset active layer to default settings"
                  @click="resetActiveLayer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Reset
                </button>
                <button
                  v-if="textLayers.length < 5"
                  class="btn-ghost h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs text-primary-500"
                  @click="addTextLayer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Text
                </button>
              </div>
            </div>
            <div class="max-h-[200px] overflow-y-auto space-y-1 thin-scrollbar">
              <div
                v-for="(layer, index) in textLayers"
                :key="layer.id"
                class="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
                :class="{
                  'bg-primary-500/10 border border-primary-500/30': index === activeLayerIndex,
                  'hover:bg-surface-100': index !== activeLayerIndex,
                  'border border-transparent': index !== activeLayerIndex,
                }"
                @click="activeLayerIndex = index"
              >
                <!-- Color dot -->
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0 border border-surface-300"
                  :style="{ backgroundColor: layer.color }"
                />
                <!-- Text preview -->
                <span class="flex-1 text-xs text-surface-700 truncate min-w-0">
                  {{ layer.text || 'Empty text' }}
                </span>
                <!-- Visibility toggle -->
                <button
                  class="btn-ghost w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  :aria-label="layer.visible ? 'Hide layer' : 'Show layer'"
                  @click.stop="layer.visible = !layer.visible"
                >
                  <!-- Eye open -->
                  <svg v-if="layer.visible" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-500">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <!-- Eye closed -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
                <!-- Delete -->
                <button
                  v-if="textLayers.length > 1"
                  class="btn-ghost w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  :aria-label="`Delete layer ${index + 1}`"
                  @click.stop="removeTextLayer(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="activeLayer">
            <h3 class="label mb-2">Text</h3>
            <div class="relative">
              <textarea
                v-model="activeLayer.text"
                class="textarea !min-h-[80px]"
                placeholder="Enter your text here..."
                maxlength="200"
                rows="3"
                aria-label="Text content"
              />
              <span class="absolute bottom-2 right-3 text-[10px] text-surface-400">
                {{ activeLayer.text.length }}/200
              </span>
            </div>
          </div>

          <!-- Quick Styles -->
          <div v-if="activeLayer">
            <h3 class="label mb-2">Quick Styles</h3>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Quick text styles">
              <button
                v-for="style in quickStyles"
                :key="style.id"
                role="radio"
                :aria-checked="false"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                @click="applyQuickStyle(style)"
              >
                {{ style.label }}
              </button>
            </div>
          </div>

          <!-- Font & Size -->
          <div v-if="activeLayer">
            <h3 class="label mb-2">Font &amp; Size</h3>
            <div class="flex items-center gap-2">
              <select
                v-model="activeLayer.fontFamily"
                class="select flex-1"
                aria-label="Font family"
                @change="loadFontIfNeeded(activeLayer.fontFamily)"
              >
                <optgroup label="Sans Serif">
                  <option value="Arial">Arial</option>
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                </optgroup>
                <optgroup label="Serif">
                  <option value="Georgia">Georgia</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                </optgroup>
                <optgroup label="Monospace">
                  <option value="Courier New">Courier New</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </optgroup>
                <optgroup label="Display">
                  <option value="Impact">Impact</option>
                  <option value="Bangers">Bangers</option>
                  <option value="Permanent Marker">Permanent Marker</option>
                  <option value="Press Start 2P">Press Start 2P</option>
                  <option value="Pacifico">Pacifico</option>
                  <option value="Lobster">Lobster</option>
                </optgroup>
              </select>
              <div class="relative w-24 flex-shrink-0">
                <input
                  v-model.number="activeLayer.fontSize"
                  type="number"
                  min="8"
                  max="200"
                  class="input text-center"
                  aria-label="Font size in pixels"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">px</span>
              </div>
            </div>
          </div>

          <!-- Formatting: Bold, Italic, Alignment -->
          <div v-if="activeLayer">
            <h3 class="label mb-2">Formatting</h3>
            <div class="flex items-center gap-3">
              <!-- Bold / Italic toggles -->
              <div class="segmented-control !p-0.5 !rounded-lg" role="group" aria-label="Text style">
                <button
                  class="segmented-control-item !px-3 !py-1.5 !rounded-md !text-xs font-bold"
                  :class="{ 'segmented-control-item-active': activeLayer.bold }"
                  aria-label="Toggle bold"
                  @click="activeLayer.bold = !activeLayer.bold"
                >
                  B
                </button>
                <button
                  class="segmented-control-item !px-3 !py-1.5 !rounded-md !text-xs italic"
                  :class="{ 'segmented-control-item-active': activeLayer.italic }"
                  aria-label="Toggle italic"
                  @click="activeLayer.italic = !activeLayer.italic"
                >
                  I
                </button>
              </div>
              <!-- Alignment -->
              <div class="segmented-control !p-0.5 !rounded-lg" role="radiogroup" aria-label="Text alignment">
                <button
                  role="radio"
                  :aria-checked="activeLayer.align === 'left'"
                  class="segmented-control-item !px-2.5 !py-1.5 !rounded-md"
                  :class="{ 'segmented-control-item-active': activeLayer.align === 'left' }"
                  @click="activeLayer.align = 'left'"
                  aria-label="Align left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
                  </svg>
                </button>
                <button
                  role="radio"
                  :aria-checked="activeLayer.align === 'center'"
                  class="segmented-control-item !px-2.5 !py-1.5 !rounded-md"
                  :class="{ 'segmented-control-item-active': activeLayer.align === 'center' }"
                  @click="activeLayer.align = 'center'"
                  aria-label="Align center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="18" y1="14" x2="6" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
                  </svg>
                </button>
                <button
                  role="radio"
                  :aria-checked="activeLayer.align === 'right'"
                  class="segmented-control-item !px-2.5 !py-1.5 !rounded-md"
                  :class="{ 'segmented-control-item-active': activeLayer.align === 'right' }"
                  @click="activeLayer.align = 'right'"
                  aria-label="Align right"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="7" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Colors -->
          <div v-if="activeLayer">
            <h3 class="label mb-2">Colors</h3>
            <div class="space-y-2.5">
              <!-- Fill Color -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500 w-14 flex-shrink-0">Fill</span>
                <input
                  v-model="activeLayer.color"
                  type="color"
                  class="w-8 h-8 rounded-md border border-surface-300 cursor-pointer p-0"
                  aria-label="Text fill color"
                />
                <input
                  v-model="activeLayer.color"
                  type="text"
                  class="input text-center text-xs !py-1.5 !min-h-[34px] flex-1"
                  maxlength="7"
                  aria-label="Text fill color hex"
                />
              </div>
              <!-- Outline Color -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500 w-14 flex-shrink-0">Outline</span>
                <input
                  v-model="activeLayer.outlineColor"
                  type="color"
                  class="w-8 h-8 rounded-md border border-surface-300 cursor-pointer p-0"
                  aria-label="Outline color"
                />
                <div class="relative flex-1">
                  <input
                    v-model.number="activeLayer.outlineWidth"
                    type="number"
                    min="0"
                    max="20"
                    class="input text-center text-xs !py-1.5 !min-h-[34px]"
                    aria-label="Outline width in pixels"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-surface-400 pointer-events-none">px</span>
                </div>
              </div>
              <!-- Shadow -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500 w-14 flex-shrink-0">Shadow</span>
                <button
                  class="toggle-switch flex-shrink-0"
                  :class="{ active: activeLayer.shadowEnabled }"
                  role="switch"
                  :aria-checked="activeLayer.shadowEnabled"
                  aria-label="Toggle text shadow"
                  @click="activeLayer.shadowEnabled = !activeLayer.shadowEnabled"
                />
              </div>
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="activeLayer.shadowEnabled" class="ml-[72px] space-y-2">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="activeLayer.shadowColor"
                      type="color"
                      class="w-7 h-7 rounded-md border border-surface-300 cursor-pointer p-0"
                      aria-label="Shadow color"
                    />
                    <div class="relative flex-1">
                      <input v-model.number="activeLayer.shadowBlur" type="number" min="0" max="20" class="input text-center text-xs !py-1 !min-h-[30px]" aria-label="Shadow blur" />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-surface-400 pointer-events-none">blur</span>
                    </div>
                    <div class="relative flex-1">
                      <input v-model.number="activeLayer.shadowOffsetX" type="number" min="-20" max="20" class="input text-center text-xs !py-1 !min-h-[30px]" aria-label="Shadow X offset" />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-surface-400 pointer-events-none">X</span>
                    </div>
                    <div class="relative flex-1">
                      <input v-model.number="activeLayer.shadowOffsetY" type="number" min="-20" max="20" class="input text-center text-xs !py-1 !min-h-[30px]" aria-label="Shadow Y offset" />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-surface-400 pointer-events-none">Y</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Background Box -->
          <div v-if="activeLayer">
            <div class="flex items-center justify-between mb-2">
              <h3 class="label !mb-0">Background Box</h3>
              <button
                class="toggle-switch flex-shrink-0"
                :class="{ active: activeLayer.backgroundEnabled }"
                role="switch"
                :aria-checked="activeLayer.backgroundEnabled"
                aria-label="Toggle text background box"
                @click="activeLayer.backgroundEnabled = !activeLayer.backgroundEnabled"
              />
            </div>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="activeLayer.backgroundEnabled" class="space-y-2.5">
                <!-- Color + Opacity -->
                <div class="flex items-center gap-2">
                  <input
                    v-model="activeLayer.backgroundColor"
                    type="color"
                    class="w-8 h-8 rounded-md border border-surface-300 cursor-pointer p-0"
                    aria-label="Background box color"
                  />
                  <div class="flex-1">
                    <input
                      v-model.number="activeLayer.backgroundOpacity"
                      type="range"
                      min="10"
                      max="100"
                      class="w-full"
                      aria-label="Background opacity"
                    />
                  </div>
                  <span class="text-xs text-surface-500 w-10 text-right flex-shrink-0">{{ activeLayer.backgroundOpacity }}%</span>
                </div>
                <!-- Padding + Border Radius -->
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">H Pad</span>
                    <input v-model.number="activeLayer.backgroundPaddingX" type="number" min="0" max="50" class="input text-center text-xs !py-1.5 !min-h-[34px]" aria-label="Horizontal padding" />
                  </div>
                  <div>
                    <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">V Pad</span>
                    <input v-model.number="activeLayer.backgroundPaddingY" type="number" min="0" max="50" class="input text-center text-xs !py-1.5 !min-h-[34px]" aria-label="Vertical padding" />
                  </div>
                  <div>
                    <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">Radius</span>
                    <input v-model.number="activeLayer.backgroundBorderRadius" type="number" min="0" max="50" class="input text-center text-xs !py-1.5 !min-h-[34px]" aria-label="Border radius" />
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Frame Range (collapsible, multi-frame only) -->
          <div v-if="activeLayer && decodedFrames.length > 1">
            <button
              class="flex items-center justify-between w-full text-left"
              @click="frameRangeOpen = !frameRangeOpen"
            >
              <h3 class="label !mb-0">Frame Range</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-400">
                  {{ activeLayer.frameStart === 0 && activeLayer.frameEnd === decodedFrames.length - 1 ? 'All frames' : `Frames ${activeLayer.frameStart + 1}-${activeLayer.frameEnd + 1}` }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400 transition-transform" :class="{ 'rotate-180': frameRangeOpen }">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="frameRangeOpen" class="mt-2 space-y-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">Start</span>
                    <input
                      :value="activeLayer.frameStart + 1"
                      type="number"
                      min="1"
                      :max="activeLayer.frameEnd + 1"
                      class="input text-center text-xs !py-1.5 !min-h-[34px]"
                      aria-label="Start frame"
                      @input="handleFrameStartInput"
                    />
                  </div>
                  <div class="flex-1">
                    <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">End</span>
                    <input
                      :value="activeLayer.frameEnd + 1"
                      type="number"
                      :min="activeLayer.frameStart + 1"
                      :max="decodedFrames.length"
                      class="input text-center text-xs !py-1.5 !min-h-[34px]"
                      aria-label="End frame"
                      @input="handleFrameEndInput"
                    />
                  </div>
                </div>
                <p class="text-xs text-surface-400">
                  Text visible on frames {{ activeLayer.frameStart + 1 }} through {{ activeLayer.frameEnd + 1 }} ({{ activeLayer.frameEnd - activeLayer.frameStart + 1 }} of {{ decodedFrames.length }})
                </p>
              </div>
            </Transition>
          </div>

          <!-- Animation (collapsible, multi-frame only) -->
          <div v-if="activeLayer && decodedFrames.length > 1">
            <button
              class="flex items-center justify-between w-full text-left"
              @click="animationOpen = !animationOpen"
            >
              <h3 class="label !mb-0">Animation</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-400">{{ animationLabels[activeLayer.animation] }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400 transition-transform" :class="{ 'rotate-180': animationOpen }">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="animationOpen" class="mt-2 space-y-2">
                <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Text animation">
                  <button
                    v-for="anim in animationOptions"
                    :key="anim.id"
                    role="radio"
                    :aria-checked="activeLayer.animation === anim.id"
                    class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                    :class="{ 'pill-active': activeLayer.animation === anim.id }"
                    @click="activeLayer.animation = anim.id"
                  >
                    {{ anim.label }}
                  </button>
                </div>
                <p class="text-xs text-surface-400">{{ animationDescriptions[activeLayer.animation] }}</p>
              </div>
            </Transition>
          </div>

          <!-- Position readout -->
          <div v-if="activeLayer" class="text-xs text-surface-400">
            Position: {{ activeLayer.x }}, {{ activeLayer.y }}px | Drag on canvas to reposition
          </div>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isEncoding || isDecoding || !hasAnyText"
            @click="downloadWithText"
          >
            <template v-if="isEncoding">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding... {{ encodeProgress }}%
            </template>
            <template v-else>
              <IconDownload :size="18" />
              Download GIF with Text
            </template>
          </button>

          <!-- Progress bar (visible during encoding) -->
          <div v-if="isEncoding" class="w-full bg-surface-200/50 rounded-full h-2">
            <div
              class="bg-primary-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: encodeProgress + '%' }"
            />
          </div>

          <!-- Tool chaining CTAs -->
          <div v-if="gifUrl && decodedFrames.length" class="pt-1">
            <p class="text-xs text-surface-400 mb-2">Continue editing this GIF</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink to="/tools/compress" aria-label="Continue editing: compress this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCompress :size="14" />
                Compress
              </NuxtLink>
              <NuxtLink to="/tools/resize" aria-label="Continue editing: resize this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconResize :size="14" />
                Resize
              </NuxtLink>
              <NuxtLink to="/tools/crop" aria-label="Continue editing: crop this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCrop :size="14" />
                Crop
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Preview -->
      <div class="lg:col-span-3">
        <!-- Empty state -->
        <div
          v-if="!gifUrl"
          class="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-surface-200 text-surface-400 text-sm"
        >
          Upload a GIF to get started
        </div>

        <!-- Interactive text canvas -->
        <div v-else class="space-y-3">
          <div class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
            <GifTextCanvas
              v-if="decodedFrames.length"
              ref="canvasComponentRef"
              :frames="decodedFrames"
              :text-layers="textLayers"
              :active-layer-index="activeLayerIndex"
              :gif-width="sourceWidth"
              :gif-height="sourceHeight"
              @update:position="handlePositionUpdate"
              @select-layer="activeLayerIndex = $event"
            />
            <!-- Loading indicator while decoding -->
            <div v-else-if="isDecoding" class="flex items-center gap-2 text-sm text-surface-400">
              <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Decoding frames...
            </div>
          </div>

          <!-- Playback controls (multi-frame only) -->
          <div v-if="decodedFrames.length > 1 && canvasComponentRef" class="flex items-center gap-3">
            <!-- Play/Pause button -->
            <button
              class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-100 hover:bg-surface-200 transition-colors flex-shrink-0"
              :aria-label="canvasComponentRef.isPlaying ? 'Pause' : 'Play'"
              @click="canvasComponentRef.togglePlay()"
            >
              <svg v-if="!canvasComponentRef.isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-surface-700">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-surface-700">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
            <!-- Frame counter -->
            <span class="text-xs text-surface-500 flex-shrink-0 w-20 text-center">
              Frame {{ canvasComponentRef.currentFrameIndex + 1 }} / {{ decodedFrames.length }}
            </span>
            <!-- Scrubber -->
            <input
              :value="canvasComponentRef.currentFrameIndex"
              type="range"
              min="0"
              :max="decodedFrames.length - 1"
              class="flex-1"
              aria-label="Frame scrubber"
              @input="handleScrubberInput"
            />
          </div>
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span>{{ textLayers.length }} text layer{{ textLayers.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

    </div>

    <!-- Related tools — text overlays commonly follow with cropping, resizing, compression, or trimming -->
    <ToolRelated
      current="/tools/add-text-to-gif"
      :tools="[
        { to: '/tools/crop', label: 'GIF Crop', icon: 'IconCrop', description: 'Crop a specific region from animated GIFs' },
        { to: '/tools/resize', label: 'GIF Resize', icon: 'IconResize', description: 'Change GIF dimensions with crop, pad, or stretch' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Add Text to a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your animated GIF</strong> -- drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Add and customize text</strong> -- type your text, choose from 18 fonts, set colors, outlines, and shadows. Use quick-style presets for meme text, captions, subtitles, and more.</li>
        <li><strong>Position and animate</strong> -- drag text directly on the canvas to position it. Add fade-in, typewriter, or slide-up animations. Set frame ranges to show text on specific frames only.</li>
        <li><strong>Download</strong> -- click "Download GIF with Text" to save your GIF with text baked in. Free, no watermark, no signup.</li>
      </ol>
      <p class="text-sm text-surface-600 leading-relaxed mt-3">
        Need to prepare your GIF first? <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">Crop</NuxtLink>,
        <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize</NuxtLink>,
        <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">trim frames</NuxtLink>, or
        <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">adjust the speed</NuxtLink> before adding text.
        After adding text, <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress your GIF</NuxtLink> to reduce file size.
      </p>
      <p class="text-xs text-surface-400 mt-2">All processing happens in your browser -- <NuxtLink to="/tools#how-it-works" class="text-primary-500 hover:underline">see how the in-browser pipeline works</NuxtLink>.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Text Layers, Animations, and Frame Range Control</h2>
      <p class="text-sm text-surface-600">
        The editor stacks text on top of the source GIF as independent layers, each with its own typography, position, animation, and per-layer frame range. The combination of those four controls covers nearly every text-on-GIF use case without needing to round-trip through Photoshop.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2 mt-3">
        <li><strong>Up to 5 layers per GIF</strong> — enough for "meme top + meme bottom + small attribution" or for sequenced dialogue where two captions take turns over different frame ranges.</li>
        <li><strong>18 fonts</strong> — sans-serif, serif, monospace, and display faces including Impact (the canonical meme font), Bangers, Pacifico, and Press Start 2P. Fonts load on demand from Google Fonts.</li>
        <li><strong>Outline, shadow, and background box</strong> — the three legibility hacks that make text survive on top of busy or fast-changing GIF backgrounds. The meme preset turns on outline by default with the classic Impact white-on-black look.</li>
        <li><strong>Per-layer animation</strong> — fade in, fade out, typewriter, and slide. The animation runs across the layer's frame range, so a typewriter caption finishing at frame 30 of a 60-frame GIF is one click.</li>
        <li><strong>Frame range slider</strong> — text doesn't have to appear on every frame. Set a start and end frame for each layer to add timed dialogue, sequence-based captions, or a credit that only shows at the end.</li>
      </ul>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">Use Cases — Meme GIFs, Captions, Subtitles &amp; More</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Meme GIFs</strong> — Add classic white Impact text with black outline to create viral meme GIFs. Use the "Meme Top" and "Meme Bottom" presets for instant results.</li>
        <li><strong>Captions &amp; Subtitles</strong> — Add readable captions with a semi-transparent background box. Perfect for making GIFs accessible or adding context to reaction GIFs.</li>
        <li><strong>Watermarks &amp; Branding</strong> — Add your name, logo text, or URL as a subtle text overlay on any GIF to protect your content.</li>
        <li><strong>Animated Text Effects</strong> — Use fade-in, typewriter, or slide-up animations to make your text more engaging. Great for social media GIFs and Discord emotes.</li>
        <li><strong>Frame-by-Frame Text</strong> — Add different text to different frames of your GIF using the frame range control. Create GIFs that tell a story or show dialogue.</li>
      </ul>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">GIF Text for Discord, Twitch &amp; Social Media</h2>
      <p class="text-sm text-surface-600 mb-3">
        Add text to GIFs for use across all your favorite platforms. After adding your text, use our companion tools to optimize for each platform's requirements:
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Discord Animated Emoji</strong> — Add text, then <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 128x128px</NuxtLink> and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress under 256 KB</NuxtLink> for Discord emoji upload.</li>
        <li><strong>Discord Stickers</strong> — Add captions to sticker GIFs, then resize to 320x320px. Keep file size under 512 KB.</li>
        <li><strong>Twitch &amp; 7TV/BTTV Emotes</strong> — Add text to emote GIFs, then resize to 28x28, 56x56, or 112x112px for Twitch and third-party emote platforms.</li>
        <li><strong>Instagram, Twitter &amp; Reddit</strong> — Add captions, meme text, or subtitles to GIFs before sharing on social media. Most platforms support GIFs up to 15 MB.</li>
      </ul>
    </section>

    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">Quality &amp; File Size Tips</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Text outline improves readability</strong> — A 2-3px black outline around white text ensures your text is legible on any background, just like professional memes and captions.</li>
        <li><strong>Use background boxes for long text</strong> — Enable the semi-transparent background box behind your text for subtitle-style captions that are always easy to read.</li>
        <li><strong>Large file? Compress after</strong> — Adding text may slightly increase file size. Use our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> afterward to optimize the file size.</li>
        <li><strong>Resize first, text second</strong> — For the best results, <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize your GIF</NuxtLink> to the final dimensions before adding text. This ensures text looks crisp at the target size.</li>
        <li><strong>Fewer text layers = smaller files</strong> — Each text layer adds visual complexity. Use only the layers you need for the cleanest result.</li>
      </ul>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I add text to a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, type your text in the editor, customize the font, color, and style, then drag it into position on the canvas. Click "Download GIF with Text" to save. The text is composited onto each frame and re-encoded so it bakes into the animation rather than overlaying as HTML.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I add multiple text overlays to a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. You can add up to 5 independent text layers, each with its own font, color, position, outline, shadow, and animation settings. This is perfect for meme-style top and bottom text.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I animate the text on my GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Choose from six animation effects: None, Fade In, Fade Out, Fade In/Out, Typewriter, and Slide Up. You can also set frame ranges so text only appears on specific frames of the animation.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What fonts are available?</h3>
          <p class="text-sm text-surface-500 mt-1">18 fonts across four categories: Sans Serif (Arial, Inter, Montserrat, Open Sans, Roboto, Oswald, Bebas Neue), Serif (Georgia, Playfair Display, Merriweather), Monospace (Courier New, JetBrains Mono), and Display (Impact, Bangers, Permanent Marker, Press Start 2P, Pacifico, Lobster).</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does adding text increase the file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Adding text re-encodes the GIF, which may slightly change the file size. The text is rendered directly onto each frame as pixels. You can always use our GIF compressor afterward to optimize the file size.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you designed -- free, clean, and ready to use.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I add text to a GIF on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer works in any modern mobile browser. The text controls and drag-to-position canvas are touch-friendly. No app download needed.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I add text to a GIF without Photoshop?</h3>
          <p class="text-sm text-surface-500 mt-1">EmoteSizer lets you add text to GIFs directly in your browser — no Photoshop, no software download, no signup needed. Just upload your GIF, type your text, customize the font and colors, and download. It's a free Photoshop alternative for GIF text editing.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I add text to a GIF on iPhone or Android?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes! EmoteSizer works in any mobile browser on iPhone, iPad, and Android devices. There's no app to install — just open emotesizer.com/tools/add-text-to-gif in Safari or Chrome, upload your GIF, and add text directly on your phone.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a meme GIF with text?</h3>
          <p class="text-sm text-surface-500 mt-1">Use the "Meme Top" or "Meme Bottom" quick style presets to instantly apply classic meme formatting — white Impact font with a black outline. You can add text to both the top and bottom of your GIF using multiple text layers.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What's the best free GIF text editor online?</h3>
          <p class="text-sm text-surface-500 mt-1">EmoteSizer is a free, browser-based GIF text editor with no watermark and no signup. It offers 18 fonts, text animations, outlines, shadows, background boxes, and frame-by-frame text control — more features than most free alternatives like EZGIF.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I add different text to different frames of a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes! Use the Frame Range control to specify exactly which frames each text layer appears on. Combined with multiple text layers, you can create GIFs where different text appears at different times in the animation.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame, UnencodedFrame } from 'modern-gif'

// -- Types --

interface TextLayer {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  x: number
  y: number
  visible: boolean
  outlineColor: string
  outlineWidth: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  backgroundEnabled: boolean
  backgroundColor: string
  backgroundOpacity: number
  backgroundPaddingX: number
  backgroundPaddingY: number
  backgroundBorderRadius: number
  frameStart: number
  frameEnd: number
  animation: 'none' | 'fade-in' | 'fade-out' | 'fade-in-out' | 'typewriter' | 'slide-up'
}

type AnimationType = TextLayer['animation']

// -- SEO --

useHead({
  title: 'Add Text to GIF — Caption & Meme Editor | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF text editor — add text, captions, and meme text to animated GIFs. Custom fonts, colors, outlines, text animations. No watermark, no signup, no download required. Works on any device.' },
    { key: 'og:title', property: 'og:title', content: 'Add Text to GIF — Caption & Meme Editor | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF text editor — add text, captions, and meme text to animated GIFs. Custom fonts, colors, outlines, text animations. No watermark, no signup, no download required. Works on any device.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/add-text-to-gif' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'Add Text to GIF — Caption & Meme Editor | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF text editor — add text, captions, and meme text to animated GIFs. Custom fonts, colors, outlines, text animations. No watermark, no signup. Works on any device.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/add-text-to-gif' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Add Text to GIF — GIF Text Editor',
        'url': 'https://emotesizer.com/tools/add-text-to-gif',
        'description': 'Free online GIF text editor. Add text, captions, and meme text to animated GIFs with custom fonts, colors, outlines, shadows, and animations. No watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Up to 5 independent text layers per GIF',
          '18 font choices including Impact, Bangers, and Pacifico',
          'Text outline, shadow, and background box with opacity',
          'Animations: fade, typewriter, and slide',
          'Per-layer frame range control',
          'Drag-to-position text placement',
          'Browser-based — no upload required',
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
            'name': 'How do I add text to a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, type your text in the editor, customize the font, color, and style, then drag it into position on the canvas. Click "Download GIF with Text" to save. The text is composited onto each frame and re-encoded so it bakes into the animation rather than overlaying as HTML.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I add multiple text overlays to a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. You can add up to 5 independent text layers, each with its own font, color, position, outline, shadow, and animation settings.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I animate the text on my GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Choose from six animation effects: None, Fade In, Fade Out, Fade In/Out, Typewriter, and Slide Up. You can also set frame ranges so text only appears on specific frames.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What fonts are available?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '18 fonts across four categories: Sans Serif (Arial, Inter, Montserrat, Open Sans, Roboto, Oswald, Bebas Neue), Serif (Georgia, Playfair Display, Merriweather), Monospace (Courier New, JetBrains Mono), and Display (Impact, Bangers, Permanent Marker, Press Start 2P, Pacifico, Lobster).',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does adding text increase the file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Adding text re-encodes the GIF, which may slightly change the file size. The text is rendered directly onto each frame as pixels. You can use the GIF compressor afterward to optimize the file size.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you designed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I add text to a GIF on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer works in any modern mobile browser. The text controls and drag-to-position canvas are touch-friendly. No app download needed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I add text to a GIF without Photoshop?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'EmoteSizer lets you add text to GIFs directly in your browser — no Photoshop, no software download, no signup needed. Just upload your GIF, type your text, customize the font and colors, and download. It\'s a free Photoshop alternative for GIF text editing.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I add text to a GIF on iPhone or Android?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes! EmoteSizer works in any mobile browser on iPhone, iPad, and Android devices. There\'s no app to install — just open emotesizer.com/tools/add-text-to-gif in Safari or Chrome, upload your GIF, and add text directly on your phone.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a meme GIF with text?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Use the "Meme Top" or "Meme Bottom" quick style presets to instantly apply classic meme formatting — white Impact font with a black outline. You can add text to both the top and bottom of your GIF using multiple text layers.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What\'s the best free GIF text editor online?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'EmoteSizer is a free, browser-based GIF text editor with no watermark and no signup. It offers 18 fonts, text animations, outlines, shadows, background boxes, and frame-by-frame text control — more features than most free alternatives like EZGIF.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I add different text to different frames of a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes! Use the Frame Range control to specify exactly which frames each text layer appears on. Combined with multiple text layers, you can create GIFs where different text appears at different times in the animation.',
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
        'name': 'How to Add Text to a GIF Online',
        'description': 'Add text, captions, and meme text to any animated GIF online using EmoteSizer\'s free GIF text editor. No signup, no watermark.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your animated GIF',
            'text': 'Drag and drop or click to browse. Supports animated GIFs up to 20 MB.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Add and customize text',
            'text': 'Type your text, choose from 18 fonts, set colors, outlines, and shadows. Use quick-style presets for meme text, captions, subtitles, and more. Add up to 5 independent text layers.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Position and animate',
            'text': 'Drag text directly on the canvas to position it. Add fade-in, typewriter, or slide-up animations. Set frame ranges to show text on specific frames only.',
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Download your GIF with text',
            'text': 'Click "Download GIF with Text" to save your GIF with the text baked in. Free, no watermark, no account needed.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Text Editor' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'Add Text to GIF', 'item': 'https://emotesizer.com/tools/add-text-to-gif' },
        ],
      }),
    },
  ],
})

// -- Composables --

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()
import { getAnimationState, wrapText, drawRoundRect } from '~/composables/useTextRendering'

// -- Reactive state --

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const isDecoding = ref(false)
const isEncoding = ref(false)
const encodeProgress = ref(0)
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

const sourceWidth = ref(0)
const sourceHeight = ref(0)

const textLayers = ref<TextLayer[]>([])
const activeLayerIndex = ref(0)
/** Type for the GifTextCanvas exposed API (defineExpose) */
interface GifTextCanvasExposed {
  currentFrameIndex: number
  isPlaying: boolean
  togglePlay: () => void
  seekToFrame: (index: number) => void
}

const canvasComponentRef = ref<GifTextCanvasExposed | null>(null)

// Collapsible section states
const frameRangeOpen = ref(false)
const animationOpen = ref(false)

// -- Computed --

const activeLayer = computed(() => textLayers.value[activeLayerIndex.value] ?? null)
const hasAnyText = computed(() => textLayers.value.some(l => l.text.trim().length > 0))

// -- Font loading --

/** Set of Google Font family names already loaded into the document */
const loadedFonts = new Set<string>()

/** Track font link elements so they can be removed on unmount */
const loadedFontLinks = new Map<string, HTMLLinkElement>()

/** System fonts that don't need to be loaded from Google Fonts */
const systemFonts = new Set(['Arial', 'Georgia', 'Courier New', 'Impact'])

function loadFontIfNeeded(fontFamily: string) {
  if (systemFonts.has(fontFamily) || loadedFonts.has(fontFamily)) return

  // Load from Google Fonts
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`
  document.head.appendChild(link)
  loadedFonts.add(fontFamily)
  loadedFontLinks.set(fontFamily, link)
}

// -- Quick styles --

interface QuickStyle {
  id: string
  label: string
  fontFamily: string
  fontSize: number
  color: string
  outlineColor: string
  outlineWidth: number
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  uppercase?: boolean
  yPosition?: 'top' | 'center' | 'bottom'
  backgroundEnabled?: boolean
  backgroundColor?: string
  backgroundOpacity?: number
}

const quickStyles: QuickStyle[] = [
  { id: 'meme-top', label: 'Meme Top', fontFamily: 'Impact', fontSize: 48, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 3, bold: false, italic: false, align: 'center', uppercase: true, yPosition: 'top' },
  { id: 'meme-bottom', label: 'Meme Bottom', fontFamily: 'Impact', fontSize: 48, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 3, bold: false, italic: false, align: 'center', uppercase: true, yPosition: 'bottom' },
  { id: 'caption', label: 'Caption', fontFamily: 'Arial', fontSize: 24, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 0, bold: false, italic: false, align: 'center', yPosition: 'bottom', backgroundEnabled: true, backgroundColor: '#000000', backgroundOpacity: 70 },
  { id: 'subtitle', label: 'Subtitle', fontFamily: 'Arial', fontSize: 20, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 1, bold: false, italic: false, align: 'center', yPosition: 'bottom' },
  { id: 'title', label: 'Title', fontFamily: 'Montserrat', fontSize: 36, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 2, bold: true, italic: false, align: 'center' },
  { id: 'minimal', label: 'Minimal', fontFamily: 'Inter', fontSize: 18, color: '#FFFFFF', outlineColor: '#000000', outlineWidth: 0, bold: false, italic: false, align: 'center' },
  { id: 'retro', label: 'Retro', fontFamily: 'Press Start 2P', fontSize: 16, color: '#FFD700', outlineColor: '#000000', outlineWidth: 2, bold: false, italic: false, align: 'center' },
]

function applyQuickStyle(style: QuickStyle) {
  const layer = activeLayer.value
  if (!layer) return

  loadFontIfNeeded(style.fontFamily)

  layer.fontFamily = style.fontFamily
  layer.fontSize = style.fontSize
  layer.color = style.color
  layer.outlineColor = style.outlineColor
  layer.outlineWidth = style.outlineWidth
  layer.bold = style.bold
  layer.italic = style.italic
  layer.align = style.align

  // Apply uppercase transformation if specified
  if (style.uppercase && layer.text) {
    layer.text = layer.text.toUpperCase()
  }

  // Apply vertical position preset
  if (style.yPosition === 'top') {
    layer.y = Math.round(sourceHeight.value * 0.15)
  } else if (style.yPosition === 'bottom') {
    layer.y = Math.round(sourceHeight.value * 0.85)
  }
  layer.x = Math.round(sourceWidth.value / 2)

  // Apply background box if specified
  if (style.backgroundEnabled) {
    layer.backgroundEnabled = true
    layer.backgroundColor = style.backgroundColor || '#000000'
    layer.backgroundOpacity = style.backgroundOpacity || 70
    layer.backgroundPaddingX = 8
    layer.backgroundPaddingY = 4
    layer.backgroundBorderRadius = 4
  } else {
    layer.backgroundEnabled = false
  }
}

// -- Animation options --

const animationOptions: { id: AnimationType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'fade-in', label: 'Fade In' },
  { id: 'fade-out', label: 'Fade Out' },
  { id: 'fade-in-out', label: 'Fade In/Out' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'slide-up', label: 'Slide Up' },
]

const animationLabels: Record<AnimationType, string> = {
  'none': 'None',
  'fade-in': 'Fade In',
  'fade-out': 'Fade Out',
  'fade-in-out': 'Fade In/Out',
  'typewriter': 'Typewriter',
  'slide-up': 'Slide Up',
}

const animationDescriptions: Record<AnimationType, string> = {
  'none': 'Text appears on all visible frames with no animation.',
  'fade-in': 'Text fades in from transparent over the first 20% of visible frames.',
  'fade-out': 'Text fades out to transparent over the last 20% of visible frames.',
  'fade-in-out': 'Text fades in at the start and out at the end.',
  'typewriter': 'Text appears one character at a time across the visible frames.',
  'slide-up': 'Text slides up into position over the first 15% of visible frames.',
}

// -- Layer management --

function createDefaultLayer(): TextLayer {
  return {
    id: crypto.randomUUID(),
    text: '',
    fontFamily: 'Impact',
    fontSize: 32,
    color: '#FFFFFF',
    bold: false,
    italic: false,
    align: 'center',
    x: Math.round(sourceWidth.value / 2),
    y: Math.round(sourceHeight.value / 2),
    visible: true,
    outlineColor: '#000000',
    outlineWidth: 2,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    backgroundEnabled: false,
    backgroundColor: '#000000',
    backgroundOpacity: 70,
    backgroundPaddingX: 8,
    backgroundPaddingY: 4,
    backgroundBorderRadius: 4,
    frameStart: 0,
    frameEnd: Math.max(0, decodedFrames.value.length - 1),
    animation: 'none',
  }
}

function addTextLayer() {
  if (textLayers.value.length >= 5) return
  const layer = createDefaultLayer()
  textLayers.value.push(layer)
  activeLayerIndex.value = textLayers.value.length - 1
}

function resetActiveLayer() {
  if (!activeLayer.value) return
  const defaults = createDefaultLayer()
  // Preserve the layer's ID
  const id = activeLayer.value.id
  Object.assign(activeLayer.value, defaults, { id })
}

function removeTextLayer(index: number) {
  if (textLayers.value.length <= 1) return
  textLayers.value.splice(index, 1)
  if (activeLayerIndex.value >= textLayers.value.length) {
    activeLayerIndex.value = textLayers.value.length - 1
  }
}

// -- Frame range handlers --

function handleFrameStartInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!activeLayer.value || isNaN(val)) return
  const maxFrame = decodedFrames.value.length - 1
  activeLayer.value.frameStart = Math.max(0, Math.min(val - 1, maxFrame, activeLayer.value.frameEnd))
}

function handleFrameEndInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!activeLayer.value || isNaN(val)) return
  const maxFrame = decodedFrames.value.length - 1
  activeLayer.value.frameEnd = Math.max(activeLayer.value.frameStart, Math.min(val - 1, maxFrame))
}

// -- Position update from canvas --

function handlePositionUpdate(payload: { layerIndex: number; x: number; y: number }) {
  const layer = textLayers.value[payload.layerIndex]
  if (layer) {
    layer.x = payload.x
    layer.y = payload.y
  }
}

// -- Scrubber --

function handleScrubberInput(e: Event) {
  const input = e.target as HTMLInputElement
  const frame = parseInt(input.value, 10)
  if (canvasComponentRef.value && !isNaN(frame)) {
    canvasComponentRef.value.isPlaying = false
    canvasComponentRef.value.seekToFrame(frame)
  }
}

// -- File handling --

function handleFileSelected(file: File) {
  // Always clean up previous blob URL first to prevent memory leaks
  if (gifUrl.value) {
    URL.revokeObjectURL(gifUrl.value)
    gifUrl.value = ''
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
  if (file.size > MAX_FILE_SIZE) {
    toastError(`File is too large. Maximum size is 20 MB.`)
    return
  }

  resetState()
  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

async function decodeGifFrames() {
  isDecoding.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    gifMetadata.value = decode(uint8)
    const frames = decodeFrames(uint8)

    if (frames.length === 0) {
      toastError('No frames could be decoded from this GIF. The file may be invalid.')
      if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
      gifUrl.value = ''
      isDecoding.value = false
      return
    }

    decodedFrames.value = frames

    sourceWidth.value = frames[0].width
    sourceHeight.value = frames[0].height

    // Create one default text layer
    textLayers.value = [createDefaultLayer()]
    activeLayerIndex.value = 0
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
    if (gifUrl.value) {
      URL.revokeObjectURL(gifUrl.value)
      gifUrl.value = ''
    }
  } finally {
    isDecoding.value = false
  }
}

// -- Encoding & Download --

/**
 * Renders all visible text layers onto a canvas context at source resolution.
 * Used during export encoding (no dashed selection border).
 * Accepts an optional layers array to support snapshot-based rendering during encoding.
 */
function renderTextLayersToContext(ctx: CanvasRenderingContext2D, frameIndex: number, width: number, height: number, layers: TextLayer[]) {
  for (const layer of layers) {
    if (!layer.visible || !layer.text) continue
    if (frameIndex < layer.frameStart || frameIndex > layer.frameEnd) continue

    const { alpha, text, yOffset } = getAnimationState(layer, frameIndex)
    if (alpha <= 0 || !text) continue

    const fontStyle = layer.italic ? 'italic' : ''
    const fontWeight = layer.bold ? 'bold' : ''
    const fontString = `${fontStyle} ${fontWeight} ${layer.fontSize}px "${layer.fontFamily}", sans-serif`.trim()
    ctx.font = fontString
    ctx.textBaseline = 'middle'

    const maxWidth = width - 20
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = layer.fontSize * 1.25

    let maxLineWidth = 0
    for (const line of lines) {
      const lw = ctx.measureText(line).width
      if (lw > maxLineWidth) maxLineWidth = lw
    }

    const totalTextHeight = lines.length * lineHeight
    const x = layer.x
    const y = layer.y + yOffset

    // Offset the background box based on alignment direction
    let alignOffsetX = 0
    if (layer.align === 'center') alignOffsetX = -maxLineWidth / 2
    else if (layer.align === 'right') alignOffsetX = -maxLineWidth
    // left: alignOffsetX = 0

    // Background box
    if (layer.backgroundEnabled) {
      const padX = layer.backgroundPaddingX
      const padY = layer.backgroundPaddingY
      const margin = 10
      let bgAnchorX: number
      if (layer.align === 'center') bgAnchorX = width / 2
      else if (layer.align === 'left') bgAnchorX = margin
      else bgAnchorX = width - margin
      const bgX = bgAnchorX + alignOffsetX - padX
      const bgY = y - totalTextHeight / 2 - padY
      const bgW = maxLineWidth + padX * 2
      const bgH = totalTextHeight + padY * 2
      const radius = layer.backgroundBorderRadius

      ctx.save()
      ctx.globalAlpha = alpha * (layer.backgroundOpacity / 100)
      ctx.fillStyle = layer.backgroundColor
      drawRoundRect(ctx, bgX, bgY, bgW, bgH, radius)
      ctx.fill()
      ctx.restore()
    }

    // Text rendering
    ctx.save()
    ctx.globalAlpha = alpha

    if (layer.shadowEnabled) {
      ctx.shadowColor = layer.shadowColor
      ctx.shadowBlur = layer.shadowBlur
      ctx.shadowOffsetX = layer.shadowOffsetX
      ctx.shadowOffsetY = layer.shadowOffsetY
    }

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      let lx: number
      const ly = y - totalTextHeight / 2 + lineIdx * lineHeight + lineHeight / 2

      // Snap left/right to GIF edges with margin
      const margin = 10
      if (layer.align === 'center') {
        lx = width / 2
        ctx.textAlign = 'center'
      } else if (layer.align === 'left') {
        lx = margin
        ctx.textAlign = 'left'
      } else {
        lx = width - margin
        ctx.textAlign = 'right'
      }

      if (layer.outlineWidth > 0) {
        ctx.strokeStyle = layer.outlineColor
        ctx.lineWidth = layer.outlineWidth * 2
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(line, lx, ly)
      }

      ctx.fillStyle = layer.color
      ctx.fillText(line, lx, ly)
    }

    ctx.restore()
  }
}

async function encodeGifWithText(): Promise<Blob> {
  const frames = decodedFrames.value

  if (!frames.length) {
    throw new Error('No frames to encode')
  }

  // Deep-copy text layers to prevent mutations during encoding
  const layerSnapshot = JSON.parse(JSON.stringify(textLayers.value)) as TextLayer[]

  const fw = frames[0].width
  const fh = frames[0].height

  // Use regular HTMLCanvasElement instead of OffscreenCanvas for broader browser compatibility
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = fw
  srcCanvas.height = fh
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!

  // Second canvas for compositing text
  const textCanvas = document.createElement('canvas')
  textCanvas.width = fw
  textCanvas.height = fh
  const textCtx = textCanvas.getContext('2d')!

  const encodedFrames: Array<{ data: Uint8ClampedArray; delay: number }> = []

  // Pre-allocate a reusable ImageData to avoid ~400MB of temporary allocations
  // on large GIFs (e.g. 100 frames at 1000x1000 = 400MB without reuse)
  const reusableImageData = new ImageData(fw, fh)

  try {
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]

      // Render base frame — reuse ImageData to avoid per-frame allocation
      reusableImageData.data.set(new Uint8ClampedArray(frame.data))
      srcCtx.putImageData(reusableImageData, 0, 0)

      // Draw the base frame onto the text canvas, then overlay text
      textCtx.clearRect(0, 0, fw, fh)
      textCtx.drawImage(srcCanvas, 0, 0)

      // Render text layers at source resolution using the snapshot
      renderTextLayersToContext(textCtx, i, fw, fh, layerSnapshot)

      // Extract composited pixel data — must copy since getImageData returns a view
      const composited = textCtx.getImageData(0, 0, fw, fh)
      encodedFrames.push({ data: new Uint8ClampedArray(composited.data), delay: frame.delay || 100 })

      // Update progress
      encodeProgress.value = Math.round(((i + 1) / frames.length) * 100)

      // Yield to browser every 20 frames to prevent UI freeze
      if (i % 20 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
  } finally {
    srcCanvas.width = 0
    srcCanvas.height = 0
    textCanvas.width = 0
    textCanvas.height = 0
  }

  const encoded = await encode({
    width: fw,
    height: fh,
    looped: gifMetadata.value?.looped ?? true,
    frames: encodedFrames as UnencodedFrame[],
  })

  return new Blob([encoded], { type: 'image/gif' })
}

async function downloadWithText() {
  if (!hasAnyText.value) return

  // Load all needed fonts
  for (const layer of textLayers.value) {
    if (layer.text && layer.visible) {
      loadFontIfNeeded(layer.fontFamily)
    }
  }
  // Wait for ALL fonts to be loaded
  await document.fonts.ready

  isEncoding.value = true
  encodeProgress.value = 0

  try {
    const blob = await encodeGifWithText()
    const baseName = gifFileName.value?.replace(/\.gif$/i, '') || 'animation'
    downloadBlob(blob, `${baseName}_text.gif`)
    toastSuccess('GIF with text downloaded!')
  } catch {
    toastError('Failed to encode GIF with text')
  } finally {
    isEncoding.value = false
    encodeProgress.value = 0
  }
}

// -- State reset --

function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  gifMetadata.value = null
  textLayers.value = []
  activeLayerIndex.value = 0
  sourceWidth.value = 0
  sourceHeight.value = 0
  frameRangeOpen.value = false
  animationOpen.value = false
  encodeProgress.value = 0
}

function clearGif() {
  resetState()
}

onUnmounted(() => {
  clearGif()
  loadedFontLinks.forEach(link => link.remove())
  loadedFontLinks.clear()
})
</script>
