<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">Video to GIF Converter — Convert MP4 to GIF Online Free</h1>
      <p class="page-subtitle mt-1">Convert video clips to animated GIFs — trim, adjust quality, and download. Free, no watermark, no signup.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- Left Column: Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Upload (shown when no video is loaded) -->
        <VideoDropZone
          v-if="!videoUrl"
          @file-selected="handleFileSelected"
          @error="handleUploadError"
        />

        <!-- Controls (shown when a video is loaded) -->
        <div v-else class="space-y-4">
          <!-- Loaded video indicator -->
          <div class="card flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
              <img v-if="videoThumbnail" :src="videoThumbnail" alt="Video thumbnail" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <IconVideo :size="20" class="text-surface-400" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ videoFileName }}</p>
              <p class="text-xs text-surface-500">
                {{ formatDuration(videoDuration) }} &middot;
                {{ videoWidth }}&times;{{ videoHeight }}px &middot;
                {{ formatFileSize(videoFileSize) }}
              </p>
            </div>
            <button
              class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              aria-label="Clear video"
              @click="clearVideo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- FFmpeg loading indicator -->
          <div v-if="ffmpeg.isLoading.value" class="card">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div class="flex-1">
                <p class="text-sm font-medium text-surface-700">Loading video engine...</p>
                <p class="text-xs text-surface-400 mt-0.5">Downloading FFmpeg.wasm (first time only)</p>
              </div>
            </div>
            <div class="mt-3 w-full bg-surface-200/50 rounded-full h-1.5">
              <div class="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style="width: 100%" />
            </div>
          </div>

          <!-- FFmpeg error -->
          <div v-if="ffmpeg.error.value" class="flex items-start gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-error-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p class="text-xs text-error-700">{{ ffmpeg.error.value }}</p>
          </div>

          <!-- Trim Range -->
          <div v-if="videoDuration > 0">
            <h3 class="label mb-2">Trim Range</h3>
            <VideoTrimmer
              :duration="videoDuration"
              :model-value="trimRange"
              @update:model-value="handleTrimUpdate"
            />
          </div>

          <!-- Frame Rate -->
          <div>
            <h3 class="label mb-2">Frame Rate</h3>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Frame rate">
              <button
                v-for="preset in fpsPresets"
                :key="preset"
                role="radio"
                :aria-checked="fps === preset && !customFpsActive"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': fps === preset && !customFpsActive }"
                @click="setFps(preset)"
              >
                {{ preset }} fps
              </button>
              <button
                role="radio"
                :aria-checked="customFpsActive"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': customFpsActive }"
                @click="enableCustomFps"
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
              <div v-if="customFpsActive" class="mt-2">
                <input
                  v-model.number="customFps"
                  type="number"
                  min="1"
                  max="60"
                  class="input text-center w-24"
                  aria-label="Custom frame rate"
                  @input="handleCustomFpsInput"
                />
                <span class="text-xs text-surface-400 ml-2">fps</span>
              </div>
            </Transition>
          </div>

          <!-- Output Width -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="label !mb-0">Output Width</h3>
              <span v-if="computedHeight > 0" class="text-xs text-surface-400">
                {{ outputWidth }}&times;{{ computedHeight }}px
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Output width">
              <button
                v-for="preset in widthPresets"
                :key="preset.value"
                role="radio"
                :aria-checked="outputWidth === preset.value && !customWidthActive"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': outputWidth === preset.value && !customWidthActive }"
                @click="setWidth(preset.value)"
              >
                {{ preset.label }}
              </button>
              <button
                role="radio"
                :aria-checked="customWidthActive"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': customWidthActive }"
                @click="enableCustomWidth"
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
              <div v-if="customWidthActive" class="mt-2">
                <input
                  v-model.number="customWidth"
                  type="number"
                  min="50"
                  :max="videoWidth || 3840"
                  class="input text-center w-24"
                  aria-label="Custom output width"
                  @input="handleCustomWidthInput"
                />
                <span class="text-xs text-surface-400 ml-2">px</span>
              </div>
            </Transition>
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
              <template v-if="quality === 'small'">Single pass, smaller file. Good for simple animations.</template>
              <template v-else-if="quality === 'balanced'">2-pass palette with Bayer dithering. Best balance of quality and size.</template>
              <template v-else>2-pass palette with Sierra dithering. Highest quality, larger file.</template>
            </p>
          </div>

          <!-- Estimated output size -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              Estimated output: ~{{ estimatedSizeLabel }}
              <span class="text-surface-400">({{ estimatedFrameCount }} frames at {{ fps }} fps)</span>
            </p>
          </div>

          <!-- Duration warning -->
          <div
            v-if="trimDuration > 15"
            class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-warning-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p class="text-xs text-warning-700">
              Long GIF warning: {{ trimDuration.toFixed(1) }}s will produce a large file (~{{ estimatedFrameCount }} frames). Consider trimming to under 15 seconds or lowering the frame rate. You can
              <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress</NuxtLink>
              the result afterwards.
            </p>
          </div>

          <!-- Convert button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isConverting || ffmpeg.isLoading.value || !videoUrl"
            @click="convertVideo"
          >
            <template v-if="isConverting">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Converting... {{ ffmpeg.conversionProgress.value }}%
            </template>
            <template v-else-if="ffmpeg.isLoading.value">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading engine...
            </template>
            <template v-else>
              <IconVideo :size="18" />
              Convert to GIF
            </template>
          </button>

          <!-- Download button (shown after conversion) -->
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
              <NuxtLink to="/tools/resize" aria-label="Continue editing: resize this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconResize :size="14" />
                Resize
              </NuxtLink>
              <NuxtLink to="/tools/trim" aria-label="Continue editing: trim GIF frames" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconScissors :size="14" />
                Trim Frames
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
          v-if="!videoUrl"
          class="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-surface-200 text-surface-400 text-sm"
        >
          Upload a video to get started
        </div>

        <!-- Video/GIF preview area -->
        <template v-else>
          <!-- Side-by-side preview (after conversion) -->
          <div v-if="resultGifUrl" class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1 flex flex-col items-center">
                <video
                  :src="videoUrl"
                  class="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                  muted
                  loop
                  autoplay
                  playsinline
                />
                <span class="mt-2 text-xs font-medium text-surface-500">Original Video</span>
                <span class="text-xs text-surface-400">{{ formatFileSize(videoFileSize) }}</span>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <img
                  :src="resultGifUrl"
                  alt="Converted GIF"
                  class="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                />
                <span class="mt-2 badge badge-primary">GIF Result</span>
                <span class="text-xs text-surface-400 mt-1">{{ formatFileSize(resultGifSize) }}</span>
              </div>
            </div>
          </div>

          <!-- Converting progress overlay -->
          <div v-else-if="isConverting" class="rounded-2xl overflow-hidden bg-surface-100/50 p-6 min-h-[200px] flex flex-col items-center justify-center gap-4">
            <div class="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <div class="text-center">
              <p class="text-sm font-medium text-surface-700">
                <template v-if="ffmpeg.conversionPhase.value === 'palette'">Generating color palette...</template>
                <template v-else-if="ffmpeg.conversionPhase.value === 'encoding'">Encoding GIF...</template>
                <template v-else>Converting...</template>
              </p>
              <p class="text-xs text-surface-400 mt-1">{{ ffmpeg.conversionProgress.value }}% complete</p>
            </div>
            <!-- Progress bar -->
            <div class="w-full max-w-xs bg-surface-200/50 rounded-full h-2">
              <div
                class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: ffmpeg.conversionProgress.value + '%' }"
              />
            </div>
            <button class="btn btn-ghost btn-sm text-xs" @click="cancelConversion">
              Cancel
            </button>
          </div>

          <!-- Video player (before conversion) -->
          <div v-else class="rounded-2xl overflow-hidden bg-surface-900/5 min-h-[200px] relative">
            <video
              ref="videoPlayerRef"
              :src="videoUrl"
              class="w-full max-h-[400px] object-contain"
              muted
              playsinline
              @loadedmetadata="handleVideoMetadata"
              @timeupdate="handleTimeUpdate"
            />
            <!-- Play/pause overlay -->
            <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
              <div class="flex items-center gap-3">
                <button
                  class="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  :aria-label="isPlaying ? 'Pause' : 'Play'"
                  @click="togglePlayback"
                >
                  <!-- Play icon -->
                  <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <!-- Pause icon -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                </button>
                <span class="text-xs text-white/80 font-medium">
                  {{ formatTime(currentPlayTime) }} / {{ formatTime(videoDuration) }}
                </span>
              </div>
            </div>
          </div>

          <!-- File info -->
          <div v-if="videoUrl" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
            <span>{{ videoWidth }}&times;{{ videoHeight }}px</span>
            <span>{{ formatDuration(videoDuration) }}</span>
            <span>{{ formatFileSize(videoFileSize) }}</span>
            <span v-if="trimDuration < videoDuration">Trim: {{ trimDuration.toFixed(1) }}s</span>
          </div>
        </template>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Convert Video to GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your video</strong> — drag and drop or click to browse. Supports MP4, WebM, MOV, and AVI files up to 200 MB. All processing happens in your browser using FFmpeg.wasm, so your file never leaves your device.</li>
        <li><strong>Trim and adjust settings</strong> — use the trim slider to select the exact clip range. Choose your preferred frame rate, output width, and quality preset. Lower frame rates and widths produce smaller GIF files.</li>
        <li><strong>Convert to GIF</strong> — click the convert button. The tool uses a 2-pass palette-based encoding for optimal color reproduction. Watch the progress in real time.</li>
        <li><strong>Download</strong> — preview the result side-by-side with the original video, then download your GIF. Completely free, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Convert MP4 to GIF?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Universal compatibility</strong> — GIFs play everywhere: social media, messaging apps, forums, emails, and websites. No video player required.</li>
        <li><strong>Perfect for short clips</strong> — reaction GIFs, tutorials, product demos, and memes are more impactful as auto-playing loops than as video files.</li>
        <li><strong>Emote creation</strong> — convert video clips into animated emotes for Twitch, Discord, Kick, 7TV, BTTV, and FFZ. Pair with our compression and resize tools for platform-ready results.</li>
        <li><strong>No server upload</strong> — your video never leaves your browser. FFmpeg.wasm processes everything locally using WebAssembly for privacy and speed.</li>
        <li><strong>100% free, no watermark</strong> — convert any video to GIF online free with no hidden costs and no branding.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Quality Settings Explained</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Small</strong> uses a single-pass encoding that produces compact files with acceptable quality. Best for simple animations with few colors.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Balanced</strong> (recommended) uses a 2-pass palette approach with Bayer dithering. The first pass analyzes the video to generate an optimal 256-color palette, then the second pass encodes the GIF using that palette. This produces noticeably better colors at a moderate file size increase.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Best</strong> also uses 2-pass palette encoding but with Sierra error diffusion dithering, which produces smoother gradients and fewer visible dithering artifacts. The trade-off is a slightly larger file size.
      </p>
      <p class="text-sm text-surface-500 mt-3">
        If the output GIF is too large, use our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to reduce the file size. You can also lower the frame rate, reduce the output width, or shorten the trim range.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">What video formats are supported?</h3>
          <p class="text-sm text-surface-500 mt-1">MP4, WebM, MOV (QuickTime), and AVI. MP4 is the most widely supported and recommended format for best compatibility with FFmpeg.wasm.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload videos up to 200 MB. Since all processing happens in your browser using WebAssembly, very large files may take longer to process depending on your device.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your files. The output GIF is clean and ready to use on any platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is my video uploaded to a server?</h3>
          <p class="text-sm text-surface-500 mt-1">No. All conversion happens entirely in your browser using FFmpeg.wasm (WebAssembly). Your video file never leaves your device. No server, no cloud processing, complete privacy.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why is my GIF so large?</h3>
          <p class="text-sm text-surface-500 mt-1">GIFs are inherently larger than modern video formats because they use lossless per-frame compression without inter-frame encoding. To reduce size: shorten the clip, lower the frame rate (10-15 fps is usually sufficient), reduce the output width, or use our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> after conversion.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What do the quality settings do?</h3>
          <p class="text-sm text-surface-500 mt-1">"Small" uses a single-pass encoding for compact files. "Balanced" and "Best" use a 2-pass palette technique that produces much better colors — the difference is in the dithering algorithm used to approximate colors outside the 256-color palette.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What frame rate should I use?</h3>
          <p class="text-sm text-surface-500 mt-1">15 fps is a good default that balances smooth animation with reasonable file size. Use 10 fps for smaller files or 24-30 fps for smoother motion. Remember that higher frame rates directly increase file size.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I convert video to GIF on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes, if your mobile browser supports SharedArrayBuffer (most modern browsers do). The conversion runs in WebAssembly so it works on any device. Processing may be slower on mobile devices.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why does the tool need to download FFmpeg?</h3>
          <p class="text-sm text-surface-500 mt-1">FFmpeg.wasm is a ~30 MB WebAssembly module that provides professional-grade video processing capabilities. It downloads once and is cached by your browser for subsequent visits.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I make a GIF from a YouTube video?</h3>
          <p class="text-sm text-surface-500 mt-1">Not directly — you need to download the video file first, then upload it here. This tool accepts local video files (MP4, WebM, MOV, AVI) from your device.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useFFmpeg } from '~/composables/useFFmpeg'

