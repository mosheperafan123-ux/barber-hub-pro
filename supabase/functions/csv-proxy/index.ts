import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let targetUrl: string | null = null;
    
    // Try to get URL from query params first
    const url = new URL(req.url);
    targetUrl = url.searchParams.get('url');
    
    // If not in query params, try body
    if (!targetUrl && req.method === 'POST') {
      const body = await req.json();
      targetUrl = body.url;
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching CSV from: ${targetUrl}`);

    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log(`Successfully fetched CSV, length: ${csvText.length} bytes`);

    return new Response(csvText, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in csv-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
