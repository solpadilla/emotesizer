<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-6">
    <!-- Page header with new editorial H1 -->
    <h1 class="page-title">Free GIF Tools — Edit, Convert, and Optimize Animated GIFs</h1>
    <p class="page-subtitle mt-1">A focused toolkit for streamers, modders, and meme makers — pick a single transformation, or chain several into a full emote workflow.</p>

    <!-- Intro paragraph: explains the toolset's purpose without reusing
         the per-tool boilerplate. Written fresh so a reviewer reading this
         after a tool page does not see duplicate copy. -->
    <p class="text-sm text-surface-500 leading-relaxed mt-4 max-w-3xl">
      EmoteSizer's tool suite covers every step between a raw GIF and a platform-ready emote. The all-in-one
      <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">Emote Optimizer</NuxtLink>
      makes the common decisions for you — pick a target platform, drop in a file, get a properly sized and compressed download — while the focused tools below give you direct manual control over a single transformation, like adjusting playback speed, cropping a region, or extracting individual frames.
      Every tool runs entirely on your own device using WebAssembly and the Canvas API, so there is no upload step and no waiting room. Open any tool, drop in a file, and the work starts immediately.
    </p>

    <!-- Primary CTAs -->
    <div class="mt-6 flex flex-col sm:flex-row gap-3">
      <NuxtLink to="/optimizer" class="btn btn-primary">
        Open the Emote Optimizer
      </NuxtLink>
      <NuxtLink to="/search" class="btn btn-secondary">
        Search GIFs &amp; Stickers
      </NuxtLink>
    </div>

    <!-- Existing tile grid (legitimate navigation surface) -->
    <div v-for="category in activeCategories" :key="category.key" class="mt-8 first:mt-8">
      <h2 class="text-sm font-bold text-surface-900 flex items-center gap-2 mb-3">
        <component :is="iconMap[category.icon]" :size="16" class="text-primary-500" />
        {{ category.label }}
        <span class="text-[10px] bg-surface-200/50 text-surface-400 rounded-full px-1.5 min-w-[20px] text-center">
          {{ category.tools.length }}
        </span>
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <NuxtLink
          v-for="tool in category.tools"
          :key="tool.to"
          :to="tool.to"
          class="card p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">
            <component :is="iconMap[tool.icon]" :size="20" class="text-primary-500" />
          </div>
          <p class="text-sm font-bold text-surface-900">{{ tool.label }}</p>
          <p class="text-xs text-surface-500 mt-1">{{ tool.description }}</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Editorial: decision guide -->
    <section class="mt-12 max-w-3xl">
      <h2 class="text-base font-bold text-surface-900 mb-3">Which GIF Tool Should I Use?</h2>
      <div class="space-y-3 text-sm text-surface-500 leading-relaxed">
        <p>
          <strong class="text-surface-900">"I want to make a Twitch or Discord emote from a GIF I already have."</strong>
          Open the <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">Emote Optimizer</NuxtLink>. Drop the file in, pick the target platform, and download a zip of the required sizes. This is the fastest path from a single GIF to a finished emote because the optimizer handles trimming, cropping, resizing, and Smart Compression in one pass.
        </p>
        <p>
          <strong class="text-surface-900">"I want to find a GIF first, then turn it into an emote."</strong>
          Start at <NuxtLink to="/search" class="text-primary-500 hover:underline">Search</NuxtLink>, browse trending GIFs and stickers by keyword or category, then click "Use as emote" on any result to hand it off to the optimizer with the source URL pre-loaded.
        </p>
        <p>
          <strong class="text-surface-900">"I just need to shrink the file size — the dimensions are already correct."</strong>
          Use the <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">GIF compressor</NuxtLink>. It runs eleven different reduction strategies in order of aggressiveness so you only sacrifice as much quality as the target size demands.
        </p>
        <p>
          <strong class="text-surface-900">"I need to change the dimensions or square-crop a non-square clip."</strong>
          Use the <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resizer</NuxtLink> for exact pixel dimensions, or the <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">cropper</NuxtLink> for picking a specific rectangular region from the source frame.
        </p>
        <p>
          <strong class="text-surface-900">"I need to shorten the animation or change how fast it plays."</strong>
          The <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">trimmer</NuxtLink> removes frames from the start or end; the <NuxtLink to="/tools/speed" class="text-primary-500 hover:underline">speed changer</NuxtLink> rewrites the per-frame delays so the same frames play faster or slower.
        </p>
        <p>
          <strong class="text-surface-900">"I want to combine several still images into a single animated GIF."</strong>
          The <NuxtLink to="/tools/gif-maker" class="text-primary-500 hover:underline">GIF maker</NuxtLink> takes a sequence of PNGs or JPEGs, lets you reorder them, set per-frame timing, and exports a looping GIF.
        </p>
      </div>
    </section>

    <!-- Editorial: typical workflow -->
    <section class="mt-10 max-w-3xl">
      <h2 class="text-base font-bold text-surface-900 mb-3">How These Tools Work Together</h2>
      <p class="text-sm text-surface-500 leading-relaxed">
        Most emote workflows touch three or four tools in sequence. A typical chain starts with
        <NuxtLink to="/search" class="text-primary-500 hover:underline">Search</NuxtLink>
        to find a candidate clip, moves to the
        <NuxtLink to="/tools/trim" class="text-primary-500 hover:underline">trimmer</NuxtLink>
        to cut the clip down to the few seconds that matter, then to the
        <NuxtLink to="/tools/crop" class="text-primary-500 hover:underline">cropper</NuxtLink>
        to square the frame around the subject. From there the
        <NuxtLink to="/tools/resize" class="text-primary-500 hover:underline">resizer</NuxtLink>
        sets the target dimensions for the platform you have in mind, and the
        <NuxtLink to="/tools/compress" class="text-primary-500 hover:underline">compressor</NuxtLink>
        handles the file-size constraint last, since file size is the easiest thing to negotiate against image quality at the end of the pipeline.
      </p>
      <p class="text-sm text-surface-500 leading-relaxed mt-3">
        If running through that chain manually feels like a lot of steps for a single emote, that is exactly what the
        <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">Emote Optimizer</NuxtLink>
        is for — it bundles trim, crop, resize, and Smart Compress into one screen with the platform's size and file-size limits already filled in.
      </p>
    </section>

    <!-- Editorial: client-side processing -->
    <section id="how-it-works" class="mt-10 max-w-3xl">
      <h2 class="text-base font-bold text-surface-900 mb-3">All Processing Happens in Your Browser</h2>
      <p class="text-sm text-surface-500 leading-relaxed">
        Every tool on this site runs its image work locally — there is no upload step and no server-side rendering of your files. We achieve this with three browser APIs working in concert: WebAssembly builds of
        <a href="https://www.ffmpeg.org/" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:underline">FFmpeg</a>
        and
        <a href="https://www.lcdf.org/gifsicle/" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:underline">gifsicle</a>
        for video and GIF transforms, the OffscreenCanvas API for per-frame pixel work, and a small JavaScript glue layer that schedules the work in chunks so the page stays interactive on long files.
      </p>
      <p class="text-sm text-surface-500 leading-relaxed mt-3">
        The practical implications: nothing you upload is ever sent to or stored on our infrastructure, the tool keeps working if your network drops mid-edit (only the initial page load needs the network), and the time to first byte on a download is roughly the time to encode rather than the time to encode plus a round trip.
      </p>
    </section>

    <!-- Suite-level FAQ -->
    <section class="mt-10 mb-8 max-w-3xl">
      <h2 class="text-base font-bold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-bold text-surface-900">Which tool should I use to make a Twitch emote?</h3>
          <p class="text-sm text-surface-500 mt-1">For a one-shot conversion from a GIF or image to a Twitch-ready emote, use the <NuxtLink to="/optimizer" class="text-primary-500 hover:underline">Emote Optimizer</NuxtLink> — it handles 28x28, 56x56, and 112x112 in a single export and applies Smart Compress automatically if the result exceeds 1 MB. Use the focused tools (resize, crop, compress) when you want manual control over a specific step.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Do I have to use the tools in a specific order?</h3>
          <p class="text-sm text-surface-500 mt-1">No — every tool reads and writes a standard GIF, so you can chain them in any order that makes sense for your source material. That said, the order trim &rarr; crop &rarr; resize &rarr; compress tends to give the best output quality, because each step removes data the next step would otherwise have to operate on.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Can I use these tools on my phone?</h3>
          <p class="text-sm text-surface-500 mt-1">Yes. The tools are responsive and the underlying WebAssembly modules run on iOS Safari and Chrome on Android. Performance scales with your device — encoding a long GIF on a phone takes longer than on a laptop, but the workflow is identical.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">What's the difference between the Optimizer and the individual tools?</h3>
          <p class="text-sm text-surface-500 mt-1">The Optimizer is opinionated: it picks resize mode, file-size target, and compression aggressiveness from the platform you choose. The individual tools are unopinionated — you set every parameter directly. Use the Optimizer when you want a finished emote in three clicks; use the individual tools when you want to inspect every intermediate result.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Are there any file size or quantity limits?</h3>
          <p class="text-sm text-surface-500 mt-1">The upload size cap is 20 MB per file across the suite. There's no per-day quantity limit because nothing about your usage is metered server-side — you're rate-limited only by your own device's CPU and memory.</p>
        </div>
        <div>
          <h3 class="text-sm font-bold text-surface-900">Why do all these tools say "no upload to server"? How does that work?</h3>
          <p class="text-sm text-surface-500 mt-1">Modern browsers ship with WebAssembly, OffscreenCanvas, and File System Access APIs powerful enough to run real image and video pipelines client-side. We compile FFmpeg and gifsicle to WebAssembly, fetch the wasm modules on first page load, and execute every encode in a worker thread on your device. The "Upload" button is technically a file picker that hands the bytes to the in-page worker — they never traverse the network.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { activeCategories } = useToolsNav()

