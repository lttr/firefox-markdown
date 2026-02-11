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

// Copy CSS to dist
copyFileSync('src/styles.css', 'dist/styles.css');

if (watch) {
  await Promise.all([ctx.watch(), highlighterCtx.watch()]);
  console.log('Watching...');
} else {
  await Promise.all([ctx.rebuild(), highlighterCtx.rebuild()]);
  await Promise.all([ctx.dispose(), highlighterCtx.dispose()]);
  console.log('Build complete');
}
