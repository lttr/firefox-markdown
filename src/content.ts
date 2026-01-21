import { marked } from 'marked';
import { codeToHtml, bundledLanguages } from 'shiki';

// Only process .md files
const url = window.location.href;
if (!url.endsWith('.md') && !url.endsWith('.markdown')) {
  throw new Error('Not a markdown file');
}

async function render() {
  // Get raw markdown content
  const pre = document.querySelector('pre');
  const raw = pre?.textContent || document.body.innerText;

  if (!raw.trim()) return;

  // Configure marked with async code highlighting
  const renderer = new marked.Renderer();

  // Store code blocks for async processing
  const codeBlocks: { id: string; code: string; lang: string }[] = [];
  let blockId = 0;

  renderer.code = ({ text, lang }) => {
    const id = `code-block-${blockId++}`;
    codeBlocks.push({ id, code: text, lang: lang || 'text' });
    return `<div id="${id}" class="shiki-placeholder"></div>`;
  };

  marked.use({ renderer, gfm: true, breaks: false });

  // Parse markdown
  const html = await marked.parse(raw);

  // Create container
  const container = document.createElement('div');
  container.className = 'markdown-body';
  container.innerHTML = html;

  // Replace document
  document.head.innerHTML = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${document.title || 'Markdown'}</title>
  `;
  document.body.innerHTML = '';
  document.body.appendChild(container);

  // Async highlight code blocks
  for (const block of codeBlocks) {
    const placeholder = document.getElementById(block.id);
    if (!placeholder) continue;

    try {
      // Check if language is supported
      const lang = block.lang in bundledLanguages ? block.lang : 'text';
      const highlighted = await codeToHtml(block.code, {
        lang,
        theme: 'github-dark',
      });
      placeholder.outerHTML = highlighted;
    } catch (e) {
      // Fallback to plain pre/code
      placeholder.outerHTML = `<pre><code>${escapeHtml(block.code)}</code></pre>`;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

render().catch(console.error);
