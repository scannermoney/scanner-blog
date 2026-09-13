# DNS checklist for blog.scanner.money

Target: Cloudflare Pages project `scanner-blog`.
Production hostname: `scanner-blog.pages.dev` (live).
Do NOT change records for apex scanner.money or tools.scanner.money.

Build output for Pages is `dist/` (`npm run build`). Node 22+.

## Records Pascal must add (Cloudflare DNS for scanner.money)

1. CNAME
   - Name: `blog`
   - Target: `scanner-blog.pages.dev`
   - Proxy: Proxied (orange cloud) recommended

2. Custom domain in Pages
   - In Cloudflare Dashboard → Workers & Pages → scanner-blog → Custom domains, add `blog.scanner.money` so Pages accepts the hostname (required in addition to the DNS CNAME).

3. Optional verification
   - If Cloudflare asks for a TXT ownership check for the custom domain, add exactly what the Pages UI shows.

## After DNS

- Confirm https://blog.scanner.money loads the index
- Sample post URL shape: https://blog.scanner.money/briefs/2026-09-13/week-ahead-fomc/
- RSS: https://blog.scanner.money/rss.xml

## Live now (before custom domain)

- Index: https://scanner-blog.pages.dev/
- Sample post: https://scanner-blog.pages.dev/briefs/2026-09-13/week-ahead-fomc/
- RSS: https://scanner-blog.pages.dev/rss.xml

## Approvals / codes

- Email verification for Cloudflare or domain: Pascal via help@scanner.money (route through Marketing Chief)
