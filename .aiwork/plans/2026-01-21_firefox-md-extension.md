---
created: 2026-01-21
type: plan
status: active
---

# Firefox Markdown Renderer Extension

## Goal
Create Firefox extension that renders `.md` files with GitHub-style dark theme and Shiki syntax highlighting.

## Tech Stack
- **Markdown parser**: marked (lightweight, fast)
- **Syntax highlight**: Shiki (bundled, supports Vue/TS/etc)
- **Build**: esbuild (bundle Shiki + marked into single file)
- **Style**: GitHub markdown CSS (dark mode variant)

## Structure
```
firefox-markdown/
├── manifest.json
├── src/
│   └── content.ts       # Main content script
├── dist/
│   ├── content.js       # Bundled output
│   └── styles.css
├── package.json
└── build.js             # esbuild config
```

## Steps

1. **Init project** - package.json, install deps (marked, shiki, esbuild)

2. **manifest.json** - v2 manifest, file://* permission, content script injection at document_start

3. **content.ts** - Main logic:
   - Detect `.md` extension
   - Fetch raw content via `document.body.innerText` or pre tag
   - Parse with marked
   - Highlight code blocks with Shiki
   - Replace document with rendered HTML

4. **styles.css** - GitHub dark theme:
   - Max-width: 900px, centered
   - Dark background (#0d1117)
   - Syntax highlight theme: github-dark

5. **Build script** - esbuild bundle with Shiki WASM inlined

6. **Test** - Load extension, verify sample .md file renders correctly

## Verification
1. Load as temporary extension in `about:debugging`
2. Open `file:///home/lukas/work/drmax/drmax-nsf-global/docs/migration/vue-3-migration-cookbook.md`
3. Verify: dark theme, centered, Vue code highlighted

## Decisions
- ✓ Shiki with full WASM bundle
- ✓ Dark mode only (no toggle)
