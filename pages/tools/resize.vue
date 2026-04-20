<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Resizer — Resize Animated GIFs Online Free</h1>
      <p class="page-subtitle mt-1">Free online GIF resizer — resize animated GIFs to exact pixel dimensions for Discord emoji, Twitch emotes, Kick, 7TV, BTTV, Slack, and more. No watermark, no signup, works in your browser.</p>
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
          <!-- Loaded GIF indicator -->
          <div class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
              <img :src="gifUrl" alt="Selected GIF" class="w-full h-full object-cover" crossorigin="anonymous" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ gifFileName }}</p>
              <p class="text-xs text-surface-500">{{ sourceWidth }}&times;{{ sourceHeight }}px &middot; Ready to resize</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Platform Presets -->
          <div>
            <h3 class="label mb-2">Resize Preset</h3>
            <div class="grid grid-cols-2 gap-2" role="radiogroup">
              <button
                v-for="preset in presets"
                :key="preset.key"
                role="radio"
                :aria-checked="selectedPreset === preset.key"
                class="platform-card flex flex-col items-start"
                :class="{ 'platform-card-active': selectedPreset === preset.key }"
                @click="selectPreset(preset.key)"
              >
                <span class="text-sm font-semibold text-surface-700">{{ preset.label }}</span>
                <span class="text-xs text-surface-400 mt-1">{{ preset.width ? `${preset.width}x${preset.height}` : 'Custom size' }}</span>
              </button>
            </div>
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
                  :max="MAX_OUTPUT_SIZE"
                  class="input text-center"
                  :disabled="selectedPreset !== 'custom'"
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
                  :max="MAX_OUTPUT_SIZE"
                  class="input text-center"
                  :disabled="selectedPreset !== 'custom'"
                  @input="handleHeightChange"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">px</span>
              </div>
            </div>
            <p v-if="selectedPreset === 'custom'" class="text-xs text-surface-400 mt-1.5 text-center">
              {{ aspectLocked ? 'Aspect ratio locked' : 'Freeform dimensions' }}
            </p>
          </div>

          <!-- Resize Mode (shown when aspect ratio changes) -->
          <div v-if="gifUrl && aspectRatioDiffers" :class="{ 'pointer-events-none opacity-60': isProcessing }">
            <h3 class="label">Resize Mode</h3>
            <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Resize mode">
              <!-- Fill & Crop -->
              <button
                class="platform-card text-center"
                :class="{ 'platform-card-active': resizeMode === 'crop' }"
                role="radio"
                :aria-checked="resizeMode === 'crop'"
                aria-label="Fill and crop"
                title="Scale to cover the target and center-crop overflow"
                @click="selectResizeMode('crop')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                  <rect x="2" y="6" width="28" height="20" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2" class="text-surface-300" />
                  <rect x="6" y="4" width="20" height="24" rx="1" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
                </svg>
                <div class="text-xs font-semibold text-surface-700">Fill & Crop</div>
                <span class="badge badge-primary text-[10px] mt-1">Recommended</span>
              </button>

              <!-- Fit & Pad -->
              <button
                class="platform-card text-center"
                :class="{ 'platform-card-active': resizeMode === 'pad' }"
                role="radio"
                :aria-checked="resizeMode === 'pad'"
                aria-label="Fit and pad"
                title="Scale to fit within the target with padding"
                @click="selectResizeMode('pad')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                  <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2" class="text-surface-300" />
                  <rect x="9" y="7" width="14" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
                </svg>
                <div class="text-xs font-semibold text-surface-700">Fit & Pad</div>
              </button>

              <!-- Stretch -->
              <button
                class="platform-card text-center"
                :class="{ 'platform-card-active': resizeMode === 'stretch' }"
                role="radio"
                :aria-checked="resizeMode === 'stretch'"
                aria-label="Stretch to fill"
                title="Stretch to fill, may distort non-square images"
                @click="selectResizeMode('stretch')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none" class="mx-auto mb-1.5">
                  <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" stroke-width="2" class="text-surface-300" />
                  <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2" class="text-primary-500" />
                  <!-- Horizontal squeeze arrows -->
                  <path d="M8 16H2M24 16H30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-warning-500" />
                  <path d="M4 14L2 16L4 18M28 14L30 16L28 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-warning-500" />
                </svg>
                <div class="text-xs font-semibold text-surface-700">Stretch</div>
                <span class="badge badge-warning text-[10px] mt-1">Distorts</span>
              </button>
            </div>

            <!-- Padding Color Presets (shown only in pad mode) -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="resizeMode === 'pad'" class="mt-3">
                <label class="label">Padding Color</label>
                <div class="flex gap-2 flex-wrap">
                  <!-- Transparent -->
                  <button
                    class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                    :class="{ 'pill-active': padColorPreset === 'transparent' }"
                    @click="selectPadColor('transparent')"
                  >
                    <span class="inline-block w-4 h-4 rounded-sm checkerboard border border-surface-200/50" />
                    <span class="text-xs">Transparent</span>
                  </button>

                  <!-- White -->
                  <button
                    class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                    :class="{ 'pill-active': padColorPreset === 'white' }"
                    @click="selectPadColor('white')"
                  >
                    <span class="inline-block w-4 h-4 rounded-sm border border-surface-300" style="background: #ffffff;" />
                    <span class="text-xs">White</span>
                  </button>

                  <!-- Black -->
                  <button
                    class="pill flex items-center gap-1.5 !px-3 !py-1.5"
                    :class="{ 'pill-active': padColorPreset === 'black' }"
                    @click="selectPadColor('black')"
                  >
                    <span class="inline-block w-4 h-4 rounded-sm" style="background: #000000;" />
                    <span class="text-xs">Black</span>
                  </button>

                  <!-- Custom -->
                  <label
                    class="pill flex items-center gap-1.5 !px-3 !py-1.5 cursor-pointer"
                    :class="{ 'pill-active': padColorPreset === 'custom' }"
                  >
                    <span
                      class="inline-block w-4 h-4 rounded-sm border border-surface-200/50"
                      :style="{ background: padColorPreset === 'custom' ? padColor : '#cccccc' }"
                    />
                    <span class="text-xs">Custom</span>
                    <input
                      type="color"
                      class="w-4 h-4 rounded cursor-pointer border border-surface-200"
                      :value="padColor === 'transparent' ? '#cccccc' : padColor"
                      @input="handleCustomColor"
                    />
                  </label>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isProcessing || isDecoding"
            @click="downloadResized"
          >
            <template v-if="isProcessing">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding...
            </template>
            <template v-else>
              <IconDownload :size="18" />
              Download Resized GIF
            </template>
          </button>
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

        <!-- GIF preview -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <img
            :src="previewUrl || gifUrl"
            alt="GIF preview"
            class="max-w-full max-h-[400px] object-contain"
          />
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>Original: {{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>Target: {{ outputWidth }}&times;{{ outputHeight }}px</span>
          <span>{{ formatFileSize(originalFileSize) }}</span>
          <span v-if="resizedFileSize">
            &rarr; {{ formatFileSize(resizedFileSize) }}
            <span :class="resizedFileSize <= originalFileSize ? 'text-success-500' : 'text-warning-500'">
              ({{ resizedFileSize <= originalFileSize ? '-' : '+' }}{{ Math.abs(Math.round((1 - resizedFileSize / originalFileSize) * 100)) }}%)
            </span>
          </span>
        </div>
      </div>

    </div>

    <!-- Related tools — resize pairs naturally with crop, compress, rotate, and trim -->
    <ToolRelated
      current="/tools/resize"
      :tools="[
        { to: '/tools/crop', label: 'GIF Crop', icon: 'IconCrop', description: 'Crop a specific region from animated GIFs' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/rotate', label: 'GIF Rotate', icon: 'IconRotate', description: 'Rotate or flip animated GIFs' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Resize a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag & drop or click to browse. Supports animated GIFs up to 20 MB. Your file never leaves your device.</li>
        <li><strong>Pick a platform preset or enter custom dimensions</strong> — one-click presets for Twitch (112x112), Discord (128x128), Kick, 7TV, BTTV, YouTube, or Slack. Or type any custom width and height up to 4096px.</li>
        <li><strong>Preview the resized GIF</strong> — see your resized animated GIF at the target dimensions before downloading. Animation, transparency, and frame timing are preserved.</li>
        <li><strong>Download your resized GIF</strong> — click to save instantly. Free, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Emote Size Guide by Platform</h2>
      <div class="overflow-x-auto rounded-xl border border-surface-200/80">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="bg-surface-100/50 text-surface-600">
              <th class="px-4 py-2 font-semibold">Platform</th>
              <th class="px-4 py-2 font-semibold">Size</th>
              <th class="px-4 py-2 font-semibold">Max File Size</th>
              <th class="px-4 py-2 font-semibold">Format</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-200/50 text-surface-500">
            <tr>
              <td class="px-4 py-2">Twitch</td>
              <td class="px-4 py-2">112 &times; 112</td>
              <td class="px-4 py-2">1 MB</td>
              <td class="px-4 py-2">GIF / PNG</td>
            </tr>
            <tr>
              <td class="px-4 py-2">Discord</td>
              <td class="px-4 py-2">128 &times; 128</td>
              <td class="px-4 py-2">256 KB</td>
              <td class="px-4 py-2">GIF / PNG / APNG</td>
            </tr>
            <tr>
              <td class="px-4 py-2">Kick</td>
              <td class="px-4 py-2">128 &times; 128</td>
              <td class="px-4 py-2">1 MB</td>
              <td class="px-4 py-2">GIF / PNG</td>
            </tr>
            <tr>
              <td class="px-4 py-2">7TV / BTTV</td>
              <td class="px-4 py-2">128 &times; 128</td>
              <td class="px-4 py-2">2.5 MB</td>
              <td class="px-4 py-2">GIF / AVIF / WebP</td>
            </tr>
            <tr>
              <td class="px-4 py-2">YouTube</td>
              <td class="px-4 py-2">128 &times; 128</td>
              <td class="px-4 py-2">1 MB</td>
              <td class="px-4 py-2">GIF / PNG</td>
            </tr>
            <tr>
              <td class="px-4 py-2">Slack</td>
              <td class="px-4 py-2">128 &times; 128</td>
              <td class="px-4 py-2">128 KB</td>
              <td class="px-4 py-2">GIF</td>
            </tr>
            <tr>
              <td class="px-4 py-2">Twitter / X</td>
              <td class="px-4 py-2">Custom</td>
              <td class="px-4 py-2">15 MB</td>
              <td class="px-4 py-2">GIF</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Use Our GIF Resizer?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>100% free, no watermark</strong> — resize GIFs without hidden costs or branding.</li>
        <li><strong>No signup or account needed</strong> — upload, resize, and download in seconds.</li>
        <li><strong>Browser-based & private</strong> — all GIF processing happens locally in your browser. Your files never leave your device.</li>
        <li><strong>Platform presets</strong> — one-click sizing for Twitch emotes (112x112), Discord emoji (128x128), Kick, 7TV, BTTV, YouTube, and Slack.</li>
        <li><strong>Preserves animation & quality</strong> — every frame is resized with high-quality interpolation. Frame timing, transparency, and loop settings are kept intact.</li>
        <li><strong>Aspect ratio control</strong> — lock or unlock the aspect ratio for precise custom dimensions.</li>
        <li><strong>Works on any device</strong> — resize GIFs on desktop, tablet, or mobile. No software to install.</li>
      </ul>

      <p class="text-sm text-surface-500 mt-6">
        Need to compress a GIF under 256 KB? Try our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> or <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">emote optimizer</NuxtLink> for smart compression. Want to cut frames? Use the <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer</NuxtLink> to shorten animations. Need to remove edges? Use the <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">GIF cropper</NuxtLink>. Or <NuxtLink to="/search" class="text-primary-500 hover:underline">search our GIF library</NuxtLink> to find the perfect emote.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I resize a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and select a target size. EmoteSizer uses high-quality interpolation to resize every frame, preserving animation smoothness and transparency. For best results, resize down rather than up — scaling a small GIF larger can cause blurriness.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What size should a Discord emoji be?</h3>
          <p class="text-sm text-surface-500 mt-1">Discord custom emojis must be 128x128 pixels and under 256 KB. Animated emoji (GIFs) require Discord Nitro. Select the Discord preset and EmoteSizer handles the resizing automatically.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I resize a GIF for Twitch emotes?</h3>
          <p class="text-sm text-surface-500 mt-1">Twitch emotes need to be 112x112 pixels and under 1 MB. Upload your GIF, select the Twitch preset, and download. Twitch auto-generates the smaller 56x56 and 28x28 sizes from your upload.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does resizing a GIF preserve the animation?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer resizes every frame of your animated GIF individually, preserving frame timing, transparency, loop count, and animation speed.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF smaller for email or Slack?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and choose a smaller dimension (e.g., 128x128 for Slack emoji). Reducing the pixel dimensions also reduces file size. For strict file size limits, use our emote optimizer with Smart Compress.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I resize a GIF to custom dimensions?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Select the "Custom" preset and enter any width and height up to 4096x4096 pixels. You can lock the aspect ratio to prevent distortion, or unlock it for freeform dimensions.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit for uploads?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to process. Your GIF never leaves your device.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does resizing add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks or branding. What you download is exactly what you resized — free, clean, and ready to use.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does resizing reduce the GIF file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes, usually. Reducing pixel dimensions reduces the data in each frame, which lowers the overall file size. For example, resizing a 500x500 GIF to 128x128 can reduce file size by 80% or more.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How is resizing different from compressing a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Resizing changes the pixel dimensions (width and height) of the GIF. Compressing reduces file size by lowering color depth, dropping frames, or adjusting quality — without changing dimensions. EmoteSizer offers both: resize here, or compress with our emote optimizer.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame, UnencodedFrame } from 'modern-gif'
import type { ResizeMode } from '~/types/optimizer'

useHead({
  title: 'Free GIF Resizer — Resize Animated GIFs Online | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Resize animated GIFs online free — no watermark, no signup. Resize GIF for Discord emoji (128x128), Twitch emotes (112x112), Kick, 7TV, BTTV, Slack. Compress & reduce GIF file size instantly.' },
    { key: 'og:title', property: 'og:title', content: 'Free GIF Resizer — Resize Animated GIFs Online | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF resizer — resize animated GIFs to exact pixel dimensions for Discord, Twitch, Kick, 7TV, BTTV, and Slack. No watermark, no signup, works in your browser.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/resize' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'Free GIF Resizer — Resize Animated GIFs Online | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Resize animated GIFs to exact emote sizes for Discord, Twitch, Kick, and more. Free browser-based GIF resizer — no watermark, no signup.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/resize' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Resizer',
        'url': 'https://emotesizer.com/tools/resize',
        'description': 'Free online GIF resizer. Resize animated GIFs to exact pixel dimensions for Discord emoji, Twitch emotes, Kick, 7TV, BTTV, Slack, and more — no watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Resize animated GIFs online',
          'Free GIF resizer no watermark',
          'Resize GIF for Discord emoji (128x128)',
          'Resize GIF for Twitch emotes (112x112)',
          'Resize GIF for Kick',
          'Resize GIF for 7TV and BTTV',
          'Resize GIF for Slack emoji',
          'Custom GIF dimensions',
          'Lock aspect ratio',
          'Scale down GIF',
          'Shrink GIF file size',
          'Resize GIF without losing animation',
          'Browser-based GIF processing',
          'No signup required',
          'Batch-ready platform presets',
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
            'name': 'How do I resize a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and select a target size. EmoteSizer uses high-quality interpolation to resize every frame, preserving animation smoothness and transparency. For best results, resize down rather than up — scaling a small GIF larger can cause blurriness.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What size should a Discord emoji be?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Discord custom emojis must be 128x128 pixels and under 256 KB. Animated emoji (GIFs) require Discord Nitro. Select the Discord preset and EmoteSizer handles the resizing automatically.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I resize a GIF for Twitch emotes?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Twitch emotes need to be 112x112 pixels and under 1 MB. Upload your GIF, select the Twitch preset, and download. Twitch auto-generates the smaller 56x56 and 28x28 sizes from your upload.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does resizing a GIF preserve the animation?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer resizes every frame of your animated GIF individually, preserving frame timing, transparency, loop count, and animation speed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF smaller for email or Slack?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and choose a smaller dimension (e.g., 128x128 for Slack emoji). Reducing the pixel dimensions also reduces file size. For strict file size limits, use our emote optimizer with Smart Compress.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I resize a GIF to custom dimensions?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Select the "Custom" preset and enter any width and height up to 4096x4096 pixels. You can lock the aspect ratio to prevent distortion, or unlock it for freeform dimensions.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit for uploads?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to process. Your GIF never leaves your device.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does resizing add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks or branding. What you download is exactly what you resized — free, clean, and ready to use.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does resizing reduce the GIF file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, usually. Reducing pixel dimensions reduces the data in each frame, which lowers the overall file size. For example, resizing a 500x500 GIF to 128x128 can reduce file size by 80% or more.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How is resizing different from compressing a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Resizing changes the pixel dimensions (width and height) of the GIF. Compressing reduces file size by lowering color depth, dropping frames, or adjusting quality — without changing dimensions. EmoteSizer offers both: resize here, or compress with our emote optimizer.',
            },
          },
        ],
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Resizer', 'item': 'https://emotesizer.com/tools/resize' },
        ],
      }),
    },
  ],
})

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const sourceWidth = ref(0)
const sourceHeight = ref(0)
const originalFileSize = ref(0)
const selectedPreset = ref('custom')
const outputWidth = ref(128)
const outputHeight = ref(128)
const aspectLocked = ref(true)
const isProcessing = ref(false)
const isDecoding = ref(false)
const previewUrl = ref<string | null>(null)
const resizedFileSize = ref(0)
const resizeMode = ref<ResizeMode>('stretch')
const padColor = ref('transparent')
const padColorPreset = ref<'transparent' | 'white' | 'black' | 'custom'>('transparent')

