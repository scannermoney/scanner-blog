# scanner.money blog

Static Astro site for dated market briefs. Separate from the scanner.money app.
Built for Cloudflare Pages.

Public site (when DNS is live): https://blog.scanner.money

## Requirements

- Node.js 22.12 or newer (`engines.node` is `>=22.12.0`; Astro 7 needs it)
- npm

## Ingest format

Drop a package here:

```text
content/briefs/YYYY-MM-DD/
  meta.json
  index.html
  charts/
```

`meta.json` fields:

| Field         | Notes                                              |
| ------------- | -------------------------------------------------- |
| `date`        | `YYYY-MM-DD` (should match the folder name)        |
| `slug`        | URL segment                                        |
| `title`       | Homepage, post `<title>`, RSS                      |
| `description` | Homepage, meta, RSS                                |
| `type`        | e.g. `week-ahead`                                  |
| `ogImage`     | Relative to the package, usually `charts/….webp`   |
| `published`   | Omit or `true` to ship; `false` skips the brief    |

Public URL for each published brief:

```text
/briefs/YYYY-MM-DD/<slug>/
```

Example from the sample package:

```text
/briefs/2026-09-13/week-ahead-fomc/
```

The build walks every `content/briefs/*/meta.json` and ignores `published: false`.
Each post page inlines the package `<body>` and `<style>` (iframe-free) so `charts/`
paths resolve next to the post. `assets/` image URLs in the package HTML are rewritten
to `charts/` (that is where the sample logo lives).

## Local commands

```sh
npm install
npm run dev       # http://localhost:4321/
npm run build     # writes ./dist
npm run preview   # serve dist
```

After `npm run build`, confirm:

- `dist/index.html`
- `dist/briefs/2026-09-13/week-ahead-fomc/index.html`
- `dist/rss.xml`
- chart files under `dist/briefs/2026-09-13/week-ahead-fomc/charts/`

## Deploy to Cloudflare Pages

Do not deploy from this box until the GitHub repo exists. When ready:

**Git-connected project (preferred)**

1. Push this directory to GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Framework preset: Astro (or None).
4. Build command: `npm run build`
5. Output directory: `dist`
6. Node version: `22` (set `NODE_VERSION=22` in Pages environment variables, or add an `.nvmrc` — this repo has `22`).
7. First deploy prints a `*.pages.dev` hostname.

**Direct upload with Wrangler**

```sh
npm run build
npx wrangler pages project create scanner-blog
npx wrangler pages deploy dist --project-name=scanner-blog
```

Copy the printed `https://<project>.pages.dev` hostname into DNS (see below).
This repo does not include Wrangler as a dependency; use `npx`.

No secrets belong in this tree. Pages env vars are only for Cloudflare-side settings
such as `NODE_VERSION`.

## DNS

See [docs/DNS-CHECKLIST.md](docs/DNS-CHECKLIST.md).

- Apex `scanner.money` and `tools.scanner.money` stay untouched.
- Blog host is `blog.scanner.money` → CNAME to the Pages `*.pages.dev` hostname
  (placeholder until the first deploy).

## Stack

- Astro latest stable, `output: 'static'`
- TypeScript
- No adapter (pure static HTML for Cloudflare Pages)
