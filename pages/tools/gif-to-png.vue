<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <div class="mb-6">
      <h1 class="page-title">GIF to PNG Converter & Frame Extractor — Split GIFs into PNG Frames Online Free</h1>
      <p class="page-subtitle mt-1">Extract single frames or split entire GIFs into PNG images — download individually or as a ZIP. Lossless quality, transparency preserved, no watermark.</p>
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
              <p class="text-xs text-surface-500">{{ decodedFrames.length }} frames</p>
            </div>
            <button class="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" aria-label="Clear GIF" @click="clearGif">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Frame picker (only for multi-frame GIFs) -->
          <div v-if="decodedFrames.length > 1">
            <!-- Selection mode toggle -->
            <h3 class="label mb-2">Pick Frames</h3>
            <div class="segmented-control w-full mb-4" role="radiogroup" aria-label="Frame selection mode">
              <button
                role="radio"
                :aria-checked="selectionMode === 'single'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': selectionMode === 'single' }"
                @click="setSelectionMode('single')"
              >
                Single Frame
              </button>
              <button
                role="radio"
                :aria-checked="selectionMode === 'multi'"
                class="segmented-control-item flex-1 justify-center"
                :class="{ 'segmented-control-item-active': selectionMode === 'multi' }"
                @click="setSelectionMode('multi')"
              >
                Multiple Frames
              </button>
            </div>

            <!-- Single-frame slider picker -->
            <FramePicker
              v-if="selectionMode === 'single'"
              v-model="selectedFrameIndex"
              :frames="decodedFrames"
              :is-loading="isDecoding"
            />

            <!-- Multi-frame thumbnail grid -->
            <template v-else>
              <FrameGrid
                :frames="decodedFrames"
                :selected-indices="selectedFrameIndices"
                @toggle-frame="toggleFrame"
              />

              <!-- Bulk controls -->
              <div class="flex items-center justify-between mt-3">
                <p class="text-xs text-surface-500">
                  {{ selectedFrameIndices.size }} of {{ decodedFrames.length }} frames selected
                </p>
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-sm" @click="selectAllFrames">Select All</button>
                  <button class="btn btn-secondary btn-sm" :disabled="selectedFrameIndices.size === 0" @click="deselectAllFrames">Deselect All</button>
                </div>
              </div>
            </template>
          </div>

          <!-- Single-frame notice -->
          <p v-else-if="decodedFrames.length === 1 && !isDecoding" class="text-sm text-surface-500">
            This GIF has only 1 frame. It will be exported as-is.
          </p>

          <!-- Download button: single mode -->
          <button
            v-if="selectionMode === 'single'"
            class="btn btn-primary btn-lg w-full"
            :disabled="isDecoding || !previewPngBlob"
            @click="downloadAsPng"
          >
            <IconDownload :size="18" />
            Download as PNG
          </button>

          <!-- Download button: multi mode -->
          <button
            v-else
            class="btn btn-primary btn-lg w-full"
            :disabled="isZipping || selectedFrameIndices.size === 0"
            @click="downloadAsZip"
          >
            <IconDownload :size="18" />
            {{ isZipping ? 'Creating ZIP...' : `Download ${selectedFrameIndices.size} PNG${selectedFrameIndices.size !== 1 ? 's' : ''} as ZIP` }}
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

        <!-- PNG preview on checkerboard background -->
        <div v-else class="rounded-2xl overflow-hidden checkerboard flex items-center justify-center p-4 min-h-[200px]">
          <!-- Multi mode: prompt or preview last-clicked frame -->
          <template v-if="selectionMode === 'multi'">
            <div v-if="selectedFrameIndices.size === 0" class="text-surface-400 text-sm">
              Select frames from the grid
            </div>
            <img
              v-else-if="multiPreviewPngUrl"
              :src="multiPreviewPngUrl"
              alt="Selected frame as PNG"
              class="max-w-full max-h-[400px] object-contain"
            />
            <div v-else class="text-surface-400 text-sm">Rendering preview...</div>
          </template>

          <!-- Single mode: standard preview -->
          <template v-else>
            <img
              v-if="previewPngUrl"
              :src="previewPngUrl"
              alt="Selected frame as PNG"
              class="max-w-full max-h-[400px] object-contain"
            />
            <div v-else class="text-surface-400 text-sm">Decoding frames...</div>
          </template>
        </div>

        <!-- File info -->
        <div v-if="decodedFrames.length" class="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          <span>{{ decodedFrames[0]?.width }}&times;{{ decodedFrames[0]?.height }}px</span>
          <span>{{ decodedFrames.length }} frames</span>
          <template v-if="selectionMode === 'multi' && selectedFrameIndices.size > 0">
            <span>Previewing frame {{ lastClickedIndex + 1 }} &mdash; {{ selectedFrameIndices.size }} frame{{ selectedFrameIndices.size !== 1 ? 's' : '' }} selected</span>
          </template>
          <template v-else-if="selectionMode === 'single'">
            <span>Showing frame {{ selectedFrameIndex + 1 }}</span>
          </template>
        </div>
      </div>

    </div>

    <!-- Related tools — frame extraction pairs with MP4 export, GIF building, compression, and trim -->
    <ToolRelated
      current="/tools/gif-to-png"
      :tools="[
        { to: '/tools/gif-to-mp4', label: 'GIF to MP4', icon: 'IconVideo', description: 'Convert GIFs to MP4 video for smaller file size' },
        { to: '/tools/gif-maker', label: 'GIF Maker', icon: 'IconFrame', description: 'Combine images into an animated GIF' },
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
      ]"
    />

    <!-- SEO content section -->
    <section class="mt-12 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-3">How to Convert GIF to PNG or Extract All Frames</h2>
      <ol class="list-decimal list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Upload your GIF</strong> — drag and drop or click to browse. Supports animated GIFs up to 20 MB. Your file never leaves your device — all processing is browser-based and private.</li>
        <li><strong>Choose your mode</strong> — use <em>Single Frame</em> to pick one frame with the slider, or switch to <em>Multiple Frames</em> to select several frames or extract all frames from the GIF at once.</li>
        <li><strong>Select frames</strong> — in Single Frame mode, scrub the slider to find the perfect still image. In Multiple Frames mode, click individual thumbnails or hit "Select All" to use our GIF splitter to grab every frame.</li>
        <li><strong>Download as PNG or ZIP</strong> — save a single frame as a lossless PNG, or download multiple GIF frames as a ZIP of PNGs. No watermark, no signup required.</li>
      </ol>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">Why Convert GIF to PNG?</h2>
      <ul class="list-disc list-inside text-sm text-surface-600 space-y-2">
        <li><strong>Lossless quality</strong> — PNG preserves every pixel. Colors, transparency, and pixel data are kept exactly as they appear in the original GIF frame.</li>
        <li><strong>Transparency preserved</strong> — PNG supports full alpha channel transparency, an upgrade from GIF's binary on/off approach. Transparent backgrounds stay transparent.</li>
        <li><strong>Perfect for thumbnails and profile pictures</strong> — extract the best moment from any animated GIF and use it as a still capture wherever you need one.</li>
        <li><strong>Smaller file size for single frames</strong> — a single PNG frame is typically smaller than the full animated GIF, making it faster to load on web pages and social profiles.</li>
        <li><strong>Great for emotes</strong> — convert an animated GIF to a static PNG emote for platforms that require still images, like Twitch static emotes or Discord emoji.</li>
        <li><strong>100% free, no watermark</strong> — download clean PNG files every time. No branding, no account, no limits.</li>
        <li><strong>Browser-based and private</strong> — your GIF never leaves your device. No server upload means your files stay secure.</li>
      </ul>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF to PNG for Streaming Emotes & Thumbnails</h2>
      <p class="text-sm text-surface-600 mb-3">Many streaming and chat platforms require static images in PNG format. Twitch static emotes must be PNG files at specific sizes. Discord emoji work best as PNGs with transparent backgrounds. If you have an animated emote and need a static version, our GIF to PNG converter lets you pick the best frame and save it as a clean, lossless PNG — ready to upload as a Twitch static emote, Discord emoji, or profile picture.</p>
      <p class="text-sm text-surface-600">You can also use the GIF frame extractor to grab a specific frame for a thumbnail. Instead of screenshotting and cropping, just upload the GIF, scrub to the right moment, and download the frame at the original resolution with transparency intact.</p>

      <h2 class="text-base font-bold text-surface-900 mt-8 mb-3">GIF to PNG vs GIF Splitter: What's the Difference?</h2>
      <p class="text-sm text-surface-600 mb-3"><strong>GIF to PNG conversion</strong> typically means extracting a single frame from an animated GIF and saving it as a static PNG image. This is what you need when you want one perfect still — a thumbnail, a profile picture, or a gif frame for a static emote.</p>
      <p class="text-sm text-surface-600 mb-3"><strong>GIF splitting</strong> (also called GIF frame extraction) means breaking an entire animated GIF into its individual frames — every single one — and exporting them as separate PNG files. This is useful for editing individual frames, creating sprite sheets, or analyzing an animation frame by frame.</p>
      <p class="text-sm text-surface-600">Our tool does both. In Single Frame mode it works as a GIF to PNG converter. Switch to Multiple Frames mode and it becomes a full GIF splitter — select all frames and download them as a ZIP, or pick just the frames you need. Either way, every PNG is exported at full resolution with lossless quality and transparency preserved.</p>

      <p class="text-sm text-surface-500 mt-6">
        Need to edit the animation itself? Use our <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">GIF trimmer</NuxtLink> to cut frames, the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">GIF resizer</NuxtLink> to change dimensions, or the <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink> to reduce file size. Or try our <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">full emote optimizer</NuxtLink> for one-click emote formatting for Twitch, Discord, and Kick.
      </p>
    </section>

    <!-- FAQ section -->
    <section class="mt-8 mb-8 max-w-3xl mx-auto">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I convert a GIF to PNG?</h3>
          <p class="text-sm text-surface-500 mt-1">Upload your GIF, pick the frame you want with the slider, and click "Download as PNG." The selected frame is saved as a lossless PNG at the original resolution with transparency preserved.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I extract all frames from a GIF?</h3>
          <p class="text-sm text-surface-500 mt-1">Switch to Multiple Frames mode, click "Select All," and download as ZIP. Every frame is exported as a separate, full-resolution PNG file.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I split a GIF into individual frames?</h3>
          <p class="text-sm text-surface-500 mt-1">Use the same Multiple Frames workflow — our GIF splitter exports all frames as separate PNGs packaged in a ZIP file. Each file is named with its frame number for easy sorting.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does converting GIF to PNG lose quality?</h3>
          <p class="text-sm text-surface-500 mt-1">No. PNG is a lossless format. Colors, transparency, and pixel data are preserved exactly as they appear in the original GIF frame.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is transparency preserved when converting GIF to PNG?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. PNG supports full alpha channel transparency. Transparent areas in your GIF remain transparent in the exported PNG — ideal for emotes and stickers with clean transparent backgrounds.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What is the difference between GIF and PNG?</h3>
          <p class="text-sm text-surface-500 mt-1">GIF supports animation and is limited to 256 colors with binary (on/off) transparency. PNG is a static format with lossless compression that supports millions of colors and full alpha transparency. Converting a GIF frame to PNG gives you higher color fidelity and better transparency handling.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I save a GIF frame as a profile picture or emote?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. Extract the perfect frame from your animated GIF and download it as a PNG. The result is ready for use as a Twitch static emote, Discord emoji, or profile picture on any platform.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">How do I download GIF frames as a ZIP?</h3>
          <p class="text-sm text-surface-500 mt-1">Switch to Multiple Frames mode, select the frames you want (or click "Select All"), then click "Download as ZIP." All selected frames are packaged as individual PNGs in a single ZIP file.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Is there a file size limit?</h3>
          <p class="text-sm text-surface-500 mt-1">You can upload GIFs up to 20 MB. All processing happens in your browser — private and secure. Larger files may take a moment to decode.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this add a watermark?</h3>
          <p class="text-sm text-surface-500 mt-1">No. EmoteSizer never adds watermarks. The PNG files you download are exactly the frames you selected, nothing more.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I select specific frames instead of all?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. In Multiple Frames mode, click individual frame thumbnails to toggle selection. You can pick any combination of frames — download just the ones you need as a ZIP.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Does this work on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. The GIF to PNG converter and GIF splitter work in any modern mobile browser. No app install needed — just open the page, upload, and download.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { decodeFrames } from 'modern-gif'
