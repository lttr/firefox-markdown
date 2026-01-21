# Markdown Renderer

Firefox extension that renders local `.md` and `.markdown` files with a dark theme and syntax highlighting.

## Features

- GitHub-style dark theme
- Syntax highlighting via [Shiki](https://shiki.style/)
- YAML frontmatter support
- GFM (GitHub Flavored Markdown)

## Install

### Signed Version (Permanent)

1. Set up `.env` with AMO API keys (see `.env.example`)
2. `pnpm install && pnpm sign`
3. Open generated `.xpi` in Firefox → auto-installs

### Development Version (Temporary)

1. `pnpm install && pnpm build`
2. Firefox → `about:debugging` → This Firefox → Load Temporary Add-on
3. Select `dist/manifest.json`

Note: Temporary add-ons are removed on browser restart.

## Development

```bash
pnpm install
pnpm watch    # dev mode with auto-rebuild
pnpm build    # production build
```

## License

MIT
