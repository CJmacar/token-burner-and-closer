import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey, content-type', 
  'Access-Control-Allow-Methods': 'GET', 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { mintAddress } = await req.json()
    console.log('Processing request for mint:', mintAddress)

    const HELIUS_KEY = Deno.env.get('HELIUS_KEY')
    if (!HELIUS_KEY) {
      console.error('HELIUS_KEY not configured')
      throw new Error('HELIUS_KEY not configured')
    }

    console.log('Fetching metadata from Helius API')
    const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAccounts: [mintAddress],
      }),
    })

    if (!response.ok) {
      console.error('Helius API error:', response.status, await response.text())
      throw new Error('Failed to fetch token metadata')
    }

    const data = await response.json()
    console.log('Received metadata from Helius:', data)

    return new Response(
      JSON.stringify({
        symbol: data[0]?.onChainMetadata?.metadata?.symbol || 'Unknown',
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
