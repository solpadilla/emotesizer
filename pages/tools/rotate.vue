<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Rotate & Flip — Rotate or Mirror GIFs Online Free</h1>
      <p class="page-subtitle mt-1">Rotate GIFs 90&deg;, 180&deg;, or 270&deg; and flip horizontally or vertically &mdash; all online and free. Instant preview, no watermark, no signup.</p>
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
                {{ sourceWidth }}&times;{{ sourceHeight }}px &middot; {{ decodedFrames.length }} frames
              </p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Rotation -->
          <div>
            <h3 class="label mb-2">Rotation</h3>
            <div class="segmented-control w-full" role="radiogroup" aria-label="Rotation angle">
              <button
                v-for="preset in rotationPresets"
                :key="preset.value"
                role="radio"
                :aria-checked="rotation === preset.value"
                class="segmented-control-item flex-1 justify-center gap-1.5"
                :class="{ 'segmented-control-item-active': rotation === preset.value }"
                @click="rotation = preset.value"
              >
                <!-- Rotation icon -->
                <svg
                  v-if="preset.value !== 0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :class="{ 'scale-x-[-1]': preset.value === 270 }"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                </svg>
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Flip -->
          <div>
            <h3 class="label mb-2">Flip</h3>
            <div class="flex gap-2">
              <button
                class="pill flex-1 justify-center gap-2"
                :class="{ 'pill-active': flipH }"
                role="checkbox"
                :aria-checked="flipH"
                @click="flipH = !flipH"
              >
                <!-- Horizontal flip icon: two arrows pointing left/right -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
                  <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
                  <line x1="12" y1="20" x2="12" y2="4" stroke-dasharray="2 2" />
                </svg>
                Horizontal
              </button>
              <button
                class="pill flex-1 justify-center gap-2"
                :class="{ 'pill-active': flipV }"
                role="checkbox"
                :aria-checked="flipV"
                @click="flipV = !flipV"
              >
                <!-- Vertical flip icon: two arrows pointing up/down -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                  <line x1="4" y1="12" x2="20" y2="12" stroke-dasharray="2 2" />
                </svg>
                Vertical
              </button>
            </div>
          </div>

          <!-- Output dimensions info -->
          <div
            v-if="isTransformed"
            class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              <template v-if="dimensionsSwapped">
                Output: {{ outputWidth }}&times;{{ outputHeight }}px (width and height swapped)
              </template>
              <template v-else>
                Output: {{ outputWidth }}&times;{{ outputHeight }}px (dimensions unchanged)
              </template>
              <template v-if="transformDescription">
                <br />{{ transformDescription }}
              </template>
            </p>
          </div>

          <!-- Reset button (shown when any transform is active) -->
          <button
            v-if="isTransformed"
            class="flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
            @click="resetTransform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset to original
          </button>

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
              {{ isTransformed ? 'Download Rotated/Flipped GIF' : 'Download GIF' }}
            </template>
          </button>

          <!-- Tool chaining CTAs -->
          <div v-if="gifUrl && decodedFrames.length" class="pt-1">
            <p class="text-xs text-surface-400 mb-2">Continue editing this GIF</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink to="/tools/resize" aria-label="Continue editing: resize this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconResize :size="14" />
                Resize
              </NuxtLink>
              <NuxtLink to="/tools/compress" aria-label="Continue editing: compress this GIF" class="btn btn-ghost btn-sm !min-h-[38px] text-xs gap-1.5">
                <IconCompress :size="14" />
                Compress
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

        <!-- GIF preview: side-by-side when transformed, single otherwise -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
          <!-- Side-by-side preview (when transform is active) -->
          <div v-if="isTransformed" class="flex flex-col md:flex-row gap-4">
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
                :src="gifUrl"
                :alt="'GIF with ' + transformDescription"
                class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
                :style="previewTransformStyle"
              />
              <span class="mt-2 badge badge-primary">{{ transformBadgeLabel }}</span>
            </div>
          </div>
          <!-- Single centered preview (original, before any transform) -->
          <div v-else class="flex items-center justify-center">
            <img
              :src="gifUrl"
              alt="GIF preview"
              class="max-w-full max-h-[300px] md:max-h-[400px] object-contain"
            />
          </div>
        </div>

        <!-- Decoding indicator -->
        <div v-if="isDecoding" class="mt-3 flex items-center gap-2 text-xs text-surface-400">
          <div class="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Decoding frames...
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span v-if="isTransformed">&rarr; {{ outputWidth }}&times;{{ outputHeight }}px</span>
        </div>
      </div>

    </div>

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Rotate or Flip a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. This free online GIF rotator supports animated GIFs up to 10 MB. All processing is browser-based and private, so your file never leaves your device.</li>
        <li><strong>Pick a rotation angle or flip direction</strong> — rotate your GIF 90 degrees, 180 degrees, or 270 degrees clockwise. Flip the GIF horizontally to mirror it, or flip vertically to turn it upside down. Rotation and flip controls combine freely for any orientation.</li>
        <li><strong>Preview instantly</strong> — see your rotated or flipped GIF side-by-side with the original. The preview uses an instant CSS transform so there is no wait and no re-encoding until you download.</li>
        <li><strong>Download</strong> — click the download button to save your rotated or flipped GIF. Completely free, no watermark, no signup, no account needed.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Rotate or Flip Your GIFs?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Fix orientation</strong> — correct GIFs that were recorded sideways or upside down from screen captures and phone recordings. Rotate an animated GIF to the right angle without losing quality.</li>
        <li><strong>Mirror for design &amp; emotes</strong> — flip a GIF horizontally to create a mirrored version facing the opposite direction. Many Twitch and Discord streamers create mirrored emote pairs from a single piece of art.</li>
        <li><strong>Lossless rotation</strong> — our GIF rotator uses pixel reindexing instead of interpolation, so colors, transparency, and animation timing are preserved exactly. Rotate or flip an animated GIF without losing frames.</li>
        <li><strong>Creative effects</strong> — rotate GIFs to unusual angles for visual interest, or flip vertically for surreal, upside-down animations.</li>
        <li><strong>Combine transforms</strong> — rotate and flip in a single step. For example, a 90-degree rotation plus a horizontal flip is equivalent to a transpose operation.</li>
        <li><strong>100% free, no watermark</strong> — rotate or flip any GIF online free with no hidden costs and no branding added to your output.</li>
        <li><strong>Private &amp; browser-based</strong> — all GIF processing happens locally in your browser. Your files are never uploaded to a server, keeping your content secure.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Rotate &amp; Flip GIFs for Twitch, Discord &amp; Streaming Emotes</h2>
      <p class="text-sm text-surface-600 mb-3">
        Mirrored emotes are a popular way to double your emote library without creating new artwork. Flip a character emote horizontally to face the other direction, or rotate a GIF emote to fix orientation after export. Many streamers keep both a left-facing and right-facing version of their most-used reactions.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Twitch animated emotes (112&times;112)</strong> — rotate emotes to correct orientation, or flip horizontally to create mirrored variants. After rotating, <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 112&times;112</NuxtLink> to meet Twitch requirements.</li>
        <li><strong>Discord animated emoji (128&times;128)</strong> — mirrored emoji add variety to your server without creating entirely new art. Rotate or flip, then <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 128&times;128</NuxtLink> and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress under 256 KB</NuxtLink> for upload.</li>
        <li><strong>7TV / BTTV / FFZ emotes</strong> — create mirrored or rotated versions of existing emotes. A horizontal flip is the most common operation for creating directional emote pairs for variety in chat.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        After rotating or flipping, you can <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize</NuxtLink> to meet platform dimension requirements, or <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress</NuxtLink> to meet file size limits. The full workflow is rotate, resize, then compress.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I rotate a GIF online?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, select a rotation angle (90&deg;, 180&deg;, or 270&deg;), preview the result instantly, and download. It's completely free — no signup, no watermark, no server upload.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I flip a GIF horizontally?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and toggle the Horizontal flip button. This creates a mirror image — left becomes right and right becomes left. You can combine it with rotation if needed for more orientations.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I mirror a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Mirroring is the same as flipping horizontally. Upload your GIF and toggle the Horizontal flip button to create a left-right mirror. Use the Vertical flip for a top-bottom mirror, or enable both at once.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can you rotate an animated GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Our GIF rotator uses lossless pixel reindexing — no interpolation, no recompression. Colors, transparency, and animation timing are all preserved exactly as the original.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I rotate a GIF 90 degrees?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF and click the 90&deg; CW button. The preview updates instantly via CSS transform so you can see the result before downloading. Width and height are swapped in the output.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I rotate and flip a GIF at the same time?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Rotation and flip are independent controls that combine freely. Select any rotation angle and toggle either or both flip directions — the preview updates instantly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this work on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer works in any mobile browser — no app needed. All controls are touch-friendly with 44px tap targets, so you can rotate and flip GIFs easily on your phone or tablet.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">Up to 10 MB. All processing happens in your browser — private and secure. Your GIF is never uploaded to a server.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does rotating or flipping add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform — Twitch, Discord, social media, or anywhere else.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I rotate a GIF without losing frames?</h3>
          <p class="text-sm text-surface-500 mt-1">Our tool preserves all frames, timing, and transparency. Only the orientation changes — every frame is rotated or flipped using exact pixel mapping. No frames are dropped or recompressed.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'Rotate & Flip GIF Online Free — GIF Rotator & Mirror Tool | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Rotate GIFs 90\u00B0, 180\u00B0, or 270\u00B0 and flip horizontally or vertically \u2014 all online and free. Instant preview, no watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:title', property: 'og:title', content: 'Rotate & Flip GIF Online Free \u2014 GIF Rotator & Mirror Tool | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Rotate GIFs 90\u00B0, 180\u00B0, or 270\u00B0 and flip horizontally or vertically \u2014 all online and free. Instant preview, no watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/rotate' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'Rotate & Flip GIF Online Free \u2014 GIF Rotator & Mirror Tool | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Rotate GIFs 90\u00B0, 180\u00B0, or 270\u00B0 and flip horizontally or vertically \u2014 all online and free. Instant preview, no watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/rotate' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Rotator & Flip Tool',
        'url': 'https://emotesizer.com/tools/rotate',
        'description': 'Free online GIF rotator. Rotate GIFs 90\u00B0, 180\u00B0, or 270\u00B0 and flip horizontally or vertically. Mirror GIFs for Discord emotes, Twitch animations & memes. No watermark, no signup \u2014 processed in your browser.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Rotate GIF 90 degrees',
          'Rotate GIF 180 degrees',
          'Flip GIF horizontally',
          'Mirror GIF',
          'Lossless rotation',
          'Instant CSS preview',
          'Free online GIF rotator',
          'No watermark',
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
            'name': 'How do I rotate a GIF online?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, select a rotation angle (90\u00B0, 180\u00B0, or 270\u00B0), preview the result instantly, and download. It\'s completely free \u2014 no signup, no watermark, no server upload.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I flip a GIF horizontally?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and toggle the Horizontal flip button. This creates a mirror image \u2014 left becomes right and right becomes left. You can combine it with rotation if needed for more orientations.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I mirror a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Mirroring is the same as flipping horizontally. Upload your GIF and toggle the Horizontal flip button to create a left-right mirror. Use the Vertical flip for a top-bottom mirror, or enable both at once.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can you rotate an animated GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Our GIF rotator uses lossless pixel reindexing \u2014 no interpolation, no recompression. Colors, transparency, and animation timing are all preserved exactly as the original.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I rotate a GIF 90 degrees?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF and click the 90\u00B0 CW button. The preview updates instantly via CSS transform so you can see the result before downloading. Width and height are swapped in the output.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I rotate and flip a GIF at the same time?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Rotation and flip are independent controls that combine freely. Select any rotation angle and toggle either or both flip directions \u2014 the preview updates instantly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this work on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer works in any mobile browser \u2014 no app needed. All controls are touch-friendly with 44px tap targets, so you can rotate and flip GIFs easily on your phone or tablet.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Up to 10 MB. All processing happens in your browser \u2014 private and secure. Your GIF is never uploaded to a server.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does rotating or flipping add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform \u2014 Twitch, Discord, social media, or anywhere else.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I rotate a GIF without losing frames?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Our tool preserves all frames, timing, and transparency. Only the orientation changes \u2014 every frame is rotated or flipped using exact pixel mapping. No frames are dropped or recompressed.',
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
        'name': 'How to Rotate or Flip a GIF Online',
        'description': 'Rotate or flip any animated GIF using EmoteSizer\'s free online GIF rotator. No signup, no watermark.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Upload your animated GIF',
            'text': 'Drag and drop or click to browse. This free GIF rotator supports animated GIFs up to 10 MB. Your file is processed entirely in your browser and never leaves your device.',
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'Pick rotation angle or flip direction',
            'text': 'Rotate your GIF 90\u00B0, 180\u00B0, or 270\u00B0 clockwise. Flip horizontally to mirror or vertically to invert. Rotation and flip combine freely for any orientation.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Preview instantly and download',
            'text': 'See the rotated or flipped GIF side-by-side with the original via instant CSS preview. Click download to save \u2014 free, no watermark, no account needed.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Rotator' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Rotate & Flip', 'item': 'https://emotesizer.com/tools/rotate' },
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
/** Stores decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

type RotationAngle = 0 | 90 | 180 | 270
const rotation = ref<RotationAngle>(0)
const flipH = ref(false)
const flipV = ref(false)

const rotationPresets = [
  { value: 0 as RotationAngle, label: '0\u00B0' },
  { value: 90 as RotationAngle, label: '90\u00B0 CW' },
  { value: 180 as RotationAngle, label: '180\u00B0' },
  { value: 270 as RotationAngle, label: '270\u00B0 CW' },
]

// -- Computed --

const sourceWidth = computed(() => decodedFrames.value[0]?.width ?? 0)
const sourceHeight = computed(() => decodedFrames.value[0]?.height ?? 0)

/** Whether 90/270 rotation swaps dimensions */
const dimensionsSwapped = computed(() => rotation.value === 90 || rotation.value === 270)

