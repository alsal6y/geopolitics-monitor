# Next Session — Handoff Notes

## Current Status
- Full-screen MapView with Carto Dark Matter basemap ✅
- Live BBC World News RSS feed via /api/rss proxy ✅
- deck.gl ArcLayer driven by real news articles ✅
- NewsFeed glassmorphism sidebar with event + country tags ✅
- Filter bar (Strike, Threat, Diplomacy, etc.) ✅
- Arc-card hover association (hover card → dims other arcs, glows border) ✅
- luma.gl maxTextureDimension2D bug patched via patch-package ✅
- Pushed to GitHub: https://github.com/alsal6y/geopolitics-monitor.git ✅

## File Structure
- src/app/page.js — root, lifts arcs + hoveredId state
- src/app/api/rss/route.js — server-side BBC RSS proxy (revalidates every 5min)
- src/components/Map/MapView.js — MapLibre map, accepts arcs + hoveredId props
- src/components/Map/ArcOverlay.js — deck.gl ArcLayer, color + width driven by hover
- src/components/Map/DeckGLOverlay.js — DeckGL wrapper, client-only
- src/components/Map/DeckErrorBoundary.js — React error boundary
- src/components/NewsFeed/NewsFeed.js — sidebar feed, filter chips, tag system
- src/lib/rssParser.js — fetches /api/rss, parses XML into article objects
- src/lib/categorizer.js — extracts country tags + event type (Strike/Threat/etc.)
- src/lib/arcMapper.js — maps country pairs to arc coordinates
- patches/@luma.gl+core+9.2.6.patch — permanent fix for resize crash

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
- Report #888888 — fallback

Country tags: short labels extracted from 30+ country keyword sets

## Arc-Card Association
- Each arc color matches its event type color
- Cards with a mapped arc show a colored gradient top strip
- Hovering a card: border glows in event color, all other arcs dim on map
- Cards show "⌁ mapped" label when they have an arc

## Reminders
- Always use next/dynamic with ssr:false for map/deck components
- npm must stay on v10 — do not upgrade to v11
- @luma.gl/webgl is pinned to 9.2.6 — do not upgrade
- PowerShell needs quotes around scoped packages: "@deck.gl/react"
- Run: npm run dev → opens at http://localhost:3000
- Git branch is main, remote is origin → push with: git push origin main

## Possible Next Steps
- Click a news card → fly map camera to the arc's midpoint
- Add a second news source (Reuters, Al Jazeera RSS)
- Tooltip on arc hover showing article headline
- Animated pulsing dots at arc source/target
- Deploy to Vercel
