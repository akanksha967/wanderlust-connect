-- Fix overly permissive RLS policies that expose user data

-- 1. Drop the overly permissive profiles policy that allows ANY active travel plan holder to see ALL profiles
DROP POLICY IF EXISTS "Users can view profiles with active travel plans for discovery" ON public.profiles;

-- Create a more restrictive policy: only show profiles with OVERLAPPING travel plans (same destination + overlapping dates)
CREATE POLICY "Users can view profiles with overlapping travel plans for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT tp.profile_id
    FROM travel_plans tp
    WHERE tp.is_active = true
      AND tp.profile_id <> get_my_profile_id()
      AND EXISTS (
        SELECT 1
        FROM travel_plans my_tp
        WHERE my_tp.profile_id = get_my_profile_id()
          AND my_tp.is_active = true
          AND my_tp.destination = tp.destination
          AND my_tp.start_date <= tp.end_date
          AND my_tp.end_date >= tp.start_date
      )
  )
);

-- 2. Drop the overly permissive travel_plans policy that exposes ALL active travel plans
DROP POLICY IF EXISTS "Users can view active travel plans for matching" ON public.travel_plans;

-- Create a more restrictive policy: only show travel plans with overlapping destination and dates
CREATE POLICY "Users can view overlapping travel plans for matching" 
ON public.travel_plans 
FOR SELECT 
USING (
  is_active = true
  AND profile_id <> get_my_profile_id()
  AND EXISTS (
    SELECT 1
    FROM travel_plans my_tp
    WHERE my_tp.profile_id = get_my_profile_id()
      AND my_tp.is_active = true
      AND my_tp.destination = destination
      AND my_tp.start_date <= end_date
      AND my_tp.end_date >= start_date
  )
);

-- 3. Drop the overly permissive travel_vibes policy that exposes ALL vibes of active travel plan holders
DROP POLICY IF EXISTS "Users can view vibes of discoverable profiles" ON public.travel_vibes;

-- Create a more restrictive policy: only show vibes for profiles with overlapping travel plans
CREATE POLICY "Users can view vibes of profiles with overlapping travel plans" 
ON public.travel_vibes 
FOR SELECT 
USING (
  profile_id IN (
    SELECT tp.profile_id
    FROM travel_plans tp
    WHERE tp.is_active = true
      AND tp.profile_id <> get_my_profile_id()
      AND EXISTS (
        SELECT 1
        FROM travel_plans my_tp
        WHERE my_tp.profile_id = get_my_profile_id()
          AND my_tp.is_active = true
          AND my_tp.destination = tp.destination
          AND my_tp.start_date <= tp.end_date
          AND my_tp.end_date >= tp.start_date
      )
  )
);