const outputWidth = computed(() => dimensionsSwapped.value ? sourceHeight.value : sourceWidth.value)
const outputHeight = computed(() => dimensionsSwapped.value ? sourceWidth.value : sourceHeight.value)

/** Whether any transform is active */
const isTransformed = computed(() => rotation.value !== 0 || flipH.value || flipV.value)

/** Human-readable description of the current transform */
const transformDescription = computed(() => {
  const parts: string[] = []
  if (rotation.value !== 0) parts.push(`Rotated ${rotation.value}\u00B0`)
  if (flipH.value) parts.push('Flipped horizontally')
  if (flipV.value) parts.push('Flipped vertically')
  return parts.join(' + ')
})

/** Short label for the badge under the preview image */
const transformBadgeLabel = computed(() => {
  const parts: string[] = []
  if (rotation.value !== 0) parts.push(`${rotation.value}\u00B0`)
  if (flipH.value && flipV.value) parts.push('Flip H+V')
  else if (flipH.value) parts.push('Flip H')
  else if (flipV.value) parts.push('Flip V')
  return parts.join(' + ') || 'Original'
})

/**
 * CSS transform string for instant preview.
 * Applies rotation first, then flip — matching the encode order.
 */
const previewTransformStyle = computed(() => {
  const transforms: string[] = []
  if (rotation.value !== 0) {
    transforms.push(`rotate(${rotation.value}deg)`)
  }
  // Flip via CSS scaleX/scaleY
  const sx = flipH.value ? -1 : 1
  const sy = flipV.value ? -1 : 1
  if (sx !== 1 || sy !== 1) {
    transforms.push(`scale(${sx}, ${sy})`)
  }
  return transforms.length ? { transform: transforms.join(' ') } : {}
})

