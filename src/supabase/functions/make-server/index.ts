// Simple Supabase Edge Function for EventHub
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("EventHub server starting...")

serve(async (req) => {
  const url = new URL(req.url)
  const origin = req.headers.get('Origin')
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`${req.method} ${url.pathname}`)

    // Simple health check
    if (url.pathname === '/make-server-1eecec3b/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'EventHub server is running',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Simple events endpoint (mock data)
    if (url.pathname === '/make-server-1eecec3b/events' && req.method === 'GET') {
      const events = [
        {
          id: '1',
          title: 'React Conference 2025',
          description: 'Amazing React conference',
          dateTime: '2025-03-15T10:00:00Z',
          location: 'San Francisco',
          type: 'Conference',
          totalTickets: 500,
          availableTickets: 350,
          price: 299.99,
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        }
      ]

      return new Response(
        JSON.stringify({ events }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Default response
    return new Response(
      JSON.stringify({ 
        message: 'EventHub API', 
        path: url.pathname,
        method: req.method
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})