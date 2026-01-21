import * as esbuild from 'esbuild';
import { copyFileSync } from 'fs';

const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/content.ts'],
  bundle: true,
  outfile: 'dist/content.js',
  format: 'iife',
  target: 'es2020',
  minify: !watch,
});

// Copy CSS to dist
copyFileSync('src/styles.css', 'dist/styles.css');

if (watch) {
  await ctx.watch();
  console.log('Watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('Build complete');
}