useHead({
  title: 'Video to GIF Converter — Convert MP4 to GIF Online Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Convert video to GIF online for free — no watermark, no signup. Trim, adjust quality, and download animated GIFs from MP4, WebM, MOV. Browser-based conversion, your files stay private.' },
    { key: 'og:title', property: 'og:title', content: 'Video to GIF Converter — Convert MP4 to GIF Online Free | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Convert video to GIF online for free — no watermark, no signup. Trim, adjust quality, and download animated GIFs from MP4, WebM, MOV. Browser-based conversion, your files stay private.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/video-to-gif' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'Video to GIF Converter — Convert MP4 to GIF Online Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Convert video to GIF online for free — no watermark, no signup. Trim, adjust quality, and download animated GIFs from MP4, WebM, MOV. Browser-based conversion, your files stay private.' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/video-to-gif' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Video to GIF Converter',
        'url': 'https://emotesizer.com/tools/video-to-gif',
        'description': 'Free online video to GIF converter. Convert MP4, WebM, MOV, AVI to animated GIFs with trim, frame rate, width, and quality controls. Browser-based, no upload, no watermark.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Convert MP4 to GIF',
          'Convert WebM to GIF',
          'Convert MOV to GIF',
          'Convert AVI to GIF',
          'Trim video before conversion',
          'Adjustable frame rate (1-60 fps)',
          'Adjustable output width',
          '3 quality presets (Small, Balanced, Best)',
          '2-pass palette encoding',
          'Side-by-side video vs GIF preview',
          'No watermark',
          'No signup required',
          'Browser-based processing via FFmpeg.wasm — files never leave your device',
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
            'name': 'What video formats are supported?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'MP4, WebM, MOV (QuickTime), and AVI. MP4 is the most widely supported and recommended format.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload videos up to 200 MB. All processing happens in your browser using WebAssembly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks to your files.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is my video uploaded to a server?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. All conversion happens entirely in your browser using FFmpeg.wasm (WebAssembly). Your video file never leaves your device.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why is my GIF so large?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'GIFs are inherently larger than modern video formats. To reduce size: shorten the clip, lower the frame rate, reduce the output width, or use the GIF compressor after conversion.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What do the quality settings do?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '"Small" uses single-pass encoding for compact files. "Balanced" and "Best" use a 2-pass palette technique for much better colors, with different dithering algorithms.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What frame rate should I use?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '15 fps is a good default. Use 10 fps for smaller files or 24-30 fps for smoother motion. Higher frame rates directly increase file size.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I convert video to GIF on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, if your mobile browser supports SharedArrayBuffer. The conversion runs in WebAssembly so it works on any device, though processing may be slower on mobile.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why does the tool need to download FFmpeg?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'FFmpeg.wasm is a ~30 MB WebAssembly module that provides professional-grade video processing. It downloads once and is cached by your browser.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I make a GIF from a YouTube video?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Not directly — you need to download the video file first, then upload it here. This tool accepts local video files from your device.',
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
        'name': 'How to Convert Video to GIF Online',
        'description': 'Convert any video to an animated GIF using EmoteSizer\'s free online converter. No signup, no watermark.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your video',
            'text': 'Drag and drop or click to browse. Supports MP4, WebM, MOV, and AVI up to 200 MB. Processed entirely in your browser.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Trim and adjust settings',
            'text': 'Use the trim slider to select the clip range. Choose frame rate, output width, and quality preset.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Convert and download',
            'text': 'Click Convert to GIF. Preview the result side-by-side with the original, then download. Free, no watermark.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer Video to GIF Converter' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'Video to GIF', 'item': 'https://emotesizer.com/tools/video-to-gif' },
        ],
      }),
    },
  ],
})