const MAX_OUTPUT_SIZE = 2048

/** Maximum dimension (width or height) for preview encoding. The preview image
 *  is displayed at max 400px CSS, so encoding at larger resolutions wastes
 *  GPU/memory. Full resolution is only used for downloads. */
const MAX_PREVIEW_DIM = 400

let previewAbortController: AbortController | null = null
/** Tracks the last successfully rendered preview parameters to skip redundant re-encodes */
let lastPreviewKey = ''

const aspectRatioDiffers = computed(() => {
  if (!sourceWidth.value || !sourceHeight.value || !outputWidth.value || !outputHeight.value) return false
  const sourceRatio = sourceWidth.value / sourceHeight.value
  const targetRatio = outputWidth.value / outputHeight.value
  return Math.abs(sourceRatio - targetRatio) > 0.01
})

function getPreviewDimensions(w: number, h: number): { pw: number; ph: number } {
  if (w <= MAX_PREVIEW_DIM && h <= MAX_PREVIEW_DIM) return { pw: w, ph: h }
  const scale = Math.min(MAX_PREVIEW_DIM / w, MAX_PREVIEW_DIM / h)
  return {
    pw: Math.round(w * scale),
    ph: Math.round(h * scale),
  }
}

let previewTimeout: ReturnType<typeof setTimeout> | null = null