import type { DecodedFrame } from 'modern-gif'

useHead({
  title: 'GIF to PNG Converter & GIF Splitter — Extract Frames Free Online | EmoteSizer',
  meta: [
    { key: 'description', name: 'description', content: 'Free online GIF to PNG converter and GIF splitter. Extract a single frame or split all frames from animated GIFs — download as PNG or ZIP. Lossless, no watermark, no signup.' },
    { key: 'og:title', property: 'og:title', content: 'GIF to PNG Converter & GIF Splitter — Extract Frames Free Online | EmoteSizer' },
    { key: 'og:description', property: 'og:description', content: 'Free online GIF to PNG converter and GIF splitter. Extract a single frame or split all frames from animated GIFs — download as PNG or ZIP. Lossless, no watermark, no signup.' },
    { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com/tools/gif-to-png' },
    { key: 'og:type', property: 'og:type', content: 'website' },
    { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { key: 'twitter:title', name: 'twitter:title', content: 'GIF to PNG Converter & GIF Splitter — Extract Frames Free Online | EmoteSizer' },
    { key: 'twitter:description', name: 'twitter:description', content: 'Free online GIF to PNG converter and GIF splitter. Extract a single frame or split all frames from animated GIFs — download as PNG or ZIP. Lossless, no watermark, no signup.' },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [{ rel: 'canonical', href: 'https://emotesizer.com/tools/gif-to-png' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'GIF to PNG Converter & GIF Splitter',
        'url': 'https://emotesizer.com/tools/gif-to-png',
        'description': 'Free online GIF to PNG converter and GIF splitter. Extract a single frame or split all frames from animated GIFs — download as PNG or ZIP. Lossless, no watermark, no signup.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        'featureList': [
          'Convert animated GIF to PNG',
          'GIF splitter',
          'GIF frame extractor',
          'Extract all frames as ZIP',
          'Single frame extraction',
          'Multi-frame selection',
          'Lossless PNG conversion',
          'Transparency preserved',
          'No watermark',
          'GIF to PNG online free',
          'GIF frame picker with slider',
          'Download GIF frames as ZIP',
          'Save GIF frames as PNG',
          'GIF to still image converter',
          'GIF to PNG emote converter',
          'GIF frame for thumbnail',
          'Browser-based processing — private and secure',
          'No signup required',
          'Client-side — files never leave your device',
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
            'name': 'How do I convert a GIF to PNG?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Upload your GIF, pick the frame you want with the slider, and click "Download as PNG." The selected frame is saved as a lossless PNG at the original resolution with transparency preserved.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I extract all frames from a GIF?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Switch to Multiple Frames mode, click "Select All," and download as ZIP. Every frame is exported as a separate, full-resolution PNG file.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I split a GIF into individual frames?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Use the same Multiple Frames workflow — our GIF splitter exports all frames as separate PNGs packaged in a ZIP file. Each file is named with its frame number for easy sorting.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does converting GIF to PNG lose quality?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. PNG is a lossless format. Colors, transparency, and pixel data are preserved exactly as they appear in the original GIF frame.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is transparency preserved when converting GIF to PNG?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. PNG supports full alpha channel transparency. Transparent areas in your GIF remain transparent in the exported PNG — ideal for emotes and stickers with clean transparent backgrounds.',
            },
          },
          {
            '@type': 'Question',
            'name': 'What is the difference between GIF and PNG?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'GIF supports animation and is limited to 256 colors with binary (on/off) transparency. PNG is a static format with lossless compression that supports millions of colors and full alpha transparency. Converting a GIF frame to PNG gives you higher color fidelity and better transparency handling.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I save a GIF frame as a profile picture or emote?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Extract the perfect frame from your animated GIF and download it as a PNG. The result is ready for use as a Twitch static emote, Discord emoji, or profile picture on any platform.',
            },
          },
          {
            '@type': 'Question',
            'name': 'How do I download GIF frames as a ZIP?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Switch to Multiple Frames mode, select the frames you want (or click "Select All"), then click "Download as ZIP." All selected frames are packaged as individual PNGs in a single ZIP file.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Is there a file size limit?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can upload GIFs up to 20 MB. All processing happens in your browser — private and secure. Larger files may take a moment to decode.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this add a watermark?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. EmoteSizer never adds watermarks. The PNG files you download are exactly the frames you selected, nothing more.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I select specific frames instead of all?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. In Multiple Frames mode, click individual frame thumbnails to toggle selection. You can pick any combination of frames — download just the ones you need as a ZIP.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does this work on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. The GIF to PNG converter and GIF splitter work in any modern mobile browser. No app install needed — just open the page, upload, and download.',
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
        'name': 'How to Convert GIF to PNG or Extract All Frames',
        'description': 'Extract a single frame or split all frames from an animated GIF into lossless PNG images using EmoteSizer\'s free GIF to PNG converter and GIF splitter.',
        'step': [
          { '@type': 'HowToStep', 'position': 1, 'name': 'Upload your GIF', 'text': 'Drag and drop or click to browse. Supports animated GIFs up to 20 MB. Your file never leaves your device — all processing is browser-based and private.' },
          { '@type': 'HowToStep', 'position': 2, 'name': 'Choose your mode', 'text': 'Use Single Frame mode to pick one frame with the slider, or switch to Multiple Frames mode to select several frames or extract all frames from the GIF at once.' },
          { '@type': 'HowToStep', 'position': 3, 'name': 'Select frames', 'text': 'In Single Frame mode, scrub the slider to find the perfect still image. In Multiple Frames mode, click individual thumbnails or hit Select All to grab every frame.' },
          { '@type': 'HowToStep', 'position': 4, 'name': 'Download as PNG or ZIP', 'text': 'Save a single frame as a lossless PNG, or download multiple GIF frames as a ZIP of PNGs. No watermark, no signup required.' },
        ],
        'tool': { '@type': 'HowToTool', 'name': 'EmoteSizer GIF to PNG Converter & GIF Splitter' },
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
          { '@type': 'ListItem', 'position': 3, 'name': 'GIF to PNG Converter', 'item': 'https://emotesizer.com/tools/gif-to-png' },
        ],
      }),
    },
  ],
})

