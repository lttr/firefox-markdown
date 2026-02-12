import { marked } from 'marked';

declare const browser: { runtime: { getURL(path: string): string } };

let savedRawContent = '';

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

function waitForContent(): Promise<string> {
  return new Promise(resolve => {
    // If body already has content, use it
    const pre = document.querySelector('pre');
    if (pre?.textContent) return resolve(pre.textContent);

    // Otherwise wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      const pre = document.querySelector('pre');
      resolve(pre?.textContent || document.body.innerText);
    });
  });
}

async function render() {
  const rawContent = await waitForContent();

  if (!rawContent.trim()) return;

  savedRawContent = rawContent.trim();

  // Parse frontmatter
  const { frontmatter, body: raw } = parseFrontmatter(rawContent.trim());

  // Configure marked
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }) => {
    const encoded = encodeURIComponent(text);
    if (lang === 'mermaid') {
      return `<div class="mermaid-placeholder" data-code="${encoded}"><pre><code>${escapeHtml(text)}</code></pre></div>`;
    }
    return `<div class="shiki-placeholder" data-lang="${escapeHtml(lang || 'text')}" data-code="${encoded}"><pre><code>${escapeHtml(text)}</code></pre></div>`;
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

  renderer.html = ({ text }) => {
    const m = text.match(/^<!--([\s\S]*?)-->$/);
    if (m) return `<div class="md-comment">${escapeHtml(m[1].trim())}</div>`;
    return text;
  };

  marked.use({ renderer, gfm: true, breaks: false });

  const html = await marked.parse(raw);

  // Inject HTML immediately so content is visible before Shiki loads
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

  // Load Shiki highlighter asynchronously if there are code blocks
  if (document.querySelector('.shiki-placeholder')) {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('dist/highlighter.js');
    document.body.appendChild(script);
  }

  // Load mermaid renderer asynchronously if there are mermaid blocks
  if (document.querySelector('.mermaid-placeholder')) {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('dist/mermaid.js');
    document.body.appendChild(script);
  }

  // Toggle button for raw/rendered view
  const toggle = document.createElement('button');
  toggle.className = 'view-toggle';
  toggle.textContent = 'Source';
  document.body.appendChild(toggle);

  let rawPre: HTMLPreElement | null = null;
  const markdownBody = document.querySelector('.markdown-body') as HTMLElement;

  toggle.addEventListener('click', () => {
    const showingRendered = markdownBody.style.display !== 'none';
    if (showingRendered) {
      if (!rawPre) {
        rawPre = document.createElement('pre');
        rawPre.className = 'raw-source';
        rawPre.textContent = savedRawContent;
        document.body.appendChild(rawPre);
      }
      markdownBody.style.display = 'none';
      rawPre.style.display = '';
      toggle.textContent = 'Rendered';
    } else {
      markdownBody.style.display = '';
      if (rawPre) rawPre.style.display = 'none';
      toggle.textContent = 'Source';
    }
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

render().catch(console.error);