const presets = [
  { key: 'custom', label: 'Custom', width: null, height: null },
  { key: 'twitch', label: 'Twitch', width: 112, height: 112 },
  { key: 'discord', label: 'Discord', width: 128, height: 128 },
  { key: 'kick', label: 'Kick', width: 128, height: 128 },
  { key: '7tv', label: '7TV / BTTV', width: 128, height: 128 },
  { key: 'youtube', label: 'YouTube', width: 128, height: 128 },
]

// -- Preset selection --

function selectPreset(key: string) {
  selectedPreset.value = key
  const preset = presets.find(p => p.key === key)
  if (preset?.width && preset?.height) {
    outputWidth.value = preset.width
    outputHeight.value = preset.height
    aspectLocked.value = true
  }
  debouncedPreview()
}

// -- Dimension input handlers --

function handleWidthChange() {
  selectedPreset.value = 'custom'
  outputWidth.value = Math.min(Math.max(1, outputWidth.value || 1), MAX_OUTPUT_SIZE)
  if (aspectLocked.value && sourceWidth.value) {
    outputHeight.value = Math.min(
      Math.round(outputWidth.value * (sourceHeight.value / sourceWidth.value)),
      MAX_OUTPUT_SIZE,
    )
  }
  debouncedPreview()
}

function handleHeightChange() {
  selectedPreset.value = 'custom'
  outputHeight.value = Math.min(Math.max(1, outputHeight.value || 1), MAX_OUTPUT_SIZE)
  if (aspectLocked.value && sourceHeight.value) {
    outputWidth.value = Math.min(
      Math.round(outputHeight.value * (sourceWidth.value / sourceHeight.value)),
      MAX_OUTPUT_SIZE,
    )
  }
  debouncedPreview()
}

