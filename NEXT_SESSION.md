# Next Session — Handoff Notes

## Current Status
- Full-screen MapView renders correctly with Carto Dark Matter basemap
- deck.gl ArcLayer renders 3 sample arcs (DC→Tehran, London→Yemen, Tehran→Bahrain)
- luma.gl maxTextureDimension2D bug patched via patch-package
- No console errors

## What Was Built
- src/components/Map/MapView.js — map container, tracks viewState on move
- src/components/Map/ArcOverlay.js — deck.gl ArcLayer with sample data
- src/components/Map/DeckGLOverlay.js — DeckGL wrapper, client-only
- src/components/Map/DeckErrorBoundary.js — React error boundary
- src/lib/deckgl-adapter.js — placeholder (adapter handled at component level)
- patches/@luma.gl+core+9.2.6.patch — permanent fix for resize crash

## Next Steps (in order)
1. Build the NewsFeed sidebar component (glassmorphism panel, left side)
2. Build rssParser.js in src/lib/ to fetch and parse BBC RSS feed
3. Build categorizer.js in src/lib/ to sort headlines by impact zone
4. Wire RSS data into the NewsFeed component
5. Style news items like X/Twitter posts (logo, handle, headline, timestamp)
6. Connect arc data to real news events instead of hardcoded sample arcs

## Reminders
- Always use next/dynamic with ssr:false for map/deck components
- npm must stay on v10 — do not upgrade to v11
- @luma.gl/webgl is pinned to 9.2.6 — do not upgrade
- PowerShell needs quotes around scoped packages: "@deck.gl/react"
- Run: npm run dev → opens at http://localhost:3000