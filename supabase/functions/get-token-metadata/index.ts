import { serve } from "https://deno.fresh.dev/std@v9.6.1/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Edge function triggered');
    
    const { mintAddress } = await req.json() as { mintAddress: string };
    console.log('Received mint address:', mintAddress);

    const HELIUS_KEY = Deno.env.get('HELIUS_KEY');
    if (!HELIUS_KEY) {
      throw new Error('HELIUS_KEY not configured');
    }

    console.log('Fetching metadata from Helius API');
    const response = await fetch('https://api.helius.xyz/v0/token-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
        apiKey: HELIUS_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch metadata from Helius');
    }

    const data = await response.json();
    console.log('Metadata received from Helius:', data);

    if (data && data[0] && data[0].onChainMetadata?.metadata?.symbol) {
      return new Response(
        JSON.stringify({ symbol: data[0].onChainMetadata.metadata.symbol }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ symbol: 'Unknown' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});