// -- Resize mode & pad color --

function selectResizeMode(mode: ResizeMode) {
  resizeMode.value = mode
  debouncedPreview()
}

function selectPadColor(preset: 'transparent' | 'white' | 'black' | 'custom', color?: string) {
  padColorPreset.value = preset
  if (preset === 'transparent') padColor.value = 'transparent'
  else if (preset === 'white') padColor.value = '#ffffff'
  else if (preset === 'black') padColor.value = '#000000'
  else if (color) padColor.value = color
  debouncedPreview()
}

function handleCustomColor(event: Event) {
  const input = event.target as HTMLInputElement
  padColor.value = input.value
  padColorPreset.value = 'custom'
  debouncedPreview()
}

/**
 * Draws a source image onto a target canvas using the specified resize mode.
 * Supports crop (fill & center-crop), pad (fit & letterbox), and stretch modes.
 */
function drawResizedRect(
  ctx: OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  mode: ResizeMode,
  color: string,
): void {
  ctx.clearRect(0, 0, targetW, targetH)

  if (mode === 'crop') {
    const scale = Math.max(targetW / srcW, targetH / srcH)
    const scaledW = srcW * scale
    const scaledH = srcH * scale
    const offsetX = (targetW - scaledW) / 2
    const offsetY = (targetH - scaledH) / 2
    ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH)
  } else if (mode === 'pad') {
    if (color && color !== 'transparent') {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, targetW, targetH)
    }
    const scale = Math.min(targetW / srcW, targetH / srcH)
    const scaledW = srcW * scale
    const scaledH = srcH * scale
    const offsetX = (targetW - scaledW) / 2
    const offsetY = (targetH - scaledH) / 2
    ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH)
  } else {
    ctx.drawImage(source, 0, 0, targetW, targetH)
  }
}