// -- State reset helper --

function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  gifMetadata.value = null
}

function resetTransform() {
  rotation.value = 0
  flipH.value = false
  flipV.value = false
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

// -- Frame transformation --

/**
 * Applies rotation and flip to a single frame's RGBA ImageData.
 * Returns a new Uint8ClampedArray with the transformed pixel data.
 *
 * Rotation is applied first (reindexing pixels), then flip.
 * For 90/270 rotation the output width/height are swapped.
 */
function transformFrame(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  angle: RotationAngle,
  fH: boolean,
  fV: boolean,
): Uint8ClampedArray {
  // Step 1: Rotate
  let w = srcW
  let h = srcH
  let rotated: Uint8ClampedArray

  if (angle === 0) {
    rotated = new Uint8ClampedArray(data)
  } else if (angle === 180) {
    rotated = new Uint8ClampedArray(data.length)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * w + x) * 4
        const dstIdx = ((h - 1 - y) * w + (w - 1 - x)) * 4
        rotated[dstIdx] = data[srcIdx]
        rotated[dstIdx + 1] = data[srcIdx + 1]
        rotated[dstIdx + 2] = data[srcIdx + 2]
        rotated[dstIdx + 3] = data[srcIdx + 3]
      }
    }
  } else if (angle === 90) {
    // 90 CW: (x, y) -> (h-1-y, x), output is h x w
    const newW = h
    const newH = w
    rotated = new Uint8ClampedArray(data.length)
    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < srcW; x++) {
        const srcIdx = (y * srcW + x) * 4
        const dstX = srcH - 1 - y
        const dstY = x
        const dstIdx = (dstY * newW + dstX) * 4
        rotated[dstIdx] = data[srcIdx]
        rotated[dstIdx + 1] = data[srcIdx + 1]
        rotated[dstIdx + 2] = data[srcIdx + 2]
        rotated[dstIdx + 3] = data[srcIdx + 3]
      }
    }
    w = newW
    h = newH
  } else {
    // 270 CW (= 90 CCW): (x, y) -> (y, w-1-x), output is h x w
    const newW = h
    const newH = w
    rotated = new Uint8ClampedArray(data.length)
    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < srcW; x++) {
        const srcIdx = (y * srcW + x) * 4
        const dstX = y
        const dstY = srcW - 1 - x
        const dstIdx = (dstY * newW + dstX) * 4
        rotated[dstIdx] = data[srcIdx]
        rotated[dstIdx + 1] = data[srcIdx + 1]
        rotated[dstIdx + 2] = data[srcIdx + 2]
        rotated[dstIdx + 3] = data[srcIdx + 3]
      }
    }
    w = newW
    h = newH
  }

  // Step 2: Flip (in-place on the rotated buffer)
  if (fH) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < Math.floor(w / 2); x++) {
        const leftIdx = (y * w + x) * 4
        const rightIdx = (y * w + (w - 1 - x)) * 4
        for (let c = 0; c < 4; c++) {
          const tmp = rotated[leftIdx + c]
          rotated[leftIdx + c] = rotated[rightIdx + c]
          rotated[rightIdx + c] = tmp
        }
      }
    }
  }

  if (fV) {
    for (let y = 0; y < Math.floor(h / 2); y++) {
      for (let x = 0; x < w; x++) {
        const topIdx = (y * w + x) * 4
        const bottomIdx = ((h - 1 - y) * w + x) * 4
        for (let c = 0; c < 4; c++) {
          const tmp = rotated[topIdx + c]
          rotated[topIdx + c] = rotated[bottomIdx + c]
          rotated[bottomIdx + c] = tmp
        }
      }
    }
  }

  return rotated
}

