import type { AIResponse, AIRequest, AuditResult, PageContent, AIModel } from './types';

/**
 * AI Service Layer - Handles all AI model integration
 * Supports: OpenAI, Gemini, Claude, Perplexity, Deepseek
 */

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**
 * Custom error for rate limit exceeded responses
 */
export class RateLimitError extends Error {
  retryAfter: number;
  tokensRemaining: number;

  constructor(retryAfter: number, tokensRemaining: number) {
    const minutes = Math.ceil(retryAfter / 60);
    super(`Rate limit exceeded. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.tokensRemaining = tokensRemaining;
  }
}

export class AIService {
  private model: AIModel | null = null;

  /**
   * Initialize with a specific AI model
   */
  async initialize(modelId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/ai-models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch AI models');

    const models = await response.json();
    this.model = models.find((m: AIModel) => m.id === modelId);

    if (!this.model) throw new Error('AI model not found');
  }

  /**
   * Get active AI models
   */
  async getActiveModels(): Promise<AIModel[]> {
    const response = await fetch(`${API_BASE}/ai-models?active=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch active models');
    return response.json();
  }

  /**
   * Send request to AI model via Edge Function
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.model) throw new Error('AI model not initialized');

    const response = await fetch(`${API_BASE}/ai-generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: this.model.id,
        provider: this.model.provider,
        ...request,
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const errorData = await response.json();
      throw new RateLimitError(
        errorData.retryAfter || 60,
        errorData.tokensRemaining || 0
      );
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI request failed');
    }

    return response.json();
  }

  /**
   * Audit page content for SEO issues
   */
  async auditPage(content: PageContent): Promise<AuditResult> {
    const prompt = this.buildAuditPrompt(content);

    const response = await this.sendRequest({
      prompt,
      systemMessage: `You are an expert SEO auditor. Analyze the provided page content and return a comprehensive JSON audit report. Always return valid JSON.`,
      maxTokens: 4000,
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const auditData = JSON.parse(jsonMatch[0]);

      return {
        pageId: content.path,
        aiModelId: this.model!.id,
        auditType: 'comprehensive',
        issues: auditData.issues || [],
        suggestions: auditData.suggestions || [],
        score: auditData.score || 0,
        h1Issues: auditData.h1Issues || [],
        h2HierarchyIssues: auditData.h2HierarchyIssues || [],
        metadataIssues: auditData.metadataIssues || [],
        schemaIssues: auditData.schemaIssues || [],
        readabilityScore: auditData.readabilityScore || 0,
        seoScore: auditData.seoScore || 0,
      };
    } catch (error) {
      console.error('Failed to parse audit response:', error);
      throw new Error('Failed to parse audit results');
    }
  }

  /**
   * Audit H1/H2 hierarchy
   */
  async auditHeadingHierarchy(content: PageContent): Promise<{
    h1Count: number;
    issues: string[];
    recommendations: string[];
  }> {
    const headings = content.headings;
    const issues: string[] = [];
    const recommendations: string[] = [];

    const h1Count = headings.filter(h => h.level === 1).length;

    if (h1Count === 0) {
      issues.push('No H1 tag found on page');
      recommendations.push('Add exactly one H1 tag as the main page title');
    } else if (h1Count > 1) {
      issues.push(`Multiple H1 tags found (${h1Count}). Only one is recommended.`);
      recommendations.push('Keep only one H1 tag per page');
    }

    // Check H2 hierarchy
    let lastH1Index = -1;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].level === 1) {
        lastH1Index = i;
      } else if (headings[i].level === 3 && lastH1Index === -1) {
        issues.push('H3 found before any H1');
        recommendations.push('Ensure proper heading hierarchy starting with H1');
      } else if (headings[i].level > 2 && i > 0 && headings[i - 1].level !== headings[i].level - 1) {
        issues.push(`Heading hierarchy skip detected: ${headings[i - 1].level} to ${headings[i].level}`);
      }
    }

