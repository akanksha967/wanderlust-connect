import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create client with user's token to get their ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify the token and get user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Create admin client for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the profile ID for this user
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      const profileId = profile.id;

      // Delete all related data (cascade should handle most, but being explicit)
      // Order matters due to foreign key constraints
      
      // Delete messages where user is sender
      await adminClient.from("messages").delete().eq("sender_id", profileId);
      
      // Delete matches where user is involved
      await adminClient.from("matches").delete().or(`profile1_id.eq.${profileId},profile2_id.eq.${profileId}`);
      
      // Delete swipes
      await adminClient.from("swipes").delete().or(`swiper_id.eq.${profileId},swiped_id.eq.${profileId}`);
      
      // Delete blocks
      await adminClient.from("blocks").delete().or(`blocker_id.eq.${profileId},blocked_id.eq.${profileId}`);
      
      // Delete reports
      await adminClient.from("reports").delete().or(`reporter_id.eq.${profileId},reported_id.eq.${profileId}`);
      
      // Delete travel plans
      await adminClient.from("travel_plans").delete().eq("profile_id", profileId);
      
      // Delete travel vibes
      await adminClient.from("travel_vibes").delete().eq("profile_id", profileId);
      
      // Delete photos
      await adminClient.from("photos").delete().eq("profile_id", profileId);
      
      // Delete AI itinerary usage
      await adminClient.from("ai_itinerary_users").delete().eq("profile_id", profileId);
      
      // Delete subscription interest
      await adminClient.from("subscription_interest").delete().eq("profile_id", profileId);
      
      // Delete the profile itself
      await adminClient.from("profiles").delete().eq("id", profileId);
    }

    // Delete user roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
