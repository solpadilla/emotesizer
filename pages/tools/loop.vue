<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF Loop Changer</h1>
      <p class="page-subtitle mt-1">Set your GIF to loop forever, play once, or any custom repeat count &mdash; free, no watermark, no signup.</p>
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

          <!-- Current loop info banner -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-surface-100/50 border border-surface-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-surface-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              Current setting: <strong>{{ loopCountLabel(originalLoopCount) }}</strong>
            </p>
          </div>

          <!-- Loop Count presets -->
          <div>
            <h3 class="label mb-2">Loop Count</h3>
            <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Loop count">
              <button
                v-for="preset in loopPresets"
                :key="preset.key"
                role="radio"
                :aria-checked="selectedPreset === preset.key"
                class="pill text-xs !px-3 !py-1.5 !min-h-[36px]"
                :class="{ 'pill-active': selectedPreset === preset.key }"
                @click="selectedPreset = preset.key"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Custom input (visible only when Custom is selected) -->
          <div v-if="selectedPreset === 'custom'" class="flex items-center gap-2">
            <input
              v-model.number="customLoopValue"
              type="number"
              min="1"
              max="65535"
              class="input w-28 text-sm"
              aria-label="Custom loop count"
            />
            <span class="text-xs text-surface-500">times</span>
          </div>

          <!-- Change summary banner -->
          <div
            v-if="hasChanged"
            class="flex items-start gap-2 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 mt-0.5 text-primary-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p class="text-xs text-surface-600">
              Will change from <strong>{{ loopCountLabel(originalLoopCount) }}</strong> to <strong>{{ loopCountLabel(effectiveLoopCount) }}</strong>
            </p>
          </div>

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
              {{ hasChanged ? 'Download Modified GIF' : 'Download GIF' }}
            </template>
          </button>

          <!-- Tool chaining CTAs -->
          <div v-if="gifUrl && decodedFrames.length" class="pt-1">
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

        <!-- Canvas-based animated preview (respects loop count) -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard p-4 min-h-[200px]">
          <div class="flex flex-col items-center justify-center gap-3">
            <canvas
              ref="canvasRef"
              :width="canvasDisplayWidth"
              :height="canvasDisplayHeight"
              class="block max-w-full max-h-[300px] md:max-h-[400px]"
              :style="{ width: canvasDisplayWidth + 'px', height: canvasDisplayHeight + 'px' }"
            />
            <!-- Replay button: shown when a finite animation has completed -->
            <button
              v-if="isAnimationComplete"
              class="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-surface-500 hover:text-surface-700"
              @click="replayAnimation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Replay
            </button>
          </div>
        </div>

        <!-- Decoding indicator -->
        <div v-if="isDecoding" class="mt-3 flex items-center gap-2 text-xs text-surface-400">
          <div class="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Decoding frames...
        </div>

        <!-- Loop setting badges (before -> after) -->
        <div v-if="gifUrl && decodedFrames.length && hasChanged" class="mt-3 flex items-center gap-2 justify-center">
          <span class="badge badge-neutral line-through">{{ loopCountLabel(originalLoopCount) }}</span>
          <span class="text-xs text-surface-400">&rarr;</span>
          <span class="badge badge-primary">{{ loopCountLabel(effectiveLoopCount) }}</span>
        </div>

        <!-- File info -->
        <div v-if="gifUrl && decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ sourceWidth }}&times;{{ sourceHeight }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <span>{{ formatFileSize(originalFileSize) }}</span>
        </div>
      </div>

    </div>

    <!-- Related tools — loop pairs well with speed, compress, reverse, and trim for emote tuning -->
    <ToolRelated
      current="/tools/loop"
      :tools="[
        { to: '/tools/speed', label: 'GIF Speed', icon: 'IconGauge', description: 'Speed up or slow down GIF animation' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/reverse', label: 'GIF Reverse', icon: 'IconReverse', description: 'Play GIFs backwards or create boomerang loops' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Change GIF Loop Count Online</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> &mdash; drag and drop or click to browse. Supports animated GIFs up to 20 MB.</li>
        <li><strong>Choose a GIF loop count</strong> &mdash; select Infinite to make your GIF loop forever, Play Once to stop it from looping, or pick a preset (2x, 3x, 5x, 10x). Need a specific number? Use the Custom option and enter any repeat count from 1 to 65,535.</li>
        <li><strong>Preview the change</strong> &mdash; a summary banner shows the before and after loop count so you know exactly how many times the GIF will repeat. The preview plays the animation so you can verify it looks correct.</li>
        <li><strong>Download</strong> &mdash; click the download button to save your modified GIF. Completely free online, no watermark, no signup required.</li>
      </ol>
      <p class="text-xs text-surface-400 mt-2">All processing happens in your browser &mdash; <NuxtLink to="/tools#how-it-works" class="text-primary-500 hover:underline">see how the in-browser pipeline works</NuxtLink>.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Loop Counts and Platform Behavior</h2>
      <p class="text-sm text-surface-600">
        The GIF spec stores loop count as a single byte in the Netscape application extension block. The value is interpreted as: <strong>0</strong> means loop forever, any positive integer means play that many times then stop. Most modern browsers and chat clients honor this header byte exactly, but a handful of older renderers ignore it and play the animation once regardless. The most common practical effects of changing the loop count:
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2 mt-3">
        <li><strong>Loop count 0 (infinite)</strong> — what most emote and meme GIFs want. Twitch, Discord, 7TV, BTTV, and FFZ all expect infinite loops; a one-shot emote that freezes on the last frame is one of the more common upload mistakes.</li>
        <li><strong>Loop count 1 (play once)</strong> — useful for instructional / tutorial GIFs in documentation, product demos, and email headers where the animation should run, communicate its message, and stop.</li>
        <li><strong>Loop count N (custom)</strong> — useful in slide decks and onboarding flows where a small fixed number of repetitions hits the right balance between drawing the eye and being distracting.</li>
      </ul>
      <p class="text-sm text-surface-600 mt-3">
        Changing the loop count is a metadata-only operation: the byte gets rewritten, every frame and palette entry passes through unchanged, and file size is essentially unaffected. No re-encoding, no compression artifacts.
      </p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF Loop Count for Twitch, Discord &amp; Streaming Emotes</h2>
      <p class="text-sm text-surface-600 mb-3">
        Most emote platforms expect GIFs to loop infinitely, but some editing workflows export GIFs with a single-play setting by accident. If your animated emote plays once and stops, use this GIF loop changer to set it to infinite loop before uploading.
      </p>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Discord GIF loop</strong> &mdash; Discord respects the GIF loop count metadata. A non-looping emoji will play once and freeze on the last frame. Set the loop to infinite for continuous animation. Discord also renders animated stickers with loop awareness, so verify the count before uploading. Then <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 128&times;128</NuxtLink> and <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress under 256 KB</NuxtLink> for upload.</li>
        <li><strong>Twitch emote loop</strong> &mdash; Twitch requires animated emotes to loop seamlessly within a 60-frame limit. If your emote stops after one play, set the loop count to infinite. After fixing the loop, <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resize to 112&times;112</NuxtLink> and keep it under 1 MB.</li>
        <li><strong>7TV / BTTV / FFZ emotes</strong> &mdash; these third-party emote platforms also honor GIF loop settings. Ensure your emotes loop infinitely for the best chat experience.</li>
      </ul>
      <p class="text-sm text-surface-500 mt-3">
        After adjusting the loop count, you can <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compress</NuxtLink> to meet file size limits, or <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">change the playback speed</NuxtLink> to fine-tune your animation.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I change GIF loop count?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, select a loop preset (Infinite, Play Once, 2x, 3x, etc.) or enter a custom count, then click Download. It's completely free &mdash; no signup, no watermark.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I stop a GIF from looping?</h3>
          <p class="text-sm text-surface-500 mt-1">Select "Play Once" to set the GIF loop count to 1. The animation will play one time and stop on the last frame.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I make a GIF loop forever?</h3>
          <p class="text-sm text-surface-500 mt-1">Select "Infinite" to set the GIF loop count to 0 (infinite). This tells viewers to repeat the animation indefinitely.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is GIF loop count?</h3>
          <p class="text-sm text-surface-500 mt-1">GIF loop count is a value stored in the Netscape Application Extension block of the GIF file. A loop count of 0 means infinite (loop forever), 1 means play once, and any other number N means the GIF repeats N times.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I set a GIF to play exactly N times?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Select "Custom" and enter any number from 1 to 65,535. The GIF will play through its frames exactly that many times and then stop.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does changing loop count affect file size or quality?</h3>
          <p class="text-sm text-surface-500 mt-1">No. The loop count is a single metadata value in the GIF header. Changing it does not re-encode, re-compress, or alter the frame data in any way. File size, colors, transparency, and timing are all preserved exactly.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why does my GIF still loop in the browser after setting play once?</h3>
          <p class="text-sm text-surface-500 mt-1">Most web browsers ignore the GIF loop count when displaying images via the &lt;img&gt; tag &mdash; they always loop infinitely. However, platforms like Discord, messaging apps, and presentation software do respect the loop setting. Open the downloaded GIF in GIMP, IrfanView, or Discord to verify.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I remove the loop from a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Removing the loop is the same as setting the GIF to play once. Select "Play Once" to set the loop count to 1 and the animation will play a single time and stop.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform &mdash; Twitch, Discord, social media, or anywhere else.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this work on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. EmoteSizer is browser-based and works on any mobile device &mdash; no app needed. All controls are touch-friendly, so you can change GIF loop settings easily on your phone or tablet.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decode, decodeFrames, encode } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'
