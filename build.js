import * as esbuild from 'esbuild';
import { copyFileSync } from 'fs';

const watch = process.argv.includes('--watch');

const shared = {
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: !watch,
};

const ctx = await esbuild.context({
  ...shared,
  entryPoints: ['src/content.ts'],
  outfile: 'dist/content.js',
});

const highlighterCtx = await esbuild.context({
  ...shared,
  entryPoints: ['src/highlighter.ts'],
  outfile: 'dist/highlighter.js',
});

const mermaidCtx = await esbuild.context({
  ...shared,
  entryPoints: ['src/mermaid.ts'],
  outfile: 'dist/mermaid.js',
});

// Copy CSS to dist
copyFileSync('src/styles.css', 'dist/styles.css');

if (watch) {
  await Promise.all([ctx.watch(), highlighterCtx.watch(), mermaidCtx.watch()]);
  console.log('Watching...');
} else {
  await Promise.all([ctx.rebuild(), highlighterCtx.rebuild(), mermaidCtx.rebuild()]);
  await Promise.all([ctx.dispose(), highlighterCtx.dispose(), mermaidCtx.dispose()]);
  console.log('Build complete');
}
