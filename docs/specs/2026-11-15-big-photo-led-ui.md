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

### What Yonder actually does

These come from a 1 minute 42 second screen recording of Yonder (iOS) that the owner shared. The recording stays local and isn't in the repo.

| # | Pattern | What it looks like in Yonder | How cuRATED would use it |
|---|---|---|---|
| Y1 | **The photo is the background** | Home is one full-screen photo with the interface floating on top | Discover opens on a full-screen "Tonight's pick" photo with the logo on top |
| Y2 | **Ambient colour** | The page background is a blurred, darkened copy of the photos, so each section takes on their colour (brown for shopping, deep red for dining) | Below the hero, Discover's background is a blurred version of the current photos, tinted towards black cherry `#3A0B14` |
| Y3 | **Frosted-glass panels** | Small translucent, blurred panels sit on top of photos (balance, chips, bottom bar) | Filter chips, the bottom bar, and the round search and map buttons become frosted glass |
| Y4 | **Tall portrait cards** | Two columns or carousels of 3:4 cards, with the photo filling the whole card. Name, location and one perk sit at the bottom over a gradient. The next card peeks in from the edge | Trending and every collection use 3:4 portrait cards with text over the photo |
| Y5 | **Curated collection names** | Rows are named like a magazine: "Feeling fancy", "One to share", "Wine & small plates", "Keeping it casual", "New this month" | Discover becomes rows like "Date night", "Cheap & cheerful", "Sunday slow", "Late ones", "New this month", built from the existing tags |
| Y6 | **One big feature card** | Inside a category there's one full-width card (KRICKET) with a large name, a one-line description, location and perk | One full-width feature card per category |
| Y7 | **Detail page = photo + sheet** | The top 55–60% is a full-bleed photo, and a cream sheet with rounded top corners slides up over it. Title, then one line of description, then the details | The spot page uses the same structure. Our cream and black cherry already match it |
| Y8 | **A floating action bar** | A dark pill-shaped main button ("Visit Origin") plus a round share button sit fixed at the bottom of the detail page | Spot page: a fixed black cherry "Save spot" pill plus a round Directions button |
| Y9 | **Very little text** | On a card: name, a pin with the area, an icon with the perk. No tags and no descriptions | Name, area and price only, as in rule 9 |
| Y10 | **One small tag** | A single small "Smart pick" tag with an icon, and nothing else | One tag at most, as in rule 8 |
| Y11 | **A floating, inset bottom bar** | A rounded frosted bar that floats above the content with a gap from the screen edges | Restyle the bottom bar the same way |
| Y12 | **Map with category pins** | Round pins with an icon for each category, number clusters, and category chips at the bottom | The same in the Saves map, using our outline icons |
| Y13 | **Placeholders while loading** | Grey shapes the same size as the content show before it loads | Placeholders the same size and shape as the photos, as in section 4 |

Seen on a second pass, one frame per second (103 frames):

| # | Pattern | What it looks like in Yonder | How cuRATED would use it |
|---|---|---|---|
| Y14 | **The hero is a photo carousel** | The detail page hero holds 3–6 photos you swipe through. A thin progress line sits at the bottom of the photo, not dots. The round heart (save) button floats bottom-right on the photo, with a round back arrow top-left | The spot page hero becomes a swipeable carousel of all the venue's photos with a thin progress line. Save heart and back arrow float on the photo as round frosted buttons |
| Y15 | **The detail page is long and editorial** | Under the sheet: a paragraph on the brand ("Why Origin Coffee?"), outline pill links (Website ↗, Instagram ↗), a map of its locations, then "The low down" with a second big photo and more text | The spot page gets sections: the blurb, outline pill links (Website, Instagram, Menu), a small map, and a second photo if there is one. Long-form, not a card of tags |
| Y16 | **The map is a card in the feed** | Inside a category, a full-width rounded map ("In the area") sits between the feature card and the first row | Discover gets an "Around you" map card after the hero, reusing the Saves peek map |
| Y17 | **The home hero is a stack of swipeable cards** | The first "Smart picks" card is nearly full-screen height, 3:4, and swiping left moves to the next pick. Below it, a 2-column grid of 3:4 cards | Discover's "Tonight's pick" is a swipeable stack of 3–5 picks rather than a single card |
| Y18 | **The map view** | Full-screen light map. Pins are white circles with an outline category icon, clusters are white circles with a number, and the selected pin grows and turns coral. Tapping shows a dark card at the bottom with the name and perk. Category chips float at the bottom, with a round close button top-left | The Saves and Discover maps use this: white icon pins, number clusters, oxblood for the selected pin, a black cherry card at the bottom, and chips floating over the map |
| Y19 | **Rare, small accent tags** | A small coral pill ("Off peak boost", "First time boost") appears top-right on maybe one card in ten. It's the only bright colour on the screen | The one tag per screen (rule 8) is a small pill, top-right, in arctic blue on dark or oxblood on cream. Nothing else is bright |
| Y20 | **Everything loads with placeholders, then settles** | Switching category shows dark grey placeholder blocks, then the feature card, then the map, then the rows | The same order for Discover: placeholders, then hero, then map, then rows |
| Y21 | **"Explore more by category" grid** | A 2-column grid of frosted panels, each with an outline icon and a label, at the end of the feed | Discover ends with the same grid: Restaurants, Bars, Cafés, Culture, Outdoors, Markets, using our outline icons |

