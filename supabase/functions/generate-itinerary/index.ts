/**
 * Generate Itinerary Edge Function
 * 
 * SECURITY NOTE: JWT Verification Configuration
 * ==============================================
 * This function uses `verify_jwt = false` in config.toml with manual JWT validation.
 * This is the REQUIRED approach for Lovable Cloud's signing-keys system.
 * 
 * The default `verify_jwt = true` is a deprecated approach that doesn't work
 * with the signing-keys authentication system. Instead, we validate JWTs
 * manually using `supabase.auth.getClaims()` which:
 * 
 * 1. Verifies the JWT signature against Supabase's signing keys
 * 2. Validates token expiration automatically
 * 3. Returns the user's claims (sub, email, role, exp)
 * 4. Returns an error for invalid, expired, or tampered tokens
 * 
 * This provides equivalent security to automatic JWT verification while
 * being compatible with the signing-keys infrastructure.
 * 
 * @see https://docs.lovable.dev/features/security
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { destination, budget, days, preferences } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert travel planner. Create detailed, practical travel itineraries that are:
- Well-organized by day
- Budget-conscious based on the user's specified budget
- Include specific recommendations for attractions, restaurants, and activities
- Consider travel time between locations
- Include estimated costs for activities
- Provide local tips and insights

Format your response in clear markdown with:
- Day-by-day breakdown
- Morning, afternoon, and evening activities
- Estimated costs in local currency and USD
- Pro tips for each day
- Total estimated budget at the end`;

    const userPrompt = `Create a ${days || 5}-day travel itinerary for ${destination}.

Budget: ${budget || "moderate"} (per person, excluding flights)
${preferences ? `Preferences: ${preferences}` : ""}

Please include:
1. Day-by-day activities with times
2. Restaurant recommendations for each meal
3. Must-see attractions
4. Hidden gems and local favorites
5. Transportation tips
6. Estimated costs for each activity
7. Best times to visit each location
8. Total budget breakdown`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate itinerary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("generate-itinerary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