const { success: toastSuccess, error: toastError } = useToast()
const { downloadBlob } = useDownload()

// -- FFmpeg instance --

const ffmpeg = useFFmpeg()

// -- Reactive state --

const videoFile = ref<File | null>(null)
const videoUrl = ref('')
const videoFileName = ref('')
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const videoFileSize = ref(0)
const videoThumbnail = ref<string | null>(null)
const trimRange = ref<[number, number]>([0, 0])
const fps = ref(15)
const outputWidth = ref(480)
const quality = ref<'small' | 'balanced' | 'best'>('balanced')
const resultGifUrl = ref<string | null>(null)
const resultGifSize = ref(0)
const isConverting = ref(false)
const isPlaying = ref(false)
const currentPlayTime = ref(0)

// Custom input state
const customFpsActive = ref(false)
const customFps = ref(15)
const customWidthActive = ref(false)
const customWidth = ref(480)

const videoPlayerRef = ref<HTMLVideoElement | null>(null)

// -- Presets --

const fpsPresets = [10, 15, 20, 24, 30] as const

const widthPresets = computed(() => {
  const presets = [
    { label: '320px', value: 320 },
    { label: '480px', value: 480 },
    { label: '640px', value: 640 },
  ]
  if (videoWidth.value > 0) {
    presets.push({ label: `Original (${videoWidth.value}px)`, value: videoWidth.value })
  }
  return presets
})

