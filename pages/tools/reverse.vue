<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Reverser</h1>
      <p class="page-subtitle mt-1">Play GIFs backwards or create seamless boomerang loops — free, no watermark, no signup</p>
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
                {{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px
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
            This GIF has only 1 frame — reverse and boomerang are not applicable.
          </p>

          <!-- Mode controls (only for multi-frame GIFs) -->
          <template v-if="decodedFrames.length > 1">
            <!-- Mode Switcher: Reverse vs Boomerang -->
            <div>
              <h3 class="label mb-2">Mode</h3>
              <div class="segmented-control w-full" role="radiogroup" aria-label="Reverse mode">
                <button
                  role="radio"
                  :aria-checked="activeMode === 'reverse'"
                  class="segmented-control-item flex-1 justify-center"
                  :class="{ 'segmented-control-item-active': activeMode === 'reverse' }"
                  @click="setMode('reverse')"
                >
                  <!-- Reverse arrow icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Reverse
                </button>
                <button
                  role="radio"
                  :aria-checked="activeMode === 'boomerang'"
                  class="segmented-control-item flex-1 justify-center"
                  :class="{ 'segmented-control-item-active': activeMode === 'boomerang' }"
                  @click="setMode('boomerang')"
                >
                  <!-- Boomerang (repeat/loop) icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                  Boomerang
                </button>
              </div>
            </div>

            <!-- Mode description -->
            <div class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p v-if="activeMode === 'reverse'" class="text-xs text-surface-600">
                Plays the entire animation in reverse order. Frame count stays the same ({{ decodedFrames.length }} frames).
              </p>
              <p v-else class="text-xs text-surface-600">
                Plays forward then backward in a seamless loop. Output will have {{ boomerangFrameCount }} frames ({{ decodedFrames.length }} original + {{ boomerangFrameCount - decodedFrames.length }} reversed, minus duplicates at loop points).
              </p>
            </div>

            <!-- Playback Speed (secondary control) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 id="speed-label" class="label !mb-0">Playback Speed</h3>
                <span v-if="speedMultiplier !== 1" class="text-xs font-medium text-primary-500">{{ speedDisplayLabel }}</span>
              </div>
              <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Playback speed">
                <button
                  v-for="preset in speedPresets"
                  :key="preset"
                  role="radio"
                  :aria-checked="speedMultiplier === preset"
                  class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                  :class="{ 'pill-active': speedMultiplier === preset }"
                  @click="speedMultiplier = preset"
                >
                  {{ preset }}x
                </button>
              </div>
              <!-- Compact fine-tune slider -->
              <div class="mt-2.5">
                <input
                  :value="speedMultiplier"
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.05"
                  class="w-full accent-primary-500 h-1.5"
                  aria-labelledby="speed-label"
                  @input="handleSliderInput"
                />
                <div class="flex justify-between text-[10px] text-surface-400 mt-0.5">
                  <span>0.25x</span>
                  <span>3x</span>
                </div>
              </div>
            </div>

            <!-- Boomerang file size warning for large GIFs -->
            <div
              v-if="activeMode === 'boomerang' && decodedFrames.length > 30"
              class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-warning-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p class="text-xs text-warning-700">
                Boomerang nearly doubles the frame count. The output file will be significantly larger. Consider
                <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compressing</NuxtLink>
                the result afterwards.
              </p>
            </div>
          </template>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isEncoding || isDecoding || decodedFrames.length <= 1"
            @click="downloadGif"
          >
            <template v-if="isEncoding">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding...
            </template>
            <template v-else>
              <IconDownload :size="18" />
              {{ downloadLabel }}
            </template>
          </button>

          <!-- Tool chaining CTAs — shown after a result is ready -->
          <div v-if="previewUrl && !isPreviewEncoding" class="pt-1">
            <p class="text-xs text-surface-400 mb-2">Continue editing this GIF</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink to="/tools/compress" aria-label="Continue editing: compress this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCompress :size="14" />
                Compress
              </NuxtLink>
              <NuxtLink to="/tools/speed" aria-label="Continue editing: change GIF speed" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconGauge :size="14" />
                Change Speed
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

        <!-- GIF preview: side-by-side when modified, single otherwise -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
          <!-- Side-by-side preview (when we have a modified preview) -->
          <div v-if="previewUrl" class="flex flex-col md:flex-row gap-4">
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
                :alt="activeMode === 'reverse' ? 'Reversed GIF' : 'Boomerang GIF'"
                class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
              />
              <span class="mt-2 badge badge-primary">
                {{ activeMode === 'reverse' ? 'Reversed' : 'Boomerang' }}
                <template v-if="speedMultiplier !== 1"> &middot; {{ speedMultiplier }}x</template>
              </span>
            </div>
          </div>
          <!-- Single centered preview (original, before mode is applied or while encoding) -->
          <div v-else class="flex items-center justify-center">
            <img
              :src="gifUrl"
              alt="GIF preview"
              class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
            />
          </div>
        </div>

        <!-- Encoding indicator below preview -->
        <div v-if="isPreviewEncoding" class="mt-3 flex items-center gap-2 text-xs text-surface-400">
          <div class="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Generating preview...
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span v-if="activeMode === 'boomerang' && decodedFrames.length > 1">
            &rarr; {{ boomerangFrameCount }} frames (boomerang)
          </span>
        </div>
      </div>

    </div>

    <!-- Related tools — reverse chains well with speed, loop, compress, and trim for emote workflows -->
    <ToolRelated
      current="/tools/reverse"
      :tools="[
        { to: '/tools/speed', label: 'GIF Speed', icon: 'IconGauge', description: 'Speed up or slow down GIF animation' },
        { to: '/tools/loop', label: 'GIF Loop', icon: 'IconLoop', description: 'Change how many times a GIF loops before stopping' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Reverse a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Choose a mode</strong> — select "Reverse" to play the GIF backwards, or "Boomerang" to create a seamless forward-backward ping-pong loop. Optionally adjust playback speed.</li>
        <li><strong>Preview the result</strong> — see your reversed or boomerang GIF play side-by-side with the original animation.</li>
        <li><strong>Download</strong> — click the download button to save your modified GIF. Completely free, no watermark, no account needed.</li>
      </ol>
      <p class="text-xs text-surface-400 mt-2">All processing happens in your browser — <NuxtLink to="/tools#how-it-works" class="text-primary-500 hover:underline">see how the in-browser pipeline works</NuxtLink>.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Reverse vs. Boomerang — When to Use Each</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Reverse</strong> plays the entire animation backward — frame 10, 9, 8, ..., 1. The frame count stays the same, and the file size is nearly identical to the original. This is what you want when you simply need a GIF to play backwards.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Boomerang</strong> (also called ping-pong) plays the animation forward, then backward, in one continuous loop. The first and last frames are not duplicated at the turnaround points, so the GIF loops back and forth seamlessly. The trade-off is that the frame count nearly doubles, which increases file size — but the result is a smooth, mesmerizing reverse animation loop.
      </p>
      <p class="text-sm text-surface-500 mt-3">
        If the boomerang output is too large, use our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to reduce the file size. You can also <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">change the speed</NuxtLink> or <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">trim frames</NuxtLink> before applying boomerang.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Reverse GIFs for Twitch, Discord & Streaming Emotes</h2>
      <p class="text-sm text-surface-600 mb-3">
        Reversed and boomerang emotes are increasingly popular across streaming platforms. Whether you're building a Twitch emote library, adding animated emoji to a Discord server, or creating content for third-party emote extensions, our GIF reverser fits directly into your workflow.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Twitch animated emotes</strong> — reversed emotes create surprise and comedic effects that stand out in chat. Boomerang loops are especially useful because they halve the original frame count needed for a smooth loop, helping you stay under the 60-frame limit while keeping the animation fluid.</li>
        <li><strong>Discord animated emoji</strong> — reversed reactions add variety to your server without creating entirely new art. Boomerang creates seamless loops that look polished within the 256 KB size limit. Pair with our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compressor</NuxtLink> to hit that target.</li>
        <li><strong>7TV / BTTV / FFZ emotes</strong> — ping-pong style emotes are a staple on these platforms. The forward-backward loop creates a smooth, satisfying animation that loops cleanly without a visible seam.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        After reversing, you can <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">adjust the playback speed</NuxtLink> to match platform-specific timing requirements, or <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress the result</NuxtLink> to meet file size limits.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I reverse a GIF online?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, choose Reverse mode, preview the result side-by-side with the original, and download. The frame order is rewritten in place, so the reversed clip plays back at the same speed and quality as the source.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a boomerang GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and choose Boomerang mode. The tool creates a seamless forward-backward loop (also called a ping-pong GIF) that you can preview and download instantly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the difference between reverse and boomerang?</h3>
          <p class="text-sm text-surface-500 mt-1">Reverse plays the entire animation backward — the last frame becomes the first. Boomerang plays forward then backward in a seamless loop, creating a continuous back-and-forth animation.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I reverse a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Reversing only reorders the existing frames — pixel data, colors, and transparency are all preserved exactly as they are in the original.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF play backwards?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, select Reverse mode, and download. The animation will play in the opposite direction with the same frame count and quality as the original.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does boomerang double the file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Boomerang adds reversed frames to create the loop, so the output file will be larger — typically close to double. Use our <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> afterwards to reduce the file size.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I reverse a GIF for Discord or Twitch emotes?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Reverse or boomerang your emote GIF, then adjust the <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">playback speed</NuxtLink> to match platform requirements and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress</NuxtLink> to meet file size limits.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. Reverse mode keeps the original frame count, while Boomerang mode roughly doubles it — keep that in mind on very long source GIFs.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is a ping-pong GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">A ping-pong GIF (also called a boomerang) loops forward then backward, creating a seamless back-and-forth animation. It's a popular effect for emotes, memes, and social media content because it loops infinitely without a visible seam.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'GIF Reverser & Boomerang Maker — EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Reverse any GIF online for free — no watermark, no signup. Play GIFs backwards or create boomerang ping-pong loops. Perfect for Discord emotes, Twitch animations & memes.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Reverser & Boomerang Maker — EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Reverse any GIF online for free — no watermark, no signup. Play GIFs backwards or create boomerang ping-pong loops. Perfect for Discord emotes, Twitch animations & memes.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/reverse' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Reverser & Boomerang Maker — EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Reverse any GIF online for free — no watermark, no signup. Play GIFs backwards or create boomerang ping-pong loops. Perfect for Discord emotes, Twitch animations & memes.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/reverse' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Reverser & Boomerang Maker',
        'url': 'https://emotesizer.com/tools/reverse',
        'description': 'Free online GIF reverser. Reverse any GIF or create boomerang ping-pong loops. Play GIFs backwards, make seamless loops for Discord emotes, Twitch animations & memes. No watermark, no signup — processed in your browser.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Reverse playback (play backwards)',
          'Boomerang / ping-pong loop creation',
          'Side-by-side original vs. reversed preview',
          'Adjustable playback speed',
          'Seamless loop output',
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
            'name': 'How do I reverse a GIF online?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, choose Reverse mode, preview the result side-by-side with the original, and download. The frame order is rewritten in place, so the reversed clip plays back at the same speed and quality as the source.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a boomerang GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and choose Boomerang mode. The tool creates a seamless forward-backward loop (also called a ping-pong GIF) that you can preview and download instantly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the difference between reverse and boomerang?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Reverse plays the entire animation backward — the last frame becomes the first. Boomerang plays forward then backward in a seamless loop, creating a continuous back-and-forth animation.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I reverse a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Reversing only reorders the existing frames — pixel data, colors, and transparency are all preserved exactly as they are in the original.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF play backwards?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, select Reverse mode, and download. The animation will play in the opposite direction with the same frame count and quality as the original.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does boomerang double the file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Boomerang adds reversed frames to create the loop, so the output file will be larger — typically close to double. Use EmoteSizer\'s GIF compressor afterwards to reduce the file size.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I reverse a GIF for Discord or Twitch emotes?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Reverse or boomerang your emote GIF, then adjust the playback speed to match platform requirements and compress to meet file size limits.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. Reverse mode keeps the original frame count, while Boomerang mode roughly doubles it — keep that in mind on very long source GIFs.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is a ping-pong GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A ping-pong GIF (also called a boomerang) loops forward then backward, creating a seamless back-and-forth animation. It\'s a popular effect for emotes, memes, and social media content because it loops infinitely without a visible seam.',
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
        'name': 'How to Reverse a GIF Online',
        'description': 'Reverse any GIF animation or create a boomerang ping-pong loop using EmoteSizer\'s free online GIF reverser. No signup, no watermark.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your GIF',
            'text': 'Drag and drop or click to browse. Supports animated GIFs up to 20 MB.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Choose reverse or boomerang mode',
            'text': 'Select "Reverse" to play the GIF backwards, or "Boomerang" to create a seamless forward-backward ping-pong loop. Optionally adjust the playback speed.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Preview and download',
            'text': 'Preview the reversed or boomerang GIF side-by-side with the original, then click download. Free, no watermark, no account needed.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Reverser' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Reverser', 'item': 'https://emotesizer.com/tools/reverse' },
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
const isDecoding = ref(false)
const isEncoding = ref(false)
const isPreviewEncoding = ref(false)
const previewUrl = ref<string | null>(null)
/** Stores decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

type ReverseMode = 'reverse' | 'boomerang'
const activeMode = ref<ReverseMode>('reverse')

// -- Speed control state --
const speedPresets = [0.5, 1, 1.5, 2] as const
const speedMultiplier = ref(1)

let previewTimeout: ReturnType<typeof setTimeout> | null = null
/** Generation counter to discard stale preview encodes after rapid mode switches */
let previewGeneration = 0

// -- Computed --

/** Number of frames in boomerang output: original + reversed minus first and last to avoid stutter */
const boomerangFrameCount = computed(() => {
  const len = decodedFrames.value.length
  if (len <= 2) return len * 2 - 1
  // original frames + reversed frames minus first and last of reversed copy
  return len + (len - 2)
})

/** Label for the download button */
const downloadLabel = computed(() => {
  if (decodedFrames.value.length <= 1) return 'Download GIF'
  return activeMode.value === 'reverse' ? 'Download Reversed GIF' : 'Download Boomerang GIF'
})

/** Speed display label shown beside the heading when speed is not 1x */
const speedDisplayLabel = computed(() => {
  const s = speedMultiplier.value
  if (s === 1) return ''
  return s < 1 ? `${s}x slower` : `${s}x faster`
})

// -- Frame manipulation --

/** Returns the frames in reverse order */
function getReversedFrames(frames: DecodedFrame[]): DecodedFrame[] {
  return [...frames].reverse()
}

/** Returns boomerang frames: original + reversed (minus first and last to avoid double-frame stutter) */
function getBoomerangFrames(frames: DecodedFrame[]): DecodedFrame[] {
  if (frames.length <= 1) return frames
  // For 2-frame GIFs, slice(1, -1) on the reversed copy yields nothing,
  // so handle it explicitly: [1, 2] -> [1, 2, 1]
  if (frames.length === 2) return [...frames, frames[0]]
  const reversed = [...frames].reverse()
  // Remove first and last of the reversed copy to avoid duplicating frames at the turnaround
  const tail = reversed.slice(1, -1)
  return [...frames, ...tail]
}

/** Builds the output frames based on the active mode */
function getOutputFrames(): DecodedFrame[] {
  const frames = decodedFrames.value
  if (!frames.length) return []
  return activeMode.value === 'reverse' ? getReversedFrames(frames) : getBoomerangFrames(frames)
}

/** Builds the encode parameters for the current mode/speed settings.
 *  Shared by preview watcher and downloadGif() to avoid duplication. */
function buildReverseEncodeParams() {
  const outputFrames = getOutputFrames()
  return {
    width: decodedFrames.value[0].width,
    height: decodedFrames.value[0].height,
    looped: gifMetadata.value?.looped ?? true,
    frames: outputFrames.map(f => ({
      data: f.data,
      delay: getAdjustedDelay(f.delay),
    })),
  }
}

// -- State reset helper (shared by handleFileSelected and clearGif) --

/** Revokes blob URLs, cancels pending timers, and resets all reactive state to defaults */
function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  activeMode.value = 'reverse'
  speedMultiplier.value = 1
  previewUrl.value = null
  gifMetadata.value = null
}

// -- File handling --

function handleFileSelected(file: File) {
  resetState()

  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
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
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Mode change --

function setMode(mode: ReverseMode) {
  activeMode.value = mode
}

// -- Speed control --

/** Handles slider input with rounding to avoid floating-point imprecision (e.g. 1.0000000001) */
function handleSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  speedMultiplier.value = Math.round(parseFloat(target.value) * 100) / 100
}

/** Computes the output delay for a frame, applying the speed multiplier.
 *  Clamps to a 20ms minimum (browsers ignore anything lower). */
function getAdjustedDelay(originalDelay: number): number {
  const adjusted = Math.round((originalDelay || 100) / speedMultiplier.value)
  return Math.max(20, adjusted)
}

// -- Debounced preview re-encode --

watch([activeMode, speedMultiplier, () => decodedFrames.value.length], () => {
  if (previewTimeout) clearTimeout(previewTimeout)

  if (!decodedFrames.value.length || decodedFrames.value.length <= 1) return

  // Bump generation so any in-flight encode from a previous mode switch is discarded
  const currentGeneration = ++previewGeneration

  previewTimeout = setTimeout(async () => {
    isPreviewEncoding.value = true
    try {
      const encoded = await encode(buildReverseEncodeParams())

      // Check if this encode is still current BEFORE creating the blob to avoid memory leaks
      if (currentGeneration !== previewGeneration) {
        isPreviewEncoding.value = false
        return
      }

      const blob = new Blob([encoded], { type: 'image/gif' })

      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)
    } catch (e) {
      if (import.meta.dev) console.error('Reverse preview failed:', e)
    } finally {
      // Only clear the encoding indicator if this is still the current generation
      if (currentGeneration === previewGeneration) {
        isPreviewEncoding.value = false
      }
    }
  }, 400)
})

// -- Download --

async function downloadGif() {
  const baseName = gifFileName.value || 'animation.gif'
  const prefix = activeMode.value === 'reverse' ? 'reversed_' : 'boomerang_'

  // Cancel any pending preview encode
  if (previewTimeout) {
    clearTimeout(previewTimeout)
    previewTimeout = null
  }

  // If we already have a finished preview blob (not mid-encode), reuse it
  if (previewUrl.value && !isPreviewEncoding.value) {
    isEncoding.value = true
    try {
      const response = await fetch(previewUrl.value)
      const blob = await response.blob()
      downloadBlob(blob, `${prefix}${baseName}`)
      toastSuccess('GIF downloaded!')
    } finally {
      isEncoding.value = false
    }
    return
  }

  // Revoke any stale preview URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  // Encode fresh
  isEncoding.value = true
  try {
    const encoded = await encode(buildReverseEncodeParams())
    const blob = new Blob([encoded], { type: 'image/gif' })
    downloadBlob(blob, `${prefix}${baseName}`)
    toastSuccess('GIF downloaded!')
  } catch {
    toastError('Failed to encode GIF')
  } finally {
    isEncoding.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  resetState()
}

onUnmounted(() => {
  clearGif()
})
</script>