// -- File handling --

function handleFileSelected(file: File) {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  resizedFileSize.value = 0

  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  originalFileSize.value = file.size

  const img = new Image()
  img.onload = () => {
    sourceWidth.value = img.naturalWidth
    sourceHeight.value = img.naturalHeight
    decodeGifFrames()
  }
  img.src = gifUrl.value
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
    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
    debouncedPreview()
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Frame resizing --

/**
 * Resizes all decoded frames to the target dimensions using shared canvases.
 * Creates the source and destination OffscreenCanvases once, reuses them for
 * every frame, then releases GPU/memory resources when done.
 *
 * Yields to the browser event loop between frames to prevent UI freezes on
 * large GIFs. Supports an optional AbortSignal to cancel in-flight work
 * when the user changes dimensions before processing completes.
 *
 * @returns Array of resized frame data with delays preserved
 */
async function resizeAllFrames(
  frames: DecodedFrame[],
  w: number,
  h: number,
  mode: ResizeMode,
  color: string,
  signal?: AbortSignal,
): Promise<Array<{ data: Uint8ClampedArray; delay: number }>> {
  // Allocate canvases once for the entire batch
  const srcCanvas = new OffscreenCanvas(frames[0].width, frames[0].height)
  const srcCtx = srcCanvas.getContext('2d')!
  const destCanvas = new OffscreenCanvas(w, h)
  // willReadFrequently: true hints the browser to use a software-backed surface
  // since we call getImageData on every frame — avoids costly GPU readbacks
  const destCtx = destCanvas.getContext('2d', { willReadFrequently: true })!
  destCtx.imageSmoothingEnabled = true
  destCtx.imageSmoothingQuality = 'high'

  const result: Array<{ data: Uint8ClampedArray; delay: number }> = []

  for (const frame of frames) {
    // Update source canvas dimensions if frames vary in size
    if (srcCanvas.width !== frame.width || srcCanvas.height !== frame.height) {
      srcCanvas.width = frame.width
      srcCanvas.height = frame.height
    }
    // new Uint8ClampedArray(frame.data) copies the data into a fresh ArrayBuffer,
    // avoiding TS 5.7+ issues where Uint8ClampedArray<ArrayBufferLike> is not
    // assignable to ImageDataArray (which expects ArrayBuffer, not SharedArrayBuffer)
    srcCtx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height),
      0, 0,
    )

    drawResizedRect(destCtx, srcCanvas, frame.width, frame.height, w, h, mode, color)

    const resized = destCtx.getImageData(0, 0, w, h)
    result.push({ data: resized.data, delay: frame.delay || 100 })

    // Yield to browser every frame to prevent UI freeze
    await new Promise(resolve => setTimeout(resolve, 0))

    // Check for cancellation after yielding
    if (signal?.aborted) {
      // Release canvases before throwing
      srcCanvas.width = 0
      srcCanvas.height = 0
      destCanvas.width = 0
      destCanvas.height = 0
      throw new DOMException('Aborted', 'AbortError')
    }
  }

  // Release canvas GPU/memory resources
  srcCanvas.width = 0
  srcCanvas.height = 0
  destCanvas.width = 0
  destCanvas.height = 0

  return result
}

