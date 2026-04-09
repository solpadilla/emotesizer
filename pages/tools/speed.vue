<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Speed Changer — Speed Up or Slow Down GIFs Online Free</h1>
      <p class="page-subtitle mt-1">Speed up, slow down, or adjust GIF animation speed online — free, no watermark, no signup.</p>
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
              <p class="text-xs text-surface-500">
                {{ decodedFrames.length }} frames &middot;
                <template v-if="hasVariableDelays">variable timing (avg {{ avgDelayMs }}ms)</template>
                <template v-else>{{ originalDelayMs }}ms per frame</template>
              </p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Single-frame notice -->
          <p v-if="decodedFrames.length === 1 && !isDecoding" class="text-sm text-surface-500">
            This GIF has only 1 frame — speed controls are not applicable.
          </p>

          <!-- Speed controls (only for multi-frame GIFs) -->
          <template v-if="decodedFrames.length > 1">
            <!-- Mode Switcher -->
            <div class="flex items-center gap-2">
              <div class="segmented-control flex-1" role="radiogroup" aria-label="Speed control mode">
                <button
                  v-for="mode in modes"
                  :key="mode.value"
                  role="radio"
                  :aria-checked="activeMode === mode.value"
                  class="segmented-control-item flex-1 justify-center"
                  :class="{ 'segmented-control-item-active': activeMode === mode.value }"
                  @click="activeMode = mode.value"
                >
                  {{ mode.label }}
                </button>
              </div>
              <!-- Reset to 1x — only visible when speed has been changed -->
              <button
                v-if="isSpeedChanged"
                class="btn-ghost h-9 px-2 rounded-lg flex items-center justify-center flex-shrink-0"
                aria-label="Reset speed to original"
                title="Reset to 1x"
                @click="handleReset"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            </div>

            <!-- Speed Mode -->
            <div v-if="activeMode === 'speed'">
              <h3 class="label mb-2">Playback Speed</h3>
              <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Playback speed">
                <button
                  v-for="preset in speedPresets"
                  :key="preset"
                  role="radio"
                  :aria-checked="speedMultiplier === preset"
                  class="pill"
                  :class="{ 'pill-active': speedMultiplier === preset }"
                  @click="setSpeed(preset)"
                >
                  {{ preset }}x
                </button>
              </div>

              <!-- Fine-Tune Slider -->
              <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 id="slider-label" class="label !mb-0">Fine-Tune</h3>
                  <span class="text-sm font-medium text-primary-500">{{ speedLabel }}</span>
                </div>
                <input
                  :value="speedMultiplier"
                  type="range"
                  min="0.1"
                  max="8"
                  step="0.05"
                  class="w-full accent-primary-500"
                  aria-labelledby="slider-label"
                  @input="handleSliderInput"
                />
                <div class="flex justify-between text-xs text-surface-400 mt-1">
                  <span>0.1x (slower)</span>
                  <span>8x (faster)</span>
                </div>
              </div>
            </div>

            <!-- FPS Mode -->
            <div v-if="activeMode === 'fps'">
              <h3 class="label mb-2">Target FPS</h3>
              <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Target frames per second">
                <button
                  v-for="preset in fpsPresets"
                  :key="preset"
                  role="radio"
                  :aria-checked="targetFps === preset"
                  class="pill"
                  :class="{ 'pill-active': targetFps === preset }"
                  @click="setTargetFps(preset)"
                >
                  {{ preset }}
                </button>
              </div>

              <div class="mt-4">
                <div class="relative">
                  <input
                    v-model.number="targetFps"
                    type="number"
                    min="1"
                    max="50"
                    class="input text-center"
                    aria-label="Target frames per second"
                    @input="handleFpsInput"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">FPS</span>
                </div>
                <p class="helper-text">
                  = {{ displaySpeed }}x speed, {{ computedDelay }}ms per frame
                </p>
                <p v-if="hasVariableDelays" class="text-xs text-warning-500 mt-1">
                  This GIF has variable timing. Target FPS is approximate.
                </p>
              </div>
            </div>

            <!-- Duration Mode -->
            <div v-if="activeMode === 'duration'">
              <h3 class="label mb-2">Target Duration</h3>
              <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Target duration">
                <button
                  v-for="preset in durationPresets"
                  :key="preset"
                  role="radio"
                  :aria-checked="targetDuration === preset"
                  class="pill"
                  :class="{ 'pill-active': targetDuration === preset }"
                  @click="setTargetDuration(preset)"
                >
                  {{ preset }}s
                </button>
              </div>

              <div class="mt-4">
                <div class="relative">
                  <input
                    v-model.number="targetDuration"
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    class="input text-center"
                    aria-label="Target duration in seconds"
                    @input="handleDurationInput"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">seconds</span>
                </div>
                <p class="helper-text">
                  = {{ displaySpeed }}x speed, {{ computedFps }} FPS
                </p>
                <p class="text-xs text-surface-400 mt-1">
                  Original: {{ originalDuration.toFixed(1) }}s
                </p>
              </div>
            </div>

            <!-- Advanced: raw frame delay (progressive disclosure) -->
            <div>
              <button
                class="flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
                :aria-expanded="showAdvanced"
                @click="showAdvanced = !showAdvanced"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="transition-transform"
                  :class="{ 'rotate-90': showAdvanced }"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Advanced: raw frame delay
              </button>

              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="showAdvanced" class="mt-3 space-y-3">
                  <!-- Reference: original delay -->
                  <div class="text-xs text-surface-400">
                    Original:
                    <template v-if="hasVariableDelays">avg {{ avgDelayMs }}ms</template>
                    <template v-else>{{ originalDelayMs }}ms</template>
                  </div>

                  <!-- Custom delay input -->
                  <div class="flex items-center gap-3">
                    <div class="relative flex-1">
                      <input
                        v-model.number="customDelayMs"
                        type="number"
                        min="2"
                        max="1000"
                        class="input text-center"
                        aria-label="Frame delay in milliseconds"
                        @input="handleDelayInput"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">ms</span>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Edge case warnings -->
            <div v-if="computedDelay <= 20" class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-warning-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p class="text-xs text-warning-700">Frame delay has reached the 20ms minimum. Going faster would cause browsers to slow the GIF down due to a rendering quirk.</p>
            </div>

            <div v-if="computedDelay > 1000" class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p class="text-xs text-primary-700">Frame delay exceeds 1 second. The result will play like a slideshow.</p>
            </div>
          </template>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isEncoding || isDecoding"
            @click="downloadGif"
          >
            <template v-if="isEncoding">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding...
            </template>
            <template v-else>
              <IconDownload :size="18" />
              {{ isSpeedChanged ? 'Download Modified GIF' : 'Download GIF' }}
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

        <!-- GIF preview: side-by-side when speed changed, single otherwise -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
          <!-- Side-by-side preview -->
          <div v-if="isSpeedChanged && previewUrl" class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 flex flex-col items-center">
              <img
                :src="gifUrl"
                alt="Original GIF"
                class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
              />
              <span class="mt-2 text-xs font-medium text-surface-500">Original</span>
            </div>
            <div class="flex-1 flex flex-col items-center">
              <img
                :src="previewUrl"
                alt="Modified GIF"
                class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
              />
              <span class="mt-2 badge badge-primary">{{ displaySpeed }}x</span>
            </div>
          </div>
          <!-- Single centered preview -->
          <div v-else class="flex items-center justify-center">
            <img
              :src="previewUrl || gifUrl"
              alt="GIF preview"
              class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
            />
          </div>
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span v-if="isSpeedChanged">
            {{ hasVariableDelays ? `avg ${avgDelayMs}ms` : `${originalDelayMs}ms` }}
            &rarr;
            {{ hasVariableDelays ? `avg ${Math.round(avgDelayMs / displaySpeed)}ms` : `${Math.round(originalDelayMs / displaySpeed)}ms` }}
          </span>
          <span v-if="isSpeedChanged">{{ originalFps }} FPS &rarr; {{ computedFps }} FPS</span>
          <span>{{ speedLabel }}</span>
        </div>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Change GIF Speed Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB. Your file never leaves your device.</li>
        <li><strong>Adjust the speed</strong> — use preset buttons to speed up a GIF (2x, 4x, 8x) or slow down a GIF (0.5x, 0.25x, 0.1x). Switch to FPS mode to target a specific frame rate, or Duration mode to set an exact playback length. Fine-tune with the slider, or enter a custom frame delay in the advanced section for precise control over GIF animation speed.</li>
        <li><strong>Download</strong> — click "Download Modified GIF" to save your speed-adjusted GIF. Free online, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Change GIF Speed?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Slow-motion effects</strong> — slow down fast animations to highlight details or create dramatic pauses.</li>
        <li><strong>Speed up long GIFs</strong> — compress viewing time without removing frames, keeping the full animation intact.</li>
        <li><strong>Fix timing issues</strong> — correct GIFs that play too fast or too slow for their intended purpose.</li>
        <li><strong>Create emote effects</strong> — adjust GIF speed for more expressive Twitch, Discord, or Kick emotes.</li>
        <li><strong>100% free, no watermark</strong> — no hidden costs, no branding added to your GIF.</li>
        <li><strong>Browser-based & private</strong> — all processing happens locally in your browser. Your GIF never leaves your device — no upload to server.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Adjust GIF Speed for Twitch, Discord & 7TV Emotes</h2>
      <p class="text-sm text-surface-600 mb-3">
        Emote timing matters. A GIF speed changer for Twitch or Discord can mean the difference between an emote that gets approved and one that gets rejected. Each platform has specific rules around animation speed, frame count, and file size — and adjusting playback speed is often the easiest way to fix compliance issues.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Twitch animated emotes</strong> — must be under 1 MB with a maximum of 60 frames, and animations cannot flash more than 3 times per second. Slowing down a fast emote can fix seizure-safety rejections without re-creating the animation.</li>
        <li><strong>Discord animated emoji</strong> — 256 KB limit at 128&times;128px. Speeding up a GIF can reduce the perceived frame count and, when combined with compression, help you hit the file size limit.</li>
        <li><strong>7TV / BTTV / FFZ emotes</strong> — speed adjustments help hit platform size limits while keeping animations smooth and visually appealing.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        Combine with our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to meet platform file size limits after adjusting speed.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF Frame Delay & FPS Explained</h2>
      <p class="text-sm text-surface-600">
        Every frame in a GIF has a delay value that controls the time between frames, measured in centiseconds (hundredths of a second). GIF frame delay is what determines the animation's perceived speed — lower delay means a faster GIF, higher delay means slower. Our advanced controls let you set the exact delay in milliseconds for precise GIF frame rate tuning.
      </p>
      <p class="text-sm text-surface-600 mt-3">
        A 2x speed multiplier halves each frame's delay (e.g., 100ms becomes 50ms), while 0.5x doubles it (100ms becomes 200ms). The tool shows the computed GIF FPS so you can fine-tune to common frame rates — 10-15 FPS is standard for most GIFs, while emotes often work best at 12-20 FPS. Variable-delay GIFs (where frames have different timings) are handled proportionally, preserving the animation's relative timing.
      </p>
      <p class="text-sm text-surface-600 mt-3">
        Note that most browsers enforce a minimum delay of about 20ms (~50 FPS). GIFs with very low delays may appear to play at the same speed regardless of the set value — this is a browser limitation, not a tool limitation.
      </p>

      <p class="text-sm text-surface-500 mt-6">
        Need to cut frames? Use our <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer</NuxtLink> to shorten animations. Want to resize? Try our <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink>. Or <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress your GIF</NuxtLink> to reduce file size.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I change the speed of a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, pick a preset speed (0.1x to 8x) or use the fine-tune slider, preview the result, and download. It's completely free online — no signup, no watermark.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I speed up a GIF online for free?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and select a speed multiplier greater than 1x — for example, 2x or 4x. You can also enter any custom speed value. Preview the faster animation, then download instantly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I slow down a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Speed changes only modify frame delay timing, not pixel data. Select a multiplier below 1x (e.g., 0.5x or 0.25x) to slow your GIF down. Quality is preserved exactly — no frames are re-compressed or altered.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the best FPS for a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">10-15 FPS is standard for most GIFs. Emotes typically work well at 12-20 FPS. Our tool shows the computed FPS as you adjust speed, so you can fine-tune to your target frame rate.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I change GIF speed for Discord or Twitch emotes?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Adjust speed to fix animation timing, meet seizure-safety guidelines, or reduce file size when combined with compression. This tool works great as a GIF speed changer for Discord and Twitch emote workflows.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF 2x speed?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and click the 2x preset button. The frame delays are halved instantly. Preview the result and download — that's it.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is GIF frame delay?</h3>
          <p class="text-sm text-surface-500 mt-1">Frame delay controls the time between frames, measured in centiseconds in the GIF specification. Lower delay means faster animation, higher delay means slower. Our advanced controls let you set the exact delay in milliseconds for precise timing.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why is my GIF playing too fast?</h3>
          <p class="text-sm text-surface-500 mt-1">Browsers enforce a minimum frame delay of about 20ms (~50 FPS). GIFs with very low delays may appear to play at the same speed regardless of the set value. If you need your GIF even faster, consider removing frames with our <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer</NuxtLink> instead.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does changing GIF speed affect quality?</h3>
          <p class="text-sm text-surface-500 mt-1">No. Speed changes only modify the timing between frames. Colors, transparency, and pixel data remain completely untouched. The number of frames stays the same as the original.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. All processing happens entirely in your browser — your files stay private and are never uploaded to a server.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'GIF Speed Changer - Speed Up or Slow Down GIFs Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF speed changer. Speed up or slow down GIF animations instantly in your browser. Perfect for Twitch & Discord emotes. No watermark, no signup.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Speed Changer - Speed Up or Slow Down GIFs Free | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF speed changer. Speed up or slow down GIF animations instantly in your browser. Perfect for Twitch & Discord emotes. No watermark, no signup.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/speed' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Speed Changer - Speed Up or Slow Down GIFs Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF speed changer. Speed up or slow down GIF animations instantly in your browser. Perfect for Twitch & Discord emotes. No watermark, no signup.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/speed' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Speed Changer',
        'url': 'https://emotesizer.com/tools/speed',
        'description': 'Free online GIF speed changer. Speed up or slow down GIF animations instantly in your browser. Adjust frame delay, preview in real time, and download. Perfect for Twitch & Discord emotes. No watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Speed up GIF',
          'Slow down GIF',
          'Change GIF animation speed',
          'GIF frame delay editor',
          'Adjust GIF FPS',
          'Target FPS mode',
          'Target duration mode',
          'Speed range 0.1x to 8x',
          'Side-by-side preview',
          'Free online GIF speed changer',
          'No watermark',
          'Preset speed multipliers (0.1x to 8x)',
          'Fine-tune speed slider',
          'Custom frame delay in milliseconds',
          'Variable frame delay support',
          'Live preview',
          'No signup required',
          'Browser-based GIF processing — files never leave your device',
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
            'name': 'How do I change the speed of a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, pick a preset speed (0.1x to 8x) or use the fine-tune slider, preview the result, and download. It\'s completely free online — no signup, no watermark.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I speed up a GIF online for free?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and select a speed multiplier greater than 1x — for example, 2x or 4x. You can also enter any custom speed value. Preview the faster animation, then download instantly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I slow down a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Speed changes only modify frame delay timing, not pixel data. Select a multiplier below 1x (e.g., 0.5x or 0.25x) to slow your GIF down. Quality is preserved exactly — no frames are re-compressed or altered.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the best FPS for a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '10-15 FPS is standard for most GIFs. Emotes typically work well at 12-20 FPS. Our tool shows the computed FPS as you adjust speed, so you can fine-tune to your target frame rate.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I change GIF speed for Discord or Twitch emotes?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Adjust speed to fix animation timing, meet seizure-safety guidelines, or reduce file size when combined with compression. This tool works great as a GIF speed changer for Discord and Twitch emote workflows.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF 2x speed?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and click the 2x preset button. The frame delays are halved instantly. Preview the result and download.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is GIF frame delay?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Frame delay controls the time between frames, measured in centiseconds in the GIF specification. Lower delay means faster animation, higher delay means slower. Our advanced controls let you set the exact delay in milliseconds for precise timing.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why is my GIF playing too fast?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Browsers enforce a minimum frame delay of about 20ms (~50 FPS). GIFs with very low delays may appear to play at the same speed regardless of the set value. This is a browser limitation, not a tool limitation.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does changing GIF speed affect quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. Speed changes only modify the timing between frames. Colors, transparency, and pixel data remain completely untouched. The number of frames stays the same as the original.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. All processing happens entirely in your browser — your files stay private and are never uploaded to a server.',
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
        'name': 'How to Change GIF Speed Online',
        'description': 'Speed up or slow down an animated GIF using EmoteSizer\'s free online GIF speed changer. Adjust animation speed, frame delay, and FPS — no signup, no watermark.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your GIF',
            'text': 'Drag and drop or click to browse. Supports animated GIFs up to 20 MB. Your file is processed entirely in your browser and never leaves your device.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Adjust GIF animation speed',
            'text': 'Speed up your GIF with 2x, 4x, or 8x presets, slow it down with 0.5x, 0.25x, or 0.1x, or use the fine-tune slider for any custom speed. Switch to FPS mode to target a specific frame rate, or Duration mode to set an exact playback length. Advanced users can set exact frame delay in milliseconds.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Download your speed-adjusted GIF',
            'text': 'Click "Download Modified GIF" to save your GIF with the new speed. Free online, no watermark, no account needed.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Speed Changer' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Speed Changer', 'item': 'https://emotesizer.com/tools/speed' },
        ],
      }),
    },
  ],
})

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()

