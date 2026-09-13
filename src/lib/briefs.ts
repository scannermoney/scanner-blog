import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AstroIntegration } from 'astro';

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export interface BriefMeta {
  date: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  ogImage?: string;
  published?: boolean;
  /** Absolute path to content/briefs/YYYY-MM-DD */
  dir: string;
}

export interface Brief extends BriefMeta {
  /** Public path /briefs/YYYY-MM-DD/slug/ */
  href: string;
  bodyHtml: string;
  packageStyles: string;
  /** Site-relative OG image path */
  ogImageHref: string;
}

export function briefsRoot(cwd = process.cwd()): string {
  return path.join(cwd, 'content', 'briefs');
}

// Discover content/briefs/<date>/meta.json where published !== false.
export function loadBriefMetas(cwd = process.cwd()): BriefMeta[] {
  const root = briefsRoot(cwd);
  if (!fs.existsSync(root)) return [];

  const briefs: BriefMeta[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !DATE_DIR.test(entry.name)) continue;

    const dir = path.join(root, entry.name);
    const metaPath = path.join(dir, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const data = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as Partial<BriefMeta>;
    if (data.published === false) continue;
    if (!data.slug || !data.title) {
      throw new Error(`Invalid brief meta at ${metaPath}: slug and title are required`);
    }

    let date = data.date || entry.name;
    if (date !== entry.name) {
      console.warn(
        `[briefs] folder ${entry.name} does not match meta.date ${date}; using folder name for URL`,
      );
      date = entry.name;
    }

    briefs.push({
      date,
      slug: data.slug,
      title: data.title,
      description: data.description ?? '',
      type: data.type ?? 'brief',
      ogImage: data.ogImage,
      published: data.published,
      dir,
    });
  }

  briefs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return briefs;
}

export function extractPackageHtml(html: string): { bodyHtml: string; packageStyles: string } {
  const packageStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1].trim())
    .filter(Boolean)
    .join('\n\n');

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1].trim() : html;

  // Package logo lives in charts/ even when the HTML points at assets/
  bodyHtml = bodyHtml.replace(/(src|href)=(["'])(?:\.\/)?assets\//gi, '$1=$2charts/');

  return { bodyHtml, packageStyles };
}

export function getPublishedBriefs(cwd = process.cwd()): Brief[] {
  const briefs: Brief[] = [];

  for (const meta of loadBriefMetas(cwd)) {
    const htmlPath = path.join(meta.dir, 'index.html');
    if (!fs.existsSync(htmlPath)) {
      console.warn(`[briefs] skipping ${meta.date}/${meta.slug}: missing index.html`);
      continue;
    }

    const { bodyHtml, packageStyles } = extractPackageHtml(fs.readFileSync(htmlPath, 'utf8'));
    const href = `/briefs/${meta.date}/${meta.slug}/`;
    const ogImageHref = meta.ogImage
      ? meta.ogImage.startsWith('http')
        ? meta.ogImage
        : `${href}${meta.ogImage.replace(/^\.\//, '')}`
      : '/logo-256.png';

    briefs.push({ ...meta, href, bodyHtml, packageStyles, ogImageHref });
  }

  return briefs;
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function serveBriefCharts(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0] ?? '';
  const match = url.match(/^\/briefs\/(\d{4}-\d{2}-\d{2})\/([^/]+)\/charts\/(.+)$/);
  if (!match) {
    next();
    return;
  }

  const [, date, slug, rawFile] = match;
  const file = decodeURIComponent(rawFile);
  const brief = loadBriefMetas().find((b) => b.date === date && b.slug === slug);
  if (!brief) {
    next();
    return;
  }

  const chartsDir = path.resolve(brief.dir, 'charts');
  const resolved = path.resolve(chartsDir, file);
  if (resolved !== chartsDir && !resolved.startsWith(chartsDir + path.sep)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    next();
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(resolved).pipe(res);
}

function copyBriefCharts(outDir: string, cwd = process.cwd()) {
  for (const brief of getPublishedBriefs(cwd)) {
    const src = path.join(brief.dir, 'charts');
    if (!fs.existsSync(src)) continue;
    copyDir(src, path.join(outDir, 'briefs', brief.date, brief.slug, 'charts'));
  }
}

export function briefAssetsIntegration(): AstroIntegration {
  return {
    name: 'brief-assets',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'serve-brief-charts',
                configureServer(server) {
                  server.middlewares.use(serveBriefCharts);
                },
              },
            ],
          },
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        copyBriefCharts(fileURLToPath(dir));
        logger.info('Copied brief charts/ into dist');
      },
    },
  };
}

export function formatBriefDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
