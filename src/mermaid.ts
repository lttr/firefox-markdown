import mermaid from 'mermaid';

async function renderMermaid() {
  const placeholders = document.querySelectorAll<HTMLElement>('.mermaid-placeholder');
  if (placeholders.length === 0) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose', // default 'strict' strips HTML from node labels; diagrams commonly use <br/> and <b>
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  });

  for (const [i, el] of Array.from(placeholders).entries()) {
    const code = decodeURIComponent(el.dataset.code || '');
    try {
      const { svg } = await mermaid.render(`mermaid-${i}`, code);
      el.outerHTML = `<div class="mermaid-diagram">${svg}</div>`;
    } catch (e) {
      console.error('[mermaid]', e);
    }
  }

  // Click-to-zoom: toggle fullscreen overlay
  for (const el of document.querySelectorAll<HTMLElement>('.mermaid-diagram')) {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      el.classList.toggle('mermaid-fullscreen');
      el.style.cursor = el.classList.contains('mermaid-fullscreen') ? 'zoom-out' : 'zoom-in';
    });
  }
}

renderMermaid().catch(console.error);
