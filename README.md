# Markdown Renderer

Firefox extension that renders local `.md` and `.markdown` files with a dark theme and syntax highlighting.

## Features

- GitHub-style dark theme
- Syntax highlighting via [Shiki](https://shiki.style/)
- YAML frontmatter support
- GFM (GitHub Flavored Markdown)

## Install

```bash
pnpm install
pnpm install:firefox   # build + install into default Firefox profile
```

Restart Firefox to load the extension. Run `pnpm install:firefox` only once - after that, just rebuild and restart Firefox (or reload at `about:debugging`).

### Distribution

- **`pnpm release`** - packages an unsigned `.xpi` archive. Useful for sharing or backing up the extension, but Firefox won't install unsigned extensions in release builds.
- **`pnpm sign`** - submits the extension to AMO (addons.mozilla.org) for signing and downloads the signed `.xpi`. Signed extensions can be installed permanently on any Firefox without profile-level setup. Requires `.env` with `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` (see `.env.example`).

## Scripts

- **`pnpm build`** - production build to `dist/`
- **`pnpm watch`** - dev mode with auto-rebuild
- **`pnpm install:firefox`** - build + install extension into Firefox profile
- **`pnpm release`** - build + package unsigned `.xpi` for manual distribution or testing
- **`pnpm sign`** - build + sign via AMO for permanent install without profile tricks (requires `.env`)

## Development

```bash
pnpm install
pnpm install:firefox   # one-time setup
pnpm watch             # rebuild on changes
# restart Firefox or reload extension at about:debugging to see changes
```

## License

MIT
