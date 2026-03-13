import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import type { SEOProps, OpenGraphImage } from '../types';
import { useSEOContext } from '../context/SEOProvider';
import { renderTemplate, renderSeoTemplates } from '../utils/template-engine';

/**
 * SEO Component - Manages all meta tags and head elements
 *
 * Usage:
 * ```tsx
 * <SEO
 *   title="Home"
 *   description="Welcome to my app"
 *   canonical="https://example.com/"
 *   openGraph={{
 *     type: 'website',
 *     url: 'https://example.com/',
 *     image: 'https://example.com/og-image.jpg'
 *   }}
 * />
 * ```
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  lang,
  openGraph,
  twitter,
  jsonLd,
  nofollow = false,
  noindex = false,
  templateContext,
}) => {
  const { config, isDevelopment } = useSEOContext();

  const baseContext = useMemo(() => {
    return {
      sitetitle: config.appName,
      sep: '|',
      ...templateContext
    };
  }, [config.appName, templateContext]);

  // Format page title with app name and template engine
  const formattedTitle = useMemo(() => {
    const rawTitle = title || '';
    // If standard title provided with no templates, default to Title | AppName format
    let finalTitle = rawTitle;
    if (rawTitle && !rawTitle.includes('%%')) {
      finalTitle = `${rawTitle} %%sep%% %%sitetitle%%`;
    } else if (!rawTitle) {
      finalTitle = `%%sitetitle%%`;
    }
    return renderTemplate(finalTitle, baseContext);
  }, [title, baseContext]);

  // Use provided description or config default with template engine
  const finalDescription = useMemo(() => {
    return renderTemplate(description || config.defaultDescription || '', baseContext);
  }, [description, config.defaultDescription, baseContext]);

  // Determine canonical URL - strip query params and hash for SEO best practices
  const finalCanonical = useMemo(() => {
    if (canonical) return canonical;
    if (typeof window !== 'undefined') {
      // Use origin + pathname only, exclude search params and hash
      return `${window.location.origin}${window.location.pathname}`;
    }
    return config.hostname;
  }, [canonical, config.hostname]);

  // Build OpenGraph tags
  const parsedOpenGraph = useMemo(() => {
    return openGraph ? renderSeoTemplates(openGraph, baseContext) : openGraph;
  }, [openGraph, baseContext]);

  const ogImage = useMemo(() => {
    let image = parsedOpenGraph?.image || config.defaultOGImage;
    if (typeof image === 'string') {
      return image;
    }
    if (Array.isArray(image) && image.length > 0) {
      return (image[0] as OpenGraphImage).url;
    }
    return config.defaultOGImage;
  }, [parsedOpenGraph?.image, config.defaultOGImage]);

  // Warn in development about missing critical metadata
  useMemo(() => {
    if (isDevelopment) {
      const warnings: string[] = [];

      if (!title) {
        warnings.push('Missing SEO title');
      }

      if (!finalDescription) {
        warnings.push('Missing SEO description');
      }

      if (openGraph && !ogImage) {
        warnings.push('OpenGraph specified but no image provided');
      }

      if (warnings.length > 0) {
        console.warn('[SEO Kit] Page metadata warnings:', warnings);
      }
    }
  }, [title, finalDescription, openGraph, ogImage, isDevelopment]);

  // Normalize jsonLd to array
  const jsonLdArray = useMemo(() => {
    if (!jsonLd) return undefined;
    return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  }, [jsonLd]);

  const robotsMeta = useMemo(() => {
    const parts: string[] = [];
    if (noindex) parts.push('noindex');
    if (nofollow) parts.push('nofollow');
    return parts.length > 0 ? parts.join(',') : undefined;
  }, [noindex, nofollow]);

  return (
    <Helmet>
      {/* Language */}
      <html lang={lang || config.lang || 'en'} />

      {/* Standard Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={finalDescription} />
      {robotsMeta && <meta name="robots" content={robotsMeta} />}
      <link rel="canonical" href={finalCanonical} />

      {/* OpenGraph Tags */}
      <meta property="og:type" content={parsedOpenGraph?.type || 'website'} />
      <meta property="og:title" content={parsedOpenGraph?.title || formattedTitle} />
      <meta property="og:description" content={parsedOpenGraph?.description || finalDescription} />
      <meta property="og:url" content={parsedOpenGraph?.url || finalCanonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {typeof parsedOpenGraph?.image === 'object' &&
        Array.isArray(parsedOpenGraph.image) &&
        parsedOpenGraph.image.map((img: OpenGraphImage, index: number) => (
          <React.Fragment key={`og-image-${index}`}>
            <meta property="og:image" content={img.url} />
            {img.width && <meta property="og:image:width" content={img.width.toString()} />}
            {img.height && <meta property="og:image:height" content={img.height.toString()} />}
            {img.alt && <meta property="og:image:alt" content={img.alt} />}
          </React.Fragment>
        ))}
      {parsedOpenGraph?.siteName && <meta property="og:site_name" content={parsedOpenGraph.siteName} />}
      {parsedOpenGraph?.locale && <meta property="og:locale" content={parsedOpenGraph.locale} />}

      {/* Twitter Card Tags */}
      {twitter && (
        <>
          <meta name="twitter:card" content={twitter.card || 'summary'} />
          {twitter.site && <meta name="twitter:site" content={renderTemplate(twitter.site, baseContext)} />}
          {twitter.creator && <meta name="twitter:creator" content={renderTemplate(twitter.creator, baseContext)} />}
          {twitter.title && <meta name="twitter:title" content={renderTemplate(twitter.title, baseContext)} />}
          {twitter.description && <meta name="twitter:description" content={renderTemplate(twitter.description, baseContext)} />}
          {twitter.image && <meta name="twitter:image" content={twitter.image} />}
        </>
      )}

      {/* JSON-LD Structured Data */}
      {jsonLdArray &&
        jsonLdArray.map((schema, index) => {
          // XSS Protection: Escape < characters to prevent script injection
          const safeJsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
          return (
            <script
              key={`json-ld-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: safeJsonLd }}
            />
          );
        })}
    </Helmet>
  );
};
