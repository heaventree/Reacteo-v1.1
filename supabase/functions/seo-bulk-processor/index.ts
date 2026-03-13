import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Mock template engine (in reality you'd share this code with frontend or use a specialized Deno port)
function renderTemplate(template: string, context: Record<string, string>): string {
  if (!template) return '';
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`%%${key}%%`, 'g'), value || '');
  }
  // cleanup dangling separators
  result = result.replace(/\s*\|\s*\|\s*/g, ' | ').replace(/^[|\s]+|[|\s]+$/g, '');
  return result;
}

serve(async (req) => {
  // CORS configuration
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' } });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { targetPageIds } = await req.json();

    if (!targetPageIds || !Array.isArray(targetPageIds)) {
      throw new Error("Missing targetPageIds array");
    }

    console.log(`Starting bulk SEO processor for ${targetPageIds.length} pages...`);

    // Fetch the global settings and templates
    const { data: globalSettings } = await supabaseClient.from('seo_global_settings').select('*').single();
    const { data: templates } = await supabaseClient.from('seo_templates').select('*');
    
    // Process each page
    for (const pageId of targetPageIds) {
      // 1. Fetch Page
      const { data: page } = await supabaseClient.from('seo_pages').select('*, seo_content(*)').eq('id', pageId).single();
      if (!page) continue;

      // 2. Find matching template based on route
      // Very naive routing check for demo purposes
      const template = templates?.find(t => page.path.startsWith(t.route_pattern.replace('/*', '')));
      
      if (!template) continue;

      // 3. Prepare Context
      const rawContent = page.seo_content?.[0] || {};
      const context = {
        sitetitle: globalSettings?.site_name || 'My Site',
        sep: globalSettings?.default_separator || '|',
        post_title: rawContent.raw_content?.substring(0, 50) || page.title || '', // Fallback to extracted content
        post_excerpt: rawContent.raw_content?.substring(0, 160) || '',
      };

      // 4. Update the page if fields are empty
      const updates: Record<string, unknown> = {};
      
      // Title
      if (!page.title) {
        updates.title = renderTemplate(template.title_template, context);
      }
      
      // Description
      if (!page.description) {
        if (template.description_template && context.post_excerpt) {
           updates.description = renderTemplate(template.description_template, context);
        } else if (template.ai_fallback_enabled) {
          // Trigger AI Fallback
          console.log(`Triggering AI generation for ${page.path} description`);
          // Note: In real setup, you'd invoke the 'ai-generate' function directly or hit external API
          updates.description = `[AI Generated] ${context.post_excerpt.substring(0, 100)}...`;
          updates.generated_by_ai = true;
        }
      }

      // 5. Save if we made updates
      if (Object.keys(updates).length > 0) {
        await supabaseClient.from('seo_pages')
          .update(updates)
          .eq('id', pageId);
          
        console.log(`Updated SEO metadata for ${page.path}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${targetPageIds.length} pages` }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