const { error: toastError, success: toastSuccess } = useToast()
const { downloadBlob } = useDownload()

let isMounted = true

// -- Reactive state --

const gifUrl = ref('')
const gifFileName = ref('')
const decodedFrames = ref<DecodedFrame[]>([])
const selectedFrameIndex = ref(0)
const isDecoding = ref(false)
const previewPngBlob = ref<Blob | null>(null)
const previewPngUrl = ref<string | null>(null)

// Multi-frame selection state
type SelectionMode = 'single' | 'multi'
const selectionMode = ref<SelectionMode>('single')
const selectedFrameIndices = ref<Set<number>>(new Set())
const isZipping = ref(false)
const lastClickedIndex = ref(0)
const multiPreviewPngUrl = ref<string | null>(null)

// -- File handling --

function handleFileSelected(file: File) {
  // Revoke any existing blob URLs to prevent memory leaks
  clearGif()

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

    const frames = decodeFrames(uint8)
    decodedFrames.value = frames
    selectedFrameIndex.value = 0

    // Render the first frame immediately (the watcher won't fire since
    // selectedFrameIndex is already 0 from its initial value)
    renderFrameAsPng()
  } catch {
    toastError('Failed to decode GIF. The file may be corrupted.')
    decodedFrames.value = []
  } finally {
    isDecoding.value = false
  }
}

