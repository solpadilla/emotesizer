// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-14',
  devtools: { enabled: true },

  // Disable experimental app manifest to prevent #app-manifest resolution errors
  // This is a known issue with Nuxt 3.19+ that can cause 404 errors in dev mode
  experimental: {
    appManifest: false,
  },

  // KLIPY API key is client-side (public) by design — the KLIPY free tier
  // is intended for client-side use. For production, consider server-side
  // proxying if rate limiting per-app is needed.
  runtimeConfig: {
    public: {
      klipyApiKey: process.env.KLIPY_API_KEY || '',
      klipyApiBaseUrl: process.env.KLIPY_API_BASE_URL || 'https://api.klipy.com/api/v1',
    },
  },

  app: {
    head: {
      title: 'EmoteSizer — GIF & Sticker Search + Emote Optimizer for Streamers',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { key: 'description', name: 'description', content: 'Free emote maker, gif compressor, and gif editor — search GIFs and stickers, compress and resize them as emotes for Twitch, Discord, Kick, 7TV, BTTV, and FFZ. No signup required.' },
        { name: 'theme-color', content: '#3B82F6' },
        // Open Graph — keys allow page-level useHead to override these defaults
        { key: 'og:title', property: 'og:title', content: 'EmoteSizer — GIF & Sticker Search + Emote Optimizer' },
        { key: 'og:description', property: 'og:description', content: 'Free emote maker — find the perfect GIF or sticker and resize it as an emote for Twitch, Discord, Kick, 7TV, BTTV, and FFZ.' },
        { key: 'og:type', property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'EmoteSizer' },
        // Twitter — keys allow page-level useHead to override these defaults
        { key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
        { key: 'twitter:title', name: 'twitter:title', content: 'EmoteSizer — GIF & Sticker Search + Emote Optimizer' },
        { key: 'twitter:description', name: 'twitter:description', content: 'Free emote maker — find the perfect GIF or sticker and resize it as an emote for Twitch, Discord, Kick, 7TV, BTTV, and FFZ.' },
        { name: 'robots', content: 'index, follow' },
        { name: 'google-site-verification', content: '20jUiCMXIyvTrhO64y3O_irxwdikeqSwoH9hWHoixjs' },
        { key: 'og:url', property: 'og:url', content: 'https://emotesizer.com' },
        { key: 'og:image', property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
        { key: 'twitter:image', name: 'twitter:image', content: 'https://emotesizer.com/og-image.png' },
      ],
      link: [
        // Google Search favicon: Google requires >= 48x48 px, PNG or ICO.
        // The 96x96 PNG is the primary icon for Google (multiple of 48).
        // The ICO at /favicon.ico is Google's ultimate fallback path.
        // SVG is listed last — browsers that support it will prefer it,
        // but Google's crawler ignores SVG favicons entirely.
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          href: '/icons/favicon-96x96.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '48x48',
          href: '/icons/favicon-48x48.png',
        },
        {
          rel: 'icon',
          sizes: '48x48',
          href: '/favicon.ico',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/icons/favicon.svg',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/icons/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/icons/site.webmanifest',
        },
      ],
      script: [
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5451666136881781',
          async: true,
          crossorigin: 'anonymous',
        },
        {
          innerHTML: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'midnight';
                var validThemes = ['default', 'midnight'];
                if (!validThemes.includes(theme)) {
                  theme = 'default';
                }
                document.documentElement.setAttribute('data-theme', theme);
                var darkThemes = ['midnight'];
                if (darkThemes.includes(theme)) {
                  document.documentElement.classList.add('dark');
                }
                var bgColors = {
                  'default': '#f9fafb',
                  'midnight': '#0f172a'
                };
                document.documentElement.style.backgroundColor = bgColors[theme] || '#f9fafb';
              } catch (e) {}
            })();
          `,
          type: 'text/javascript',
        },
      ],
    },
  },

  // FFmpeg.wasm requires SharedArrayBuffer, which needs Cross-Origin-Opener-Policy
  // and Cross-Origin-Embedder-Policy headers. Using "credentialless" for COEP
  // instead of "require-corp" to avoid breaking third-party resources (AdSense,
  // CDN scripts) that don't set Cross-Origin-Resource-Policy headers.
  // "credentialless" still enables SharedArrayBuffer in Chrome/Edge 96+.
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'credentialless',
        },
      },
    },
  },

  // Exclude @ffmpeg/ffmpeg and @ffmpeg/util from Vite's dep optimizer.
  // FFmpeg.wasm uses a Web Worker internally that Vite cannot pre-bundle,
  // producing a "worker.js?worker_file&type=module does not exist" warning.
  // These packages are designed to load as native ESM (WASM core fetched
  // from CDN at runtime), so pre-bundling is unnecessary.
  vite: {
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  },

  css: ['~/assets/css/main.css'],

  // Flatten the icons/ subdirectory so components inside it are auto-imported
  // without a directory prefix (e.g. <IconSearch /> instead of <IconsIconSearch />).
  components: [
    { path: '~/components/icons', pathPrefix: false },
    '~/components',
  ],

  site: {
    url: 'https://emotesizer.com',
  },

  // @nuxtjs/sitemap v8 — the third-party KLIPY-sourced detail pages under
  // /gifs/** and /stickers/** contain no original editorial content, so we
  // exclude them from the sitemap to keep Google's index focused on our
  // tool pages and editorial content (AdSense "low value content" policy).
  // The dynamic pages also carry a `robots: noindex, follow` page meta
  // for defense in depth.
  sitemap: {
    exclude: [
      '/gifs/**',
      '/stickers/**',
      // /search renders mostly third-party KLIPY media with minimal original
      // editorial; excluded from sitemap and noindexed at the page level
      // so it's not a candidate for "low value content" flags.
      '/search',
    ],
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/sitemap',
  ],
})
