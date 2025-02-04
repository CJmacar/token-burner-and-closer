import { serve } from "https://deno.fresh.dev/std@v9.6.1/http/server.ts";

interface RequestBody {
  mintAddress: string;
}

serve(async (req) => {
  try {
    const { mintAddress } = await req.json() as RequestBody;
    const HELIUS_KEY = Deno.env.get('HELIUS_KEY');

    if (!HELIUS_KEY) {
      throw new Error('HELIUS_KEY not configured');
    }

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
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ symbol: 'Unknown' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});