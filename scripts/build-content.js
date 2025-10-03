#!/usr/bin/env node
const { build, context } = require('esbuild');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isProduction = process.env.NODE_ENV === 'production';

const buildContent = async () => {
  try {
    const config = {
      entryPoints: [path.resolve(projectRoot, 'src/content/index.js')],
      bundle: true,
      outfile: path.resolve(projectRoot, 'dist/content.js'),
      format: 'iife',
      platform: 'browser',
      target: ['chrome114'],
      sourcemap: true,
      logLevel: 'info',
      minify: isProduction,
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    };

    if (isWatch) {
      if (typeof context !== 'function') {
        console.error('[build-content] Watch mode requires esbuild context API (>= 0.17).');
        process.exitCode = 1;
        return;
      }
      const ctx = await context(config);
      await ctx.watch();
      console.log('[build-content] Watching for changes... (press Ctrl+C to exit)');
    } else {
      await build(config);
    }
  } catch (error) {
    console.error('[build-content] Failed to bundle content script');
    if (error?.errors) {
      for (const issue of error.errors) {
        console.error(issue);
      }
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  }
};

buildContent();