// -- Reactive state --

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const speedMultiplier = ref(1.0)
const showAdvanced = ref(false)
const customDelayMs = ref(100)
const isDecoding = ref(false)
const isEncoding = ref(false)
const isPreviewEncoding = ref(false)
const previewUrl = ref<string | null>(null)
/** Stores decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

const speedPresets = [0.1, 0.25, 0.5, 1, 1.5, 2, 4, 8] as const
const fpsPresets = [10, 12, 15, 20, 24, 30] as const
const durationPresets = [1, 2, 3, 5, 10] as const

type SpeedMode = 'speed' | 'fps' | 'duration'
const activeMode = ref<SpeedMode>('speed')
const targetFps = ref(15)
const targetDuration = ref(3.0)

const modes = [
  { value: 'speed' as SpeedMode, label: 'Speed' },
  { value: 'fps' as SpeedMode, label: 'FPS' },
  { value: 'duration' as SpeedMode, label: 'Duration' },
]

let previewTimeout: ReturnType<typeof setTimeout> | null = null

// -- Computed --

/** Whether the speed has been changed from the default 1x */
const isSpeedChanged = computed(() => Math.abs(speedMultiplier.value - 1) > 0.001)

/** The original per-frame delay in ms (uses first frame as reference) */
const originalDelayMs = computed(() => {
  if (!decodedFrames.value.length) return 100
  return decodedFrames.value[0].delay || 100
})