import { formatFileSize } from '~/utils/format'

useHead({
  title: 'GIF Loop Changer — EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF loop changer. Set your GIF to loop forever, play once, or repeat a custom number of times. No watermark, no signup. Works in your browser.' },
    { key: 'og:title', property: 'og:title', content: 'GIF Loop Changer — EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF loop changer. Set your GIF to loop forever, play once, or repeat a custom number of times. No watermark, no signup. Works in your browser.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/loop' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF Loop Changer — EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF loop changer. Set your GIF to loop forever, play once, or repeat a custom number of times. No watermark, no signup. Works in your browser.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/loop' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF Loop Changer',
        'url': 'https://emotesizer.com/tools/loop',
        'description': 'Free online GIF loop changer. Set your GIF to loop forever, play once, or repeat a custom number of times. No watermark, no signup. Works in your browser.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Change GIF loop count',
          'Stop GIF from looping',
          'Make GIF loop forever',
          'Set GIF to play once',
          'Custom loop count 1-65535',
          'Free GIF loop changer',
          'No watermark',
          'Browser-based',
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
            'name': 'How do I change GIF loop count?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, select a loop preset (Infinite, Play Once, 2x, 3x, etc.) or enter a custom count, then click Download. It\'s completely free \u2014 no signup, no watermark.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I stop a GIF from looping?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select "Play Once" to set the GIF loop count to 1. The animation will play one time and stop on the last frame.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I make a GIF loop forever?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Select "Infinite" to set the GIF loop count to 0 (infinite). This tells viewers to repeat the animation indefinitely.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is GIF loop count?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'GIF loop count is a value stored in the Netscape Application Extension block of the GIF file. A loop count of 0 means infinite (loop forever), 1 means play once, and any other number N means the GIF repeats N times.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I set a GIF to play exactly N times?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Select "Custom" and enter any number from 1 to 65,535. The GIF will play through its frames exactly that many times and then stop.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does changing loop count affect file size or quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. The loop count is a single metadata value in the GIF header. Changing it does not re-encode, re-compress, or alter the frame data in any way. File size, colors, transparency, and timing are all preserved exactly.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Why does my GIF still loop in the browser after setting play once?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Most web browsers ignore the GIF loop count when displaying images via the <img> tag \u2014 they always loop infinitely. However, platforms like Discord, messaging apps, and presentation software do respect the loop setting. Open the downloaded GIF in GIMP, IrfanView, or Discord to verify.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I remove the loop from a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Removing the loop is the same as setting the GIF to play once. Select "Play Once" to set the loop count to 1 and the animation will play a single time and stop.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks to your GIFs. The output is clean and ready to use on any platform \u2014 Twitch, Discord, social media, or anywhere else.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this work on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. EmoteSizer is browser-based and works on any mobile device \u2014 no app needed. All controls are touch-friendly, so you can change GIF loop settings easily on your phone or tablet.',
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
        'name': 'How to Change GIF Loop Count Online',
        'description': 'Change GIF loop count online free with EmoteSizer\u2019s GIF loop changer. Stop a GIF from looping, make it loop forever, or set a custom repeat count. No watermark, no signup.',
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
            'name': 'Choose a GIF loop count',
            'text': 'Select Infinite to make your GIF loop forever, Play Once to stop it from looping, or pick a preset (2x, 3x, 5x, 10x). Use Custom for any count from 1 to 65,535.',
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Preview the loop change',
            'text': 'A summary banner shows the before and after loop count so you can verify exactly how many times the GIF will repeat.',
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Download your modified GIF',
            'text': 'Click Download to save the GIF with the new loop count. Completely free, no watermark, no signup required.',
          },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF Loop Changer' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF Loop Changer', 'item': 'https://emotesizer.com/tools/loop' },
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
const originalFileSize = ref(0)
const decodedFrames = ref<DecodedFrame[]>([])
const isDecoding = ref(false)
const isEncoding = ref(false)
/** Stores decoded GIF metadata (loop settings, etc.) for re-encoding */
const gifMetadata = ref<ReturnType<typeof decode> | null>(null)
/** Stores the raw GIF ArrayBuffer so we can download the original without re-encoding */
const originalBuffer = ref<ArrayBuffer | null>(null)

