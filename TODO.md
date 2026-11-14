# To-do

| # | Task | Status |
|---|------|--------|
| 1 | Plan quality testing | In progress — chain mode + cascade done, needs more QA |
| 2 | Invite only code | Not started |
| 3 | Discover tab — curated static picks | In progress |
| 4 | Push notifications before event reminder | Not started |
| 5 | Community plans — suggest popular user-favourited itineraries | Not started |
| 6 | Migrate account data from personal email to test email | Not started — sign up with new email, then run `scripts/copy-user-data.sql` in Supabase SQL Editor |
| 8 | Larger "Because you like" cards on Discover | Not started |
| 9 | Map spot list: match save preview card style | Not started |
| 11 | Audit what drives Discover content and the onboarding this-or-that game | Not started — trending = google_rating >= 4.2; "Because you like" = top category by count; swipe deck = rating >= 4.0 with photos; onboarding pairs test 5 taste axes |
| 12 | Plans table migration | Not started — run `migrations/2026-09-08_plans-table.sql` in Supabase SQL Editor |

## Done
- 2026-11-14 — People › Feed: friends' recent saves (bursts grouped), "you both saved" card with make-a-bucket-list-together, "N friends saved, you haven't" nudges; Discover Trending now uses real save counts (falls back to rating). Migration `2026-11-14_feed-popularity.sql` run in Supabase
- 2026-11-13 — Rotated Supabase keys to sb_publishable/sb_secret, disabled legacy JWT keys (leaked service_role key now dead); Vercel connected to GitHub (pushes to main auto-deploy)
- 2026-11-13 — Merged `redesign` into `main`; ported security extras (Claude model/token caps, URL checks in saved-tools, keys out of scripts, removed unused Netlify function)
- 2026-09-08 — Plans moved to Supabase, account details on Me page, FriendProfile redesign, bucket list fixes, save-to-list picker, background parsing, avatars bucket
