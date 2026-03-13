import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface AuditSuggestion {
  type?: string;
  priority?: string;
  title?: string;
  description?: string;
  action?: string;
  estimatedImpact?: string;
}

interface AuditRequest {
  pageId: string;
  aiModelId: string;
  auditType: string;
  issues: unknown[];
  suggestions: AuditSuggestion[];
  score: number;
  h1Issues: unknown[];
  h2HierarchyIssues: unknown[];
  metadataIssues: unknown[];
  schemaIssues: unknown[];
  readabilityScore: number;
  seoScore: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === "GET") {
      // Get audits for a page
      const pageId = url.searchParams.get("pageId");

      let query = supabase.from("ai_audits").select("*").order("timestamp", {
        ascending: false,
      });

      if (pageId) {
        query = query.eq("page_id", pageId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      // Create new audit
      const body: AuditRequest = await req.json();

      // Update page audit status
      await supabase
        .from("seo_pages")
        .update({ needs_audit: false, last_crawled: new Date().toISOString() })
        .eq("id", body.pageId);

      // Store audit results
      const { data, error } = await supabase
        .from("ai_audits")
        .insert([
          {
            page_id: body.pageId,
            ai_model_id: body.aiModelId,
            audit_type: body.auditType,
            issues: body.issues,
            suggestions: body.suggestions,
            score: body.score,
            h1_issues: body.h1Issues,
            h2_hierarchy_issues: body.h2HierarchyIssues,
            metadata_issues: body.metadataIssues,
            schema_issues: body.schemaIssues,
            readability_score: body.readabilityScore,
            seo_score: body.seoScore,
          },
        ])
        .select();

      if (error) throw error;

      // Create suggestions
      const auditId = data[0].id;
      const suggestionInserts = body.suggestions.map((suggestion: AuditSuggestion) => ({
        page_id: body.pageId,
        audit_id: auditId,
        suggestion_type: suggestion.type,
        priority: suggestion.priority,
        title: suggestion.title,
        description: suggestion.description,
        action: suggestion.action,
        estimated_impact: suggestion.estimatedImpact,
      }));

      if (suggestionInserts.length > 0) {
        await supabase.from("seo_suggestions").insert(suggestionInserts);
      }

      return new Response(JSON.stringify(data[0]), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