const qualityOptions = [
  { label: 'Small', value: 'small' as const },
  { label: 'Balanced', value: 'balanced' as const },
  { label: 'Best', value: 'best' as const },
]

// -- Computed --

const trimDuration = computed(() => trimRange.value[1] - trimRange.value[0])

/** Computed output height based on aspect ratio and selected width */
const computedHeight = computed(() => {
  if (videoWidth.value <= 0 || videoHeight.value <= 0) return 0
  return Math.round((outputWidth.value / videoWidth.value) * videoHeight.value)
})

/** Estimated total frames in the output */
const estimatedFrameCount = computed(() => {
  return Math.ceil(trimDuration.value * fps.value)
})

/**
 * Rough estimated output file size.
 * GIF bytes per frame depends heavily on content complexity, but a reasonable
 * heuristic is: width * height * 0.5 bytes per frame for balanced quality,
 * scaled by a quality factor. This is intentionally conservative (high).
 */
const estimatedSize = computed(() => {
  const w = outputWidth.value
  const h = computedHeight.value
  if (w <= 0 || h <= 0) return 0

  const qualityFactor = quality.value === 'small' ? 0.3 : quality.value === 'balanced' ? 0.5 : 0.6
  const bytesPerFrame = w * h * qualityFactor
  return Math.round(bytesPerFrame * estimatedFrameCount.value)
})

