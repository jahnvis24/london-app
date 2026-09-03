# Curated — App Feature Brief

## What the app does
A London venue discovery and itinerary planning app. Users save spots they find on social media, get AI-generated day/night plans, and share lists with friends.

## Target user
20-30 year olds living in or visiting London who save restaurant/bar/activity recommendations from TikTok, Instagram, and friends but never actually go. The app turns that chaos into action.

## Core features

### 1. Save spots from anywhere
Users can capture venues from multiple sources:
- Screenshot a TikTok/Instagram post → AI reads the image and extracts venue name, category, area
- Paste a TikTok or Instagram link → auto-fetches caption and parses venues
- Paste a Google Maps link → extracts place names and coordinates
- Manually type a venue name → Google auto-suggests the match with photo, address, rating
- All saves are enriched with Google Places data (photo, rating, address, coordinates, price level)

### 2. Organised collections
Saved spots auto-sort into category-based folders (Restaurants, Bars, Cafés, Outdoor, etc.). Users can also create custom folders, rename them, and move spots between them. Each folder has a cover photo collage generated from the spots inside it.

### 3. AI itinerary generator
A 9-question quiz captures preferences, then AI generates a sequenced plan:
- Questions: time of day, vibes, area, number of stops, travel mode, budget (total for all stops), group size, energy level, must-haves
- Plus a freeform "anything else?" text field
- Output: titled itinerary with timed stops, travel times between them, cost estimates, booking info, and a local tip
- Users can swap individual stops (AI suggests alternatives) or remove stops
- Plans can be built around a specific saved spot (the plan clusters nearby)
- Bar crawl mode: specialised quiz for a pub/cocktail crawl sequence

### 4. Discover / Tinder-style swipe
A discovery flow that shows one venue at a time as a large card. Venues are scored based on the user's existing tastes (what they've already saved). Swipe right to save, left to skip. Tap for full details.

### 5. Friends & social
- Connect with friends using a 4-letter word code (e.g. BEAR, WOLF)
- View a friend's saved spots (Instagram-style profile with their folders)
- Save any of their spots to your own board
- Send a folder or itinerary directly to a friend (in-app notification)

### 6. Collaborative bucket lists
- Create a shared list with friends (name + emoji)
- Add spots from saves, screenshots, or manually
- Tick off visited places (with celebration animation)
- Each item can have a target date + Google Calendar link
- All members can add/remove items
- Collapsed map showing all list items

### 7. Map view
An interactive map showing all saved spots as clustered pins. Filter by category. Tap a pin for a card with photo + details. Expandable from a small peek to full-screen.

### 8. Spot detail page
Full venue page with: photo carousel, star rating (personal + community average), description, vibe tags, address, price, opening hours, and actions (book, show on map, make a plan from this, add to bucket list, view original source).

### 9. Calendar
Month view showing when you've planned to visit specific spots. Spots can be scheduled from the detail page or bucket lists.

### 10. Profile & settings
- Taste preferences (tune recommendations)
- Export all data (GDPR)
- Delete account (GDPR)
- Guided product tour

## Non-functional requirements
- Mobile-first (420px max-width design)
- Haptic feedback + micro-sounds on saves and interactions
- Confetti animation on bucket list completions
- Push notifications for: new friend connection, added to a bucket list, friend sent you something
- PWA installable (or native via Capacitor)
- Offline-capable for viewing saved spots

## Data & integrations
- Supabase (auth, database, realtime)
- Google Places API (venue enrichment, photos, ratings)
- Google Routes API (travel times)
- Anthropic Claude API (screenshot parsing, itinerary generation)
- Vercel Blob (photo storage)

## Tone & visual direction
- Warm, editorial, premium but not stuffy
- Serif headings, cream/olive/burgundy palette
- Pinterest-inspired card layouts (image-first, minimal text on cards)
- Tinder-inspired swipe for discovery
- Soft, rounded cards with shadow depth (no flat borders)
