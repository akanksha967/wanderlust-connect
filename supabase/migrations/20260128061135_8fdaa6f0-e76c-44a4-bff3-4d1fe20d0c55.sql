-- Fix infinite recursion in travel_plans RLS policies
-- The issue is that policies reference travel_plans while querying travel_plans

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view overlapping travel plans for matching" ON public.travel_plans;

-- Recreate the overlapping travel plans policy using a function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_my_active_travel_plan()
RETURNS TABLE(destination text, start_date date, end_date date)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT destination, start_date, end_date 
  FROM public.travel_plans 
  WHERE profile_id = get_my_profile_id() AND is_active = true
  LIMIT 1;
$$;

-- Now create policy that uses the function instead of subquery
CREATE POLICY "Users can view overlapping travel plans for matching"
ON public.travel_plans
FOR SELECT
USING (
  is_active = true 
  AND profile_id <> get_my_profile_id()
  AND destination IN (SELECT destination FROM get_my_active_travel_plan())
  AND start_date <= (SELECT end_date FROM get_my_active_travel_plan() LIMIT 1)
  AND end_date >= (SELECT start_date FROM get_my_active_travel_plan() LIMIT 1)
);