// -- Canvas preview state --
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isAnimationComplete = ref(false)

/** The loop count read from the original GIF (0 = infinite) */
const originalLoopCount = ref(0)

type LoopPreset = 'infinite' | 'once' | '2x' | '3x' | '5x' | '10x' | 'custom'
const selectedPreset = ref<LoopPreset>('infinite')
const customLoopValue = ref(2)

const loopPresets: Array<{ key: LoopPreset; label: string; value: number }> = [
  { key: 'infinite', label: 'Infinite', value: 0 },
  { key: 'once', label: 'Play Once', value: 1 },
  { key: '2x', label: '2x', value: 2 },
  { key: '3x', label: '3x', value: 3 },
  { key: '5x', label: '5x', value: 5 },
  { key: '10x', label: '10x', value: 10 },
  { key: 'custom', label: 'Custom', value: -1 },
]

// -- Computed --

const sourceWidth = computed(() => decodedFrames.value[0]?.width ?? 0)
const sourceHeight = computed(() => decodedFrames.value[0]?.height ?? 0)

/** The effective loop count based on the selected preset */
const effectiveLoopCount = computed(() => {
  switch (selectedPreset.value) {
    case 'infinite': return 0
    case 'once': return 1
    case '2x': return 2
    case '3x': return 3
    case '5x': return 5
    case '10x': return 10
    case 'custom': return Math.max(1, Math.min(65535, customLoopValue.value || 1))
    default: return 0
  }
})

