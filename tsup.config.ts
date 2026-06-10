import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['scripts/cli.mts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  bundle: true,
  splitting: false,
  clean: true,
  external: ['jsdom', 'marked', 'dompurify', '@clack/prompts'],
  banner: {
    js: '#!/usr/bin/env node',
  },
})
