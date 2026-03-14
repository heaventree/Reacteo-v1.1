import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SitemapStream, streamToPromise, SitemapIndexStream } from 'sitemap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Post-build script: Generate chunked sitemaps for enterprise scale (10k+ pages)
 *
 * Features:
 * - Automatic chunking at 40,000 URLs per file (under 50k Google limit)
 * - Sitemap index generation for multi-file sitemaps
 * - Validation and error handling
 *
 * Usage: npm run postbuild
 */

const MAX_URLS_PER_SITEMAP = 40000;

async function generateSitemap() {
  try {
    // Import the SEO config
    const distConfigPath = path.resolve(__dirname, '../dist/seo-config.js');

    let seoConfig;
    if (fs.existsSync(distConfigPath)) {
      const configModule = await import(`file://${distConfigPath}`);
      seoConfig = configModule.seoConfig || configModule.default;
    } else {
      console.warn(
        '⚠️  Compiled seo-config.js not found. Make sure to build first with: npm run build'
      );
      process.exit(1);
    }

    if (!seoConfig) {
      console.error('❌ Failed to load SEO configuration');
      process.exit(1);
    }

    const { hostname, routes } = seoConfig;

    if (!hostname) {
      console.error('❌ SEO configuration missing hostname');
      process.exit(1);
    }

    if (!routes || routes.length === 0) {
      console.error('❌ SEO configuration has no routes');
      process.exit(1);
    }

    // Create dist directory if it doesn't exist
    const distDir = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Calculate number of chunks needed
    const totalRoutes = routes.length;
    const numChunks = Math.ceil(totalRoutes / MAX_URLS_PER_SITEMAP);

    console.log(`📊 Sitemap Generation Statistics:`);
    console.log(`   Total Routes: ${totalRoutes}`);
    console.log(`   Chunks Needed: ${numChunks}`);
    console.log(`   Max URLs per Chunk: ${MAX_URLS_PER_SITEMAP}`);

    const sitemapFiles: string[] = [];

    // Generate individual sitemap chunks
    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const startIndex = chunkIndex * MAX_URLS_PER_SITEMAP;
      const endIndex = Math.min(startIndex + MAX_URLS_PER_SITEMAP, totalRoutes);
      const chunkRoutes = routes.slice(startIndex, endIndex);

      const smStream = new SitemapStream({
        hostname,
        xmlns: {
          news: false,
          xhtml: false,
          image: false,
          video: false,
        },
      });

      // Add routes to this chunk
      chunkRoutes.forEach((route) => {
        smStream.write({
          url: route.path,
          changefreq: route.changefreq || 'daily',
          priority: route.priority !== undefined ? route.priority : 0.8,
          lastmod: new Date().toISOString(),
        });
      });

      smStream.end();

      const sitemap = await streamToPromise(smStream);
      const sitemapXml = sitemap.toString();

      // Validate chunk
      if (!sitemapXml.includes('<?xml') || !sitemapXml.includes('</urlset>')) {
        console.error(`❌ Generated sitemap chunk ${chunkIndex + 1} is invalid`);
        process.exit(1);
      }

      // Write chunk file
      const filename = numChunks > 1 ? `sitemap-${chunkIndex + 1}.xml` : 'sitemap.xml';
      const filepath = path.join(distDir, filename);
      fs.writeFileSync(filepath, sitemapXml, 'utf-8');
      sitemapFiles.push(filename);

      console.log(`   ✅ Generated ${filename} (${endIndex - startIndex} URLs)`);
    }

    // Generate sitemap index if multiple chunks
    if (numChunks > 1) {
      const sitemapIndexStream = new SitemapIndexStream();

      sitemapFiles.forEach((file) => {
        sitemapIndexStream.write({
          url: `${hostname}/${file}`,
          lastmod: new Date().toISOString(),
        });
      });

      sitemapIndexStream.end();

      const sitemapIndex = await streamToPromise(sitemapIndexStream);
      const sitemapIndexXml = sitemapIndex.toString();

      // Validate index
      if (!sitemapIndexXml.includes('<?xml') || !sitemapIndexXml.includes('</sitemapindex>')) {
        console.error('❌ Generated sitemap index is invalid');
        process.exit(1);
      }

      const indexPath = path.join(distDir, 'sitemap-index.xml');
      fs.writeFileSync(indexPath, sitemapIndexXml, 'utf-8');

      console.log(`\n✅ Sitemap index generated successfully!`);
      console.log(`   Primary file: sitemap-index.xml`);
      console.log(`   Chunk files: ${sitemapFiles.join(', ')}`);
    } else {
      console.log(`\n✅ Sitemap generated successfully!`);
      console.log(`   File: sitemap.xml`);
    }

    console.log(`   Hostname: ${hostname}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();