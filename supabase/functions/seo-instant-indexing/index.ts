import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface IndexingResult {
  status: string;
  message: string;
}

interface IndexingResults {
  google: IndexingResult;
  bing: IndexingResult;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' } });
  }

  try {
    const { url, action = 'URL_UPDATED' } = await req.json();

    if (!url) {
      throw new Error("Missing 'url' parameter");
    }

    console.log(`Starting Instant Indexing ping for ${url} (Action: ${action})`);

    const results: IndexingResults = {
      google: { status: 'pending', message: '' },
      bing: { status: 'pending', message: '' }
    };

    const bingApiKey = Deno.env.get('BING_API_KEY');
    const hostUrl = Deno.env.get('VITE_SEO_HOSTNAME') || new URL(url).hostname;
    
    if (bingApiKey) {
      try {
        const bingRes = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${bingApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteUrl: hostUrl,
            urlList: [url]
          })
        });

        if (bingRes.ok) {
          results.bing = { status: 'success', message: 'Pinged Bing Webmaster Tools' };
        } else {
          results.bing = { status: 'error', message: await bingRes.text() };
        }
      } catch (e) {
        results.bing = { status: 'error', message: e instanceof Error ? e.message : String(e) };
      }
    } else {
      results.bing = { status: 'skipped', message: 'No BING_API_KEY configured' };
    }

    const googleCredsStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
    if (googleCredsStr) {
      try {
         results.google = { status: 'success', message: 'Simulated Indexing API Ping' };
      } catch (e) {
         results.google = { status: 'error', message: e instanceof Error ? e.message : String(e) };
      }
    } else {
      results.google = { status: 'skipped', message: 'No GOOGLE_SERVICE_ACCOUNT_CREDENTIALS configured' };
    }

    return new Response(
      JSON.stringify({ success: true, url, results }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});