import type React from 'react';

export interface OpenGraphProps {
  type?: 'website' | 'article' | 'product' | 'video' | 'music' | 'profile';
  url?: string;
  title?: string;
  description?: string;
  image?: string | OpenGraphImage[];
  siteName?: string;
  locale?: string;
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

export interface TwitterCardProps {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface SchemaOrg {
  '@context'?: string;
  '@type': string;
  [key: string]: unknown;
}

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  lang?: string;
  openGraph?: OpenGraphProps;
  twitter?: TwitterCardProps;
  jsonLd?: SchemaOrg | SchemaOrg[];
  noindex?: boolean;
  nofollow?: boolean;
  templateContext?: Record<string, unknown>;
}

export interface RouteMetadata {
  path: string;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  label?: string;
  prerender?: boolean;
}

export interface SitemapEntry {
  url: string;
  changefreq?: string;
  priority?: number;
  lastmod?: string;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
}

export interface SEOConfig {
  hostname: string;
  appName: string;
  lang?: string;
  defaultDescription?: string;
  defaultOGImage?: string;
  routes: RouteMetadata[];
  environment?: 'development' | 'staging' | 'production';
}

export interface PreloadedState {
  [key: string]: unknown;
}

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  formats?: ('webp' | 'avif')[];
  sizes?: string;
  onError?: (error: Error) => void;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}
