// @ts-check
import { defineConfig } from 'astro/config';
import { briefAssetsIntegration } from './src/lib/briefs.ts';

export default defineConfig({
  site: 'https://blog.scanner.money',
  output: 'static',
  trailingSlash: 'always',
  integrations: [briefAssetsIntegration()],
});
