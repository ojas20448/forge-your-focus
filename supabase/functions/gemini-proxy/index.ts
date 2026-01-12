// Secure Gemini API Proxy
// Handles all AI requests server-side with rate limiting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  type: 'schedule' | 'milestone' | 'coaching';
  maxTokens?: number;
  temperature?: number;
}

interface RateLimitRecord {
  user_id: string;
  requests_count: number;
  window_start: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Gemini API key from environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Initialize Supabase client for rate limiting
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 50 requests per hour per user
    const RATE_LIMIT = 50;
    const WINDOW_MINUTES = 60;

    // Check rate limit
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - WINDOW_MINUTES);

    const { data: rateLimitData, error: rateLimitError } = await supabaseClient
      .from('api_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (!rateLimitError && rateLimitData) {
      if (rateLimitData.requests_count >= RATE_LIMIT) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: `Maximum ${RATE_LIMIT} AI requests per hour. Try again later.`,
            resetAt: new Date(rateLimitData.window_start).getTime() + (WINDOW_MINUTES * 60 * 1000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment counter
      await supabaseClient
        .from('api_rate_limits')
        .update({ requests_count: rateLimitData.requests_count + 1 })
        .eq('id', rateLimitData.id);
    } else {
      // Create new rate limit record
      await supabaseClient
        .from('api_rate_limits')
        .insert({
          user_id: user.id,
          requests_count: 1,
          window_start: new Date().toISOString()
        });
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { prompt, maxTokens = 2048, temperature = 0.7 } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const data = await geminiResponse.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from Gemini API');
    }

    // Log usage for analytics
    await supabaseClient
      .from('ai_usage_logs')
      .insert({
        user_id: user.id,
        request_type: body.type,
        tokens_used: textResponse.length / 4, // Rough estimate
        success: true
      });

    return new Response(
      JSON.stringify({ 
        response: textResponse,
        usage: {
          requestsRemaining: RATE_LIMIT - (rateLimitData?.requests_count ?? 0) - 1
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in gemini-proxy:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        fallback: true // Frontend can use fallback logic
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
