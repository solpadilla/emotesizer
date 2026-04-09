<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Compressor — Compress Animated GIFs Online Free</h1>
      <p class="page-subtitle mt-1">Free online GIF compressor and file size reducer — make your GIF smaller without losing quality. Smart auto-compression to meet platform limits for Twitch, Discord, Kick, and 7TV emotes, or use manual strategies for full control. No watermark, no signup, no upload — processed entirely in your browser.</p>
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
              <p class="text-xs text-surface-500">{{ sourceWidth }}&times;{{ sourceHeight }}px &middot; {{ formatFileSize(originalFileSize) }}</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Compression Mode -->
          <div>
            <h3 class="label mb-2">Compression Mode</h3>
            <div class="segmented-control w-full" role="radiogroup" aria-label="Compression mode">
              <button
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': compressionMode === 'smart' }"
                role="radio"
                :aria-checked="compressionMode === 'smart'"
                @click="compressionMode = 'smart'"
              >
                Smart Compress
              </button>
              <button
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': compressionMode === 'manual' }"
                role="radio"
                :aria-checked="compressionMode === 'manual'"
                @click="compressionMode = 'manual'"
              >
                Manual
              </button>
            </div>
          </div>

          <!-- Smart Compress Mode -->
          <div v-if="compressionMode === 'smart'">
            <h3 class="label mb-2">Target Platform</h3>
            <div class="grid grid-cols-2 gap-2" role="radiogroup">
              <button
                v-for="preset in platformPresets"
                :key="preset.key"
                role="radio"
                :aria-checked="selectedPlatform === preset.key"
                class="platform-card flex flex-col items-start"
                :class="{ 'platform-card-active': selectedPlatform === preset.key }"
                @click="selectedPlatform = preset.key"
              >
                <span class="text-sm font-semibold text-surface-700">{{ preset.label }}</span>
                <span class="text-xs text-surface-400 mt-1">{{ preset.description }}</span>
              </button>
            </div>

            <!-- Custom target size input -->
            <Transition name="fade">
              <div v-if="selectedPlatform === 'custom'" class="mt-3">
                <h3 class="label mb-2">Target Size</h3>
                <div class="relative">
                  <input
                    v-model.number="customTargetKB"
                    type="number"
                    min="10"
                    max="10240"
                    class="input text-center"
                    placeholder="256"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">KB</span>
                </div>
              </div>
            </Transition>

            <!-- Compress button -->
            <button
              class="btn btn-primary btn-lg w-full mt-4"
              :disabled="isCompressing || isDecoding"
              @click="runSmartCompress"
            >
              <template v-if="isCompressing">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {{ currentStrategyLabel || 'Compressing...' }}
              </template>
              <template v-else>
                <IconCompress :size="18" />
                Smart Compress
              </template>
            </button>
          </div>

          <!-- Manual Mode -->
          <div v-if="compressionMode === 'manual'">
            <h3 class="label mb-2">Compression Strategies</h3>
            <div class="space-y-3">
              <!-- Lossless group -->
              <div>
                <p class="text-[11px] text-surface-400 uppercase tracking-wide font-medium mb-1.5">Lossless</p>
                <div class="space-y-1.5">
                  <label
                    v-for="strategy in strategyGroups.lossless"
                    :key="strategy.id"
                    class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    :class="selectedStrategies.includes(strategy.id)
                      ? 'bg-primary-500/5 border-2 border-primary-500/30'
                      : 'border-2 border-surface-200/80 hover:border-surface-300/80'"
                  >
                    <input
                      v-model="selectedStrategies"
                      type="checkbox"
                      :value="strategy.id"
                      class="checkbox mt-0.5 flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-700">{{ strategy.name }}</span>
                        <span class="badge badge-success">Lossless</span>
                      </div>
                      <p class="text-xs text-surface-400 mt-0.5">{{ strategy.description }}</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Near-lossless group -->
              <div>
                <p class="text-[11px] text-surface-400 uppercase tracking-wide font-medium mb-1.5">Near-lossless</p>
                <div class="space-y-1.5">
                  <label
                    v-for="strategy in strategyGroups.nearLossless"
                    :key="strategy.id"
                    class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    :class="selectedStrategies.includes(strategy.id)
                      ? 'bg-primary-500/5 border-2 border-primary-500/30'
                      : 'border-2 border-surface-200/80 hover:border-surface-300/80'"
                  >
                    <input
                      v-model="selectedStrategies"
                      type="checkbox"
                      :value="strategy.id"
                      class="checkbox mt-0.5 flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-700">{{ strategy.name }}</span>
                        <span class="badge badge-info">Near-lossless</span>
                      </div>
                      <p class="text-xs text-surface-400 mt-0.5">{{ strategy.description }}</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Moderate group -->
              <div>
                <p class="text-[11px] text-surface-400 uppercase tracking-wide font-medium mb-1.5">Moderate</p>
                <div class="space-y-1.5">
                  <label
                    v-for="strategy in strategyGroups.moderate"
                    :key="strategy.id"
                    class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    :class="selectedStrategies.includes(strategy.id)
                      ? 'bg-primary-500/5 border-2 border-primary-500/30'
                      : 'border-2 border-surface-200/80 hover:border-surface-300/80'"
                  >
                    <input
                      v-model="selectedStrategies"
                      type="checkbox"
                      :value="strategy.id"
                      class="checkbox mt-0.5 flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-700">{{ strategy.name }}</span>
                        <span class="badge badge-warning">Moderate</span>
                      </div>
                      <p class="text-xs text-surface-400 mt-0.5">{{ strategy.description }}</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Heavy group -->
              <div>
                <p class="text-[11px] text-surface-400 uppercase tracking-wide font-medium mb-1.5">Heavy</p>
                <div class="space-y-1.5">
                  <label
                    v-for="strategy in strategyGroups.heavy"
                    :key="strategy.id"
                    class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    :class="selectedStrategies.includes(strategy.id)
                      ? 'bg-primary-500/5 border-2 border-primary-500/30'
                      : 'border-2 border-surface-200/80 hover:border-surface-300/80'"
                  >
                    <input
                      v-model="selectedStrategies"
                      type="checkbox"
                      :value="strategy.id"
                      class="checkbox mt-0.5 flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-surface-700">{{ strategy.name }}</span>
                        <span class="badge badge-error">Heavy</span>
                      </div>
                      <p class="text-xs text-surface-400 mt-0.5">{{ strategy.description }}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Apply button -->
            <button
              class="btn btn-primary btn-lg w-full mt-4"
              :disabled="isCompressing || isDecoding || selectedStrategies.length === 0"
              @click="runManualCompress"
            >
              <template v-if="isCompressing">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {{ currentStrategyLabel || 'Applying...' }}
              </template>
              <template v-else>
                <IconCompress :size="18" />
                Apply Selected ({{ selectedStrategies.length }})
              </template>
            </button>
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

        <!-- GIF preview -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <img
            :src="compressedPreviewUrl || gifUrl"
            alt="GIF preview"
            class="max-w-full max-h-[400px] object-contain"
          />
        </div>

        <!-- File size comparison card -->
        <div v-if="compressedFileSize > 0" class="card mt-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-surface-500">Original: <strong class="text-surface-700">{{ formatFileSize(originalFileSize) }}</strong></span>
            <span class="text-surface-500">Compressed: <strong class="text-surface-700">{{ formatFileSize(compressedFileSize) }}</strong></span>
          </div>
          <!-- Proportion bar -->
          <div class="h-3 rounded-full bg-surface-200/50 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="compressedFileSize <= originalFileSize ? 'bg-success-500' : 'bg-warning-500'"
              :style="{ width: `${Math.min(100, Math.round((compressedFileSize / originalFileSize) * 100))}%` }"
            />
          </div>
          <!-- Savings text -->
          <p
            class="text-sm font-semibold mt-2"
            :class="compressedFileSize <= originalFileSize ? 'text-success-500' : 'text-warning-500'"
          >
            {{ compressedFileSize <= originalFileSize ? '-' : '+' }}{{ Math.abs(savingsPercent) }}%
            ({{ formatFileSize(Math.abs(originalFileSize - compressedFileSize)) }} {{ compressedFileSize <= originalFileSize ? 'saved' : 'larger' }})
          </p>
        </div>

        <!-- Compression history -->
        <div v-if="compressionLog.length > 0" class="card mt-4">
          <h4 class="text-sm font-semibold text-surface-700 mb-2">Compression History</h4>
          <div class="space-y-1.5">
            <div
              v-for="(entry, idx) in compressionLog"
              :key="idx"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-surface-600">{{ entry.name }}</span>
              <span
                :class="entry.sizeAfter < entry.sizeBefore ? 'text-success-500' : 'text-surface-400'"
                class="font-medium"
              >
                {{ entry.sizeAfter < entry.sizeBefore ? '-' : '' }}{{ Math.round((1 - entry.sizeAfter / entry.sizeBefore) * 100) }}%
                ({{ formatFileSize(entry.sizeBefore) }} &rarr; {{ formatFileSize(entry.sizeAfter) }})
              </span>
            </div>
          </div>
        </div>

        <!-- Download button -->
        <button
          v-if="compressedPreviewUrl"
          class="btn btn-primary w-full mt-4"
          @click="downloadCompressed"
        >
          <IconDownload :size="18" />
          Download Compressed GIF
        </button>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span>{{ formatFileSize(originalFileSize) }}</span>
        </div>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Compress a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag & drop or click to browse. Supports animated GIFs up to 10 MB. Your file never leaves your device.</li>
        <li><strong>Choose a compression mode</strong> — use Smart Compress for automatic optimization with platform presets (Twitch, Discord, Kick, 7TV), or switch to Manual mode to pick individual strategies.</li>
        <li><strong>Compress and preview</strong> — see the compressed GIF alongside file size savings. Smart Compress tries strategies from lossless to aggressive until the target size is reached.</li>
        <li><strong>Download your compressed GIF</strong> — click to save instantly. Free, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Use Our GIF Compressor?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>100% free, no watermark</strong> — compress GIFs without hidden costs or branding.</li>
        <li><strong>No signup or account needed</strong> — upload, compress, and download in seconds.</li>
        <li><strong>Browser-based & private</strong> — all GIF processing happens locally in your browser. Your files never leave your device.</li>
        <li><strong>Smart auto-compression</strong> — one click to meet platform file size limits for Twitch (1 MB), Discord (256 KB), Kick (1 MB), and 7TV/BTTV (1 MB).</li>
        <li><strong>11 compression strategies</strong> — from lossless optimization to aggressive color reduction. Full manual control when you need it.</li>
        <li><strong>Preserves dimensions</strong> — unlike resizing, compression reduces file size without changing the GIF's width and height (unless you choose resolution reduction).</li>
        <li><strong>Works on any device</strong> — compress GIFs on desktop, tablet, or mobile. No software to install.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF Compression Strategies Explained</h2>
      <p class="text-sm text-surface-600 mb-3">
        Our GIF compressor offers 11 strategies organized by aggressiveness. Understanding each helps you choose the best approach for your use case:
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Lossless optimization</strong> — re-encodes the GIF with frame delta optimization and improved LZW compression. Reduces file size 30-70% with zero quality loss. Always the first strategy to try.</li>
        <li><strong>Duplicate frame removal</strong> — identifies frames that are 95%+ visually identical and drops them, merging their delay into the previous frame. Animation timing is preserved.</li>
        <li><strong>Lossy compression</strong> — introduces small, barely visible artifacts to achieve further size reduction. Available at three levels: light (30), moderate (60), and aggressive (80-100).</li>
        <li><strong>Color reduction</strong> — lowers the GIF palette from 256 to 128 or 64 colors. Effective for GIFs with gradients or many colors, but may cause banding on photographic content.</li>
        <li><strong>Resolution reduction</strong> — scales the GIF down to 75% or 60% of its original dimensions. Used as a last resort in Smart Compress when other strategies aren't enough.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Platform File Size Limits</h2>
      <div class="overflow-x-auto rounded-xl border border-surface-200/80">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="bg-surface-100/50 text-surface-600">
              <th class="px-4 py-2 font-semibold">Platform</th>
              <th class="px-4 py-2 font-semibold">Max File Size</th>
              <th class="px-4 py-2 font-semibold">Emote Size</th>
              <th class="px-4 py-2 font-semibold">Format</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-200/50 text-surface-500">
            <tr><td class="px-4 py-2">Discord Emoji</td><td class="px-4 py-2">256 KB</td><td class="px-4 py-2">128 &times; 128</td><td class="px-4 py-2">GIF / PNG / APNG</td></tr>
            <tr><td class="px-4 py-2">Twitch Emote</td><td class="px-4 py-2">1 MB</td><td class="px-4 py-2">112 &times; 112</td><td class="px-4 py-2">GIF / PNG</td></tr>
            <tr><td class="px-4 py-2">Kick Emote</td><td class="px-4 py-2">1 MB</td><td class="px-4 py-2">128 &times; 128</td><td class="px-4 py-2">GIF / PNG</td></tr>
            <tr><td class="px-4 py-2">7TV / BTTV</td><td class="px-4 py-2">~1 MB</td><td class="px-4 py-2">128 &times; 128</td><td class="px-4 py-2">GIF / AVIF / WebP</td></tr>
            <tr><td class="px-4 py-2">Slack Emoji</td><td class="px-4 py-2">128 KB</td><td class="px-4 py-2">128 &times; 128</td><td class="px-4 py-2">GIF</td></tr>
            <tr><td class="px-4 py-2">Email / Web</td><td class="px-4 py-2">Varies (typically &lt; 5 MB)</td><td class="px-4 py-2">Custom</td><td class="px-4 py-2">GIF</td></tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-surface-400 mt-2">Need to resize your GIF to match these dimensions? Use our <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> first, then compress here.</p>

      <p class="text-sm text-surface-500 mt-6">
        Need to change GIF dimensions? Try our <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">free GIF resizer</NuxtLink> to resize animated GIFs to exact pixel dimensions. Want to cut frames? Use the <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer and cutter</NuxtLink> to shorten animations. Need to remove edges? Use the <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">GIF cropper</NuxtLink> to crop a specific region. You can also <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">change GIF speed</NuxtLink> or use the <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">full emote optimizer</NuxtLink> to resize, compress, and convert GIFs into emotes for Twitch, Discord, and Kick in one step.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I compress a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Use the lossless optimization strategy. It re-encodes the GIF with frame delta optimization and improved LZW compression, often reducing file size by 30-70% with zero quality loss. In Smart Compress mode, this is always the first strategy tried.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is Smart Compress?</h3>
          <p class="text-sm text-surface-500 mt-1">Smart Compress automatically applies compression strategies in order of increasing aggressiveness until your GIF is under the target file size. It starts with lossless optimization and only moves to lossy methods if needed. Choose a platform preset or set a custom target size.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I compress a GIF for Discord?</h3>
          <p class="text-sm text-surface-500 mt-1">Select the Discord preset in Smart Compress mode. It targets 256 KB, which is Discord's limit for custom emoji. The compressor will automatically apply the minimum compression needed to get under that limit.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a Twitch emote under 1 MB?</h3>
          <p class="text-sm text-surface-500 mt-1">Select the Twitch preset in Smart Compress mode. It targets 1 MB, which is Twitch's file size limit for animated emotes. For best results, resize your emote to 112x112 first using our GIF resizer, then compress here.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the difference between lossless and lossy compression?</h3>
          <p class="text-sm text-surface-500 mt-1">Lossless compression reduces file size without any quality loss by optimizing how the data is encoded. Lossy compression achieves smaller sizes by introducing small artifacts, reducing colors, or dropping similar frames. The Manual mode lets you choose exactly which type to apply.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does compressing change the GIF dimensions?</h3>
          <p class="text-sm text-surface-500 mt-1">Most strategies preserve the original dimensions. The only exceptions are the "Reduce resolution" strategies (75% and 60%), which shrink the pixel dimensions to achieve further savings. In Smart Compress mode, these are only used as a last resort.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit for uploads?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 10 MB. Since all processing happens in your browser, larger files may take a moment to process. Your GIF never leaves your device.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I undo compression?</h3>
          <p class="text-sm text-surface-500 mt-1">Compression is not reversible, but your original file is never modified. Simply upload the original GIF again to start over. The compressed version is only created when you click download.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF smaller in file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF to EmoteSizer and click Smart Compress. The tool automatically applies the least aggressive strategy needed to shrink your GIF — starting with lossless optimization (30-70% reduction with zero quality loss), then moving to lossy compression, color reduction, and frame dropping only if needed. You can also set a specific target size in KB.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I compress a GIF in my browser without uploading it to a server?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer processes your GIF entirely in your browser using client-side WebAssembly and Canvas APIs. Your file never leaves your device — there is no server upload, no cloud processing, and no data collection. This makes it faster and more private than server-based GIF compressors.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What are the GIF file size limits for Discord, Twitch, Kick, and 7TV?</h3>
          <p class="text-sm text-surface-500 mt-1">Discord custom emoji must be under 256 KB. Twitch animated emotes must be under 1 MB. Kick emotes must be under 1 MB. 7TV and BTTV emotes are typically under 1 MB (varies by tier). Use the Smart Compress platform presets to automatically target the correct limit for each platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I compress a GIF to a specific file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Select "Custom" in Smart Compress mode, then enter your target size in KB (e.g., 256 for Discord, 1024 for Twitch). Smart Compress will automatically apply strategies in order of increasing aggressiveness until your GIF is under the target. You can also use Manual mode to hand-pick exactly which strategies to apply.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the best way to compress a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Start with lossless optimization — it uses frame delta optimization and improved LZW encoding to reduce file size by 30-70% with zero visible quality loss. If you need further reduction, try removing duplicate frames (95% similarity threshold), which drops visually identical frames while preserving animation timing. Both strategies are available in our GIF compressor's Manual mode.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decodeFrames } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'
