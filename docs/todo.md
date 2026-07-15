# To Do List

## Before Beta Launch
- [ ] PWA: add PNG icons (192x192, 512x512) — required for install prompts on Android/iOS
- [x] SEO: add OG/Twitter meta tags — shared links look blank without these
- [ ] Security: add auth checks on API endpoints (bulk-import, data-gaps POST are publicly callable)
- [x] Fix: `venue-photo.mjs` uses wrong env var (`SUPABASE_URL` vs `VITE_SUPABASE_URL`)
- [x] Fix: `enrich-venue.mjs` uses deprecated Google Places API — will break when Google sunsets it
- [ ] GDPR: add privacy policy page (link in footer/Me screen)
- [ ] Onboarding: first-visit tooltip on People tab explaining friend codes
- [ ] Onboarding: first-visit tooltip on Saves tab explaining how to save
- [ ] Error handling: graceful fallback when Claude API / Google Places is down
- [ ] Test the full flow on iOS Safari + Android Chrome (PWA install, share target, notifications)
- [ ] Rate limiting on the Claude proxy (`api/claude.mjs`) to prevent abuse
- [ ] Remove dead code: `parseAndSave_legacy`, unused `VENUES` array in client bundle

## Later
- [ ] Set up PostHog account and replace Supabase analytics with PostHog custom events
- [ ] Pinterest-style view: add option for someone to view bucket list as grid or list
- [ ] Natural language filter: extend to also filter the venue shortlist (not just prompt)
- [ ] Instagram fetch: find a RapidAPI plan or alternative with higher limits for automated scraping
- [ ] Fix: 3 cron jobs on Vercel Hobby plan (max 2) — consolidate or upgrade
- [ ] Performance: code-split App.jsx (single 660KB bundle)
- [ ] Accessibility: colour contrast on muted text, aria-labels on nav icons
- [ ] Dark mode support
- [ ] Unfriend/block UI (currently no way to disconnect)
- [ ] Friend code pool expansion (100 words — collision risk at scale)

## App Store / Play Store Readiness

Capacitor is the fastest path for both stores with the existing codebase.

- [ ] Add Capacitor to the project (`@capacitor/core`, `@capacitor/cli`)
- [ ] Configure iOS and Android projects
- [ ] Set up Apple Developer account ($99/yr) + TestFlight for iOS beta
- [ ] Set up Google Play Console ($25 one-time) + internal/closed testing track
- [ ] Create app icons (1024x1024 for iOS, 512x512 for Android) + splash screens
- [ ] Write App Store description, screenshots (6.5" and 5.5" for iOS, phone + tablet for Android)
- [ ] Set up privacy policy URL (required by both stores)
- [ ] Handle deep linking (for shared lists, friend codes)
- [ ] Test push notifications natively (for friend requests, list activity)
- [ ] Ensure haptics/confetti work natively (not just browser vibration API)

## Recommended by Agents

### Itinerary / Quiz Flow
- [ ] Add stop-count validation: if Claude returns fewer stops than requested, retry or show a note
- [ ] Handle partial travel-time failures gracefully (some stops show "calculating..." forever)
- [ ] Bar crawl budget path uses old format ("low"/"mid") vs main quiz ("£10-£30") — inconsistency

### Backend / API
- [ ] `process-videos.mjs` only handles 10 videos per cron run — queue grows indefinitely if tiktok-fetch queues more
- [ ] `server.js` local dev proxy exposes full Anthropic API without rate limiting
- [ ] `data-gaps.mjs` POST uses `ilike` with user-supplied name — no auth, potential abuse
- [ ] `shared_plans` table is fully public (anyone with an ID can read or overwrite)

### UI / Architecture
- [ ] 5,700+ line monolithic `App.jsx` — extract components, hooks, contexts
- [ ] Empty `App.css` / `index.css` — dead files in the build
- [ ] Leftover scaffold assets: `react.svg`, `vite.svg`, `icons.svg`
- [ ] Font "Sofia" imported but never used — wasted network request
- [ ] Inline styles and CSS classes mixed inconsistently — causes visual drift
- [ ] Decorative homepage shapes spin continuously with no `prefers-reduced-motion` guard (battery drain)
- [ ] Leaflet/MarkerCluster loaded from unpkg CDN at runtime — flash/loading state
- [ ] No `maximum-scale=1` on viewport (accidental zoom on mobile inputs)
- [ ] No iOS splash screen config (`apple-mobile-web-app-*` meta tags absent)
- [ ] `.app` container max-width 420px — desktop is just a narrow strip (no wider layout)

### Saves / Social
- [ ] `window.prompt()` / `alert()` for folder rename/errors — replace with custom UI
- [ ] Note persistence fallback to localStorage can silently desync across devices
- [ ] Invite links contain raw user UUIDs — exposes internal IDs
- [ ] One-time photo backfill uses localStorage to track progress — re-runs on new devices
- [ ] Bulk paste silently skips lines that fail (only `console.error`)
- [ ] `status: "pending"` set on every save but no UI to change it (admin approval vestige)
