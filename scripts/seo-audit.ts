import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Pre-deployment audit script
 * Validates SEO readiness before deployment
 *
 * Usage: npm run seo:audit
 */

interface AuditResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: AuditResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function runAudit() {
  try {
    console.log('\n🔍 Running pre-deployment SEO audit...\n');

    const distDir = path.resolve(__dirname, '../dist');
    const sitemapPath = path.join(distDir, 'sitemap.xml');
    const robotsPath = path.join(distDir, 'robots.txt');
    const configPath = path.resolve(__dirname, '../seo-config.ts');

    // Check 1: seo-config.ts exists
    const configExists = fs.existsSync(configPath);
    addResult('SEO Config', configExists, configExists ? 'seo-config.ts found' : 'seo-config.ts not found');

    // Check 2: dist directory exists
    const distExists = fs.existsSync(distDir);
    addResult('Build Output', distExists, distExists ? 'dist/ directory found' : 'dist/ directory not found');

    if (!distExists) {
      console.log(
        '\n⚠️  Build not found. Run `npm run build` before deployment.\n'
      );
      process.exit(1);
    }

    // Check 3: sitemap.xml exists and is valid
    const sitemapExists = fs.existsSync(sitemapPath);
    let sitemapValid = false;
    let sitemapEntries = 0;

    if (sitemapExists) {
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      sitemapValid = sitemapContent.includes('<?xml') && sitemapContent.includes('</urlset>');
      sitemapEntries = (sitemapContent.match(/<url>/g) || []).length;
    }

    addResult(
      'Sitemap',
      sitemapExists && sitemapValid,
      sitemapExists
        ? sitemapValid
          ? `Valid sitemap with ${sitemapEntries} entries`
          : 'Sitemap exists but is invalid'
        : 'sitemap.xml not found'
    );

    // Check 4: robots.txt exists
    const robotsExists = fs.existsSync(robotsPath);
    addResult('Robots.txt', robotsExists, robotsExists ? 'robots.txt found' : 'robots.txt not found');

    // Check 5: HTML files exist in dist
    const indexPath = path.join(distDir, 'index.html');
    const indexExists = fs.existsSync(indexPath);
    addResult('Index HTML', indexExists, indexExists ? 'index.html found' : 'index.html not found');

    // Check 6: Count total HTML files
    let htmlCount = 0;
    try {
      const files = fs.readdirSync(distDir, { recursive: true });
      htmlCount = files.filter((f: string | Buffer) => typeof f === 'string' && f.endsWith('.html')).length;
    } catch {
      htmlCount = 0;
    }

    addResult(
      'HTML Files',
      htmlCount > 0,
      htmlCount > 0 ? `${htmlCount} HTML file(s) found` : 'No HTML files found'
    );

    // Summary
    console.log('\n' + '─'.repeat(50));
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    console.log(`\nAudit Results: ${passed}/${total} checks passed\n`);

    if (passed === total) {
      console.log('✅ All checks passed! Ready for deployment.\n');
      process.exit(0);
    } else {
      console.log('❌ Some checks failed. Review errors above before deploying.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Audit error:', error);
    process.exit(1);
  }
}

runAudit();
