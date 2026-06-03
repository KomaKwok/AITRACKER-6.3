# AI Radar Method

## 1. What the tool is

AI Radar is a polished MVP web app for tracking first-hand AI product dynamics through official update channels. The goal is to surface structured product signals from release notes, changelogs, and official feeds rather than assemble a generic AI news feed.

## 2. Why AI dynamics tracking is defined this way

The strongest early product signals tend to appear in:

- official release notes
- official changelogs
- official RSS / Atom feeds
- official product documentation update pages
- official domestic product pages

This definition makes the product more useful for spotting product motion early, especially around frontier AI teams in Silicon Valley.

## 3. Major features

- dashboard with visible freshness metrics and last updated time
- normalized signal stream with filters and sorting
- source coverage page with fetch metadata
- trend summary for 7d and 30d windows
- China vs Global comparison
- manual refresh button
- cron-compatible fetch route
- source status tracking with transparent fetch failure reporting

## 4. How it was built

1. Set up a Next.js 15 App Router app with TypeScript and Tailwind CSS.
2. Chose a local JSON repository abstraction instead of Prisma to keep the interview MVP fast to run and demo.
3. Defined normalized `Signal` and `Source` models plus a persistent local store.
4. Reduced the source scope to a smaller set of official update channels and added explicit status handling for blocked, empty, or successful sources.
5. Built a fetch pipeline that performs source fetch, normalization, dedupe, tag enrichment, four-dimensional scoring, storage, and trend summary generation.
6. Added an LLM abstraction for summaries and tags with a heuristic fallback when no API key is available.
7. Built reusable UI components and the four required pages.
8. Added scripts for seeding and manual fetch plus a cron-friendly API route for Vercel.

## 5. AI tools used

- LLM-assisted code generation and iteration for scaffolding, component drafting, and fetch pipeline structure
- heuristic fallback logic for summaries and tags when no model API key is available
- LLM-assisted iteration for refining the signal scoring framework into four dimensions: source directness, update materiality, freshness, and analytical relevance
- optional OpenAI Responses API integration for one-sentence signal summaries and tag suggestion
