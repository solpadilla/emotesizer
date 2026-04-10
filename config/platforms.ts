import type { Platform } from '~/types/optimizer'

export const platforms: Platform[] = [
  {
    id: 'twitch-animated',
    name: 'Twitch Animated Emote',
    icon: 'twitch',
    sizes: [112],
    maxFileSize: '1 MB',
    maxFileSizeBytes: 1048576,
    format: 'GIF',
    maxFrames: 60,
    sizesLabel: '112px (Twitch auto-resizes)',
    description: 'Upload one square GIF, 112\u20134096px. Twitch generates 28/56/112px sizes automatically.',
    chatDisplaySizes: [
      { label: 'Inline chat', size: 28, context: 'Standard chat message' },
    ],
  },
  {
    id: 'twitch-static',
    name: 'Twitch Static Emote',
    icon: 'twitch',
    sizes: [112],
    maxFileSize: '1 MB',
    maxFileSizeBytes: 1048576,
    format: 'PNG',
    maxFrames: 1,
    sizesLabel: '112px (Twitch auto-resizes)',
    description: 'Upload one square PNG, 112–4096px. Twitch generates 28/56/112px sizes automatically.',
    chatDisplaySizes: [
      { label: 'Inline chat', size: 28, context: 'Standard chat message' },
    ],
  },
  {
    id: 'twitch-badge',
    name: 'Twitch Sub Badge',
    icon: 'twitch',
    sizes: [18, 36, 72],
    maxFileSize: '25 KB',
    maxFileSizeBytes: 25600,
    format: 'PNG',
    maxFrames: 1,
    description: 'Upload all three sizes separately. Twitch does not auto-resize badges.',
    chatDisplaySizes: [
      { label: 'Chat badge', size: 18, context: 'Next to username' },
    ],
  },
  {
    id: 'discord-emoji',
    name: 'Discord Emoji',
    icon: 'discord',
    sizes: [128],
    maxFileSize: '256 KB',
    maxFileSizeBytes: 262144,
    format: 'GIF / PNG',
    maxFrames: null,
    chatDisplaySizes: [
      { label: 'Inline chat', size: 22, context: 'Within a text message' },
      { label: 'Emoji-only message', size: 48, context: 'When the message is only emoji' },
    ],
  },
  {
    id: 'kick-emote',
    name: 'Kick Emote',
    icon: 'kick',
    sizes: [500],
    sizesLabel: '500px (Kick auto-resizes)',
    maxFileSize: '1 MB',
    maxFileSizeBytes: 1048576,
    format: 'GIF / PNG',
    maxFrames: null,
    description: 'Upload one square image up to 500x500px. Kick generates 32/64/128px sizes automatically.',
    chatDisplaySizes: [
      { label: 'Inline chat', size: 28, context: 'Standard chat message' },
    ],
  },
]

export type { Platform }