/** Whether the selected loop count differs from the original */
const hasChanged = computed(() => effectiveLoopCount.value !== originalLoopCount.value)

// -- Canvas display sizing --
// Scale the GIF to fit within the preview area constraints (max-h 300px / 400px on md+)

const maxPreviewHeight = computed(() => {
  // Match the CSS constraint: max-h-[300px] md:max-h-[400px]
  if (import.meta.client && window.innerWidth >= 768) return 400
  return 300
})

const canvasScale = computed(() => {
  if (!sourceHeight.value) return 1
  return Math.min(1, maxPreviewHeight.value / sourceHeight.value)
})
const canvasDisplayWidth = computed(() => Math.round(sourceWidth.value * canvasScale.value))
const canvasDisplayHeight = computed(() => Math.round(sourceHeight.value * canvasScale.value))

// -- Canvas animation engine --

/** Reusable offscreen canvas for rendering frame pixel data at source resolution */
let srcCanvas: HTMLCanvasElement | null = null
let srcCtx: CanvasRenderingContext2D | null = null

/** Cached ImageData to avoid per-frame allocation */
let cachedImageData: ImageData | null = null

let animFrameId: number | null = null
let animationGeneration = 0
let currentFrameIndex = 0
let lastFrameTime = 0
let accumulatedTime = 0
let completedLoops = 0

/** Whether the user prefers reduced motion */
const prefersReducedMotion = ref(false)

