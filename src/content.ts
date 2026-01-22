import { marked } from 'marked';
import { createHighlighter, bundledLanguages, type Highlighter } from 'shiki/bundle/web';

let highlighter: Highlighter | null = null;

// Only process .md files
const url = window.location.href;
if (!url.endsWith('.md') && !url.endsWith('.markdown')) {
  throw new Error('Not a markdown file');
}

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

  const slugCounts = new Map<string, number>();
  renderer.heading = ({ text, depth }) => {
    const slug = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '') // strip HTML tags
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .trim();

    // Handle duplicate slugs
    const count = slugCounts.get(slug) || 0;
    slugCounts.set(slug, count + 1);
    const id = count > 0 ? `${slug}-${count}` : slug;

    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  marked.use({ renderer, gfm: true, breaks: false });

  const html = await marked.parse(raw);

  // Build new document (CSS loaded externally via manifest)
  document.documentElement.innerHTML = `
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${document.title || 'Markdown'}</title>
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
