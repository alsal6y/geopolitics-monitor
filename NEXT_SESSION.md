# Next Session — Handoff Notes

## Current Status
- Full-screen MapView with Carto Dark Matter basemap ✅
- deck.gl ArcLayer driven by real news articles ✅
- NewsFeed glassmorphism sidebar with event + country tags ✅
- Filter bar (Strike, Threat, Diplomacy, etc.) ✅
- Arc-card hover + click association ✅
- luma.gl maxTextureDimension2D bug patched via patch-package ✅
- **Multi-source news aggregation (7 sources) ✅**
- **SQLite persistence via sql.js (articles survive restarts) ✅**
- **Paginated "Load More" for full historical archive ✅**
- **Per-source filter chips + dynamic source badges ✅**
- **Title-fingerprint deduplication across sources ✅**
- **Auto-ingestion on first load (no scheduler needed) ✅**
- **Bug fixes: isStale datetime, date filter SQL, RSS null guard, app metadata ✅**
- Pushed to GitHub: https://github.com/alsal6y/geopolitics-monitor.git ✅

## File Structure

### App & API routes
- `src/app/page.js` — root, lifts arcs + hoveredId state
- `src/app/api/articles/route.js` — **primary feed endpoint**: paginated DB reads + auto-ingestion
- `src/app/api/ingest/route.js` — POST endpoint to trigger manual ingestion
- `src/app/api/sources/route.js` — source metadata with per-source article counts
- `src/app/api/guardian/route.js` — direct Guardian proxy (kept as fallback)
- `src/app/api/rss/route.js` — direct BBC RSS proxy (kept as fallback)

### Components
- `src/components/Map/MapView.js` — MapLibre map, accepts arcs + hoveredId props
- `src/components/Map/ArcOverlay.js` — deck.gl ArcLayer, color + width driven by hover
- `src/components/Map/DeckGLOverlay.js` — DeckGL wrapper, client-only
- `src/components/Map/DeckErrorBoundary.js` — React error boundary
- `src/components/NewsFeed/NewsFeed.js` — sidebar feed, source/event filters, Load More

### Libraries
- `src/lib/db.js` — sql.js SQLite singleton; schema, upsert, paginated queries, fetch_log
- `src/lib/dedup.js` — title fingerprinting for cross-source deduplication
- `src/lib/ingest.js` — parallel ingestion orchestrator; categorizes at ingest time
- `src/lib/sources/index.js` — source registry (all 7 sources with metadata)
- `src/lib/sources/guardian.js` — paginated Guardian API fetcher (up to 5 pages = 250 articles)
- `src/lib/sources/rss.js` — generic RSS fetcher using fast-xml-parser (server-side)
- `src/lib/categorizer.js` — extracts country tags + event type (unchanged)
- `src/lib/arcMapper.js` — maps country pairs to arc coordinates (unchanged)
- `src/lib/guardianParser.js` — client-side parser (kept as fallback)
- `src/lib/rssParser.js` — client-side parser (kept as fallback)
- `patches/@luma.gl+core+9.2.6.patch` — permanent fix for resize crash

## News Sources (7 active)
| ID | Name | Type | Notes |
|----|------|------|-------|
| guardian | The Guardian | API (paginated) | Requires `GUARDIAN_API_KEY` in `.env.local` |
| bbc | BBC World | RSS | `feeds.bbci.co.uk/news/world/rss.xml` |
| aljazeera | Al Jazeera | RSS | Via Google News proxy (direct has SSL issues) |
| reuters | Reuters | RSS | Via Google News proxy |
| france24 | France 24 | RSS | `france24.com/en/rss` |
| dw | DW News | RSS | `rss.dw.com/rdf/rss-en-world` |
| npr | NPR World | RSS | `feeds.npr.org/1004/rss.xml` |
| unnews | UN News | RSS | `news.un.org/feed/subscribe/en/news/all/rss.xml` |

## Data Architecture
```
Sources (parallel fetch)
    ↓
categorizeAll() — enriches with countries, eventType, zone
    ↓
dedup.js — fingerprint check → skip if duplicate
    ↓
SQLite DB (data/geopolitics.db) — persisted to disk via sql.js
    ↓
/api/articles → NewsFeed.js → buildArcs() → MapView
```

**Database tables:** `articles`, `article_fingerprints`, `fetch_log`

**Auto-ingestion:** `/api/articles` triggers ingestion if last fetch > 15 min ago. On first cold start, ingestion runs inline before the first response — no external scheduler needed.

**DB file:** `data/geopolitics.db` — gitignored, auto-created on first run.

## Tag System
Event types (with colors):
- Strike #ff3333 — military action, bombs, missiles
- Threat #ff8800 — warnings, ultimatums, escalation
- Sanctions #ffdd00 — tariffs, embargoes, restrictions
- Diplomacy #44aaff — talks, deals, summits
- Espionage #44ffcc — hacking, spying, cyber
- Unrest #cc66ff — protests, riots, coups
- Aid #44dd44 — humanitarian, refugees
- Arrest #ff6644 — detention, trials
- Statement #aaaaaa — bilateral events with <2 countries in title
- Report #888888 — fallback

Country tags: short labels extracted from 37 country keyword sets

## Environment Variables
```
GUARDIAN_API_KEY=...    # required for Guardian source
INGEST_SECRET=...       # optional: protects POST /api/ingest
```

## Reminders
- Always use next/dynamic with ssr:false for map/deck components
- npm must stay on v10 — do not upgrade to v11
- @luma.gl/webgl is pinned to 9.2.6 — do not upgrade
- PowerShell needs quotes around scoped packages: "@deck.gl/react"
- Run: npm run dev → opens at http://localhost:3000
- Working branch is `claude/brave-elbakyan` (PR #3 open against master)
- sql.js must be installed: `npm install sql.js` (was missing from node_modules)

## Bug Fixes Applied (this session)
- `src/lib/ingest.js:93` — `isStale()` used `lastFetch + 'Z'` on SQLite's space-separated datetime; fixed to `.replace(' ', 'T') + 'Z'` for valid ISO 8601
- `src/lib/db.js:158` — SQL `pub_date <= ? || 'T23:59:59Z'` relied on SQLite operator precedence; moved concat to JS: `params.push(toDate + 'T23:59:59Z')`
- `src/lib/sources/rss.js:44` — single-item wrap `[items]` could create `[null]`; added `&& items` guard
- `src/app/layout.js:15` — replaced "Create Next App" scaffold metadata with correct app title/description

## Possible Next Steps
- Add Guardian API key to unlock full paginated history (up to 250 articles/run)
- Click a news card → fly map camera to the arc's midpoint
- Tooltip on arc hover showing article headline
- Animated pulsing dots at arc source/target
- Schedule periodic ingestion via Vercel cron (`vercel.json` crons key)
- Deploy to Vercel (note: sql.js works locally but needs Turso/libsql for Vercel's ephemeral FS)
- Add keyword search across persisted articles
- Add more RSS sources to `src/lib/sources/rss.js` + register in `src/lib/sources/index.js`