// -- PNG preview rendering --
// Renders the selected frame to a canvas at native resolution and converts
// to a PNG blob URL. Updates live as the slider moves (no debounce needed
// since a single-frame canvas render is fast).

// Reusable canvas for PNG rendering — created once, reused across frame changes
let pngCanvas: HTMLCanvasElement | null = null
let pngCtx: CanvasRenderingContext2D | null = null

function getPngCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!pngCanvas) {
    pngCanvas = document.createElement('canvas')
    pngCtx = pngCanvas.getContext('2d', { willReadFrequently: true })
  }
  if (!pngCtx) return null
  return { canvas: pngCanvas, ctx: pngCtx }
}

watch(selectedFrameIndex, () => {
  renderFrameAsPng()
})

/**
 * Renders the currently selected frame onto an offscreen canvas at native
 * resolution, then converts to a PNG blob URL for preview and download.
 */
function renderFrameAsPng() {
  const frame = decodedFrames.value[selectedFrameIndex.value]
  if (!frame) return

  const result = getPngCanvas()
  if (!result) return
  const { canvas, ctx } = result

  // Resize canvas only if dimensions changed
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }

  // Paint raw RGBA pixel data onto the canvas
  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  ctx.putImageData(imageData, 0, 0)

  // Convert to PNG blob
  canvas.toBlob((blob) => {
    if (!isMounted || !blob) return

    // Revoke previous preview URL to prevent memory leaks
    if (previewPngUrl.value) {
      URL.revokeObjectURL(previewPngUrl.value)
    }
    previewPngBlob.value = blob
    previewPngUrl.value = URL.createObjectURL(blob)
  }, 'image/png')
}

