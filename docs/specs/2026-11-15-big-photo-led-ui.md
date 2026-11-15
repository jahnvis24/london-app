# Spec: make cuRATED feel big and photo-led

**Status:** draft. Waiting on the owner's answers to the open questions at the end.
**Date:** 2026-11-15
**Owner:** the app owner. The work is done by whichever laptop picks it up.

## 1. The problem

The owner says the app "feels small". Apps like Yonder feel nicer because their images are big. Looking through `src/App.jsx`, that feeling comes from three measurable things:

1. **The photos are small.** On a standard 390px-wide phone, most venue photos use well under half the screen width:

   | Where | Photo size today | Share of screen width |
   |---|---|---|
   | Discover: Trending cards | 160 × 206 | 41% |
   | Discover: "Because you like" rows | 90 × 90, and some at 38 × 38 | 23% / 10% |
   | Spot page hero | 380 tall | full width, but only about 45% of the screen height |
   | Plan result: stops | **no photo**, just an icon square | 0% |
   | Plans list: cover | 180 tall, with 36px thumbnails | full width / 9% |
   | Saves: Recently saved | 130 × 130 | 33% |
   | Saves: rows inside a list | 64 × 64 and 44 × 44 | 16% / 11% |
   | People feed: single save | 64 × 64 | 16% |
   | People feed: "saved 6 places" | 4 squares of about 80px | 20% each |
   | People feed: "You & X both saved" | 52 × 52 | 13% |

2. **The text is tiny.** About 125 pieces of text in the app are 10px or smaller (sizes 8, 8.5, 9, 9.5 and 10), mostly uppercase labels. Small type makes the whole interface look shrunk, even where the layout itself is fine.

3. **Lots of small things compete.** Screens stack many small cards, chips and labels of similar weight. Nothing is clearly the main thing, so the eye has nowhere to land.

There's also a technical limit to fix before photos get bigger: **stored photos are only 600–800px wide** (`maxWidthPx=800` or `maxwidth=600` when fetched). A full-width photo on a modern phone needs about 1,170px to look sharp.

## 2. The goal

The owner's words: the app already "feels nice", but Yonder feels **aesthetic, photo-led and luxury**. The aim is to keep what's nice and add those three qualities.

| Quality | What makes an app feel this way | Where cuRATED stands today |
|---|---|---|
| **Photo-led** | Photos are the biggest thing on every screen, and the interface sits on top of them or steps back around them | Photos are thumbnails, and the interface is the biggest thing |
| **Aesthetic** | A small, consistent set of elements: one display font used large, a quiet colour palette, lots of empty space, nothing decorative that doesn't earn its place | Many badges, chips, labels and tag colours per screen, and tight spacing |
| **Luxury** | Restraint and confidence: fewer items shown bigger, no rush to show everything, slow and smooth motion, nothing shouty (no "Trending" stickers on every card, no emojis, no exclamation marks) | Lots of information per card, small badges on most photos, quick animations |

The app should feel like flicking through a magazine, not reading a directory.

**Success looks like this:**
- The owner and five or so friends say it feels bigger and nicer, comparing old and new screenshots side by side.
- Discover → spot page opens and saves per session hold steady or go up. Mixpanel already tracks both.
- Nothing gets slower: Discover's first photo shows in under 1.5 seconds on 4G.

## 3. Design rules (apply on every screen)

1. **One hero per screen.** Each screen has one clearly biggest element, usually a photo at least 60% of the screen width.
2. **Fewer, bigger items.** For example, a carousel shows about 1.2 cards rather than 2.4. Swap long lists of small rows for fewer big cards, and keep a compact view for power users where it's needed (for example, Saves).
3. **Edge-to-edge where it counts.** The spot page hero and the Discover hero card run to the screen edge or close to it, with 16px gutters for photo cards instead of 22px.
4. **Minimum text size of 11px.** The new type scale:

   | Role | Size today | New size |
   |---|---|---|
   | Small labels and badges | 8–10px | 11px, uppercase, letter-spacing 0.1em |
   | Meta lines (area · price) | 11–12px | 13px |
   | Body | 13px | 15px |
   | Card titles | 19–21px | 22–24px |
   | Tab titles (Unbounded) | 30px | stays 30px |

5. **Text on photos, not under them.** Put the name and area over a dark gradient on the photo so the photo can take the full card. Only Trending does this today.
6. **Shapes stay as agreed.** Cards and photos have 14px corners, small squares 11px, buttons and tags 8px soft rectangles.

**Rules for the luxury feel:**

7. **More empty space.** Leave 40px between sections instead of today's 18–26px, and give each card room. When a screen feels busy, take things away rather than shrink them.
8. **Use badges sparingly.** Today almost every photo has a sticker (Trending, Top pick, celebrity, rating). Show at most one per screen, and only where it matters, such as a friend saving it. Ratings move off the photo into the info line.
9. **Fewer elements on each card.** A photo card shows the name, a single line of area · price, and a save heart. Tags, vibe scores and extra pills move to the spot page.
10. **One display font, used big.** Instrument Serif for venue names at 24–34px, Unbounded only for the logo and tab titles, and DM Sans for everything else. No other weights or styles.
11. **Quiet colour.** Most of each screen is cream, photos and black cherry text. Oxblood is for the main action, and arctic blue only for tags and small accents. Never more than two accent colours visible at once.
12. **Photos treated the same way.** No borders or drop shadows on photos. Use the same 14px corners everywhere, and the same dark gradient behind text. Consider a very light warm grade on all photos so they look like one set.
13. **Slow, smooth motion.** Photos fade in over 300ms as they load, screens slide with a gentle ease, and nothing bounces.
14. **Plain, confident words.** Short headings ("Tonight's pick", "Your saves"), with no emojis, no exclamation marks and no "✦" decorations.

