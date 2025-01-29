import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://token-burner-and-closer.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mintAddress } = await req.json()
    console.log('Fetching metadata for mint:', mintAddress)

    const HELIUS_KEY = Deno.env.get('HELIUS_KEY')
    if (!HELIUS_KEY) {
      throw new Error('HELIUS_KEY not configured')
    }

    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
      }),
    })

    const data = await response.json()
    console.log('Helius API response:', data)

    if (!response.ok) {
      throw new Error('Failed to fetch token metadata')
    }

    const metadata = data[0]
    return new Response(
      JSON.stringify({
        symbol: metadata?.onChainMetadata?.metadata?.symbol || 'Unknown',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Error in get-token-metadata:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})