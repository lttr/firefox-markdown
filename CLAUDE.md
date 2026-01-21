# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install        # install dependencies
pnpm build          # production build → dist/
pnpm watch          # dev mode with auto-rebuild
pnpm release        # build + package .xpi (unsigned)
pnpm sign           # build + sign for AMO (requires .env with API keys)
```

## Architecture

Firefox extension (Manifest V2) that renders local `.md`/`.markdown` files.

**Entry point:** `src/content.ts` - content script injected on `file:///*` URLs
- Checks URL extension, extracts raw markdown from Firefox's `<pre>` wrapper
- Parses YAML frontmatter (simple key-value + arrays)
- Uses marked (GFM) with custom code renderer → placeholders
- Post-renders code blocks with Shiki (`github-dark` theme)

**Build:** `build.js` - esbuild bundles TS to IIFE, copies `src/styles.css` to `dist/`

**Output:** `dist/content.js` + `dist/styles.css` loaded via `manifest.json` content_scripts

## Environment

`.env` needed for signing (see `.env.example`):
- `WEB_EXT_API_KEY` - AMO API key
- `WEB_EXT_API_SECRET` - AMO API secret
