const sharp = require('sharp');

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Aurora glow blur -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80" />
    </filter>

    <!-- Brand gradient for the accent line -->
    <linearGradient id="accent-line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>

  <!-- Layer 1: Deep background -->
  <rect width="${width}" height="${height}" fill="#080D1B"/>

  <!-- Layer 2: Aurora glow — three soft blurred ellipses -->
  <!-- Primary blue glow, left-center -->
  <ellipse cx="440" cy="280" rx="320" ry="220" fill="#3B82F6" opacity="0.18" filter="url(#glow)"/>
  <!-- Accent teal glow, right-center -->
  <ellipse cx="760" cy="350" rx="280" ry="200" fill="#14B8A6" opacity="0.15" filter="url(#glow)"/>
  <!-- Deep indigo accent, top-right -->
  <ellipse cx="850" cy="180" rx="200" ry="160" fill="#6366F1" opacity="0.10" filter="url(#glow)"/>

  <!-- Layer 4: Wordmark — the hero, centered -->
  <text x="597" y="310" text-anchor="end"
        font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
        font-weight="800" font-size="96"
        fill="#3B82F6">Emote</text>
  <text x="603" y="310" text-anchor="start"
        font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
        font-weight="800" font-size="96"
        fill="#14B8A6">Sizer</text>

  <!-- Layer 5: Accent gradient line (brand flourish) -->
  <rect x="520" y="330" width="160" height="3" rx="1.5" fill="url(#accent-line)"/>

  <!-- Layer 6: Tagline -->
  <text x="600" y="370"
        text-anchor="middle"
        font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
        font-weight="500" font-size="24"
        letter-spacing="0.5"
        fill="#94A3B8">GIF Search &amp; Emote Optimizer for Streamers</text>

  <!-- Layer 7: Domain -->
  <text x="600" y="580"
        text-anchor="middle"
        font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
        font-weight="600" font-size="18"
        letter-spacing="1.5"
        fill="#475569">emotesizer.com</text>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(svg))
    .png()
    .toFile('./public/og-image.png');
  console.log('OG image generated at public/og-image.png');
}

generate().catch(console.error);
