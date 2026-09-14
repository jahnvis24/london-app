# Curated — Tester Briefing

## What is Curated?

Curated is a mobile-first web app for saving London venues you find on social media and turning them into real plans. Instead of bookmarking restaurants and bars on TikTok and Instagram and never actually going, Curated extracts the venue from a screenshot or link, enriches it with Google Maps data (photos, ratings, address, price), and organises everything into lists. When you're ready to go out, the app generates a personalised AI itinerary — a sequenced evening plan with timed stops, travel times, and cost estimates — based on your taste, budget, and area preferences.

## Main features

**Save from anywhere** — Screenshot a TikTok or Instagram post, paste a link, or search by name. The app reads the image with AI, identifies the venue, and pulls in the Google Maps photo, rating, address, and price automatically.

**Organised lists** — Saved venues auto-sort into category lists (Restaurants, Bars, Cafes, etc.) or you can create your own custom lists. Each list has a photo collage cover card.

**AI itinerary planner** — Answer 5 quick questions (vibes, area, budget, group size, energy level) and get a full evening plan with 3-5 timed stops, walking times between them, and a total cost estimate. You can swap individual stops or generate a bar crawl.

**Discover and swipe** — A personalised discovery feed with trending venues and a Tinder-style swipe deck. Swipe right to save, left to skip. Each card shows a taste-match score based on your preferences.

**Map view** — See all your saved spots on an interactive map. Filter by category. Tap a pin to see the venue details.

**Friends and bucket lists** — Connect with friends using a 4-letter code. Browse their saves and copy spots to your board. Create shared bucket lists and tick off places you've visited together.

**Spot detail** — Full venue page with a swipeable photo gallery, star ratings, personal notes, vibe tags, and one-tap actions: book a table, get directions, schedule a visit, share with friends, or build a plan around this venue.

**Calendar** — See your scheduled visits on a monthly calendar. Add spots to specific dates and build plans from them.

## How to access

The app is live at **london-app.vercel.app**. It works best on a mobile phone browser (Safari on iPhone, Chrome on Android). You can also add it to your home screen as a PWA for a full-screen app-like experience.

Sign up with Google or your email address (you'll get a one-time code). The first time you sign up, there's a short onboarding flow — your name, what you're into, and a quick this-or-that photo game to learn your taste.

---

## Testing guidance

### How to test

Use the app as you normally would — save places you actually like, build a plan for this weekend, connect with another tester. The most valuable feedback comes from real usage, not scripted walkthroughs.

If you want to test a specific flow, the test plan spreadsheet has 50 numbered flows with step-by-step instructions and expected outcomes. You can work through them in any order. Mark each as Pass, Fail, or Blocked and add notes on what happened.

### What to look for

- **Does it feel natural?** Are the buttons where you'd expect them? Is anything confusing or hard to find?
- **Does it work?** Did anything crash, freeze, or show an error? Did a save fail silently? Did a button do nothing?
- **Does it look right?** Are fonts consistent? Are photos loading? Is anything cut off, overlapping, or misaligned on your screen size?
- **Is it fast enough?** Does the screenshot parsing feel too slow? Does the map lag? Does anything take unexpectedly long?

### How to give feedback

For each issue, note:
1. What you were doing (e.g. "I uploaded a screenshot of a TikTok post about a restaurant in Shoreditch")
2. What happened (e.g. "It said 'Nothing found to add' after 10 seconds")
3. What you expected (e.g. "I expected it to find the restaurant and show it in the preview")
4. Your device and browser (e.g. "iPhone 15, Safari")

Screenshots of any issues are especially helpful.

### Known limitations

- Screenshot parsing uses AI and costs about 1p per screenshot — it may occasionally misidentify a venue or fail on very busy images with lots of text.
- Some venues may show "Added from screenshot" instead of the Google photo and rating. This means Google Places couldn't match the exact venue name — the Maps link will still work.
- The app requires an internet connection — there is no offline mode yet.
- Profile photo upload requires a Supabase storage bucket to be configured — if it fails, this is a known setup issue.