## 4. Screen by screen

Sizes assume a 390px-wide phone. Use aspect ratios rather than fixed heights so it scales.

### Discover
- **New "Tonight's pick" hero card** directly under the logo and date: full width minus 16px gutters (358px), 4:5 ratio (about 448px tall). One venue, chosen like Trending. Name in Instrument Serif at 30px over the photo, with area, price and a Save button.
- **Build me a night out** block and the **Swipe to discover** card stay. They move below the hero.
- **Trending cards:** 160 × 206 → **280 × 350** (4:5), about 1.2 cards visible so the next one peeks in.
- **"Because you like" list:** 90px squares → **full-width 16:10 cards**, three of them, with a "See all" link.

### Spot page
- **Hero:** 380px → **62% of the screen height** (about 520px), edge to edge, swipeable when there are several photos, with page dots.
- Name over the bottom of the photo in Instrument Serif at 34px, with the info block under it as now.

### Plan result
- **Each stop gets its photo:** a 16:9 photo at the top of every stop card, full card width (about 358 × 200), with the time and type over it. The outline icon stays as the fallback when there's no photo.
- **Plan hero:** add a cover photo collage made from the stops, one large image and two small, about 300px tall, above the title.

### Plans list
- **Plan cards:** 180px cover → **4:5 cover cards** (358 × 448), with the plan title and date over the photo, shown one per row.
- **Stop thumbnails** inside a card: 36px → 56px.

### Saves
- **Recently saved:** 130 × 130 → **200 × 250** (4:5).
- **List tiles:** each tile 1.3× bigger, with fewer per row in grid view: two columns, collage height 175 → 220.
- **Rows inside a list:** 64px → 96px thumbnails in list view. Add a **"big" view toggle** that shows full-width 4:3 photo cards. The existing grid/list toggle becomes grid/big.

### People feed
- **Single save:** 64px thumbnail → **full-width 4:3 photo card**, with the friend's avatar and "Sahil saved" over the top.
- **"Saved 6 places":** 4 small squares → **one big photo (2/3 width) plus two stacked small ones**, plus a "+3" tile. No names, as already agreed.
- **"You & X both saved":** stays compact as just agreed (the owner asked for it smaller). Thumbnail stays 52px.

### Everywhere
- Apply the type scale from section 3.
- **Loading placeholders** are the same size and shape as the photo, in sand `#F1EDE4`, so the layout doesn't jump.

## 5. Technical work

1. **Sharper photos:** re-fetch the catalogue photos at `maxWidthPx=1200` with Places API (New), using `scripts/backfill-photos.mjs` with a `--width` flag. Re-upload them to Vercel Blob. About 1,000 venues makes about 1,000 Places Photo calls; check the cost before running.
2. **Use the New Places API in the API routes too.** `api/venue-photo.mjs` and `api/saved-tools.mjs` still use the old `maps/api/place/photo?maxwidth=600` endpoint, which breaks the CLAUDE.md rule. Move them to the New format at 1200px.
3. **Speed:** add `loading="lazy"` and `decoding="async"` to every image below the fold. Keep the Discover hero `eager`. Set `aspect-ratio` on photo boxes so nothing jumps while loading.
4. **No new libraries.** It's all inline styles in `App.jsx`, as now.

## 6. How we roll it out

| Phase | What | Check before moving on |
|---|---|---|
| 0 | Mock the new Discover, spot page, plan and feed on the brand board, next to the current screens | Owner signs off on the look |
| 1 | Sharper photos (technical work items 1 and 2) | Spot-check 20 venues on a phone |
| 2 | Type scale across the app | Screenshots of every tab |
| 3 | Discover and spot page | Owner and friends test it |
| 4 | Plan result and plans list | Make two plans and check them |
| 5 | Saves and People | Check with real lists and a friend |

Each phase is its own commit and push, so the two laptops stay in sync.

## 7. Open questions for the owner

1. **What exactly do you like about Yonder?** The answer so far is "aesthetic, photo-led, luxury". Two or three screenshots would still help pin down which screens.
1b. **Badges:** OK to remove most "Trending" / "Top pick" / rating stickers from photos (rule 8)? It's the biggest single change towards a luxury feel, but it means less information on each card.
2. **Discover hero:** add the new full-width "Tonight's pick" card, or just make the existing Trending cards bigger?
3. **Saves:** do big photo cards become the default, or stay an option behind the toggle?
4. **Plan stops:** is a photo on every stop card OK, given it makes plans about twice as long to scroll?
5. **Photo re-fetch cost:** OK to spend about 1,000 Google Places photo calls to make every photo sharp?
