import { marked } from 'marked';
import { createHighlighter, bundledLanguages, type Highlighter } from 'shiki/bundle/web';

let highlighter: Highlighter | null = null;

// Only process .md files
const url = window.location.href;
if (!url.endsWith('.md') && !url.endsWith('.markdown')) {
  throw new Error('Not a markdown file');
}

const CSS = `
:root {
  --color-canvas-default: #2d333b;
  --color-canvas-subtle: #373e47;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-fg-default: #adbac7;
  --color-fg-muted: #8b949e;
  --color-accent-fg: #58a6ff;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: var(--color-canvas-default);
  color: var(--color-fg-default);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
body { padding: 32px 16px; }
.markdown-body {
  max-width: 900px;
  margin: 0 auto;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}
.markdown-body h1 { font-size: 2em; border-bottom: 1px solid var(--color-border-muted); padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--color-border-muted); padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { margin: 0 0 16px; }
.markdown-body a { color: var(--color-accent-fg); text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body ul, .markdown-body ol { margin: 0 0 16px; padding-left: 2em; }
.markdown-body li { margin: 0.25em 0; }
.markdown-body code {
  padding: 0.2em 0.4em;
  font-size: 85%;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  background: rgba(110,118,129,0.4);
  border-radius: 6px;
}
.markdown-body pre {
  margin: 0 0 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background: var(--color-canvas-subtle);
  border-radius: 6px;
}
.markdown-body pre code {
  padding: 0;
  background: transparent;
  font-size: 100%;
}
.markdown-body .shiki {
  margin: 0 0 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  border-radius: 6px;
}
.markdown-body .shiki code { padding: 0; background: transparent; }
.markdown-body blockquote {
  margin: 0 0 16px;
  padding: 0 1em;
  color: var(--color-fg-muted);
  border-left: 0.25em solid var(--color-border-default);
}
.markdown-body hr {
  height: 0.25em;
  margin: 24px 0;
  background: var(--color-border-default);
  border: 0;
}
.markdown-body table {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  margin: 0 0 16px;
  border-collapse: collapse;
}
.markdown-body th, .markdown-body td {
  padding: 6px 13px;
  border: 1px solid var(--color-border-default);
}
.markdown-body th { font-weight: 600; background: var(--color-canvas-subtle); }
.markdown-body tr:nth-child(2n) { background: var(--color-canvas-subtle); }
.markdown-body img { max-width: 100%; border-radius: 6px; }
.frontmatter {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--color-canvas-subtle);
  border-radius: 6px;
  border-left: 3px solid var(--color-accent-fg);
  font-size: 14px;
}
.frontmatter-row {
  display: flex;
  gap: 8px;
  margin: 4px 0;
}
.frontmatter-key {
  color: var(--color-fg-muted);
  min-width: 80px;
}
.frontmatter-value { color: var(--color-fg-default); }
.frontmatter-value a { color: var(--color-accent-fg); }
`;

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown> | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };

  const yaml = match[1];
  const body = match[2];
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parser for basic key-value and arrays
  let currentKey = '';
  for (const line of yaml.split('\n')) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value) {
        frontmatter[currentKey] = value.replace(/^["']|["']$/g, '');
      } else {
        frontmatter[currentKey] = [];
      }
    } else if (line.match(/^\s+-\s+/) && Array.isArray(frontmatter[currentKey])) {
      (frontmatter[currentKey] as string[]).push(line.replace(/^\s+-\s+/, '').trim());
    }
  }

  return { frontmatter, body };
}

function renderFrontmatter(fm: Record<string, unknown>): string {
  const rows = Object.entries(fm).map(([key, value]) => {
    let displayValue: string;
    if (Array.isArray(value)) {
      displayValue = value
        .map(v => v.startsWith('http') ? `<a href="${v}" target="_blank">${v}</a>` : escapeHtml(String(v)))
        .join('<br>');
    } else {
      const str = String(value);
      displayValue = str.startsWith('http') ? `<a href="${str}" target="_blank">${str}</a>` : escapeHtml(str);
    }
    return `<div class="frontmatter-row"><span class="frontmatter-key">${escapeHtml(key)}</span><span class="frontmatter-value">${displayValue}</span></div>`;
  });
  return `<div class="frontmatter">${rows.join('')}</div>`;
}

async function render() {
  // Get raw markdown - Firefox wraps file content in <pre>
  const pre = document.querySelector('pre');
  const rawContent = pre?.textContent || document.body.innerText;

  if (!rawContent.trim()) return;

  // Initialize highlighter - web bundle has common web languages
  highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: Object.keys(bundledLanguages),
  });

  // Parse frontmatter
  const { frontmatter, body: raw } = parseFrontmatter(rawContent.trim());

  // Configure marked
  const renderer = new marked.Renderer();
  const codeBlocks: { id: string; code: string; lang: string }[] = [];
  let blockId = 0;

  renderer.code = ({ text, lang }) => {
    const id = `code-block-${blockId++}`;
    codeBlocks.push({ id, code: text, lang: lang || 'text' });
    return `<div id="${id}" class="shiki-placeholder"></div>`;
  };

  marked.use({ renderer, gfm: true, breaks: false });

  const html = await marked.parse(raw);

  // Build new document
  document.documentElement.innerHTML = `
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${document.title || 'Markdown'}</title>
      <style>${CSS}</style>
    </head>
    <body>
      <div class="markdown-body">${frontmatter ? renderFrontmatter(frontmatter) : ''}${html}</div>
    </body>
  `;

  // Highlight code blocks
  for (const block of codeBlocks) {
    const placeholder = document.getElementById(block.id);
    if (!placeholder) continue;

    try {
      const lang = block.lang in bundledLanguages ? block.lang : 'text';
      const highlighted = highlighter!.codeToHtml(block.code, {
        lang,
        theme: 'github-dark',
      });
      placeholder.outerHTML = highlighted;
    } catch {
      placeholder.outerHTML = `<pre><code>${escapeHtml(block.code)}</code></pre>`;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

render().catch(console.error);