/** Average delay across all frames */
const avgDelayMs = computed(() => {
  if (!decodedFrames.value.length) return 100
  const total = decodedFrames.value.reduce((sum, f) => sum + (f.delay || 100), 0)
  return Math.round(total / decodedFrames.value.length)
})

/** Whether the GIF has variable (non-uniform) frame delays */
const hasVariableDelays = computed(() => {
  if (decodedFrames.value.length < 2) return false
  const first = decodedFrames.value[0].delay || 100
  return decodedFrames.value.some(f => (f.delay || 100) !== first)
})

/** Reference delay: uses average for variable-delay GIFs, first-frame delay otherwise */
const referenceDelay = computed(() =>
  hasVariableDelays.value ? avgDelayMs.value : originalDelayMs.value,
)

/** The original FPS (based on average delay) */
const originalFps = computed(() => {
  if (referenceDelay.value <= 0) return 0
  return Math.round(1000 / referenceDelay.value)
})

/** The computed delay after applying the speed multiplier (based on reference delay) */
const computedDelay = computed(() => {
  return Math.max(20, Math.round(referenceDelay.value / speedMultiplier.value))
})

/** FPS after speed change */
const computedFps = computed(() => {
  if (computedDelay.value <= 0) return 0
  return Math.round(1000 / computedDelay.value)
})