// -- Selection mode --

function setSelectionMode(mode: SelectionMode) {
  if (selectionMode.value === mode) return

  if (mode === 'multi') {
    // Pre-select the currently viewed single frame
    selectedFrameIndices.value = new Set([selectedFrameIndex.value])
    lastClickedIndex.value = selectedFrameIndex.value
    renderMultiPreview(selectedFrameIndex.value)
  } else {
    // Switching to single: clear multi selection
    selectedFrameIndices.value = new Set()
    revokeMultiPreview()
  }

  selectionMode.value = mode
}

function toggleFrame(index: number) {
  const next = new Set(selectedFrameIndices.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selectedFrameIndices.value = next
  lastClickedIndex.value = index

  // Update the multi-mode preview to show the last-clicked frame
  if (next.size > 0) {
    renderMultiPreview(index)
  } else {
    revokeMultiPreview()
  }
}

function selectAllFrames() {
  selectedFrameIndices.value = new Set(decodedFrames.value.map((_, i) => i))
  // Keep the current preview as-is, or show frame 0 if none was shown
  if (!multiPreviewPngUrl.value && decodedFrames.value.length > 0) {
    renderMultiPreview(0)
    lastClickedIndex.value = 0
  }
}

function deselectAllFrames() {
  selectedFrameIndices.value = new Set()
  revokeMultiPreview()
}

// -- Multi-mode preview --

// Version counter to guard against stale toBlob callbacks when the user
// clicks frames faster than the async blob conversion can resolve.
let multiPreviewVersion = 0

function revokeMultiPreview() {
  if (multiPreviewPngUrl.value) {
    URL.revokeObjectURL(multiPreviewPngUrl.value)
    multiPreviewPngUrl.value = null
  }
}

/**
 * Renders a specific frame as a PNG blob URL for the multi-mode preview.
 * Reuses the same offscreen canvas infrastructure as single-mode rendering.
 */
function renderMultiPreview(index: number) {
  const version = ++multiPreviewVersion

  const frame = decodedFrames.value[index]
  if (!frame) return

  const result = getPngCanvas()
  if (!result) return
  const { canvas, ctx } = result

  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }

  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height,
  )
  ctx.putImageData(imageData, 0, 0)

  canvas.toBlob((blob) => {
    // Discard stale renders: if a newer call has incremented the version
    // since this blob started, this callback is outdated.
    if (!isMounted || !blob || version !== multiPreviewVersion) return
    revokeMultiPreview()
    multiPreviewPngUrl.value = URL.createObjectURL(blob)
  }, 'image/png')
}

