import { useState, useCallback, useEffect } from 'react';
import { AIService } from './service';
import { BlogService } from './blog';
import { PageCrawler } from './crawler';
import type { AIModel, AuditResult, BlogPost, PageContent } from './types';

/**
 * Custom Hooks for AI SEO Management
 */

/**
 * useAIModels - Manage available AI models
 */
export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const service = new AIService();
      const activeModels = await service.getActiveModels();
      setModels(activeModels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, []);

  return { models, loading, error, fetchModels };
}

/**
 * useAIAudit - Perform page audits
 */
export function useAIAudit() {
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const auditPage = useCallback(async (pagePath: string, modelId: string) => {
    setAuditing(true);
    setError(null);
    try {
      // Crawl page
      const content = await PageCrawler.crawlPage(pagePath);

      // Initialize AI service
      const service = new AIService();
      await service.initialize(modelId);

      // Perform audit
      const result = await service.auditPage(content);
      setAuditResult(result);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audit failed';
      setError(message);
      throw err;
    } finally {
      setAuditing(false);
    }
  }, []);

  return { auditing, auditResult, error, auditPage };
}

/**
 * useBlogPost - Manage single blog post
 */
export function useBlogPost(initialSlug?: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await BlogService.getPostBySlug(slug);
      setPost(loaded);
      return loaded;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load post';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (newPost: BlogPost) => {
    setLoading(true);
    setError(null);
    try {
      const created = await BlogService.createPost(newPost);
      setPost(created);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePost = useCallback(
    async (id: string, updates: Partial<BlogPost>) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await BlogService.updatePost(id, updates);
        setPost(updated);
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update post';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePost = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await BlogService.deletePost(id);
      setPost(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSlug) {
      loadPost(initialSlug).catch(console.error);
    }
  }, [initialSlug, loadPost]);

  return {
    post,
    loading,
    error,
    loadPost,
    createPost,
    updatePost,
    deletePost,
  };
}

/**
 * useBlogPosts - Manage multiple blog posts
 */
export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (published: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await BlogService.getAllPosts(published);
      setPosts(fetched);
      return fetched;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await BlogService.searchPosts(query);
      setPosts(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await BlogService.getPostsByCategory(category);
      setPosts(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getByTag = useCallback(async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await BlogService.getPostsByTag(tag);
      setPosts(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    search,
    getByCategory,
    getByTag,
  };
}

/**
 * usePageContent - Crawl and analyze page content
 */
export function usePageContent() {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crawlPage = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const crawled = await PageCrawler.crawlPage(path, {
        includeContent: true,
        parseHeadings: true,
        parseImages: true,
        parseLinks: true,
      });
      setContent(crawled);
      return crawled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to crawl page';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStructure = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      return await PageCrawler.getPageStructure(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get structure';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { content, loading, error, crawlPage, getStructure };
}

/**
 * useBlogValidation - Validate blog post SEO
 */
export function useBlogValidation() {
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = useCallback((post: BlogPost) => {
    setLoading(true);
    try {
      const result = BlogService.validateSEO(post);
      setValidationResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { validationResult, loading, validate };
}
