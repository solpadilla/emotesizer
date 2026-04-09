<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to MP4 Converter — Convert GIF to Video Online Free</h1>
      <p class="page-subtitle mt-1">Convert animated GIFs to MP4 video for 80-90% smaller file size. Browser-based, no watermark, no signup.</p>
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
                {{ gifWidth }}&times;{{ gifHeight }}px &middot;
                {{ formatFileSize(gifFileSize) }}
              </p>
            </div>
            <button
              class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              aria-label="Clear GIF"
              @click="clearGif"
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

          <!-- Settings controls — disable interaction during conversion -->
          <div class="space-y-4" :class="{ 'pointer-events-none opacity-60': isConverting }">

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
              <template v-if="quality === 'good'">Smallest file size. Good for simple animations and memes.</template>
              <template v-else-if="quality === 'better'">Balanced quality and file size. Best for most GIFs.</template>
              <template v-else>Highest quality, larger file. Best for detailed or high-resolution GIFs.</template>
            </p>
          </div>

          <!-- Info banner -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              MP4 is typically 80-90% smaller than GIF with better visual quality. H.264 video uses inter-frame compression, which GIF lacks entirely.
            </p>
          </div>

          </div><!-- /Settings controls wrapper -->

          <!-- Convert button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isConverting || ffmpeg.isLoading.value || !gifUrl"
            @click="convertGif"
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
              Convert to MP4
            </template>
          </button>

          <!-- File size comparison badge (shown after conversion) -->
          <div
            v-if="resultMp4Url"
            class="flex items-start gap-2 p-3 rounded-xl bg-success-500/10 border border-success-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-success-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p class="text-xs text-success-700 font-medium">
              {{ savingsPercent }}% smaller — {{ formatFileSize(gifFileSize) }} → {{ formatFileSize(resultMp4Size) }}
            </p>
          </div>

          <!-- Download button (shown after conversion) -->
          <button
            v-if="resultMp4Url"
            class="btn btn-primary btn-lg w-full"
            @click="downloadMp4"
          >
            <IconDownload :size="18" />
            Download MP4 ({{ formatFileSize(resultMp4Size) }})
          </button>

          <!-- Tool chaining CTAs -- shown after a result is ready -->
          <div v-if="resultMp4Url" class="pt-1">
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

        <!-- Preview area -->
        <template v-else>
          <!-- Side-by-side preview (after conversion) -->
          <div v-if="resultMp4Url" class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1 flex flex-col items-center">
                <img
                  :src="gifUrl"
                  alt="Original GIF"
                  class="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                />
                <span class="mt-2 text-xs font-medium text-surface-500">Original GIF</span>
                <span class="text-xs text-surface-400">{{ formatFileSize(gifFileSize) }}</span>
              </div>
              <div class="flex-1 flex flex-col items-center">
                <video
                  :src="resultMp4Url"
                  class="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded-lg"
                  autoplay
                  muted
                  loop
                  playsinline
                />
                <span class="mt-2 badge badge-primary">MP4 Result</span>
                <span class="text-xs text-surface-400 mt-1">{{ formatFileSize(resultMp4Size) }}</span>
              </div>
            </div>
          </div>

          <!-- Converting progress overlay -->
          <div v-else-if="isConverting" class="rounded-2xl overflow-hidden bg-surface-100/50 p-6 min-h-[200px] flex flex-col items-center justify-center gap-4">
            <div class="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <div class="text-center">
              <p class="text-sm font-medium text-surface-700">
                <template v-if="ffmpeg.conversionPhase.value === 'encoding'">Encoding MP4...</template>
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

          <!-- GIF preview (before conversion) -->
          <div v-else class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
            <div class="flex items-center justify-center">
              <img
                :src="gifUrl"
                alt="GIF preview"
                class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
              />
            </div>
          </div>

          <!-- File info -->
          <div v-if="gifUrl" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
            <span>{{ gifWidth }}&times;{{ gifHeight }}px</span>
            <span>{{ formatFileSize(gifFileSize) }}</span>
          </div>
        </template>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Convert GIF to MP4 Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 10 MB. All processing is browser-based, so your file never leaves your device.</li>
        <li><strong>Choose quality</strong> — pick Good (smallest file), Better (balanced), or Best (highest quality). The default "Better" setting works well for most GIFs.</li>
        <li><strong>Convert and download</strong> — click "Convert to MP4" and watch the progress. Preview the result side-by-side with the original GIF, then download your MP4 video. Completely free, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Convert GIF to MP4?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>80-90% smaller file size</strong> — MP4 uses H.264 inter-frame compression, which is dramatically more efficient than GIF's frame-by-frame LZW encoding. A 5 MB GIF often becomes a 500 KB MP4.</li>
        <li><strong>Better visual quality</strong> — GIF is limited to 256 colors per frame. MP4 supports millions of colors with no banding or dithering artifacts.</li>
        <li><strong>Faster page loads</strong> — smaller files mean faster loading times on websites and social media. MP4 is the standard format for web video and is natively supported by all modern browsers.</li>
        <li><strong>Social media compatible</strong> — Twitter, Facebook, Discord, and most platforms auto-play MP4 videos. Many platforms actually convert uploaded GIFs to MP4 behind the scenes for this reason.</li>
        <li><strong>Private and browser-based</strong> — all conversion happens locally in your browser using FFmpeg.wasm. Your files are never uploaded to a server.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF vs MP4: Key Differences</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>GIF</strong> stores each frame as a complete image with a maximum of 256 colors and uses lossless LZW compression within each frame. There is no inter-frame compression, so even small animations produce large files. GIFs loop natively in browsers and support transparency.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>MP4</strong> (H.264) uses sophisticated inter-frame compression — it only stores the differences between frames, resulting in dramatically smaller files. It supports millions of colors, producing smoother gradients and more accurate visuals. MP4 does not natively support transparency, but for most use cases the file size savings far outweigh this limitation.
      </p>
      <p class="text-sm text-surface-500 mt-3">
        Use GIF when you need transparency, universal inline playback in messaging apps, or platform-specific emotes. Use MP4 when file size matters, especially for longer animations, web content, or social media posts. You can also <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress your GIF</NuxtLink> to reduce its size while keeping the GIF format.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF to MP4 for Web Performance</h2>
      <p class="text-sm text-surface-600 mb-3">
        Web performance experts recommend replacing animated GIFs with MP4 videos. Google Lighthouse specifically flags GIF files as an opportunity to save bandwidth. Using <code class="text-xs bg-surface-100 px-1 py-0.5 rounded">&lt;video autoplay muted loop playsinline&gt;</code> provides the same visual experience as a GIF with a fraction of the bandwidth cost. This converter makes it easy to generate the MP4 file you need.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I convert a GIF to MP4?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF file, choose a quality preset (Good, Better, or Best), and click "Convert to MP4." The conversion runs in your browser and takes just seconds. Download the result — it is completely free, with no watermark and no signup.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Will my MP4 loop?</h3>
          <p class="text-sm text-surface-500 mt-1">Whether an MP4 loops depends on the player, not the file. In a web browser, use the <code class="text-xs bg-surface-100 px-1 py-0.5 rounded">loop</code> attribute on the video element. On social media platforms like Twitter, MP4s auto-loop by default. Standalone video players typically play once unless you enable repeat.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How much smaller will my MP4 be?</h3>
          <p class="text-sm text-surface-500 mt-1">MP4 is typically 80-90% smaller than the equivalent GIF. A 5 MB GIF commonly becomes 300-800 KB as an MP4. The exact savings depend on the GIF's content, dimensions, and frame count.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does MP4 support transparency?</h3>
          <p class="text-sm text-surface-500 mt-1">H.264 MP4 does not support transparency. If your GIF has a transparent background, it will be rendered as black in the MP4. For transparent video, consider WebM with VP9, though browser support is more limited.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What quality setting should I use?</h3>
          <p class="text-sm text-surface-500 mt-1">For most GIFs, "Better" (the default) provides an excellent balance of quality and file size. Use "Good" when file size is the top priority, or "Best" for high-resolution or detailed GIFs where visual fidelity matters most.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your files. The output MP4 is clean and ready to use on any platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 10 MB. All processing happens entirely in your browser — your files stay private and are never uploaded to a server.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I convert MP4 back to GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Use our <NuxtLink to="/tools/video-to-gif" class="text-primary-500 hover:underline">Video to GIF converter</NuxtLink> to convert any MP4, WebM, MOV, or AVI file to an animated GIF with full control over trim, FPS, width, and quality.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How does browser-based conversion work?</h3>
          <p class="text-sm text-surface-500 mt-1">This tool uses FFmpeg.wasm, a WebAssembly port of the professional FFmpeg video toolkit. It runs entirely in your browser — your GIF is decoded, processed, and encoded into an MP4 on your device. Nothing is uploaded to any server, giving you complete privacy.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useFFmpeg } from '~/composables/useFFmpeg'