/** Media query listener refs for cleanup */
let mqlListener: ((e: MediaQueryListEvent) => void) | null = null
let mql: MediaQueryList | null = null

onMounted(() => {
  // Check reduced motion preference
  mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mql.matches
  mqlListener = (e: MediaQueryListEvent) => { prefersReducedMotion.value = e.matches }
  mql.addEventListener('change', mqlListener)
})

onBeforeUnmount(() => {
  stopAnimation()

  // Clean up media query listener
  if (mql && mqlListener) {
    mql.removeEventListener('change', mqlListener)
    mqlListener = null
    mql = null
  }

  // Release offscreen canvas memory
  if (srcCanvas) {
    srcCanvas.width = 0
    srcCanvas.height = 0
    srcCanvas = null
    srcCtx = null
  }
  cachedImageData = null
})

function startAnimation() {
  stopAnimation()
  const gen = ++animationGeneration
  currentFrameIndex = 0
  lastFrameTime = 0
  accumulatedTime = 0
  completedLoops = 0
  isAnimationComplete.value = false

  function loop(timestamp: number) {
    if (gen !== animationGeneration) return // Stale generation, exit
    animationLoop(timestamp)
  }
  animFrameId = requestAnimationFrame(loop)
}

function stopAnimation() {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
}

function replayAnimation() {
  startAnimation()
}

function animationLoop(timestamp: number) {
  const gen = animationGeneration
  const frames = decodedFrames.value
  if (!frames.length) return

  // For reduced motion: draw first frame statically and stop
  if (prefersReducedMotion.value) {
    drawFrame(0)
    return
  }

  // Single-frame GIF: draw once, no animation needed
  if (frames.length <= 1) {
    drawFrame(0)
    return
  }

  // First frame initialization
  if (lastFrameTime === 0) {
    lastFrameTime = timestamp
    drawFrame(0)
    animFrameId = requestAnimationFrame((ts) => {
      if (gen !== animationGeneration) return
      animationLoop(ts)
    })
    return
  }

  const elapsed = timestamp - lastFrameTime
  lastFrameTime = timestamp
  accumulatedTime += elapsed

  const currentDelay = frames[currentFrameIndex]?.delay || 100

  if (accumulatedTime >= currentDelay) {
    accumulatedTime -= currentDelay

    const nextIndex = currentFrameIndex + 1

    // Check if we've reached the end of all frames in this loop iteration
    if (nextIndex >= frames.length) {
      completedLoops++

      const loopCount = effectiveLoopCount.value

      // Check if we should stop:
      // loopCount 0 = infinite, never stop
      // loopCount N = stop after N complete plays
      if (loopCount !== 0 && completedLoops >= loopCount) {
        // Stay on the last frame and stop animating
        isAnimationComplete.value = true
        animFrameId = null
        return
      }

      // Loop back to frame 0
      currentFrameIndex = 0
    } else {
      currentFrameIndex = nextIndex
    }

    drawFrame(currentFrameIndex)
  }

  animFrameId = requestAnimationFrame((ts) => {
    if (gen !== animationGeneration) return
    animationLoop(ts)
  })
}

function drawFrame(index: number) {
  const canvas = canvasRef.value
  const frames = decodedFrames.value
  if (!canvas || !frames[index]) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const frame = frames[index]

  // Lazily create or reuse the offscreen source canvas
  if (!srcCanvas) {
    srcCanvas = document.createElement('canvas')
    srcCtx = srcCanvas.getContext('2d')
  }
  if (!srcCtx) return

  srcCanvas.width = frame.width
  srcCanvas.height = frame.height

  // Reuse cached ImageData to avoid allocating new pixel buffers every frame
  if (!cachedImageData || cachedImageData.width !== frame.width || cachedImageData.height !== frame.height) {
    cachedImageData = new ImageData(frame.width, frame.height)
  }
  cachedImageData.data.set(frame.data)
  srcCtx.putImageData(cachedImageData, 0, 0)

  // Draw scaled to the display canvas
  ctx.clearRect(0, 0, canvasDisplayWidth.value, canvasDisplayHeight.value)
  ctx.drawImage(srcCanvas, 0, 0, canvasDisplayWidth.value, canvasDisplayHeight.value)
}

