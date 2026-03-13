/**
 * Template Engine for Reacteo SEO
 * Parses and replaces `%%tag%%` variables within strings based on a context object.
 */

export interface TemplateContext {
  sitetitle?: string;
  sitedesc?: string;
  sep?: string;
  current_url?: string;
  current_date?: string;
  current_year?: string;
  
  // Post/Page specific
  post_title?: string;
  post_excerpt?: string;
  post_content?: string;
  post_date?: string;
  post_modified?: string;
  post_author?: string;
  category?: string;
  
  // Allow any other custom tag
  [key: string]: string | undefined;
}

export const defaultTemplateContext: TemplateContext = {
  sitetitle: '',
  sitedesc: '',
  sep: '-',
  current_url: typeof window !== 'undefined' ? window.location.href : '',
  current_date: new Date().toLocaleDateString(),
  current_year: new Date().getFullYear().toString(),
};

/**
 * Replaces tags like `%%post_title%%` in a template string with actual values from the context.
 * Empty or missing values will be replaced with an empty string, and multiple spaces cleaned up.
 */
export function renderTemplate(template: string | undefined, context: TemplateContext): string {
  if (!template) return '';
  
  const mergedContext = { ...defaultTemplateContext, ...context };
  
  let result = template;
  
  // Find all %%tags%%
  const regex = /%%([a-zA-Z0-9_]+)%%/g;
  
  result = result.replace(regex, (match, tag) => {
    const value = mergedContext[tag];
    return value !== undefined && value !== null ? String(value) : '';
  });
  
  // Clean up any double spaces or dangling separators left behind by empty replacements
  // E.g. "My Title |  | My Site" -> "My Title | My Site"
  // E.g. " | My Site" -> "My Site"
  
  const sepEscaped = mergedContext.sep ? mergedContext.sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '-';
  
  // Remove empty spaces around separators
  const cleanupRegex = new RegExp(`\\s*(?:${sepEscaped}\\s*)+`, 'g');
  result = result.replace(cleanupRegex, ` ${mergedContext.sep} `);
  
  // Remove leading/trailing separators
  const edgeRegex = new RegExp(`^(?:\\s*${sepEscaped}\\s*)+|(?:\\s*${sepEscaped}\\s*)+$`, 'g');
  result = result.replace(edgeRegex, '');
  
  return result.trim();
}

/**
 * Processes an entire object of SEO templates (e.g. title, description), rendering them string by string.
 */
export function renderSeoTemplates<T extends Record<string, unknown>>(templates: T, context: TemplateContext): T {
  const rendered: Record<string, unknown> = { ...templates };
  
  for (const key in rendered) {
    if (Object.prototype.hasOwnProperty.call(rendered, key)) {
      if (key === '__proto__' || key === 'constructor') continue;

      if (typeof rendered[key] === 'string') {
        rendered[key] = renderTemplate(rendered[key] as string, context);
      } else if (typeof rendered[key] === 'object' && rendered[key] !== null) {
        if (!Array.isArray(rendered[key])) {
           rendered[key] = renderSeoTemplates(rendered[key] as Record<string, unknown>, context);
        }
      }
    }
  }
  
  return rendered as T;
}