import {
  GIFSICLE_BASE_FLAGS,
  compareFrames,
  dropNearDuplicateFrames,
  tryRunGifsicle,
  encodeFramesAtSize,
} from '~/composables/useGifOptimizer'

useHead({
  title: 'GIF Compressor — Compress & Reduce GIF Size Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free GIF compressor — reduce file size without losing quality. Compress for Discord (256 KB), Twitch (1 MB), Kick & 7TV. No watermark, no signup, no upload.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Compressor — Reduce GIF File Size Online Free | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free GIF compressor — reduce file size for Discord, Twitch, Kick & 7TV. Lossless and lossy strategies. No watermark, no signup.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/compress' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Compressor — Reduce GIF File Size Online Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free GIF compressor — reduce file size for Discord, Twitch, Kick & 7TV. Lossless and lossy strategies. No watermark, no signup.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/compress' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Compressor',
        'url': 'https://emotesizer.com/tools/compress',
        'description': 'Free online GIF compressor. Reduce animated GIF file size for Discord emoji, Twitch emotes, Kick, 7TV, and BTTV — smart auto-compression or 11 manual strategies. No watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Compress animated GIFs online free',
          'GIF compressor no watermark',
          'Reduce GIF file size without losing quality',
          'Make GIF smaller online',
          'GIF file size reducer',
          'GIF optimizer online free',
          'Smart auto-compression for platform limits',
          'Compress GIF for Discord emoji under 256 KB',
          'Compress GIF for Twitch emotes under 1 MB',
          'Compress GIF for Kick emotes',
          'Compress GIF for 7TV and BTTV emotes',
          'Discord GIF compressor',
          'Twitch emote compressor',
          'Lossless GIF optimization',
          'Lossy GIF compression',
          'GIF color reduction',
          'GIF frame deduplication',
          'Drop duplicate frames from GIF',
          'Reduce GIF resolution',
          'Compress GIF to specific file size',
          'Browser-based GIF compression — no upload required',
          '11 compression strategies',
          'No signup required',
          'Client-side processing — files never leave your device',
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
            'name': 'How do I compress a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Use the lossless optimization strategy. It re-encodes the GIF with frame delta optimization and improved LZW compression, often reducing file size by 30-70% with zero quality loss. In Smart Compress mode, this is always the first strategy tried.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is Smart Compress?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Smart Compress automatically applies compression strategies in order of increasing aggressiveness until your GIF is under the target file size. It starts with lossless optimization and only moves to lossy methods if needed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I compress a GIF for Discord?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select the Discord preset in Smart Compress mode. It targets 256 KB, which is Discord\'s limit for custom emoji. The compressor will automatically apply the minimum compression needed to get under that limit.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a Twitch emote under 1 MB?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select the Twitch preset in Smart Compress mode. It targets 1 MB, which is Twitch\'s file size limit for animated emotes. For best results, resize your emote to 112x112 first using our GIF resizer, then compress here.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the difference between lossless and lossy compression?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Lossless compression reduces file size without any quality loss by optimizing how the data is encoded. Lossy compression achieves smaller sizes by introducing small artifacts, reducing colors, or dropping similar frames.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does compressing change the GIF dimensions?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Most strategies preserve the original dimensions. The only exceptions are the "Reduce resolution" strategies (75% and 60%), which shrink the pixel dimensions to achieve further savings.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit for uploads?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 10 MB. Since all processing happens in your browser, larger files may take a moment to process. Your GIF never leaves your device.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I undo compression?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Compression is not reversible, but your original file is never modified. Simply upload the original GIF again to start over. The compressed version is only created when you click download.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF smaller in file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF to EmoteSizer and click Smart Compress. The tool automatically applies the least aggressive strategy needed to shrink your GIF — starting with lossless optimization (30-70% reduction with zero quality loss), then moving to lossy compression, color reduction, and frame dropping only if needed. You can also set a specific target size in KB.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I compress a GIF in my browser without uploading it to a server?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer processes your GIF entirely in your browser using client-side WebAssembly and Canvas APIs. Your file never leaves your device — there is no server upload, no cloud processing, and no data collection. This makes it faster and more private than server-based GIF compressors.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What are the GIF file size limits for Discord, Twitch, Kick, and 7TV?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Discord custom emoji must be under 256 KB. Twitch animated emotes must be under 1 MB. Kick emotes must be under 1 MB. 7TV and BTTV emotes are typically under 1 MB (varies by tier). Use the Smart Compress platform presets to automatically target the correct limit for each platform.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I compress a GIF to a specific file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select "Custom" in Smart Compress mode, then enter your target size in KB (e.g., 256 for Discord, 1024 for Twitch). Smart Compress will automatically apply strategies in order of increasing aggressiveness until your GIF is under the target. You can also use Manual mode to hand-pick exactly which strategies to apply.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the best way to compress a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Start with lossless optimization — it uses frame delta optimization and improved LZW encoding to reduce file size by 30-70% with zero visible quality loss. If you need further reduction, try removing duplicate frames (95% similarity threshold), which drops visually identical frames while preserving animation timing. Both strategies are available in our GIF compressor\'s Manual mode.',
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
        'name': 'How to Compress a GIF Online',
        'description': 'Compress animated GIFs for free using EmoteSizer. Reduce GIF file size for Discord, Twitch, Kick, and 7TV with smart auto-compression or manual strategies.',
        'step': [
          { '@type': 'HowToStep', 'position': 1, 'name': 'Upload your GIF', 'text': 'Drag and drop or click to browse. Supports animated GIFs up to 10 MB. Your file never leaves your device — all processing happens in your browser.' },
          { '@type': 'HowToStep', 'position': 2, 'name': 'Choose a compression mode', 'text': 'Use Smart Compress with platform presets (Discord 256 KB, Twitch 1 MB, Kick, 7TV) for automatic optimization, or switch to Manual mode to pick from 11 individual compression strategies.' },
          { '@type': 'HowToStep', 'position': 3, 'name': 'Preview and compare', 'text': 'See the compressed GIF alongside file size savings in real time. Smart Compress tries strategies from lossless to aggressive until the target size is reached.' },
          { '@type': 'HowToStep', 'position': 4, 'name': 'Download the compressed GIF', 'text': 'Click download to save your compressed GIF instantly. Free, no watermark, no account needed.' },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Compressor' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Compressor', 'item': 'https://emotesizer.com/tools/compress' },
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
const sourceWidth = ref(0)
const sourceHeight = ref(0)
const originalFileSize = ref(0)
const originalGifBytes = ref<Uint8Array | null>(null)
const isDecoding = ref(false)
const isCompressing = ref(false)
const currentStrategyLabel = ref('')
const compressedPreviewUrl = ref<string | null>(null)
const compressedFileSize = ref(0)

const compressionMode = ref<'smart' | 'manual'>('smart')
const selectedPlatform = ref('twitch')
const customTargetKB = ref(256)
const selectedStrategies = ref<number[]>([])

interface CompressionLogEntry {
  name: string
  sizeBefore: number
  sizeAfter: number
}
const compressionLog = ref<CompressionLogEntry[]>([])

// -- Constants --

const platformPresets = [
  { key: 'twitch', label: 'Twitch', description: 'Max 1 MB' },
  { key: 'discord', label: 'Discord', description: 'Max 256 KB' },
  { key: 'kick', label: 'Kick', description: 'Max 1 MB' },
  { key: '7tv', label: '7TV / BTTV', description: 'Max 1 MB' },
  { key: 'custom', label: 'Custom', description: 'Set target size' },
]

/** Maps platform preset keys to their target file sizes in bytes */
const platformTargetBytes: Record<string, number> = {
  twitch: 1024 * 1024,       // 1 MB
  discord: 256 * 1024,       // 256 KB
  kick: 1024 * 1024,         // 1 MB
  '7tv': 1024 * 1024,        // 1 MB
}

interface Strategy {
  id: number
  name: string
  description: string
  /** 'gifsicle' = run gifsicle on current bytes, 'frames' = drop/merge frames then re-encode, 'resolution' = resize frames then re-encode */
  type: 'gifsicle' | 'frames' | 'resolution'
  gifsicleArgs?: string[]
  /** Similarity threshold for frame-based strategies */
  similarityThreshold?: number
  /** Resolution scale factor for resolution strategies */
  scaleFactor?: number
}

const allStrategies: Strategy[] = [
  { id: 1, name: 'Lossless optimization', description: 'Frame delta optimization and LZW re-encoding with zero quality loss', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3'] },
  { id: 2, name: 'Remove duplicate frames', description: 'Drop frames that are 95%+ identical to the previous frame', type: 'frames', similarityThreshold: 0.95 },
  { id: 3, name: 'Light lossy compression', description: 'Barely visible artifacts — gifsicle lossy at level 30', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=30'] },
  { id: 4, name: 'Remove similar frames', description: 'Drop frames that are 85%+ similar to the previous frame', type: 'frames', similarityThreshold: 0.85 },
  { id: 5, name: 'Moderate lossy compression', description: 'Some visible artifacts — gifsicle lossy at level 60', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=60'] },
  { id: 6, name: 'Reduce colors (128)', description: 'Lower color palette to 128 colors with mild lossy', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=30', '--colors', '128'] },
  { id: 7, name: 'Reduce colors (64)', description: 'Lower color palette to 64 colors with moderate lossy', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=50', '--colors', '64'] },
  { id: 8, name: 'Aggressive compression', description: 'Heavy lossy (80) with 64 colors — noticeable quality loss', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=80', '--colors', '64'] },
  { id: 9, name: 'Heavy compression', description: 'Maximum lossy (100) with 32 colors — significant quality loss', type: 'gifsicle', gifsicleArgs: [...GIFSICLE_BASE_FLAGS, '-O3', '--lossy=100', '--colors', '32'] },
  { id: 10, name: 'Reduce resolution (75%)', description: 'Scale down to 75% of original dimensions', type: 'resolution', scaleFactor: 0.75 },
  { id: 11, name: 'Reduce resolution (60%)', description: 'Scale down to 60% of original dimensions', type: 'resolution', scaleFactor: 0.60 },
]

const strategyGroups = {
  lossless: allStrategies.filter(s => s.id <= 2),
  nearLossless: allStrategies.filter(s => s.id >= 3 && s.id <= 4),
  moderate: allStrategies.filter(s => s.id >= 5 && s.id <= 7),
  heavy: allStrategies.filter(s => s.id >= 8 && s.id <= 11),
}

// -- Computed --

const savingsPercent = computed(() => {
  if (!originalFileSize.value || !compressedFileSize.value) return 0
  return Math.round((1 - compressedFileSize.value / originalFileSize.value) * 100)
})

// -- Gifsicle helper, frame comparison, frame encoding --
// All imported from ~/composables/useGifOptimizer:
// tryRunGifsicle, compareFrames, dropNearDuplicateFrames, encodeFramesAtSize, GIFSICLE_BASE_FLAGS

// -- File handling --

function handleFileSelected(file: File) {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (compressedPreviewUrl.value) URL.revokeObjectURL(compressedPreviewUrl.value)
  compressedPreviewUrl.value = null
  compressedFileSize.value = 0
  compressionLog.value = []

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
    originalGifBytes.value = uint8
    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Shared strategy helper --

/**
 * Mutable state bag passed through the strategy pipeline. Using an object
 * lets applyStrategy mutate frames/dimensions in place so the caller sees
 * the updated values on the next iteration.
 */
interface CompressionState {
  currentBytes: Uint8Array
  currentFrames: DecodedFrame[]
  currentW: number
  currentH: number
}

/**
 * Applies a single compression strategy to the current state. Returns the
 * resulting GIF bytes if the strategy produced output, or null if it was
 * skipped (e.g. no frames to drop, dimensions unchanged).
 *
 * Side-effects: may mutate `state.currentFrames`, `state.currentW`, and
 * `state.currentH` for frame-drop and resolution strategies.
 */
async function applyStrategy(
  strategy: Strategy,
  state: CompressionState,
): Promise<Uint8Array | null> {
  if (strategy.type === 'gifsicle') {
    return await tryRunGifsicle(state.currentBytes, strategy.gifsicleArgs!)
  }

  if (strategy.type === 'frames' && strategy.similarityThreshold) {
    if (state.currentFrames.length <= 1) return null
    const beforeCount = state.currentFrames.length
    const filtered = dropNearDuplicateFrames(state.currentFrames, strategy.similarityThreshold)
    if (filtered.length >= beforeCount) return null
    state.currentFrames = filtered
    const encoded = await encodeFramesAtSize(state.currentFrames, state.currentW, state.currentH)
    const polished = await tryRunGifsicle(encoded, [...GIFSICLE_BASE_FLAGS, '-O3'])
    return polished ?? encoded
  }

  if (strategy.type === 'resolution' && strategy.scaleFactor) {
    const newW = Math.round(sourceWidth.value * strategy.scaleFactor)
    const newH = Math.round(sourceHeight.value * strategy.scaleFactor)
    if (newW <= 0 || newH <= 0 || (newW === state.currentW && newH === state.currentH)) return null
    state.currentW = newW
    state.currentH = newH
    const encoded = await encodeFramesAtSize(state.currentFrames, state.currentW, state.currentH)
    const polished = await tryRunGifsicle(encoded, [...GIFSICLE_BASE_FLAGS, '-O3'])
    return polished ?? encoded
  }

  return null
}

// -- Smart Compress --

async function runSmartCompress() {
  if (!originalGifBytes.value || !decodedFrames.value.length) return

  const targetBytes = selectedPlatform.value === 'custom'
    ? (customTargetKB.value || 256) * 1024
    : platformTargetBytes[selectedPlatform.value] || 1024 * 1024

  isCompressing.value = true
  currentStrategyLabel.value = 'Preparing...'
  compressionLog.value = []

  if (compressedPreviewUrl.value) {
    URL.revokeObjectURL(compressedPreviewUrl.value)
    compressedPreviewUrl.value = null
  }
  compressedFileSize.value = 0

  try {
    // Start with the original GIF bytes — encode from decoded frames first
    // so gifsicle gets a clean input at the original dimensions
    const initialBytes = await encodeFramesAtSize(
      decodedFrames.value,
      sourceWidth.value,
      sourceHeight.value,
    )

    const state: CompressionState = {
      currentBytes: initialBytes,
      currentFrames: [...decodedFrames.value],
      currentW: sourceWidth.value,
      currentH: sourceHeight.value,
    }

    // If already under target, no compression needed
    if (state.currentBytes.length <= targetBytes) {
      acceptCompressedResult(state.currentBytes)
      toastSuccess('GIF is already under the target size!')
      return
    }

    // Run strategies in order, stop when under target
    for (const strategy of allStrategies) {
      currentStrategyLabel.value = strategy.name
      const sizeBefore = state.currentBytes.length

      // Yield to browser for UI update
      await new Promise(resolve => setTimeout(resolve, 16))

      const result = await applyStrategy(strategy, state)

      if (result && result.length < state.currentBytes.length) {
        compressionLog.value.push({
          name: strategy.name,
          sizeBefore,
          sizeAfter: result.length,
        })
        state.currentBytes = result

        if (state.currentBytes.length <= targetBytes) {
          acceptCompressedResult(state.currentBytes)
          toastSuccess(`Compressed to ${formatFileSize(state.currentBytes.length)} — under the target!`)
          return
        }
      }
    }

    // All strategies exhausted — use the best result we got
    acceptCompressedResult(state.currentBytes)
    if (state.currentBytes.length <= targetBytes) {
      toastSuccess(`Compressed to ${formatFileSize(state.currentBytes.length)}`)
    } else {
      toastError(`Reached ${formatFileSize(state.currentBytes.length)} — could not get under ${formatFileSize(targetBytes)}. Try the manual mode for more control.`)
    }
  } catch (e) {
    if (import.meta.dev) console.error('Smart compress failed:', e)
    toastError('Compression failed. Please try again.')
  } finally {
    isCompressing.value = false
    currentStrategyLabel.value = ''
  }
}

// -- Manual Compress --

async function runManualCompress() {
  if (!originalGifBytes.value || !decodedFrames.value.length) return
  if (selectedStrategies.value.length === 0) return

  isCompressing.value = true
  currentStrategyLabel.value = 'Preparing...'
  compressionLog.value = []

  if (compressedPreviewUrl.value) {
    URL.revokeObjectURL(compressedPreviewUrl.value)
    compressedPreviewUrl.value = null
  }
  compressedFileSize.value = 0

  try {
    // Sort selected strategies by their ID to maintain correct order
    const sortedIds = [...selectedStrategies.value].sort((a, b) => a - b)
    const strategies = sortedIds.map(id => allStrategies.find(s => s.id === id)!).filter(Boolean)

    const initialBytes = await encodeFramesAtSize(
      decodedFrames.value,
      sourceWidth.value,
      sourceHeight.value,
    )

    const state: CompressionState = {
      currentBytes: initialBytes,
      currentFrames: [...decodedFrames.value],
      currentW: sourceWidth.value,
      currentH: sourceHeight.value,
    }

    for (const strategy of strategies) {
      currentStrategyLabel.value = strategy.name
      const sizeBefore = state.currentBytes.length

      await new Promise(resolve => setTimeout(resolve, 16))

      const result = await applyStrategy(strategy, state)

      if (result) {
        compressionLog.value.push({
          name: strategy.name,
          sizeBefore,
          sizeAfter: result.length,
        })
        // In manual mode, always accept the result (even if larger) since
        // the user explicitly chose the strategy
        state.currentBytes = result
      }
    }

    acceptCompressedResult(state.currentBytes)
    toastSuccess(`Compressed to ${formatFileSize(state.currentBytes.length)}`)
  } catch (e) {
    if (import.meta.dev) console.error('Manual compress failed:', e)
    toastError('Compression failed. Please try again.')
  } finally {
    isCompressing.value = false
    currentStrategyLabel.value = ''
  }
}

// -- Result handling --

function acceptCompressedResult(gifBytes: Uint8Array) {
  const blob = new Blob([gifBytes as unknown as BlobPart], { type: 'image/gif' })
  if (compressedPreviewUrl.value) URL.revokeObjectURL(compressedPreviewUrl.value)
  compressedPreviewUrl.value = URL.createObjectURL(blob)
  compressedFileSize.value = blob.size
}

// -- Download --

async function downloadCompressed() {
  if (!compressedPreviewUrl.value) return

  const response = await fetch(compressedPreviewUrl.value)
  const blob = await response.blob()
  downloadBlob(blob, `compressed_${gifFileName.value || 'animation.gif'}`)
  toastSuccess('Compressed GIF downloaded!')
}

// -- Clear / cleanup --

function clearGif() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (compressedPreviewUrl.value) URL.revokeObjectURL(compressedPreviewUrl.value)
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  sourceWidth.value = 0
  sourceHeight.value = 0
  originalFileSize.value = 0
  originalGifBytes.value = null
  isDecoding.value = false
  compressedPreviewUrl.value = null
  compressedFileSize.value = 0
  compressionLog.value = []
  currentStrategyLabel.value = ''
  compressionMode.value = 'smart'
  selectedPlatform.value = 'twitch'
  customTargetKB.value = 256
  selectedStrategies.value = []
}

onUnmounted(() => {
  clearGif()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