const estimatedSizeLabel = computed(() => formatFileSize(estimatedSize.value))

// -- Format helpers --

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const whole = Math.floor(secs)
  const tenths = Math.floor((secs - whole) * 10)
  return `${mins}:${String(whole).padStart(2, '0')}.${tenths}`
}

// -- FPS controls --

function setFps(value: number) {
  fps.value = value
  customFpsActive.value = false
}

function enableCustomFps() {
  customFpsActive.value = true
  customFps.value = fps.value
}

function handleCustomFpsInput() {
  const clamped = Math.max(1, Math.min(60, customFps.value || 15))
  fps.value = clamped
}

// -- Width controls --

function setWidth(value: number) {
  outputWidth.value = value
  customWidthActive.value = false
}

function enableCustomWidth() {
  customWidthActive.value = true
  customWidth.value = outputWidth.value
}

function handleCustomWidthInput() {
  const maxW = videoWidth.value || 3840
  const clamped = Math.max(50, Math.min(maxW, customWidth.value || 480))
  outputWidth.value = clamped
}

// -- Trim controls --

function handleTrimUpdate(value: [number, number]) {
  trimRange.value = value

  // Seek the video player to the start of the new trim range
  const player = videoPlayerRef.value
  if (player && Math.abs(player.currentTime - value[0]) > 0.2) {
    player.currentTime = value[0]
  }
}

// -- Video playback --

function togglePlayback() {
  const player = videoPlayerRef.value
  if (!player) return

  if (isPlaying.value) {
    player.pause()
    isPlaying.value = false
  } else {
    // Start from trim start if currently outside range
    if (player.currentTime < trimRange.value[0] || player.currentTime >= trimRange.value[1]) {
      player.currentTime = trimRange.value[0]
    }
    player.play()
    isPlaying.value = true
  }
}

/** Loop playback within the trim range */
function handleTimeUpdate() {
  const player = videoPlayerRef.value
  if (!player) return

  currentPlayTime.value = player.currentTime

  // Loop back to start when reaching the end of the trim range
  if (player.currentTime >= trimRange.value[1]) {
    player.currentTime = trimRange.value[0]
  }
}