// Pre-resolve all icon components used in the tools nav so that dynamic
// `<component :is="...">` lookups work correctly. Nuxt tree-shakes
// auto-imported components that aren't statically referenced, so calling
// resolveComponent() with a runtime string in the template fails.
const iconMap: Record<string, ReturnType<typeof resolveComponent>> = {
  IconScissors: resolveComponent('IconScissors'),
  IconResize: resolveComponent('IconResize'),
  IconCrop: resolveComponent('IconCrop'),
  IconRotate: resolveComponent('IconRotate'),
  IconGauge: resolveComponent('IconGauge'),
  IconReverse: resolveComponent('IconReverse'),
  IconLoop: resolveComponent('IconLoop'),
  IconFrame: resolveComponent('IconFrame'),
  IconCompress: resolveComponent('IconCompress'),
  IconVideo: resolveComponent('IconVideo'),
  IconText: resolveComponent('IconText'),
}

useHead({
  title: 'GIF Tools — Edit, Convert, and Optimize Animated GIFs | EmoteSizer',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Free in-browser GIF editing toolkit — trim, crop, resize, compress, change speed, reverse, and convert animated GIFs. Pick the right tool for your task or use the all-in-one Emote Optimizer.',
    },
    { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
  ],
  link: [
    { rel: 'canonical', href: 'https://emotesizer.com/tools' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'EmoteSizer GIF Tools',
        'url': 'https://emotesizer.com/tools',
        'description': 'A free, in-browser toolkit for editing, converting, and optimizing animated GIFs.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any (browser-based)',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
        // featureList kept short and human-readable to avoid keyword stuffing
        'featureList': [
          'Trim, crop, and resize animated GIFs',
          'Compress GIFs to platform file size limits',
          'Change GIF playback speed and loop count',
          'Rotate, flip, and reverse animations',
          'Convert between GIF, MP4, and PNG',
          'Add captions and meme text to GIFs',
          'Build GIFs from a sequence of images',
          'Runs entirely in the browser — no upload required',
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
            'name': 'Which tool should I use to make a Twitch emote?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'For a one-shot conversion from a GIF or image to a Twitch-ready emote, use the Emote Optimizer — it handles 28x28, 56x56, and 112x112 in a single export and applies Smart Compress automatically if the result exceeds 1 MB. Use the focused tools (resize, crop, compress) when you want manual control over a specific step.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Do I have to use the tools in a specific order?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No — every tool reads and writes a standard GIF, so you can chain them in any order that makes sense for your source material. That said, the order trim, crop, resize, compress tends to give the best output quality, because each step removes data the next step would otherwise have to operate on.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Can I use these tools on my phone?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. The tools are responsive and the underlying WebAssembly modules run on iOS Safari and Chrome on Android. Performance scales with your device — encoding a long GIF on a phone takes longer than on a laptop, but the workflow is identical.',
            },
          },
          {
            '@type': 'Question',
            'name': "What's the difference between the Optimizer and the individual tools?",
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'The Optimizer is opinionated: it picks resize mode, file-size target, and compression aggressiveness from the platform you choose. The individual tools are unopinionated — you set every parameter directly. Use the Optimizer when you want a finished emote in three clicks; use the individual tools when you want to inspect every intermediate result.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Are there any file size or quantity limits?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': "The upload size cap is 20 MB per file across the suite. There's no per-day quantity limit because nothing about your usage is metered server-side — you're rate-limited only by your own device's CPU and memory.",
            },
          },
          {
            '@type': 'Question',
            'name': 'Why do all these tools say "no upload to server"? How does that work?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Modern browsers ship with WebAssembly, OffscreenCanvas, and File System Access APIs powerful enough to run real image and video pipelines client-side. We compile FFmpeg and gifsicle to WebAssembly, fetch the wasm modules on first page load, and execute every encode in a worker thread on your device. The "Upload" button is technically a file picker that hands the bytes to the in-page worker — they never traverse the network.',
            },
          },
        ],
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
        ],
      }),
    },
  ],
})
</script>