/** Speed multiplier formatted for display, stripping floating-point noise */
const displaySpeed = computed(() => {
  // toFixed(2) then drop unnecessary trailing zeros: 1.50 -> 1.5, 2.00 -> 2
  return parseFloat(speedMultiplier.value.toFixed(2))
})

/** Human-readable speed label */
const speedLabel = computed(() => {
  const s = displaySpeed.value
  if (Math.abs(s - 1) < 0.001) return '1x (original)'
  if (s > 1) return `${s}x faster`
  return `${s}x slower`
})

/** Total original duration in seconds */
const originalDuration = computed(() => {
  if (!decodedFrames.value.length) return 0
  return decodedFrames.value.reduce((sum, f) => sum + (f.delay || 100), 0) / 1000
})

/** Modified duration after speed change */
const modifiedDuration = computed(() => {
  if (speedMultiplier.value <= 0) return 0
  return originalDuration.value / speedMultiplier.value
})

// -- File handling --

/** Resets all speed/mode state to defaults */
function resetSpeedState() {
  speedMultiplier.value = 1.0
  activeMode.value = 'speed'
  targetFps.value = 15
  targetDuration.value = 3.0
  showAdvanced.value = false
  customDelayMs.value = 100
}

/** Resets speed controls back to 1x without clearing the uploaded GIF */
function handleReset() {
  resetSpeedState()
  // Revoke the modified preview since we're back to original speed
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  // Re-sync custom delay from the original frame data
  customDelayMs.value = decodedFrames.value[0]?.delay || 100
}

