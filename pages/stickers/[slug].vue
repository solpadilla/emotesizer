<template>
  <ItemDetail content-type="stickers" :item="item" :is-loading="pending" />
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const klipy = useKlipy()

// ---------------------------------------------------------------------------
// Primary data fetch — MUST live in the page file (not a child component)
// so that Nuxt's SSR engine properly awaits it. This guarantees the OG meta
// tags are present in the server-rendered HTML for social crawlers.
// ---------------------------------------------------------------------------
const { data: item, pending } = await useAsyncData(
  `item-stickers-${slug}`,
  async () => {
    if (!slug) return null

    // First, try the dedicated items-by-slug endpoint
    let fetchedItem = await klipy.getItemBySlug('stickers', slug)

    // Fallback: search by slug words and find an exact slug match
    if (!fetchedItem) {
      const searchResponse = await klipy.search(
        'stickers',
        slug.replace(/-/g, ' '),
        1,
        24,
      )
      fetchedItem = searchResponse.data.data.find(g => g.slug === slug) || null
    }

    return fetchedItem || null
  },
)

// ---------------------------------------------------------------------------
// SEO head tags — in the page file so they resolve during SSR.
// The `key` on each meta ensures page-level tags override the global
// defaults from nuxt.config instead of duplicating them.
// ---------------------------------------------------------------------------
useHead(computed(() => {
  if (!item.value) {
    return { title: `${slug} — EmoteSizer` }
  }

  const sticker = item.value
  const canonicalUrl = `https://emotesizer.com/stickers/${sticker.slug}`
  const ogImage = sticker.file.md.gif.url
  const seoTitle = `${sticker.title} — Free Sticker for Twitch & Discord Emotes | EmoteSizer`
  const seoDescription = `Download and optimize "${sticker.title}" as a sticker emote for Twitch, Discord, or Kick. Free resize and compression — no signup required.`

  return {
    title: seoTitle,
    meta: [
      { key: 'description', name: 'description', content: seoDescription },
      { key: 'og:title', property: 'og:title', content: `${sticker.title} — Sticker for Streaming Emotes` },
      { key: 'og:description', property: 'og:description', content: `Optimize "${sticker.title}" for Twitch, Discord, or Kick emotes. Free browser-based sticker resizer.` },
      { key: 'og:image', property: 'og:image', content: ogImage },
      { key: 'og:image:width', property: 'og:image:width', content: String(sticker.file.md.gif.width) },
      { key: 'og:image:height', property: 'og:image:height', content: String(sticker.file.md.gif.height) },
      { key: 'og:url', property: 'og:url', content: canonicalUrl },
      { key: 'og:type', property: 'og:type', content: 'article' },
      { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
      { key: 'twitter:title', name: 'twitter:title', content: `${sticker.title} — Sticker for Streaming Emotes` },
      { key: 'twitter:description', name: 'twitter:description', content: seoDescription },
      { key: 'twitter:image', name: 'twitter:image', content: ogImage },
    ],
    link: [{ rel: 'canonical', href: canonicalUrl }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://emotesizer.com" },
            { "@type": "ListItem", "position": 2, "name": "Search Stickers", "item": "https://emotesizer.com/search?type=stickers" },
            { "@type": "ListItem", "position": 3, "name": sticker.title, "item": canonicalUrl },
          ],
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "name": sticker.title,
          "contentUrl": sticker.file.hd.gif.url,
          "thumbnailUrl": ogImage,
          "description": `${sticker.title} — sticker for use as a Twitch, Discord, or Kick emote.`,
          "width": sticker.file.hd.gif.width,
          "height": sticker.file.hd.gif.height,
        }),
      },
    ],
  }
}))
</script>
