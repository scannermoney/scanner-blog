import type { APIRoute } from 'astro';
import { getPublishedBriefs, xmlEscape } from '../lib/briefs';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://blog.scanner.money')).toString().replace(/\/$/, '');
  const items = getPublishedBriefs()
    .map((brief) => {
      const link = `${origin}${brief.href}`;
      const pubDate = new Date(`${brief.date}T12:00:00Z`).toUTCString();
      return `    <item>
      <title>${xmlEscape(brief.title)}</title>
      <description>${xmlEscape(brief.description)}</description>
      <link>${xmlEscape(link)}</link>
      <guid>${xmlEscape(link)}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>scanner.money blog</title>
    <description>Market briefs from the scanner.money desk.</description>
    <link>${xmlEscape(`${origin}/`)}</link>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