useHead({
  title: 'GIF to MP4 Converter — Convert GIF to Video Online Free | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller file size. Browser-based, no watermark, no signup. Works on any device.' },
    { key: 'og:title', property: 'og:title', content: 'GIF to MP4 Converter — Convert GIF to Video Online Free | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller file size. Browser-based, no watermark, no signup. Works on any device.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/gif-to-mp4' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF to MP4 Converter — Convert GIF to Video Online Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller file size. Browser-based, no watermark, no signup. Works on any device.' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/gif-to-mp4' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF to MP4 Converter',
        'url': 'https://emotesizer.com/tools/gif-to-mp4',
        'description': 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller file size with H.264 encoding. Browser-based, no upload, no watermark.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Convert GIF to MP4',
          'GIF to video converter',
          'H.264 encoding',
          '80-90% smaller file size',
          '3 quality presets (Good, Better, Best)',
          'Side-by-side GIF vs MP4 preview',
          'Browser-based FFmpeg',
          'No watermark',
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
            'name': 'How do I convert a GIF to MP4?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF file, choose a quality preset (Good, Better, or Best), and click "Convert to MP4." The conversion runs in your browser and takes just seconds. Download the result — completely free, no watermark, no signup.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Will my MP4 loop?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Whether an MP4 loops depends on the player, not the file. In a web browser, use the loop attribute on the video element. On social media platforms like Twitter, MP4s auto-loop by default. Standalone video players typically play once unless you enable repeat.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How much smaller will my MP4 be?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'MP4 is typically 80-90% smaller than the equivalent GIF. A 5 MB GIF commonly becomes 300-800 KB as an MP4. The exact savings depend on the content, dimensions, and frame count.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does MP4 support transparency?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'H.264 MP4 does not support transparency. If your GIF has a transparent background, it will be rendered as black in the MP4. For transparent video, consider WebM with VP9.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What quality setting should I use?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'For most GIFs, "Better" (the default) provides an excellent balance of quality and file size. Use "Good" when file size is the top priority, or "Best" for detailed or high-resolution GIFs.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks to your files. The output MP4 is clean and ready to use on any platform.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 10 MB. All processing happens entirely in your browser — your files stay private and are never uploaded to a server.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I convert MP4 back to GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Use EmoteSizer\'s Video to GIF converter to convert any MP4, WebM, MOV, or AVI file to an animated GIF with full control over trim, FPS, width, and quality.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How does browser-based conversion work?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'This tool uses FFmpeg.wasm, a WebAssembly port of the professional FFmpeg video toolkit. It runs entirely in your browser — your GIF is decoded, processed, and encoded into an MP4 on your device. Nothing is uploaded to any server.',
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
        'name': 'How to Convert GIF to MP4 Online',
        'description': 'Convert any animated GIF to MP4 video using EmoteSizer\'s free online GIF to MP4 converter. No signup, no watermark, no software to install.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your GIF',
            'text': 'Drag and drop or click to browse. Supports animated GIFs up to 10 MB. Your file is processed entirely in your browser using FFmpeg.wasm and never leaves your device.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Choose quality',
            'text': 'Select Good (smallest file), Better (balanced, default), or Best (highest quality). The Better preset works well for most GIFs.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Convert and download',
            'text': 'Click "Convert to MP4" and watch the progress. Preview the result side-by-side with the original GIF, then download your MP4. Free, no watermark, no signup.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF to MP4 Converter' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF to MP4', 'item': 'https://emotesizer.com/tools/gif-to-mp4' },
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

const gifUrl = ref('')
const gifFileName = ref('')
const gifFileSize = ref(0)
const gifFile = ref<File | null>(null)
const gifWidth = ref(0)
const gifHeight = ref(0)
const quality = ref<'good' | 'better' | 'best'>('better')
const isConverting = ref(false)
const resultMp4Url = ref<string | null>(null)
const resultMp4Blob = ref<Blob | null>(null)
const resultMp4Size = ref(0)

// -- Quality presets --

const qualityOptions = [
  { label: 'Good', value: 'good' as const },
  { label: 'Better', value: 'better' as const },
  { label: 'Best', value: 'best' as const },
]

/**
 * Maps quality preset to CRF (Constant Rate Factor) value.
 * Lower CRF = higher quality, larger file. Range: 0-51.
 * 18 = visually lossless, 23 = default, 28 = smaller/lower quality.
 */
const crfMap: Record<'good' | 'better' | 'best', number> = {
  good: 28,
  better: 23,
  best: 18,
}

// -- Computed --

/** Percentage of file size savings after conversion */
const savingsPercent = computed(() => {
  if (gifFileSize.value <= 0 || resultMp4Size.value <= 0) return 0
  return Math.round((1 - resultMp4Size.value / gifFileSize.value) * 100)
})

// -- Format helpers --

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// -- State reset --

function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (resultMp4Url.value) URL.revokeObjectURL(resultMp4Url.value)

  gifFile.value = null
  gifUrl.value = ''
  gifFileName.value = ''
  gifFileSize.value = 0
  gifWidth.value = 0
  gifHeight.value = 0
  quality.value = 'better'
  resultMp4Url.value = null
  resultMp4Blob.value = null
  resultMp4Size.value = 0
  isConverting.value = false
}

// -- File handling --

function handleFileSelected(file: File) {
  resetState()

  gifFile.value = file
  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  gifFileSize.value = file.size

  // Extract dimensions from the image's natural size
  const img = new Image()
  img.onload = () => {
    gifWidth.value = img.naturalWidth
    gifHeight.value = img.naturalHeight
  }
  img.src = gifUrl.value

  // Eagerly start loading FFmpeg in the background
  if (!ffmpeg.isReady.value && !ffmpeg.isLoading.value) {
    ffmpeg.load()
  }
}

function handleUploadError(message: string) {
  toastError(message)
}

function clearGif() {
  resetState()
}

// -- Conversion --

async function convertGif() {
  if (!gifFile.value || isConverting.value || ffmpeg.isLoading.value) return

  // Snapshot the quality setting before async work
  const currentCrf = crfMap[quality.value]

  // Revoke previous result if any
  if (resultMp4Url.value) {
    URL.revokeObjectURL(resultMp4Url.value)
    resultMp4Url.value = null
    resultMp4Blob.value = null
    resultMp4Size.value = 0
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

    const blob = await ffmpeg.convertToMp4({
      inputFile: gifFile.value,
      crf: currentCrf,
    })

    resultMp4Blob.value = blob
    resultMp4Url.value = URL.createObjectURL(blob)
    resultMp4Size.value = blob.size
    toastSuccess('GIF converted to MP4!')
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

function downloadMp4() {
  if (!resultMp4Blob.value) return

  const baseName = gifFileName.value.replace(/\.[^.]+$/, '') || 'animation'
  downloadBlob(resultMp4Blob.value, `${baseName}.mp4`)
  toastSuccess('MP4 downloaded!')
}

// -- Cleanup --

onUnmounted(() => {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (resultMp4Url.value) URL.revokeObjectURL(resultMp4Url.value)
})
</script>