function handleFileSelected(file: File) {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null

  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  resetSpeedState()
  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

/** Decodes all frames from the current GIF */
async function decodeGifFrames() {
  isDecoding.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    gifMetadata.value = decode(uint8)
    const frames = decodeFrames(uint8)
    decodedFrames.value = frames

    // Initialize custom delay from the first frame's delay
    customDelayMs.value = frames[0]?.delay || 100
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Speed control handlers --

function setSpeed(preset: number) {
  speedMultiplier.value = preset
  syncDelayFromSpeed()
}

function handleSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  // Round to 2 decimal places to avoid floating-point drift
  speedMultiplier.value = Math.round(parseFloat(target.value) * 100) / 100
  syncDelayFromSpeed()
}

/** Updates the custom delay input to match the current speed multiplier */
function syncDelayFromSpeed() {
  customDelayMs.value = Math.round(referenceDelay.value / speedMultiplier.value)
}

/** Updates the speed multiplier to match a manually-entered delay value */
function handleDelayInput() {
  const clamped = Math.max(20, Math.min(1000, customDelayMs.value || 20))
  customDelayMs.value = clamped
  if (clamped > 0 && referenceDelay.value > 0) {
    speedMultiplier.value = Math.round((referenceDelay.value / clamped) * 100) / 100
  }
}

// -- FPS mode handlers --

function setTargetFps(fps: number) {
  targetFps.value = fps
  const origFps = originalFps.value
  if (origFps > 0) {
    speedMultiplier.value = Math.round((fps / origFps) * 100) / 100
    syncDelayFromSpeed()
  }
}

function handleFpsInput() {
  const clamped = Math.max(1, Math.min(50, targetFps.value || 1))
  targetFps.value = clamped
  setTargetFps(clamped)
}

// -- Duration mode handlers --

function setTargetDuration(seconds: number) {
  targetDuration.value = seconds
  const origDuration = originalDuration.value
  if (origDuration > 0) {
    speedMultiplier.value = Math.round((origDuration / seconds) * 100) / 100
    syncDelayFromSpeed()
  }
}

function handleDurationInput() {
  const clamped = Math.max(0.1, Math.min(60, targetDuration.value || 0.1))
  targetDuration.value = clamped
  setTargetDuration(clamped)
}

// -- Encoding helper --

/** Builds encode parameters with speed-adjusted frame delays */
function buildSpeedModifiedEncodeParams(frames: DecodedFrame[], multiplier: number) {
  return {
    width: frames[0].width,
    height: frames[0].height,
    looped: gifMetadata.value?.looped ?? true,
    frames: frames.map(f => ({
      data: f.data,
      delay: Math.max(20, Math.round((f.delay || 100) / multiplier)),
    })),
  }
}

// -- Debounced preview re-encode --

watch(speedMultiplier, () => {
  if (previewTimeout) clearTimeout(previewTimeout)

  if (!decodedFrames.value.length || decodedFrames.value.length <= 1) return

  // At 1x speed, revert to original GIF URL (no re-encode needed)
  if (!isSpeedChanged.value) {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    return
  }

  previewTimeout = setTimeout(async () => {
    const frames = decodedFrames.value
    if (!frames.length) return

    isPreviewEncoding.value = true
    try {
      const encoded = await encode(buildSpeedModifiedEncodeParams(frames, speedMultiplier.value))
      const blob = new Blob([encoded], { type: 'image/gif' })

      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      if (import.meta.dev) console.error('Speed preview failed:', e)
    } finally {
      isPreviewEncoding.value = false
    }
  }, 400)
})

// -- Mode synchronization --
// When switching modes, sync the target values from the current speedMultiplier
watch(activeMode, (newMode) => {
  if (newMode === 'fps') {
    targetFps.value = Math.round(computedFps.value)
  } else if (newMode === 'duration') {
    targetDuration.value = parseFloat(modifiedDuration.value.toFixed(1))
  }
})

// -- Download --

async function downloadGif() {
  const baseName = gifFileName.value || 'animation.gif'

  // Cancel any pending preview encode to avoid race conditions and blob URL leaks
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }

  // No speed change — download original as-is
  if (!isSpeedChanged.value && gifUrl.value) {
    isEncoding.value = true
    try {
      const response = await fetch(gifUrl.value)
      const blob = await response.blob()
      downloadBlob(blob, baseName)
    } finally {
      isEncoding.value = false
    }
    return
  }

  // If we already have a finished preview blob (not mid-encode), reuse it
  if (previewUrl.value && !isPreviewEncoding.value) {
    isEncoding.value = true
    try {
      const response = await fetch(previewUrl.value)
      const blob = await response.blob()
      downloadBlob(blob, `speed_${speedMultiplier.value}x_${baseName}`)
      toastSuccess('GIF downloaded!')
    } finally {
      isEncoding.value = false
    }
    return
  }

  // Revoke any stale preview URL before encoding fresh to prevent blob leaks
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  // Encode fresh
  isEncoding.value = true
  try {
    const frames = decodedFrames.value
    const encoded = await encode(buildSpeedModifiedEncodeParams(frames, speedMultiplier.value))
    const blob = new Blob([encoded], { type: 'image/gif' })
    downloadBlob(blob, `speed_${speedMultiplier.value}x_${baseName}`)
    toastSuccess('GIF downloaded!')
  } catch {
    toastError('Failed to encode GIF')
  } finally {
    isEncoding.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  resetSpeedState()
  previewUrl.value = null
  gifMetadata.value = null
}

onUnmounted(() => {
  clearGif()
})
</script>
