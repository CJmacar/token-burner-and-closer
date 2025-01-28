import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { mintAddress } = await req.json()
    const heliusKey = Deno.env.get('HELIUS_KEY')

    if (!heliusKey) {
      console.error('Helius API key not configured in Edge Function')
      throw new Error('Helius API key not configured')
    }

    console.log('Fetching metadata for mint:', mintAddress)
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${heliusKey}&mint=${mintAddress}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Helius API error:', errorText)
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    console.log('Metadata received for mint:', mintAddress, 'symbol:', data.symbol)

    return new Response(
      JSON.stringify({ symbol: data.symbol || 'Unknown' }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  } catch (error) {
    console.error('Error in get-token-metadata function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})