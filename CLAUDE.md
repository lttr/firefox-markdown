# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install        # install dependencies
pnpm build          # production build → dist/
pnpm watch          # dev mode with auto-rebuild
pnpm release        # bump version, tag, push → CI signs on AMO + publishes GitHub release
pnpm release minor  # (or major / X.Y.Z) — see release.js
```

## Releasing

`pnpm release` (release.js) bumps the version in `manifest.json` + `package.json`,
regenerates `updates.json`, builds, commits, tags `vX.Y.Z`, and pushes. The
`Sign & Release` workflow (`.github/workflows/sign.yml`) then signs the add-on
unlisted on AMO (`pnpm sign:ci`, needs `WEB_EXT_API_KEY`/`WEB_EXT_API_SECRET`
repo secrets) and attaches `markdown_renderer-X.Y.Z.xpi` to the GitHub release.

Self-distribution auto-update: `manifest.json` `update_url` → `updates.json` on
master (raw.githubusercontent) → the `vX.Y.Z` release asset. Each AMO version is
single-use, so always bump before releasing.

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

Signing runs in CI from repo secrets `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`
(AMO API credentials). No local `.env` is needed for the release flow.
