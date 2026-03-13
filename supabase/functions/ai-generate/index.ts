import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("SITE_URL") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  modelId: string;
  provider: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AIRequest = await req.json();

    // Get API key from environment based on provider
    const apiKey = Deno.env.get(`${body.provider.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `Missing API key for ${body.provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let aiResponse: string;
    let tokensUsed = 0;

    switch (body.provider.toLowerCase()) {
      case "openai": {
        const openaiResult = await callOpenAI(apiKey, body);
        aiResponse = openaiResult.content;
        tokensUsed = openaiResult.tokens;
        break;
      }

      case "gemini": {
        const geminiResult = await callGemini(apiKey, body);
        aiResponse = geminiResult.content;
        tokensUsed = geminiResult.tokens;
        break;
      }

      case "claude": {
        const claudeResult = await callClaude(apiKey, body);
        aiResponse = claudeResult.content;
        tokensUsed = claudeResult.tokens;
        break;
      }

      case "perplexity": {
        const perplexityResult = await callPerplexity(apiKey, body);
        aiResponse = perplexityResult.content;
        tokensUsed = perplexityResult.tokens;
        break;
      }

      case "deepseek": {
        const deepseekResult = await callDeepseek(apiKey, body);
        aiResponse = deepseekResult.content;
        tokensUsed = deepseekResult.tokens;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported AI provider" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({
        content: aiResponse,
        tokensUsed,
        model: body.modelId,
        provider: body.provider,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callOpenAI(apiKey: string, request: AIRequest) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.modelId || "gpt-4-turbo-preview",
      messages: [
        ...(request.systemMessage ? [{ role: "system", content: request.systemMessage }] : []),
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
  };
}

async function callGemini(apiKey: string, request: AIRequest) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${request.modelId || "gemini-pro"}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...(request.systemMessage
                ? [{ text: request.systemMessage }]
                : []),
              { text: request.prompt },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    tokens: 0,
  };
}

async function callClaude(apiKey: string, request: AIRequest) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.modelId || "claude-3-opus-20240229",
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      system: request.systemMessage,
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    tokens: data.usage.input_tokens + data.usage.output_tokens,
  };
}

async function callPerplexity(apiKey: string, request: AIRequest) {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.modelId || "pplx-70b-online",
      messages: [
        ...(request.systemMessage ? [{ role: "system", content: request.systemMessage }] : []),
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
  };
}

async function callDeepseek(apiKey: string, request: AIRequest) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.modelId || "deepseek-chat",
      messages: [
        ...(request.systemMessage ? [{ role: "system", content: request.systemMessage }] : []),
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
  };
}
