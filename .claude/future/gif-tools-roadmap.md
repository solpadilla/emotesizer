# GIF Tools Roadmap

## Current Tools
- `/tools/compress` — GIF compression (smart + manual, 11 strategies)
- `/tools/resize` — GIF resizing (platform presets, custom dimensions, crop/pad/stretch modes)
- `/tools/trim` — GIF trimming (cut frames from start/end)
- `/tools/gif-to-png` — GIF to PNG frame picker + static export
- `/tools/speed` — GIF speed changer (Speed/FPS/Duration modes, 0.1x–8x range, side-by-side preview)
- `/tools/reverse` — GIF reverse & boomerang (ping-pong loops, speed control, tool chaining)
- `/tools/crop` — GIF cropping (interactive canvas, 10 aspect ratios, autocrop, file size display)
- `/tools/rotate` — GIF rotate & flip (0°/90°/180°/270° rotation, horizontal/vertical flip, CSS preview)
- `/tools/loop` — GIF loop changer (Infinite/Once/2x/3x/5x/10x/Custom, canvas preview with loop count)
- `/tools/video-to-gif` — Video to GIF converter (FFmpeg.wasm, trim, FPS, width, quality, loop count, color count)
- `/tools/gif-to-mp4` — GIF to MP4 converter (FFmpeg.wasm, CRF quality presets, 80-90% size reduction)

## Features in Optimizer Not Yet Standalone
- **Platform-aware optimization** — optimizer targets specific platforms (Twitch animated/static/badges, Discord, Kick, 7TV, BTTV, FFZ, YouTube) with multi-size output
- **Twitch sub badge support** — 18x18, 36x36, 72x72 badge presets

## Remaining Tools

### GIF Maker (from images)
- **Search volume**: High (~50K/mo for "gif maker")
- **Effort**: Medium
- **How**: Upload multiple images, set frame delays, combine into animated GIF via modern-gif encode
- **Competitors**: GIPHY, Imgflip, Kapwing, Canva, Pi7

## Medium Value

### GIF to WebP Converter
- **Search volume**: Medium-High
- **Effort**: Medium — WebP encoding via canvas API or libwebp-wasm
- **How**: Decode GIF frames, encode to animated WebP; WebP is 25-75% smaller than GIF
- **Competitors**: ezgif, FreeConvert, Kapwing, RedKetchup

### WebP to GIF Converter
- **Search volume**: Medium
- **Effort**: Medium — decode WebP frames via canvas, re-encode as GIF
- **Competitors**: ezgif, CloudConvert, Kapwing, GIFSpeed

### Add Text to GIF
- **Search volume**: Medium
- **Effort**: High — canvas text rendering per frame, font selection, positioning UI
- **How**: Render text overlay onto each frame via canvas, re-encode
- **Competitors**: ezgif, Kapwing, Pi7, Imgflip, GIFSpeed

## Lower Priority / Niche

### GIF to APNG Converter
- **Search volume**: Low-Medium
- **Effort**: Moderate — needs APNG encoder library
- **Note**: APNG supports better color depth and transparency than GIF

### GIF to Sprite Sheet
- **Search volume**: Low (niche for game developers)
- **Effort**: Low — extract frames, tile onto single canvas

### GIF Metadata Analyzer
- **Search volume**: Low
- **Effort**: Low — parse GIF binary format, display frame count, dimensions, delays, color tables

### Screen to GIF
- **Search volume**: Low-Medium
- **Effort**: Medium — use MediaRecorder API + canvas
- **Note**: Kapwing has this

## Recommended Build Order

### Phase 1 — Next up
1. GIF Maker (from images)

### Phase 2 — Format converters
2. GIF to WebP
3. WebP to GIF

### Phase 3 — Creative tools
4. Add Text to GIF
5. GIF to APNG