Yonder's venue "logos" on the cards are supplied by the brands. cuRATED doesn't have those, so venue names go in Instrument Serif at 24–30px in the same spot, which gives a similar editorial feel.

**The biggest single difference is that Yonder is dark and moody where it shows photos**, using deep blurred backgrounds, and cream only on detail sheets. That darkness is a large part of why it feels luxury. cuRATED could do the same with **black cherry** as the dark background on Discover and the photo screens, keeping cream for the spot sheet, Saves and forms. See open question 0.

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

5. **Name on the photo, over a soft gradient at the bottom.** Name in Instrument Serif, area · price in small caps under it, as on today's Trending cards. The gradient covers only the bottom third, and the photo is tall enough (4:5) that the whole subject shows above it. Confirmed by the owner 2026-11-15 with a Courtauld card as the reference.
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
- **Trending cards:** 160 × 206 → **280 × 350** (4:5), name on the photo over a soft gradient, about 1.2 cards visible so the next one peeks in.
- **"Because you like" list:** replaced by the preference rows (see "Discover, in order").

### Spot page
- **Hero:** 380px → **62% of the screen height** (about 520px), edge to edge, a swipeable carousel of every photo with a thin progress line (Y14). Round frosted back and save buttons float on the photo.
- Name over the bottom of the photo in Instrument Serif at 34px, with the cream sheet sliding up over it.
- **Sheet contents, in order (Y15):** category · area · price line, the blurb, one row of outline pill links (Website, Instagram, Menu, Directions), friends who saved it, a small map, then the tags. Long and scrollable, not a card.

### Discover, in order (decided 2026-11-15: option B, rows of picks)
1. Logo and date
2. "Build me a night out" block and the "Swipe to discover" card, unchanged
3. Filter chips
4. **Trending this week**: 280 × 350 cards (4:5), name on the photo, about 1.2 visible, Top pick badge only
5. **Preference rows**, up to three, one per preference the person ticked at sign-up (`PREF_OPTIONS`): "Top bar picks", "Hidden gems", "Outdoor" and so on, highest-rated first, with a one-line "Because you like bars" under the title
6. **Cheap eats**: `price = "low"`
7. **Celebrity row**: "Dua Lipa's picks", from `celebrity_tags`, rotating weekly between celebrities with 5+ venues
8. **New this month**: newest approved venues
9. "Explore by category" grid (Y21)

Every row shows 8 cards and "See all" opens the full list. The current "Because you like" list goes, because the preference rows replace it. No "Tonight's pick" stack: the owner chose rows over a single hero so the Build block stays near the top.

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
| 0 | Mock the new Discover, spot page, plan and feed on the brand board, next to the current screens. Done 2026-11-15: panels "Plan stops with photos", "Discover · rows of picks", "Spot page and People feed" | Owner signs off on the look |
| 1 | Sharper photos (technical work items 1 and 2) | Spot-check 20 venues on a phone |
| 2 | Type scale across the app | Screenshots of every tab |
| 3 | Discover and spot page | Owner and friends test it |
| 4 | Plan result and plans list | Make two plans and check them |
| 5 | Saves and People | Check with real lists and a friend |

Each phase is its own commit and push, so the two laptops stay in sync.

## 7. Decisions so far (2026-11-15)

- **Discover stays cream.** No dark background. The ambient-blur idea (Y1–Y3) is dropped. Photos get bigger on cream.
- **Keep the "Top pick" badge.** Other stickers (Trending, rating-on-photo) still go, per rule 8.
- **Discover: option B, rows of picks.** Trending, then rows from the person's preferences, Cheap eats, a celebrity row and New this month. Mocked on the brand board, "Discover · rows of picks".
- **Saves: big photo cards are the default view.** The compact grid/list stays behind the toggle.
- **A photo on every plan stop: yes.** Mocked on the brand board, "Plan stops with photos".
- **Photo re-fetch cost:** Google's Place Photos SKU is $7 per 1,000 calls, with the first 1,000 a month free. 100 calls ≈ £0.55, and the full ~1,000-venue re-fetch is at most about £5, possibly free. Approved.

## 8. Open questions for the owner

0. ~~Dark and moody Discover?~~ Decided: cream.
1. ~~What exactly do you like about Yonder?~~ Answered with the screen recording.
1b. ~~Badges~~ Decided: keep Top pick, drop the rest.
2. ~~Discover hero~~ Decided: option B, rows of picks. See "Discover, in order".
3. ~~Saves~~ Decided: big photo cards are the default view; the grid/list toggle stays for a compact view.
4. ~~Plan stops~~ Decided: yes, photo on every stop.
5. ~~Photo re-fetch cost~~ Decided: approved, at most about £5.