// -- Helper: render any frame to a PNG blob --

/**
 * Renders a decoded frame to a PNG Blob. Used by both single download
 * and batch ZIP creation to avoid duplicating canvas logic.
 */
function renderFrameToPngBlob(frame: DecodedFrame): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const result = getPngCanvas()
    if (!result) return reject(new Error('Canvas unavailable'))
    const { canvas, ctx } = result

    if (canvas.width !== frame.width || canvas.height !== frame.height) {
      canvas.width = frame.width
      canvas.height = frame.height
    }

    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height,
    )
    ctx.putImageData(imageData, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

// -- Download --

function downloadAsPng() {
  if (!previewPngBlob.value) return

  const baseName = gifFileName.value.replace(/\.gif$/i, '')
  const filename = decodedFrames.value.length > 1
    ? `${baseName}_frame${selectedFrameIndex.value + 1}.png`
    : `${baseName}.png`

  downloadBlob(previewPngBlob.value, filename)
}

async function downloadAsZip() {
  if (selectedFrameIndices.value.size === 0) return
  isZipping.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const baseName = gifFileName.value.replace(/\.gif$/i, '')
    const sorted = [...selectedFrameIndices.value].sort((a, b) => a - b)
    const padLength = String(decodedFrames.value.length).length

    for (const idx of sorted) {
      const frame = decodedFrames.value[idx]
      if (!frame) continue
      const blob = await renderFrameToPngBlob(frame)
      const padded = String(idx + 1).padStart(padLength, '0')
      zip.file(`${baseName}_frame${padded}.png`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${baseName}_frames.zip`)
    toastSuccess(`Downloaded ${sorted.length} frame${sorted.length !== 1 ? 's' : ''} as ZIP`)
  } catch {
    toastError('Failed to create ZIP file')
  } finally {
    isZipping.value = false
  }
}

// -- Clear / cleanup --

function clearGif() {
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  if (previewPngUrl.value) URL.revokeObjectURL(previewPngUrl.value)
  revokeMultiPreview()
  multiPreviewVersion = 0
  gifUrl.value = ''
  gifFileName.value = ''
  decodedFrames.value = []
  selectedFrameIndex.value = 0
  previewPngBlob.value = null
  previewPngUrl.value = null
  selectionMode.value = 'single'
  selectedFrameIndices.value = new Set()
  isZipping.value = false
  lastClickedIndex.value = 0

  // Release the reusable canvas
  if (pngCanvas) {
    pngCanvas.width = 0
    pngCanvas.height = 0
    pngCanvas = null
    pngCtx = null
  }
}

onUnmounted(() => {
  isMounted = false
  clearGif()
})
</script>
