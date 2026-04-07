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
      title: 'EmoteSizer — GIF Search & Emote Optimizer for Streamers',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Search thousands of GIFs and instantly resize them as emotes for Twitch, Discord, and Kick. Free browser-based emote optimizer — no signup required.' },
        { name: 'theme-color', content: '#3B82F6' },
        // Open Graph
        { property: 'og:title', content: 'EmoteSizer — GIF Search & Emote Optimizer' },
        { property: 'og:description', content: 'Find the perfect GIF and resize it as an emote for Twitch, Discord, or Kick. Optimized sizes, one click.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'EmoteSizer' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'EmoteSizer — GIF Search & Emote Optimizer' },
        { name: 'twitter:description', content: 'Find the perfect GIF and resize it as an emote for Twitch, Discord, or Kick. Optimized sizes, one click.' },
        { name: 'robots', content: 'index, follow' },
        { name: 'google-site-verification', content: '20jUiCMXIyvTrhO64y3O_irxwdikeqSwoH9hWHoixjs' },
        { property: 'og:url', content: 'https://emotesizer.com' },
        { property: 'og:image', content: 'https://emotesizer.com/og-image.png' },
        { name: 'twitter:image', content: 'https://emotesizer.com/og-image.png' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/icons/icon.svg',
        },
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          href: '/icons/icon.svg',
        },
      ],
      script: [
        {
          innerHTML: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'default';
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

  css: ['~/assets/css/main.css'],

  // Flatten the icons/ subdirectory so components inside it are auto-imported
  // without a directory prefix (e.g. <IconSearch /> instead of <IconsIconSearch />).
  components: [
    { path: '~/components/icons', pathPrefix: false },
    '~/components',
  ],

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
})
