
-- Add a policy to allow viewing profiles that have active travel plans (for swiping/discovery)
-- This allows users to see potential matches with overlapping travel plans

CREATE POLICY "Users can view profiles with active travel plans for discovery" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT tp.profile_id 
    FROM travel_plans tp 
    WHERE tp.is_active = true
  )
);

-- Also update photos policy to allow viewing photos of discoverable profiles
CREATE POLICY "Users can view photos of discoverable profiles" 
ON public.photos 
FOR SELECT 
USING (
  profile_id IN (
    SELECT tp.profile_id 
    FROM travel_plans tp 
    WHERE tp.is_active = true
  )
);

-- Update travel_vibes policy to allow viewing vibes of discoverable profiles
CREATE POLICY "Users can view vibes of discoverable profiles" 
ON public.travel_vibes 
FOR SELECT 
USING (
  profile_id IN (
    SELECT tp.profile_id 
    FROM travel_plans tp 
    WHERE tp.is_active = true
  )
);

-- Update travel_plans policy to allow viewing active plans for matching
CREATE POLICY "Users can view active travel plans for matching" 
ON public.travel_plans 
FOR SELECT 
USING (is_active = true);
