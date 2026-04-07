# GIF Tool Project — Context & Research Summary

## How We Got Here

This project idea came out of a conversation exploring **passive income opportunities**. Here's the journey:

1. **Started with lo-fi 24/7 YouTube streams** — researched Lofi Girl's stats (15.7M subs, ~$4.5K–$25K/month declining revenue, flatlined growth). Concluded the space is oversaturated, low barrier to entry, and the income doesn't justify the effort for a new channel.

2. **Explored YouTube music copyright** — discovered there's no master list of allowed/banned music. YouTube's old Music Policies database was shut down in 2020. Content ID scans everything, and policies change constantly per rights holder. Video game music is also copyrighted — Nintendo is strict, some indie devs are lenient, but nothing is guaranteed.

3. **Pivoted to web-based passive income** — since the creator already knows how to code websites and has a live project (Halo Record, a Halo MCC stats tracker), web tools emerged as a better fit than content creation.

4. **Analyzed Halo Record's current analytics:**
   - 10,444 sessions / 166 users / 18,240 pageviews
   - 62.92 avg pages per session / 9m 21s avg session duration
   - Engagement is excellent, but user count is small and revenue is $0
   - Estimated ad revenue at current traffic: ~$18–$270/month depending on CPM and ad density

5. **Explored the web tools model** — building small, SEO-driven utility tools that rank on Google and earn through display ads. Long-tail keywords, stacking multiple tools, and targeting specific pain points.

6. **Landed on the GIF tool idea** — combining a GIF search engine (like Discord's) with Twitch/streaming optimization tools.

---

## The Project

### Name
TBD — needs a short, memorable domain

### Core Concept
A web app that lets users **search, discover, and optimize GIFs** for streaming platforms like Twitch, Discord, and Kick.

### Two Main Features

#### 1. GIF Search Engine
- Search across multiple GIF sources from a single interface (similar to Discord's GIF picker)
- Browse trending, categories, and reactions
- Preview GIFs before downloading or optimizing

#### 2. Twitch/Streaming GIF Optimizer
- Upload a GIF or send one directly from search results
- Automatically resize to platform-required dimensions
- Compress to meet file size limits
- Preview at actual display sizes (e.g., 28px chat size for Twitch)
- Download a zip with all required sizes

---

## Twitch Emote Requirements (Key Reference)

### Static Emotes
- **Format:** PNG with transparent background
- **Sizes:** 28x28, 56x56, 112x112 pixels (all three required)
- **Max file size:** 25KB per size

### Animated Emotes
- **Format:** GIF
- **Sizes:** 28x28, 56x56, 112x112 pixels (all three required)
- **Max file size:** 1MB per size (512KB for manual upload mode)
- **Max frames:** 60
- **Must loop smoothly**
- **Thumbnail defaults to first frame** (can override with custom static image)

### Subscriber Badges
- **Sizes:** 18x18, 36x36, 72x72 pixels
- **Different from emote sizes**

---

## GIF API Options

| Provider | Cost       | Status (as of early 2026)                        | Notes                                                    |
|----------|------------|--------------------------------------------------|----------------------------------------------------------|
| Tenor    | Free       | No longer accepting new API clients (Jan 2026)   | Google-owned, huge library, 35+ languages                |
| GIPHY    | Paid       | ~$9K/year for standard plan                      | Free beta key limited to 100 calls/hour                  |
| KLIPY    | Free       | Active and accepting developers                  | Built-in ad monetization with revenue share for devs     |

**KLIPY** looks like the best option — free API + potential revenue share from their ad model.

---

## SEO Strategy

### Target Keywords (High Intent, Low Competition)
- "twitch emote resizer"
- "gif to twitch emote"
- "compress gif for twitch"
- "twitch animated emote too large"
- "resize gif for twitch emote"
- "twitch emote file size too big"
- "discord emoji resizer"
- "kick emote size"
- "7tv emote resizer"
- "bttv emote upload size"

### Growth Strategy
- Start with the GIF optimizer (solves an immediate, searchable pain point)
- Add the GIF search feature for engagement and repeat visits
- Expand into related tools (Discord emoji sizer, Kick emotes, badge resizer, background remover)
- Each tool = a new page = a new keyword to rank for
- Stack tools over time to build domain authority
- Expect 3–6 months before meaningful organic traffic from Google

---

## Revenue Model

### Phase 1 — Display Ads
- Google AdSense or similar on tool pages
- Each page view during a resize/compress session = an ad impression
- Users viewing multiple tools per session = multiple impressions

### Phase 2 — KLIPY Revenue Share
- If using KLIPY's API, their built-in ads between GIF search results generate revenue shared with the developer

### Phase 3 — Premium Features (Optional, Future)
- Batch processing (resize 10+ emotes at once)
- Emote preview mockups (see how it looks in actual Twitch chat)
- Priority processing or higher quality compression
- Emote set management (save and organize emote collections)

---

## Competitive Landscape

There are existing emote resizer tools (emoteresizer.net, MakeEmoji, TacticalLionDesigns), but most are:
- Single-purpose (resize only, no search)
- Basic UI with no GIF search integration
- Not combining discovery + optimization in one flow

**The differentiator:** combining GIF search/discovery with platform-specific optimization in a single, polished tool. Nobody is doing the "Discord-style GIF search → one-click Twitch optimize" flow.

---

## Existing Skills & Assets

- **Web development experience** (can build the frontend and backend)
- **Live project** — Halo Record (halorecord.com) demonstrates ability to ship and maintain a web app
- **Understanding of the gaming/streaming community** — knows the audience and their pain points firsthand

---

## Next Steps

1. Choose a domain name
2. Investigate KLIPY API access and integration
3. Build MVP — GIF upload → Twitch resize/compress → download zip
4. Add GIF search functionality
5. Basic SEO setup (meta tags, clean URLs, descriptive content on each tool page)
6. Launch and share in streaming communities (Reddit, Discord, Twitter)
7. Monitor analytics and iterate
8. Add more tools over time (Discord, Kick, 7TV, BTTV, FFZ)