function handleVideoMetadata() {
  const player = videoPlayerRef.value
  if (!player) return

  videoDuration.value = player.duration
  videoWidth.value = player.videoWidth
  videoHeight.value = player.videoHeight

  // Set initial trim range to full duration
  trimRange.value = [0, player.duration]

  // Set default output width based on video dimensions
  if (player.videoWidth <= 320) {
    outputWidth.value = player.videoWidth
  } else if (player.videoWidth <= 480) {
    outputWidth.value = player.videoWidth
  } else {
    outputWidth.value = 480
  }

  // Auto-play muted
  player.play().then(() => { isPlaying.value = true }).catch(() => {})
}

// -- Video thumbnail extraction --

/**
 * Extracts the first frame from the video as a thumbnail using a hidden
 * video element and canvas. Seeks to time=0, draws the frame to a canvas,
 * and converts to a data URL.
 */
function extractThumbnail(file: File) {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'metadata'

  video.onloadeddata = () => {
    video.currentTime = 0
  }

  video.onseeked = () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      videoThumbnail.value = canvas.toDataURL('image/jpeg', 0.7)
    }
    // Clean up
    URL.revokeObjectURL(url)
    video.remove()
  }

  video.src = url
}

// -- State reset --

function resetState() {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  if (resultGifUrl.value) URL.revokeObjectURL(resultGifUrl.value)

  videoFile.value = null
  videoUrl.value = ''
  videoFileName.value = ''
  videoDuration.value = 0
  videoWidth.value = 0
  videoHeight.value = 0
  videoFileSize.value = 0
  videoThumbnail.value = null
  trimRange.value = [0, 0]
  fps.value = 15
  outputWidth.value = 480
  quality.value = 'balanced'
  resultGifUrl.value = null
  resultGifSize.value = 0
  isConverting.value = false
  isPlaying.value = false
  currentPlayTime.value = 0
  customFpsActive.value = false
  customWidthActive.value = false
}

// -- File handling --

function handleFileSelected(file: File) {
  resetState()

  videoFile.value = file
  videoUrl.value = URL.createObjectURL(file)
  videoFileName.value = file.name
  videoFileSize.value = file.size

  extractThumbnail(file)

  // Eagerly start loading FFmpeg in the background
  if (!ffmpeg.isReady.value && !ffmpeg.isLoading.value) {
    ffmpeg.load()
  }
}

function handleUploadError(message: string) {
  toastError(message)
}

function clearVideo() {
  resetState()
}

// -- Conversion --

async function convertVideo() {
  if (!videoFile.value) return

  // Revoke previous result if any
  if (resultGifUrl.value) {
    URL.revokeObjectURL(resultGifUrl.value)
    resultGifUrl.value = null
    resultGifSize.value = 0
  }

  isConverting.value = true

  try {
    // Load FFmpeg if not ready
    if (!ffmpeg.isReady.value) {
      await ffmpeg.load()
      if (ffmpeg.error.value) {
        toastError(ffmpeg.error.value)
        isConverting.value = false
        return
      }
    }

    const blob = await ffmpeg.convertToGif({
      inputFile: videoFile.value,
      startTime: trimRange.value[0],
      duration: trimDuration.value,
      fps: fps.value,
      width: outputWidth.value,
      quality: quality.value,
    })

    resultGifUrl.value = URL.createObjectURL(blob)
    resultGifSize.value = blob.size
    toastSuccess('Video converted to GIF!')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Conversion failed'
    toastError(msg)
  } finally {
    isConverting.value = false
  }
}

function cancelConversion() {
  ffmpeg.cancelConversion()
  isConverting.value = false
  toastError('Conversion cancelled')
}

// -- Download --

function downloadGif() {
  if (!resultGifUrl.value) return

  const baseName = videoFileName.value.replace(/\.[^.]+$/, '') || 'video'
  // Fetch the blob from the object URL rather than using downloadUrl directly,
  // because downloadBlob creates its own temporary URL that auto-revokes.
  fetch(resultGifUrl.value)
    .then(r => r.blob())
    .then(blob => {
      downloadBlob(blob, `${baseName}.gif`)
      toastSuccess('GIF downloaded!')
    })
}

// -- Cleanup --

onUnmounted(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  if (resultGifUrl.value) URL.revokeObjectURL(resultGifUrl.value)
})
</script>