    return { h1Count, issues, recommendations };
  }

  /**
   * Suggest metadata improvements
   */
  async suggestMetadata(content: PageContent): Promise<{
    title: { current: string; suggested: string; score: number };
    description: { current: string; suggested: string; score: number };
  }> {
    const prompt = `
      Based on this page content, suggest improved SEO metadata:

      Title: "${content.title}"
      Description: "${content.description}"
      Content summary: "${content.rawContent.substring(0, 500)}..."

      Provide suggestions for:
      1. A better title (50-60 characters optimal)
      2. A better description (150-160 characters optimal)

      Return JSON with: { title: { current, suggested, score }, description: { current, suggested, score } }
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 1000,
      temperature: 0.5,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse metadata suggestions:', error);
      throw new Error('Failed to generate metadata suggestions');
    }
  }

  /**
   * Generate alt text for images
   */
  async generateAltText(_imageUrl: string, context: string): Promise<string> {
    const prompt = `
      Generate a concise, descriptive alt text for an image in context of: ${context}

      Requirements:
      - 8-125 characters
      - Descriptive but concise
      - Include key details
      - Don't start with "image of" or "picture of"

      Return only the alt text, no quotes or explanation.
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 50,
      temperature: 0.7,
    });

    return response.content.trim();
  }

  /**
   * Suggest schema for page
   */
  async suggestSchema(content: PageContent, pageType: string = 'WebPage'): Promise<Record<string, unknown>> {
    const prompt = `
      Generate a complete JSON-LD schema for a ${pageType} with this content:
      Title: "${content.title}"
      Description: "${content.description}"
      Content: "${content.rawContent.substring(0, 300)}..."

      Return only valid JSON-LD schema, no markdown or explanation.
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse schema:', error);
      throw new Error('Failed to generate schema');
    }
  }

  /**
   * Optimize URL
   */
  async optimizeURL(currentUrl: string, contentSummary: string): Promise<string> {
    const prompt = `
      Optimize this URL for SEO:
      Current: "${currentUrl}"
      Content: "${contentSummary}"

      Requirements:
      - Use hyphens not underscores
      - Include relevant keywords
      - Keep it concise (max 75 characters)
      - Use lowercase

      Return only the optimized URL slug, no slashes or domain.
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 100,
      temperature: 0.5,
    });

    return response.content.trim().toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Analyze content readability
   */
  async analyzeReadability(content: string): Promise<{
    readabilityScore: number;
    suggestions: string[];
    sentenceLength: number;
    paragraphLength: number;
  }> {
    const prompt = `
      Analyze the readability of this content and return a JSON report:

      "${content.substring(0, 500)}..."

      Return JSON with: {
        readabilityScore: 0-100,
        suggestions: ["suggestion1", "suggestion2"],
        sentenceLength: average,
        paragraphLength: average
      }
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 500,
      temperature: 0.3,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse readability:', error);
      throw new Error('Failed to analyze readability');
    }
  }

  /**
   * Generate blog post from outline
   */
  async generateBlogPost(
    title: string,
    outline: string[],
    targetKeywords: string
  ): Promise<string> {
    const prompt = `
      Write an SEO-optimized blog post with:
      Title: "${title}"
      Target keywords: "${targetKeywords}"
      Outline: ${outline.join('\n')}

      Requirements:
      - Professional tone
      - Include keywords naturally
      - Well-structured with headings
      - Approximately 1000-1500 words
      - Include a conclusion

      Return only the blog post content in markdown format.
    `;

    const response = await this.sendRequest({
      prompt,
      maxTokens: 3000,
      temperature: 0.7,
    });

    return response.content;
  }

  /**
   * Build comprehensive audit prompt
   */
  private buildAuditPrompt(content: PageContent): string {
    return `
      Conduct a comprehensive SEO audit of this page and return a detailed JSON report.

      Page Title: "${content.title}"
      Meta Description: "${content.description}"
      URL: "${content.path}"
      Word Count: ${content.wordCount}

      Headings:
      ${content.headings.map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n')}

      Images: ${content.images.length} found
      ${content.images.map(img => `- src: ${img.src}, alt: "${img.alt}"`).join('\n')}

      Links: ${content.links.length} found

      Content preview: "${content.rawContent.substring(0, 300)}..."

      Analyze for:
      1. H1/H2 hierarchy issues
      2. Meta title/description quality
      3. Image alt text completeness
      4. Keyword optimization
      5. Content quality and readability
      6. Schema markup suggestions
      7. URL optimization
      8. Internal/external link balance

      Return JSON with structure:
      {
        issues: [{type, severity, message, suggestion}],
        suggestions: [{type, priority, title, description, action, estimatedImpact}],
        score: 0-100,
        h1Issues: [],
        h2HierarchyIssues: [],
        metadataIssues: [],
        schemaIssues: [],
        readabilityScore: 0-100,
        seoScore: 0-100
      }
    `;
  }
}

export const createAIService = (): AIService => new AIService();
