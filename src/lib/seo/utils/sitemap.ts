/**
 * Dynamic Sitemap Generator
 * Designed to be imported and used within a backend API route (Next.js, Express, Remix).
 */

import { SitemapStream, streamToPromise } from 'sitemap';

export interface SitemapPageRecord {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export type SitemapFetcher = () => Promise<SitemapPageRecord[]>;

/**
 * Generates an XML sitemap dynamically using an async fetcher function.
 * Ideal for fetching thousands of URLs from a database at build time.
 */
export async function buildSitemapFromFetcher(
  fetcher: SitemapFetcher,
  hostname: string
): Promise<string> {
  const pages = await fetcher();
  return generateDynamicSitemap(pages, hostname);
}

/**
 * Generates an XML sitemap from a list of URLs.
 * Example Next.js Usage:
 * 
 * ```ts
 * // pages/api/sitemap.xml.ts
 * import { generateDynamicSitemap } from 'reacteo/utils/sitemap';
 * import { supabase } from '@/lib/supabase';
 * 
 * export default async function handler(req, res) {
 *   const { data } = await supabase.from('seo_pages').select('path, updated_at');
 *   const hostname = 'https://mysite.com';
 *   const pages = data.map(p => ({
 *     url: `${hostname}${p.path}`,
 *     lastmod: p.updated_at
 *   }));
 *   
 *   const xml = await generateDynamicSitemap(pages, hostname);
 *   res.setHeader('Content-Type', 'text/xml');
 *   res.write(xml);
 *   res.end();
 * }
 * ```
 */
export async function generateDynamicSitemap(
  pages: SitemapPageRecord[],
  hostname: string
): Promise<string> {
  const stream = new SitemapStream({ hostname });
  
  pages.forEach(page => {
    stream.write({
      url: page.url.replace(hostname, ''),
      lastmod: page.lastmod,
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || 0.8
    });
  });
  
  stream.end();
  
  const sitemapBuffer = await streamToPromise(stream);
  return sitemapBuffer.toString();
}

/**
 * Generates a Sitemap Index file pointing to multiple paginated sitemaps.
 * Used when you have > 50,000 pages and need sitemap-1.xml, sitemap-2.xml.
 */
export function generateSitemapIndex(hostname: string, totalSitemaps: number): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (let i = 1; i <= totalSitemaps; i++) {
    xml += `
  <sitemap>
    <loc>${hostname}/api/sitemap-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  }

  xml += '\n</sitemapindex>';
  return xml;
}
