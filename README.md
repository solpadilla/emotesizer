# EmoteSizer

A free, browser-based emote maker and GIF toolkit for streamers. Search thousands of GIFs and stickers, then resize, crop, compress, trim, and convert them into emotes for Twitch, Discord, Kick, 7TV, BTTV, and FFZ — without uploading a single byte to a server.

Live site: **[emotesizer.com](https://emotesizer.com)**

---

## What it does

EmoteSizer is a single-page-feel app built on Nuxt 3 that bundles a content discovery experience with a full GIF/video processing pipeline. Everything runs locally in the user's browser via WebAssembly, so the user's media never leaves their device.

Tools shipped:

- **Compress, Resize, Crop, Trim, Rotate** — GIF editing primitives tuned for the size limits of each streaming platform
- **Speed, Reverse, Loop** — playback transformations
- **GIF → MP4, GIF → PNG, Video → GIF, GIF Maker** — format conversions
- **Add Text to GIF** — full text editor with positioning, styling, and per-frame rendering

Plus search/browse pages backed by the KLIPY API and SEO-friendly detail pages.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Nuxt 3** + Vue 3 (Composition API) | File-based routing, auto-imports, SSR for SEO, hybrid rendering |
| Language | **TypeScript** | Strict typing across composables, stores, and components |
| State | **Pinia** | Stores for theme + search; preferred over Vuex for typing and modularity |
| Styling | **TailwindCSS** | Utility-first; custom theme tokens for light + "midnight" dark mode |
| Media processing | **FFmpeg.wasm** + **gifsicle-wasm** + **modern-gif** | Right tool per job — FFmpeg for video/encoding, gifsicle for GIF-native ops |
| Image server-side | **Sharp** | Used at build time for asset optimization |
| Packaging | **JSZip** | Client-side ZIP for batch downloads |
| API | **KLIPY** (GIF/sticker search) | Free tier suitable for client-side use |
| SEO | **@nuxtjs/sitemap** + structured metadata | Selective sitemap exclusion to keep AdSense quality signals high |

---

## Engineering highlights

A few decisions in this codebase that go beyond a typical Nuxt template:

### 1. Browser-only video pipeline with SharedArrayBuffer

FFmpeg.wasm requires `SharedArrayBuffer`, which only works when the page sets cross-origin isolation headers. The app sets:

```ts
// nuxt.config.ts
'Cross-Origin-Opener-Policy': 'same-origin',
'Cross-Origin-Embedder-Policy': 'credentialless',
```

`credentialless` (rather than `require-corp`) was chosen deliberately — it enables `SharedArrayBuffer` in modern Chromium browsers while still permitting third-party resources (AdSense, CDN scripts) that don't ship CORP headers. This was the only way to keep monetization working alongside in-browser FFmpeg.

### 2. SSR-safe dynamic loading of WASM

All `@ffmpeg/*` imports are dynamic. A top-level import would crash Nuxt's SSR pass since the FFmpeg class only exists in a browser context. Loading is wrapped with a 30s timeout, progress reporting, and lifecycle state (`idle | loading | palette | encoding | done`) exposed via a composable for any tool to consume.

### 3. Component auto-import flattening

Icon components live in `components/icons/` but are auto-imported without the directory prefix:

```ts
components: [
  { path: '~/components/icons', pathPrefix: false },
  '~/components',
]
```

So `<IconSearch />` works directly instead of `<IconsIconSearch />`. Small ergonomic win that compounds across hundreds of usages.

### 4. FOUC-free theming

A pre-hydration inline script in `nuxt.config.ts` reads the persisted theme from `localStorage`, applies the `data-theme` attribute, toggles the `dark` class, and sets `document.documentElement.style.backgroundColor` — all before Vue hydrates. Eliminates the white-flash that hits most SSR apps on load.

### 5. SEO discipline for AdSense

KLIPY-sourced detail pages (`/gifs/**`, `/stickers/**`) carry no original editorial content, which trips Google's "low-value content" classifier. They're excluded from the sitemap and carry a `robots: noindex, follow` meta tag — defense in depth so the index stays focused on tool pages and original content.

### 6. Privacy as architecture

There is no upload endpoint. There is no user account system. There is no analytics on user-uploaded media. The processing model is the privacy story — it's not a policy promise, it's a structural one.

---

## Project structure

```
.
├── components/         Vue components (auto-imported, with icons/ flattened)
├── composables/        useFFmpeg, useGifOptimizer, useKlipy, useTheme, ...
├── pages/              File-based routes: /, /optimizer, /search, /tools/*
│   ├── tools/          13 tool pages (compress, resize, crop, trim, ...)
│   ├── gifs/[slug].vue Dynamic GIF detail (noindex)
│   └── stickers/[slug].vue
├── stores/             Pinia stores (search, theme)
├── utils/              Pure helpers (format, url)
├── types/              Shared TypeScript types
├── assets/css/         Tailwind entry + theme tokens
├── public/             Static assets (icons, OG image, manifest)
├── layouts/            Default layout (sidebar + bottom bar)
└── nuxt.config.ts      App head, headers, modules, sitemap, Vite tweaks
```

---

## Getting started

**Requirements:** Node 18+, a `KLIPY_API_KEY` (free at [klipy.com](https://klipy.com)).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# edit .env and set KLIPY_API_KEY

# 3. Run
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # Production build (Nitro server)
npm run generate     # Static export
npm run preview      # Preview production build locally
```

---

## Notable trade-offs

- **KLIPY key lives in the client bundle, by design.** KLIPY (like GIPHY and Tenor) issues a public *app key* meant for direct browser use — it identifies the app for rate-limiting and analytics, not a user, and grants no access to anything private. Putting it client-side keeps the site fully static-deployable on a CDN with no Node runtime in the request path. If the project ever moved to a paid tier or hit abuse-driven rate limits, a thin `/server/api/klipy.ts` proxy (with the key moved out of `runtimeConfig.public`) is the obvious upgrade.
- **No test suite in this repo.** This was a solo product project optimized for shipping speed; in a team setting the FFmpeg composable and tool pages would be the highest-value targets for Vitest + Playwright.
- **Vite dep optimizer excludes FFmpeg packages.** Pre-bundling them produces a "worker.js does not exist" warning because of how FFmpeg.wasm spawns its internal worker. They load fine as native ESM, so they're left out of the optimizer.

---

## License

This repository is published for portfolio / review purposes. Please reach out before reusing substantial portions in a commercial product.
