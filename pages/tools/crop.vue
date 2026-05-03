<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Cropper</h1>
      <p class="page-subtitle mt-1">Crop animated GIFs online for free. Draw a crop region, lock aspect ratios, and download — no watermark, no signup.</p>
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
              <p class="text-xs text-surface-500">{{ sourceWidth }}&times;{{ sourceHeight }}px &middot; {{ decodedFrames.length }} frames</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Aspect Ratio -->
          <div>
            <h3 class="label mb-2">Aspect Ratio</h3>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Crop aspect ratio">
              <button
                v-for="preset in aspectPresets"
                :key="preset.value"
                role="radio"
                :aria-checked="selectedAspect === preset.value"
                class="pill"
                :class="{ 'pill-active': selectedAspect === preset.value }"
                @click="selectAspect(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>

            <!-- Custom ratio inputs -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div v-if="selectedAspect === 'custom'" class="mt-3 flex items-center gap-2">
                <div class="relative flex-1">
                  <input
                    v-model.number="customRatioW"
                    type="number"
                    min="1"
                    max="100"
                    class="input text-center"
                    aria-label="Custom ratio width"
                    @input="applyCustomRatio"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">W</span>
                </div>
                <span class="text-surface-400 font-medium">:</span>
                <div class="relative flex-1">
                  <input
                    v-model.number="customRatioH"
                    type="number"
                    min="1"
                    max="100"
                    class="input text-center"
                    aria-label="Custom ratio height"
                    @input="applyCustomRatio"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none">H</span>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Crop Region -->
          <div>
            <h3 class="label mb-2">Crop Region</h3>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">X</span>
                <input
                  v-model.number="cropX"
                  type="number"
                  min="0"
                  :max="maxCropX"
                  class="input text-center"
                  @input="handleCropInputChange"
                />
              </div>
              <div>
                <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">Y</span>
                <input
                  v-model.number="cropY"
                  type="number"
                  min="0"
                  :max="maxCropY"
                  class="input text-center"
                  @input="handleCropInputChange"
                />
              </div>
              <div>
                <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">Width</span>
                <input
                  v-model.number="cropW"
                  type="number"
                  min="1"
                  :max="maxCropW"
                  class="input text-center"
                  @input="handleCropSizeChange"
                />
              </div>
              <div>
                <span class="text-[10px] uppercase font-semibold text-surface-400 tracking-wide">Height</span>
                <input
                  v-model.number="cropH"
                  type="number"
                  min="1"
                  :max="maxCropH"
                  class="input text-center"
                  @input="handleCropSizeChange"
                />
              </div>
            </div>
            <p class="text-xs text-surface-400 mt-2">
              Output: {{ cropW }}&times;{{ cropH }}px
              <span v-if="previewFileSizeLabel"> &middot; ~{{ previewFileSizeLabel }}</span>
              <span v-if="cropPercentage < 100"> ({{ cropPercentage }}% of original)</span>
            </p>
          </div>

          <!-- Quick Crop -->
          <div>
            <h3 class="label mb-2">Quick Crop</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button class="platform-card text-center" @click="centerSquareCrop">
                <span class="text-sm font-semibold text-surface-700">Center Square</span>
                <span class="text-xs text-surface-400 block mt-0.5">Largest centered square</span>
              </button>
              <button class="platform-card text-center" @click="selectAllCrop">
                <span class="text-sm font-semibold text-surface-700">Select All</span>
                <span class="text-xs text-surface-400 block mt-0.5">Reset to full image</span>
              </button>
              <button class="platform-card text-center col-span-2 sm:col-span-1" @click="autoTrimCrop">
                <span class="text-sm font-semibold text-surface-700">Autocrop</span>
                <span class="text-xs text-surface-400 block mt-0.5">Trim transparent edges</span>
              </button>
            </div>
          </div>

          <!-- Download button -->
          <button
            class="btn btn-primary btn-lg w-full"
            :disabled="isEncoding || isDecoding"
            @click="downloadCropped"
          >
            <template v-if="isEncoding">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Encoding...
            </template>
            <template v-else>
              <IconDownload :size="18" />
              {{ isCropped ? 'Download Cropped GIF' : 'Download GIF' }}
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

        <!-- Interactive crop canvas -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <GifCropCanvas
            v-if="decodedFrames.length"
            :gif-url="gifUrl"
            :frames="decodedFrames"
            :crop-x="cropX"
            :crop-y="cropY"
            :crop-w="cropW"
            :crop-h="cropH"
            :aspect-ratio="computedAspectRatio"
            @update:crop="handleCanvasCropUpdate"
          />
          <!-- Loading indicator while decoding -->
          <div v-else-if="isDecoding" class="flex items-center gap-2 text-sm text-surface-400">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            Decoding frames...
          </div>
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>Original: {{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>Crop: {{ cropW }}&times;{{ cropH }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
        </div>
      </div>

    </div>

    <!-- Related tools — crop pairs naturally with resize, rotate, compress, and trim -->
    <ToolRelated
      current="/tools/crop"
      :tools="[
        { to: '/tools/resize', label: 'GIF Resize', icon: 'IconResize', description: 'Change GIF dimensions with crop, pad, or stretch' },
        { to: '/tools/rotate', label: 'GIF Rotate', icon: 'IconRotate', description: 'Rotate or flip animated GIFs' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Crop a GIF Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your animated GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Draw your crop region or autocrop</strong> — drag the crop handles or enter exact pixel values. Use the Autocrop button to trim transparent edges automatically, or lock an aspect ratio for square emotes and social formats.</li>
        <li><strong>Preview the cropped GIF</strong> — the cropped animation plays in real time, with the projected file size shown so you can verify platform limits before downloading.</li>
        <li><strong>Download</strong> — click "Download Cropped GIF" to save the result.</li>
      </ol>
      <p class="text-xs text-surface-400 mt-2">All processing happens in your browser — <NuxtLink to="/tools#how-it-works" class="text-primary-500 hover:underline">see how the in-browser pipeline works</NuxtLink>.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Aspect Ratio Presets for Streaming Platforms</h2>
      <p class="text-sm text-surface-600">
        The aspect-ratio lock isn't just a constraint — it's a shortcut to the dimensions that streaming and social platforms actually accept. Knowing which preset maps to which platform saves you from a second resize step downstream.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2 mt-3">
        <li><strong>1:1 (square)</strong> — what every emote slot wants. Twitch (112x112), Discord (128x128), Kick, 7TV, BTTV, and FFZ all expect a square source. Use this when the final destination is any chat emote.</li>
        <li><strong>4:5 (portrait)</strong> — Instagram feed posts and Pinterest pins. Tighter than the source's natural aspect for most clips, so be deliberate about what you frame.</li>
        <li><strong>9:16 (vertical)</strong> — TikTok, Instagram Reels, YouTube Shorts, and Twitter / X mobile feeds. Crop tightly around the subject's vertical center of mass.</li>
        <li><strong>4:3 / 16:9 (landscape)</strong> — embedded video and presentation slides. 16:9 is the default for almost all modern web video; 4:3 is closer to what older content was shot at.</li>
        <li><strong>Custom</strong> — type any width and height when you have a specific target that doesn't match a preset (banner ads, profile cover photos, custom emote sizes for non-standard servers).</li>
      </ul>
      <p class="text-sm text-surface-600 mt-3">
        Cropping is lossless — pixels outside the crop rectangle are discarded, but everything inside it passes through unchanged. Quality, transparency, and frame timing are preserved exactly.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Crop vs. Resize: What's the Difference?</h2>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Cropping</strong> removes pixels from the edges of an image — you select a rectangular region to keep, and everything outside is discarded. The remaining pixels are untouched, so quality is perfectly preserved. Cropping reduces the pixel dimensions and file size.
      </p>
      <p class="text-sm text-surface-600 mb-3">
        <strong>Resizing</strong> scales the entire image to new dimensions. Every pixel is recalculated through interpolation, which can introduce slight softness — especially when scaling up. Resizing changes dimensions but keeps the entire image content.
      </p>
      <p class="text-sm text-surface-500 mt-3">
        For the best results, crop first to isolate the content you want, then <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize</NuxtLink> to your target dimensions. This workflow gives you a clean, sharp final image. You can also <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress</NuxtLink> afterwards to further reduce file size.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Crop GIFs for Twitch, Discord & Streaming Emotes</h2>
      <p class="text-sm text-surface-600 mb-3">
        Most emote platforms require square images. If your source GIF is not square, cropping is the first step to prepare it for upload. Lock the aspect ratio to 1:1, position the crop over the most important part of the animation, and download. You can also crop a GIF for a profile picture — the same square crop workflow applies.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Crop GIF for Twitch (112&times;112)</strong> — crop to square, then <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 112&times;112</NuxtLink>. Cropping first ensures no content is unexpectedly cut off during the resize step. A clean crop GIF 112x112 workflow produces sharp Twitch emotes.</li>
        <li><strong>Crop GIF for Discord (128&times;128)</strong> — crop to square, then resize to 128&times;128 and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress under 256 KB</NuxtLink>. Starting with a tight crop means better quality at the small final size. The crop GIF 128x128 workflow is essential for Discord animated emoji.</li>
        <li><strong>7TV / BTTV / FFZ</strong> — same square crop workflow. A precise crop gives you more control over what appears in the final emote at small display sizes.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        Combine with our <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> for a complete emote preparation workflow.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I crop a GIF online?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, drag the crop handles to select the region you want to keep, then click download. The crop runs across every frame in the animation, so the output stays in sync.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I crop a GIF to a specific aspect ratio?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Select a preset aspect ratio (1:1, 4:3, 16:9) or enter a custom ratio. The crop handles will lock to your chosen ratio, making it easy to crop for specific platforms or formats.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does cropping a GIF reduce file size?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Cropping removes pixels from every frame, which directly reduces the file size. A tighter crop means a smaller file — great for meeting platform size limits.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does cropping preserve animation quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Cropping extracts pixels from each frame without any scaling or re-compression. Frame timing, transparency, and loop settings are all preserved exactly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I crop a GIF to a square for emotes?</h3>
          <p class="text-sm text-surface-500 mt-1">Select the 1:1 aspect ratio, or use the "Center Square" quick crop button. This automatically selects the largest centered square region. Then download and resize to your emote platform's required dimensions.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to decode.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you cropped — free, clean, and ready to use.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can you crop an animated GIF without losing the animation?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Cropping preserves all frames, timing, and transparency. Only the pixels outside the crop region are removed — the animation plays back exactly as before, just with the edges trimmed.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I crop a GIF without losing quality?</h3>
          <p class="text-sm text-surface-500 mt-1">Cropping is lossless — it removes pixels from edges without recompressing the remaining content. Colors, transparency, and animation are preserved exactly. No quality is lost during the crop.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I crop a GIF on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer works in any modern mobile browser. The crop handles are touch-friendly with 44px tap targets, so you can draw and adjust the crop region easily on your phone. No app download needed.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I remove borders from a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Use the Autocrop button to automatically detect and trim transparent edges. Or drag the crop handles inward to manually remove unwanted borders. Both methods preserve the full animation.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame, UnencodedFrame } from 'modern-gif'

useHead({
  title: 'GIF Cropper — EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF cropper. Crop animated GIFs with aspect ratio presets, autocrop transparent edges, and precise pixel controls. No watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Cropper — EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF cropper. Crop animated GIFs with aspect ratio presets, autocrop transparent edges, and precise pixel controls. No watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/crop' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Cropper — EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF cropper. Crop animated GIFs with aspect ratio presets, autocrop transparent edges, and precise pixel controls. No watermark, no signup. Perfect for Twitch & Discord emotes.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/crop' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Cropper',
        'url': 'https://emotesizer.com/tools/crop',
        'description': 'Free online GIF cropper. Crop animated GIFs with aspect ratio presets, autocrop transparent edges, and precise pixel controls. No watermark, no signup. Perfect for Twitch & Discord emotes.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Interactive visual crop editor with drag handles',
          'Ten aspect-ratio presets (1:1, 4:3, 16:9, and more)',
          'Exact pixel crop inputs',
          'Center-square auto-crop helper',
          'Autocrop for transparent edges',
          'Cropped file size display before download',
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
            'name': 'How do I crop a GIF online?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, drag the crop handles to select the region you want to keep, then click download. The crop runs across every frame in the animation, so the output stays in sync.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I crop a GIF to a specific aspect ratio?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Select a preset aspect ratio (1:1, 4:3, 16:9) or enter a custom ratio. The crop handles will lock to your chosen ratio.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does cropping a GIF reduce file size?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Cropping removes pixels from every frame, which directly reduces the file size. A tighter crop means a smaller file.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does cropping preserve animation quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Cropping extracts pixels from each frame without any scaling or re-compression. Frame timing, transparency, and loop settings are all preserved exactly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I crop a GIF to a square for emotes?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select the 1:1 aspect ratio, or use the "Center Square" quick crop button. This automatically selects the largest centered square region.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. Since all processing happens in your browser, larger files may take a moment to decode.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks or branding to your GIFs. What you download is exactly what you cropped — free, clean, and ready to use.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can you crop an animated GIF without losing the animation?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Cropping preserves all frames, timing, and transparency. Only the pixels outside the crop region are removed — the animation plays back exactly as before, just with the edges trimmed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I crop a GIF without losing quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Cropping is lossless — it removes pixels from edges without recompressing the remaining content. Colors, transparency, and animation are preserved exactly. No quality is lost during the crop.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I crop a GIF on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer works in any modern mobile browser. The crop handles are touch-friendly with 44px tap targets, so you can draw and adjust the crop region easily on your phone. No app download needed.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I remove borders from a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Use the Autocrop button to automatically detect and trim transparent edges. Or drag the crop handles inward to manually remove unwanted borders. Both methods preserve the full animation.',
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
        'name': 'How to Crop a GIF Online',
        'description': 'Crop any animated GIF online using EmoteSizer\'s free visual crop editor. No signup, no watermark.',
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
            'name': 'Draw your crop region or autocrop',
            'text': 'Drag the crop handles to select the area you want to keep, or use Autocrop to trim transparent edges automatically. Lock aspect ratios for square emotes (1:1) or social media formats.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Preview the cropped GIF',
            'text': 'See the animated crop preview in real time. Adjust position and size until you are satisfied. The cropped file size is displayed so you can check platform limits.',
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Download your cropped GIF',
            'text': 'Click "Download Cropped GIF" to save your crop. Crop a GIF online free — no watermark, no account needed.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Cropper' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Cropper', 'item': 'https://emotesizer.com/tools/crop' },
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
/** File size (bytes) of the last encoded crop (populated after download) */
const previewFileSize = ref<number | null>(null)
/** Stores the decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)

const cropX = ref(0)
const cropY = ref(0)
const cropW = ref(0)
const cropH = ref(0)
const sourceWidth = ref(0)
const sourceHeight = ref(0)

type AspectPresetValue = 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '2:1' | '4:5' | '9:16' | 'phi' | 'custom'
const selectedAspect = ref<AspectPresetValue>('free')
const customRatioW = ref(1)
const customRatioH = ref(1)

const aspectPresets = [
  { value: 'free' as AspectPresetValue, label: 'Free' },
  { value: '1:1' as AspectPresetValue, label: '1:1' },
  { value: '4:3' as AspectPresetValue, label: '4:3' },
  { value: '3:2' as AspectPresetValue, label: '3:2' },
  { value: '16:9' as AspectPresetValue, label: '16:9' },
  { value: '2:1' as AspectPresetValue, label: '2:1' },
  { value: '4:5' as AspectPresetValue, label: '4:5' },
  { value: '9:16' as AspectPresetValue, label: '9:16' },
  { value: 'phi' as AspectPresetValue, label: '1.62:1' },
  { value: 'custom' as AspectPresetValue, label: 'Custom' },
]

// -- Computed --

/** The numeric aspect ratio for the canvas component. null = free, number = locked W/H ratio */
const computedAspectRatio = computed((): number | null => {
  switch (selectedAspect.value) {
    case 'free': return null
    case '1:1': return 1
    case '4:3': return 4 / 3
    case '3:2': return 3 / 2
    case '16:9': return 16 / 9
    case '2:1': return 2
    case '4:5': return 4 / 5
    case '9:16': return 9 / 16
    case 'phi': return 1.618
    case 'custom': return (customRatioW.value || 1) / (customRatioH.value || 1)
    default: return null
  }
})

/** Whether the user has actually cropped away any pixels */
const isCropped = computed(() => {
  return cropX.value > 0
    || cropY.value > 0
    || cropW.value < sourceWidth.value
    || cropH.value < sourceHeight.value
})

/** What percentage of the original area the crop covers */
const cropPercentage = computed(() => {
  if (!sourceWidth.value || !sourceHeight.value) return 100
  const originalArea = sourceWidth.value * sourceHeight.value
  const cropArea = cropW.value * cropH.value
  return Math.round((cropArea / originalArea) * 100)
})

/** Human-readable preview file size */
const previewFileSizeLabel = computed(() => {
  const size = previewFileSize.value
  if (size === null) return null
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
})

/** Max values for numeric inputs to keep crop within bounds */
const maxCropX = computed(() => Math.max(0, sourceWidth.value - 1))
const maxCropY = computed(() => Math.max(0, sourceHeight.value - 1))
const maxCropW = computed(() => Math.max(1, sourceWidth.value - cropX.value))
const maxCropH = computed(() => Math.max(1, sourceHeight.value - cropY.value))

// -- Aspect ratio selection --

function selectAspect(value: AspectPresetValue) {
  selectedAspect.value = value
  if (value !== 'free' && value !== 'custom') {
    applyAspectRatioToCurrentCrop()
  } else if (value === 'custom') {
    applyCustomRatio()
  }
}

/** Applies the current custom ratio values as a constraint */
function applyCustomRatio() {
  customRatioW.value = Math.max(1, customRatioW.value || 1)
  customRatioH.value = Math.max(1, customRatioH.value || 1)
  applyAspectRatioToCurrentCrop()
}

/** Adjusts the current crop to maintain the active aspect ratio, centered on the existing crop center */
function applyAspectRatioToCurrentCrop() {
  const ratio = computedAspectRatio.value
  if (ratio === null) return

  const centerX = cropX.value + cropW.value / 2
  const centerY = cropY.value + cropH.value / 2

  // Calculate new dimensions that fit within the source while maintaining ratio
  let newW = cropW.value
  let newH = Math.round(newW / ratio)

  // If the height overflows, constrain by height instead
  if (newH > sourceHeight.value) {
    newH = sourceHeight.value
    newW = Math.round(newH * ratio)
  }
  // If width overflows, constrain by width
  if (newW > sourceWidth.value) {
    newW = sourceWidth.value
    newH = Math.round(newW / ratio)
  }

  // Re-center
  let newX = Math.round(centerX - newW / 2)
  let newY = Math.round(centerY - newH / 2)

  // Clamp to bounds
  newX = Math.max(0, Math.min(newX, sourceWidth.value - newW))
  newY = Math.max(0, Math.min(newY, sourceHeight.value - newH))

  cropX.value = newX
  cropY.value = newY
  cropW.value = newW
  cropH.value = newH

  // File size estimate is invalidated when the crop region changes.
  // Re-encoding is deferred to download to avoid blocking the animation loop.
  previewFileSize.value = null
}

// -- Quick crop actions --

function centerSquareCrop() {
  const side = Math.min(sourceWidth.value, sourceHeight.value)
  cropW.value = side
  cropH.value = side
  cropX.value = Math.round((sourceWidth.value - side) / 2)
  cropY.value = Math.round((sourceHeight.value - side) / 2)
  selectedAspect.value = '1:1'
  previewFileSize.value = null
}

function selectAllCrop() {
  cropX.value = 0
  cropY.value = 0
  cropW.value = sourceWidth.value
  cropH.value = sourceHeight.value
  selectedAspect.value = 'free'
  previewFileSize.value = null
}

/** Scans the first frame for non-transparent pixels and sets the crop to their bounding box */
function autoTrimCrop() {
  const frame = decodedFrames.value[0]
  if (!frame) return

  const w = frame.width
  const h = frame.height
  const data = frame.data // RGBA Uint8ClampedArray

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]
      if (alpha > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // No non-transparent pixels found, or the bounding box covers the entire image
  if (maxX < 0 || (minX === 0 && minY === 0 && maxX === w - 1 && maxY === h - 1)) {
    toastSuccess('No transparent edges found')
    return
  }

  let trimX = minX
  let trimY = minY
  let trimW = maxX - minX + 1
  let trimH = maxY - minY + 1

  // If an aspect ratio is locked, expand the bounding box to satisfy it
  const ratio = computedAspectRatio.value
  if (ratio !== null) {
    const currentRatio = trimW / trimH
    if (currentRatio > ratio) {
      // Too wide — increase height to match
      const newH = Math.round(trimW / ratio)
      const extraH = newH - trimH
      trimY = Math.max(0, trimY - Math.floor(extraH / 2))
      trimH = Math.min(newH, h - trimY)
      // Recalculate width from the (possibly clamped) height
      trimW = Math.min(Math.round(trimH * ratio), w - trimX)
    } else {
      // Too tall — increase width to match
      const newW = Math.round(trimH * ratio)
      const extraW = newW - trimW
      trimX = Math.max(0, trimX - Math.floor(extraW / 2))
      trimW = Math.min(newW, w - trimX)
      // Recalculate height from the (possibly clamped) width
      trimH = Math.min(Math.round(trimW / ratio), h - trimY)
    }
  }

  cropX.value = trimX
  cropY.value = trimY
  cropW.value = trimW
  cropH.value = trimH
  previewFileSize.value = null
}

// -- Crop input handlers --

/** Handles changes to X/Y position inputs — clamps and updates */
function handleCropInputChange() {
  cropX.value = Math.max(0, Math.min(cropX.value || 0, sourceWidth.value - cropW.value))
  cropY.value = Math.max(0, Math.min(cropY.value || 0, sourceHeight.value - cropH.value))
  previewFileSize.value = null
}

/** Handles changes to Width/Height inputs — clamps and respects aspect ratio */
function handleCropSizeChange() {
  cropW.value = Math.max(1, Math.min(cropW.value || 1, sourceWidth.value - cropX.value))
  cropH.value = Math.max(1, Math.min(cropH.value || 1, sourceHeight.value - cropY.value))

  // If aspect ratio is locked, adjust the other dimension
  if (computedAspectRatio.value !== null) {
    const ratio = computedAspectRatio.value
    // Adjust height to match width-based ratio, then clamp
    cropH.value = Math.min(Math.round(cropW.value / ratio), sourceHeight.value - cropY.value)
    cropH.value = Math.max(1, cropH.value)
    // If height was clamped, recalculate width
    cropW.value = Math.min(Math.round(cropH.value * ratio), sourceWidth.value - cropX.value)
    cropW.value = Math.max(1, cropW.value)
  }

  previewFileSize.value = null
}

/** Handles crop updates from the GifCropCanvas component (pointer drag / resize) */
function handleCanvasCropUpdate(crop: { x: number; y: number; w: number; h: number }) {
  cropX.value = crop.x
  cropY.value = crop.y
  cropW.value = crop.w
  cropH.value = crop.h
  previewFileSize.value = null
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

    // Initialize crop to full image
    if (frames.length > 0) {
      sourceWidth.value = frames[0].width
      sourceHeight.value = frames[0].height
      cropX.value = 0
      cropY.value = 0
      cropW.value = frames[0].width
      cropH.value = frames[0].height
    }
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

/** Encodes the cropped GIF from decoded frames using canvas-based pixel extraction */
async function encodeCroppedGif(): Promise<Blob> {
  const frames = decodedFrames.value
  let cx = cropX.value
  let cy = cropY.value
  let cw = cropW.value
  let ch = cropH.value

  // Safety clamp: ensure the crop region fits within the source dimensions.
  // decodeFrames() composites all frames to the full canvas size, so they
  // should all match, but guard against edge cases to prevent getImageData
  // throwing an out-of-bounds error.
  const fw = frames[0].width
  const fh = frames[0].height
  cx = Math.max(0, Math.min(cx, fw - 1))
  cy = Math.max(0, Math.min(cy, fh - 1))
  cw = Math.max(1, Math.min(cw, fw - cx))
  ch = Math.max(1, Math.min(ch, fh - cy))

  // Use OffscreenCanvas for frame rendering
  const srcCanvas = new OffscreenCanvas(fw, fh)
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!

  const croppedFrames: Array<{ data: Uint8ClampedArray; delay: number }> = []

  try {
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      // Update source canvas dimensions if frames vary in size
      if (srcCanvas.width !== frame.width || srcCanvas.height !== frame.height) {
        srcCanvas.width = frame.width
        srcCanvas.height = frame.height
      }

      srcCtx.putImageData(
        new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height),
        0, 0,
      )

      // Extract the crop region
      const cropped = srcCtx.getImageData(cx, cy, cw, ch)
      croppedFrames.push({ data: cropped.data, delay: frame.delay || 100 })

      // Yield to browser every 50 frames to prevent UI freeze
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
  } finally {
    // Release canvas resources even if encoding throws
    srcCanvas.width = 0
    srcCanvas.height = 0
  }

  const encoded = await encode({
    width: cw,
    height: ch,
    looped: gifMetadata.value?.looped ?? true,
    frames: croppedFrames as UnencodedFrame[],
  })

  return new Blob([encoded], { type: 'image/gif' })
}

// -- Download --

async function downloadCropped() {
  const baseName = gifFileName.value || 'animation.gif'

  // If crop is full image, download the original
  if (!isCropped.value && gifUrl.value) {
    const response = await fetch(gifUrl.value)
    const blob = await response.blob()
    downloadBlob(blob, baseName)
    return
  }

  // Encode the cropped GIF on demand — avoids blocking the animation loop
  // with expensive background encodes during crop adjustments.
  isEncoding.value = true
  try {
    const blob = await encodeCroppedGif()
    previewFileSize.value = blob.size
    downloadBlob(blob, `cropped_${baseName}`)
    toastSuccess('Cropped GIF downloaded!')
  } catch {
    toastError('Failed to encode cropped GIF')
  } finally {
    isEncoding.value = false
  }
}

// -- State reset (shared by handleFileSelected and clearGif) --

function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  gifMetadata.value = null
  previewFileSize.value = null
  cropX.value = 0
  cropY.value = 0
  cropW.value = 0
  cropH.value = 0
  sourceWidth.value = 0
  sourceHeight.value = 0
  selectedAspect.value = 'free'
  customRatioW.value = 1
  customRatioH.value = 1
}

function clearGif() {
  resetState()
}

onUnmounted(() => {
  clearGif()
})
</script>
