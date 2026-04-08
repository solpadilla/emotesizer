# GIF Tools Roadmap

## Current Tools
- `/tools/compress` — GIF compression (smart + manual, 11 strategies)
- `/tools/resize` — GIF resizing (platform presets, custom dimensions)
- `/tools/trim` — GIF trimming (cut frames from start/end)

## Features in Optimizer Not Yet Standalone
- **GIF to PNG** — frame picker + static export (optimizer has this via FramePicker component)
- **Crop/Pad/Stretch resize modes** — optimizer supports fill & crop, fit & pad, stretch; standalone resize only does direct scaling
- **Platform-aware optimization** — optimizer targets specific platforms (Twitch animated/static/badges, Discord, Kick, 7TV, BTTV, FFZ, YouTube) with multi-size output
- **Twitch sub badge support** — 18x18, 36x36, 72x72 badge presets

## Quick Wins (low effort, gifsicle-wasm already available)

### GIF Speed Changer
- **Search volume**: Medium-High (10K-50K/mo)
- **Effort**: Low — modify frame delay values
- **How**: Use gifsicle-wasm to adjust delays, or decode/re-encode with modified delay per frame
- **Competitors**: ezgif, gifspeed.com, Kapwing, VEED

### Reverse GIF
- **Search volume**: Medium
- **Effort**: Very Low — reverse frame order
- **How**: Decode frames, reverse array, re-encode
- **Competitors**: ezgif, GIFSpeed, Kapwing, Imgflip

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
1. GIF Speed Changer
2. Reverse GIF
3. GIF Crop
4. Rotate/Flip GIF
5. GIF Frame Extractor
6. GIF Loop Changer

### Phase 2 — Standalone versions of optimizer features
7. GIF to PNG (standalone frame picker)

### Phase 3 — High-traffic tools (add FFmpeg.wasm)
8. Video to GIF (MP4 to GIF)
9. GIF to MP4/Video
10. GIF Maker (from images)

### Phase 4 — Format converters
11. GIF to WebP
12. WebP to GIF

### Phase 5 — Creative tools
13. Add Text to GIF
14. GIF to APNG