// Restart animation when decoded frames change (new GIF loaded)
watch(decodedFrames, (frames) => {
  cachedImageData = null
  if (frames.length > 0) {
    startAnimation()
  }
})

// When the user changes loop count, reset the loop counter without restarting from frame 0
// to avoid a jarring jump. If animation was completed, restart it.
watch(effectiveLoopCount, () => {
  completedLoops = 0
  isAnimationComplete.value = false
  // If animation was stopped (completed), restart it
  if (animFrameId === null && decodedFrames.value.length > 1) {
    startAnimation()
  }
})

// Redraw current frame when canvas size changes
watch([canvasDisplayWidth, canvasDisplayHeight], () => {
  if (decodedFrames.value.length > 0 && animFrameId === null) {
    // Animation is stopped (complete) — redraw the last frame at new size
    drawFrame(currentFrameIndex)
  }
})

// -- Helpers --

/** Human-readable label for a loop count value */
function loopCountLabel(count: number): string {
  if (count === 0) return 'Infinite loop'
  if (count === 1) return 'Plays once'
  return `Plays ${count} times`
}

/**
 * Finds the preset key matching a given loop count, or 'custom' if none match.
 */
function presetForLoopCount(count: number): LoopPreset {
  const match = loopPresets.find(p => p.key !== 'custom' && p.value === count)
  return match ? match.key : 'custom'
}

// -- State reset helper --

function resetState() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = ''
  gifFileName.value = ''
  originalFileSize.value = 0
  decodedFrames.value = []
  originalLoopCount.value = 0
  selectedPreset.value = 'infinite'
  customLoopValue.value = 2
  gifMetadata.value = null
  originalBuffer.value = null
}

// -- File handling --

function handleFileSelected(file: File) {
  stopAnimation()
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  resetState()
  gifUrl.value = URL.createObjectURL(file)
  gifFileName.value = file.name
  originalFileSize.value = file.size
  decodeGifFrames()
}

function handleUploadError(message: string) {
  toastError(message)
}

/** Decodes all frames from the current GIF and reads loop metadata */
async function decodeGifFrames() {
  isDecoding.value = true
  try {
    const response = await fetch(gifUrl.value)
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    // Store the raw buffer for pass-through download when unchanged
    originalBuffer.value = buffer

    const metadata = decode(uint8)
    gifMetadata.value = metadata

    // Read the loop count from metadata
    // loopCount === undefined or 0 means infinite in the GIF spec
    const rawLoopCount = metadata.loopCount ?? 0
    originalLoopCount.value = rawLoopCount

    // Auto-select the matching preset pill
    const matchingPreset = presetForLoopCount(rawLoopCount)
    selectedPreset.value = matchingPreset
    if (matchingPreset === 'custom') {
      customLoopValue.value = rawLoopCount
    }

    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- Download --

async function downloadGif() {
  if (isDecoding.value) return

  const baseName = gifFileName.value || 'animation.gif'

  // No change applied — download original GIF directly (no re-encoding needed)
  if (!hasChanged.value && originalBuffer.value) {
    isEncoding.value = true
    try {
      const blob = new Blob([originalBuffer.value], { type: 'image/gif' })
      downloadBlob(blob, baseName)
    } finally {
      isEncoding.value = false
    }
    return
  }

  // Re-encode with the new loop count
  const prefix = effectiveLoopCount.value === 0 ? 'loop-infinite_' : `loop-${effectiveLoopCount.value}x_`
  const srcFrames = decodedFrames.value.slice() // Snapshot to avoid race with animation loop

  isEncoding.value = true
  try {
    const w = sourceWidth.value
    const h = sourceHeight.value
    const loopCount = effectiveLoopCount.value

    // Build frame data, yielding to browser every 50 frames
    const frames: Array<{ data: Uint8ClampedArray; delay: number }> = []
    for (let i = 0; i < srcFrames.length; i++) {
      const f = srcFrames[i]
      frames.push({
        data: f.data,
        delay: f.delay,
      })

      // Yield to browser every 50 frames to prevent UI freeze
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    const encoded = await encode({
      width: w,
      height: h,
      looped: true, // Always write the Netscape extension to control loop count
      loopCount,
      frames,
    })

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