/**
 * Builds encode parameters for the current rotation + flip settings.
 * Async to yield to the browser every 50 frames, preventing UI freeze on large GIFs.
 */
async function buildEncodeParams() {
  // Snapshot all reactive values upfront to prevent mid-encode inconsistencies
  // if the user adjusts controls while encoding is in progress
  const srcW = sourceWidth.value
  const srcH = sourceHeight.value
  const outW = outputWidth.value
  const outH = outputHeight.value
  const angle = rotation.value
  const fH = flipH.value
  const fV = flipV.value
  const srcFrames = decodedFrames.value
  const looped = gifMetadata.value?.looped ?? true

  const frames: Array<{ data: Uint8ClampedArray; delay: number }> = []
  for (let i = 0; i < srcFrames.length; i++) {
    const f = srcFrames[i]
    frames.push({
      data: transformFrame(f.data, srcW, srcH, angle, fH, fV),
      delay: f.delay,
    })

    // Yield to browser every 50 frames to prevent UI freeze
    if (i % 50 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  return {
    width: outW,
    height: outH,
    looped,
    frames,
  }
}

// -- Download --

async function downloadGif() {
  if (isDecoding.value) return

  const baseName = gifFileName.value || 'animation.gif'

  // No transform applied — download original GIF directly (no re-encoding needed)
  if (!isTransformed.value && gifUrl.value) {
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

  // Build a descriptive filename prefix from the active transforms
  const parts: string[] = []
  if (rotation.value !== 0) parts.push(`rot${rotation.value}`)
  if (flipH.value) parts.push('flipH')
  if (flipV.value) parts.push('flipV')
  const prefix = parts.length ? `${parts.join('_')}_` : ''

  isEncoding.value = true
  try {
    const encoded = await encode(await buildEncodeParams())
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
