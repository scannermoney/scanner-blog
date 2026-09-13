# DNS checklist for blog.scanner.money

Target: Cloudflare Pages project (name TBD, e.g. `scanner-blog`).
Do NOT change records for apex scanner.money or tools.scanner.money.

Build output for Pages is `dist/` (`npm run build`). Node 22+.
The Pages hostname below is still a placeholder until the first deploy.

## Records Pascal must add (Cloudflare DNS for scanner.money)

1. CNAME
   - Name: `blog`
   - Target: `<pages-project>.pages.dev` (exact hostname from Cloudflare Pages custom domains UI or the first `wrangler pages deploy` / Git deploy URL)
   - Proxy: Proxied (orange cloud) recommended

2. Optional verification
   - If Cloudflare asks for a TXT ownership check for the custom domain, add exactly what the Pages UI shows.

## After DNS

- Confirm https://blog.scanner.money loads the index
- Sample post URL shape: https://blog.scanner.money/briefs/2026-09-13/week-ahead-fomc/
- RSS: https://blog.scanner.money/rss.xml

## Approvals / codes

- Email verification for Cloudflare or domain: Pascal via help@scanner.money (route through Marketing Chief)
