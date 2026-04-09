# GIF Tools Roadmap

## Current Tools
- `/tools/compress` — GIF compression (smart + manual, 11 strategies)
- `/tools/resize` — GIF resizing (platform presets, custom dimensions, crop/pad/stretch modes)
- `/tools/trim` — GIF trimming (cut frames from start/end)
- `/tools/gif-to-png` — GIF to PNG frame picker + static export
- `/tools/speed` — GIF speed changer (Speed/FPS/Duration modes, 0.1x–8x range, side-by-side preview)
- `/tools/reverse` — GIF reverse & boomerang (ping-pong loops, speed control, tool chaining)

## Features in Optimizer Not Yet Standalone
- **Platform-aware optimization** — optimizer targets specific platforms (Twitch animated/static/badges, Discord, Kick, 7TV, BTTV, FFZ, YouTube) with multi-size output
- **Twitch sub badge support** — 18x18, 36x36, 72x72 badge presets

## Quick Wins (low effort, gifsicle-wasm already available)

### GIF Crop
- **Search volume**: Medium-High
- **Effort**: Low — gifsicle-wasm supports cropping directly
- **How**: Let user draw crop region, apply via gifsicle `--crop x1,y1-x2,y2`
- **Note**: Distinct from resize (crop = cut a region; resize = scale dimensions)
- **Competitors**: ezgif, Kapwing, Pi7, RedKetchup

### Rotate/Flip GIF
- **Search volume**: Medium
- **Effort**: Low — canvas transform or gifsicle
- **How**: Rotate 90/180/270 degrees, flip horizontal/vertical via canvas transforms per frame
- **Competitors**: ezgif, Kapwing, VEED, GIFSpeed

### GIF Loop Changer
- **Search volume**: Medium-Low
- **Effort**: Very Low — modify loop count in GIF header
- **How**: Modify Netscape Application Extension loop count byte; gifsicle supports `--loopcount=N`
- **Competitors**: GIFSpeed, ezgif

### GIF Frame Extractor / Splitter
- **Search volume**: Medium
- **Effort**: Low — decode frames, export as PNGs
- **How**: Decode GIF frames with modern-gif, render each to canvas, export as individual PNGs (zip download)
- **Keywords**: "gif to png", "gif splitter", "extract frames from gif"
- **Competitors**: ezgif, GIFSpeed, Kapwing

## High Traffic (bigger effort, needs FFmpeg.wasm ~25MB)

### Video to GIF / MP4 to GIF
- **Search volume**: Very High (~116K/mo for "mp4 to gif")
- **Effort**: High — requires FFmpeg.wasm
- **How**: Decode video frames via FFmpeg.wasm, encode to GIF with frame rate/quality controls
- **Note**: Highest-traffic GIF tool keyword in existence
- **Competitors**: ezgif (#1 rank), Canva, Adobe Express, VEED, Kapwing, CloudConvert

### GIF to MP4/Video
- **Search volume**: Very High
- **Effort**: High — requires FFmpeg.wasm
- **How**: Decode GIF frames, encode to MP4 via FFmpeg.wasm; MP4 is 80-90% smaller than GIF
- **Competitors**: ezgif, Canva, VEED, Kapwing, CloudConvert

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

### Phase 1 — Quick wins (use existing gifsicle-wasm)
1. GIF Crop
2. Rotate/Flip GIF
3. GIF Frame Extractor
4. GIF Loop Changer

### Phase 2 — High-traffic tools (add FFmpeg.wasm)
5. Video to GIF (MP4 to GIF)
6. GIF to MP4/Video
7. GIF Maker (from images)

### Phase 3 — Format converters
8. GIF to WebP
9. WebP to GIF

### Phase 4 — Creative tools
10. Add Text to GIF
11. GIF to APNG