// -- Debounced preview --

function debouncedPreview() {
  if (previewTimeout) clearTimeout(previewTimeout)
  if (!decodedFrames.value.length) return

  previewTimeout = setTimeout(async () => {
    await generatePreview()
  }, 500)
}

async function generatePreview() {
  if (previewAbortController) {
    previewAbortController.abort()
  }
  previewAbortController = new AbortController()
  const { signal } = previewAbortController

  if (!decodedFrames.value.length || !outputWidth.value || !outputHeight.value) return

  // Cap preview encoding to MAX_PREVIEW_DIM — the preview img is displayed
  // at max 400px CSS anyway, so full-resolution encoding is wasteful.
  const { pw, ph } = getPreviewDimensions(outputWidth.value, outputHeight.value)

  // Skip re-encoding if the capped preview dimensions, resize mode, and pad
  // color haven't changed — avoids redundant work when e.g. the user changes
  // from 400px to 1000px (both cap to 400px preview).
  const previewKey = `${pw}x${ph}_${resizeMode.value}_${padColor.value}`
  if (previewKey === lastPreviewKey && previewUrl.value) {
    previewAbortController = null
    return
  }

  try {
    const frames = await resizeAllFrames(decodedFrames.value, pw, ph, resizeMode.value, padColor.value, signal)

    if (signal.aborted) return

    const encoded = await encode({ width: pw, height: ph, looped: true, frames: frames as UnencodedFrame[] })

    if (signal.aborted) return

    const blob = new Blob([encoded], { type: 'image/gif' })

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(blob)
    resizedFileSize.value = blob.size
    lastPreviewKey = previewKey
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    if (import.meta.dev) console.error('Resize preview failed:', e)
  } finally {
    previewAbortController = null
  }
}

// -- Download --

async function downloadResized() {
  isProcessing.value = true
  try {
    const w = outputWidth.value
    const h = outputHeight.value
    const frames = await resizeAllFrames(decodedFrames.value, w, h, resizeMode.value, padColor.value)

    const encoded = await encode({ width: w, height: h, looped: true, frames: frames as UnencodedFrame[] })
    const blob = new Blob([encoded], { type: 'image/gif' })
    downloadBlob(blob, `resized_${gifFileName.value || 'animation.gif'}`)
    toastSuccess('Resized GIF downloaded!')
  } catch {
    toastError('Failed to encode resized GIF')
  } finally {
    isProcessing.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  if (previewAbortController) {
    previewAbortController.abort()
    previewAbortController = null
  }
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  sourceWidth.value = 0
  sourceHeight.value = 0
  originalFileSize.value = 0
  selectedPreset.value = 'custom'
  outputWidth.value = 128
  outputHeight.value = 128
  aspectLocked.value = true
  previewUrl.value = null
  resizedFileSize.value = 0
  resizeMode.value = 'stretch'
  padColor.value = 'transparent'
  padColorPreset.value = 'transparent'
  lastPreviewKey = ''
}

onUnmounted(() => {
  clearGif()
})
</script>
