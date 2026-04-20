<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to MP4 Converter — Convert GIF to Video Online Free</h1>
      <p class="page-subtitle mt-1">Convert animated GIFs to MP4 video for 80-90% smaller file size — browser-based, no upload to servers, no watermark, no signup.</p>
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

    <!-- Related tools — GIF-to-MP4 pairs with video-to-GIF roundtrip, frame extraction, compression, and trim -->
    <ToolRelated
      current="/tools/gif-to-mp4"
      :tools="[
        { to: '/tools/video-to-gif', label: 'Video to GIF', icon: 'IconVideo', description: 'Convert video clips to animated GIFs' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/gif-to-png', label: 'GIF to PNG', icon: 'IconFrame', description: 'Extract individual frames as PNG images' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Convert GIF to MP4 Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB. All processing is browser-based, so your file never leaves your device.</li>
        <li><strong>Choose quality</strong> — pick Good (smallest file), Better (balanced), or Best (highest quality). The default "Better" setting works well for most GIFs.</li>
        <li><strong>Convert and download</strong> — click "Convert to MP4" and watch the progress. Preview the result side-by-side with the original GIF, then download your MP4 video. Completely free, no watermark, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Convert GIF to MP4?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>80-90% smaller file size</strong> — MP4 uses H.264 inter-frame compression, which is dramatically more efficient than GIF's frame-by-frame LZW encoding. A 5 MB GIF often becomes 300-500 KB as an MP4.</li>
        <li><strong>Better visual quality</strong> — GIF is limited to 256 colors per frame. MP4 supports millions of colors with no banding or dithering artifacts, so quality is preserved or improved when you convert GIF to video.</li>
        <li><strong>Faster page loads</strong> — smaller files mean faster loading times on websites. Google Lighthouse specifically recommends replacing animated GIFs with video for better web performance.</li>
        <li><strong>Supported everywhere</strong> — MP4 is the universal video format, natively supported by every modern browser, operating system, and device. Hardware-accelerated playback keeps things smooth even on mobile.</li>
        <li><strong>Social media compatibility</strong> — Instagram does not support GIF uploads at all; you must convert to MP4 first. Twitter, Facebook, Discord, and TikTok all prefer or require MP4 video.</li>
        <li><strong>Private and browser-based</strong> — all conversion happens locally in your browser using FFmpeg compiled to WebAssembly. Your files are never uploaded to a server. No software to install, no signup required.</li>
        <li><strong>Free with no watermark</strong> — EmoteSizer never adds watermarks. The output MP4 is clean and ready to use anywhere.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF to MP4 for Social Media &amp; Messaging</h2>
      <p class="text-sm text-surface-600 mb-3">
        Many social platforms have moved away from GIF in favor of MP4 video. <strong>Instagram</strong> does not accept GIF uploads — you need to convert your animated GIF to MP4 before posting. <strong>Discord</strong> imposes file size limits (8 MB for free users), and since MP4 files are 80-90% smaller than GIFs, converting helps you stay well within those limits. <strong>Twitter</strong> and <strong>TikTok</strong> auto-convert GIFs to video behind the scenes, but uploading an MP4 directly gives you more control over quality.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        If you need to adjust your animation before converting, you can <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress your GIF</NuxtLink> to reduce frames and colors, or <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize it</NuxtLink> to fit the platform's recommended dimensions. Then use this GIF to MP4 converter to produce a lightweight video file ready for any social network.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF vs MP4: Which Format Is Better?</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>GIF</strong> stores each frame as a complete image with a maximum of 256 colors. There is no inter-frame compression, so even short animations produce large files. The main advantage of GIF is that it auto-plays inline without a video player, making it ideal for emails, forum posts, and chat apps where embedded video is not supported. GIFs also support transparency.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>MP4</strong> (H.264) uses sophisticated inter-frame compression — it only stores the differences between frames, producing files that are 80-90% smaller. MP4 supports millions of colors (24-bit) versus GIF's 256, resulting in smoother gradients and more accurate visuals without dithering. Playback is hardware-accelerated on virtually every device, keeping CPU usage low.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        Google Lighthouse and web performance audits recommend serving video instead of animated GIF. Using <code class="text-xs bg-surface-100 px-1 py-0.5 rounded">&lt;video autoplay muted loop playsinline&gt;</code> provides the same visual experience as a GIF with a fraction of the bandwidth cost. For web content, social media, and any situation where file size matters, MP4 is the better choice.
      </p>
      <p class="text-sm text-surface-500 mt-3">
        Use GIF when you need transparency, universal inline playback in emails or messaging apps, or platform-specific emotes. Use MP4 for everything else — especially longer animations, web content, and social media posts. You can also <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress your GIF</NuxtLink> to reduce its size while keeping the GIF format.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I convert GIF to MP4?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF file, choose a quality preset (Good, Better, or Best), and click "Convert to MP4." The conversion runs in your browser and takes just seconds. Download the result — it is completely free, with no watermark and no signup required.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How much smaller is MP4 than GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">MP4 is typically 80-90% smaller than the equivalent GIF. A 5 MB GIF commonly becomes 300-500 KB as an MP4. The exact savings depend on the content, dimensions, and frame count, but the reduction is always significant.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does converting GIF to MP4 lose quality?</h3>
          <p class="text-sm text-surface-500 mt-1">No. MP4 actually supports more colors than GIF — millions versus GIF's 256-color limit. When you convert an animated GIF to MP4, quality is preserved or improved because the video format can represent smoother gradients and more detail without dithering artifacts.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Will my MP4 loop like the original GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">It depends on the player. On the web, use the <code class="text-xs bg-surface-100 px-1 py-0.5 rounded">&lt;video loop&gt;</code> attribute and the video will loop seamlessly. Social media platforms like Twitter and Instagram loop MP4 videos by default. Standalone desktop players may play once unless you enable repeat.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I upload a GIF to Instagram?</h3>
          <p class="text-sm text-surface-500 mt-1">Instagram does not support GIF uploads directly. You need to convert your animated GIF to MP4 first, then upload the video. Our GIF to MP4 converter makes this easy — just upload, convert, and download the MP4 ready for Instagram.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. All processing happens entirely in your browser — your files stay private and are never uploaded to a server.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your files. The output MP4 is clean and ready to use on any platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I convert GIF to MP4 without software?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. This GIF to MP4 converter runs entirely in your browser via WebAssembly — no app or software to install. It works on Mac, Windows, iPhone, and Android. Just open the page and start converting.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why should I convert GIF to MP4?</h3>
          <p class="text-sm text-surface-500 mt-1">Converting GIF to MP4 gives you smaller files, better visual quality, faster loading times, and wider platform support. Google recommends serving video instead of animated GIF for web performance. MP4 is also required for platforms like Instagram that do not accept GIF uploads.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How does browser-based conversion work?</h3>
          <p class="text-sm text-surface-500 mt-1">This tool uses FFmpeg compiled to WebAssembly (FFmpeg.wasm). It runs entirely in your browser — your GIF is decoded, processed, and encoded into an MP4 on your device. Nothing is uploaded to any server, giving you complete privacy.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I convert GIF to MP4 for Discord?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. MP4 files are much smaller than GIFs, which helps you stay within Discord's file size limits (8 MB for free users). Convert your animated GIF to MP4 here and share it without hitting the upload cap.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What quality setting should I use?</h3>
          <p class="text-sm text-surface-500 mt-1">"Better" (the default) works well for most cases, providing an excellent balance of quality and file size. Use "Best" for high-resolution or detailed content where visual fidelity matters most. Use "Good" for maximum compression when you need the smallest possible file.</p>
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
    { key: 'description', name: 'description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller files. Browser-based, no upload, no watermark, no signup. Works on any device.' },
    { key: 'og:title', property: 'og:title', content: 'GIF to MP4 Converter — Convert GIF to Video Online Free | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller files. Browser-based, no upload, no watermark, no signup. Works on any device.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/gif-to-mp4' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF to MP4 Converter — Convert GIF to Video Online Free | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller files. Browser-based, no upload, no watermark, no signup. Works on any device.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
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
        'description': 'Free online GIF to MP4 converter. Convert animated GIFs to MP4 video for 80-90% smaller files. Browser-based, no upload, no watermark.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Convert GIF to MP4',
          '80-90% file size reduction',
          'GIF to video converter',
          'Browser-based FFmpeg',
          'Quality presets (CRF)',
          'No watermark',
          'No signup',
          'Works on any device',
          'GIF to MP4 for Instagram',
          'GIF to MP4 for Discord',
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
            'name': 'How do I convert GIF to MP4?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF file, choose a quality preset (Good, Better, or Best), and click "Convert to MP4." The conversion runs in your browser and takes just seconds. Download the result — it is completely free, with no watermark and no signup required.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How much smaller is MP4 than GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'MP4 is typically 80-90% smaller than the equivalent GIF. A 5 MB GIF commonly becomes 300-500 KB as an MP4. The exact savings depend on the content, dimensions, and frame count, but the reduction is always significant.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does converting GIF to MP4 lose quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. MP4 actually supports more colors than GIF — millions versus GIF\'s 256-color limit. When you convert an animated GIF to MP4, quality is preserved or improved because the video format can represent smoother gradients and more detail without dithering artifacts.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Will my MP4 loop like the original GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'It depends on the player. On the web, use the <video loop> attribute and the video will loop seamlessly. Social media platforms like Twitter and Instagram loop MP4 videos by default. Standalone desktop players may play once unless you enable repeat.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I upload a GIF to Instagram?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Instagram does not support GIF uploads directly. You need to convert your animated GIF to MP4 first, then upload the video. Our GIF to MP4 converter makes this easy — just upload, convert, and download the MP4 ready for Instagram.',
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
            'name': 'Can I convert GIF to MP4 without software?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. This GIF to MP4 converter runs entirely in your browser via WebAssembly — no app or software to install. It works on Mac, Windows, iPhone, and Android. Just open the page and start converting.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why should I convert GIF to MP4?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Converting GIF to MP4 gives you smaller files, better visual quality, faster loading times, and wider platform support. Google recommends serving video instead of animated GIF for web performance. MP4 is also required for platforms like Instagram that do not accept GIF uploads.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How does browser-based conversion work?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'This tool uses FFmpeg compiled to WebAssembly (FFmpeg.wasm). It runs entirely in your browser — your GIF is decoded, processed, and encoded into an MP4 on your device. Nothing is uploaded to any server, giving you complete privacy.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I convert GIF to MP4 for Discord?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. MP4 files are much smaller than GIFs, which helps you stay within Discord\'s file size limits (8 MB for free users). Convert your animated GIF to MP4 here and share it without hitting the upload cap.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What quality setting should I use?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': '"Better" (the default) works well for most cases, providing an excellent balance of quality and file size. Use "Best" for high-resolution or detailed content where visual fidelity matters most. Use "Good" for maximum compression when you need the smallest possible file.',
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
        'description': 'Convert any animated GIF to MP4 video online free using EmoteSizer\'s browser-based GIF to MP4 converter. No upload to servers, no watermark, no software to install.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your animated GIF',
            'text': 'Drag and drop or click to browse for a GIF file (up to 20 MB). Your file is processed entirely in your browser and never leaves your device — completely private.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Choose MP4 quality preset',
            'text': 'Select Good (smallest file, maximum compression), Better (balanced, recommended default), or Best (highest quality for detailed GIFs). The converter uses H.264 CRF encoding.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Convert GIF to MP4 and download',
            'text': 'Click "Convert to MP4" and watch the progress. Preview the MP4 video side-by-side with the original GIF, then download. File size is typically 80-90% smaller. Free, no watermark, no signup.',
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

// -- Blob URL cleanup --

/** Revokes both blob URLs to prevent memory leaks */
function revokeUrls() {
  if (gifUrl.value) { URL.revokeObjectURL(gifUrl.value); gifUrl.value = '' }
  if (resultMp4Url.value) { URL.revokeObjectURL(resultMp4Url.value); resultMp4Url.value = null }
}

// -- State reset --

function resetState() {
  revokeUrls()

  gifFile.value = null
  gifFileName.value = ''
  gifFileSize.value = 0
  gifWidth.value = 0
  gifHeight.value = 0
  quality.value = 'better'
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
  img.onerror = () => {
    toastError('Failed to load GIF preview')
    resetState()
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

  // Revoke previous result URL if re-converting (gif URL still needed for preview)
  if (resultMp4Url.value) {
    URL.revokeObjectURL(resultMp4Url.value)
    resultMp4Url.value = null
  }
  resultMp4Blob.value = null
  resultMp4Size.value = 0

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
  revokeUrls()
})
</script>
