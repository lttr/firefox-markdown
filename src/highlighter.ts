import { createHighlighter, bundledLanguages, type BundledLanguage } from 'shiki/bundle/web';

async function highlight() {
  const placeholders = document.querySelectorAll<HTMLElement>('.shiki-placeholder');
  if (placeholders.length === 0) return;

  const usedLangs = [...new Set(
    Array.from(placeholders).map(el => el.dataset.lang || 'text')
  )];
  const validLangs = usedLangs.filter((l): l is BundledLanguage => l in bundledLanguages);

  const highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: [],
  });

  if (validLangs.length > 0) {
    await highlighter.loadLanguage(...validLangs);
  }

  for (const el of placeholders) {
    const lang = el.dataset.lang || 'text';
    const code = decodeURIComponent(el.dataset.code || '');

    try {
      const resolvedLang = lang in bundledLanguages ? lang : 'text';
      el.outerHTML = highlighter.codeToHtml(code, {
        lang: resolvedLang,
        theme: 'github-dark',
      });
    } catch {
      el.outerHTML = `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

highlight().catch(console.error);
