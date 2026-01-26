-- Drop the overly permissive policy that allows viewing photos of any discoverable profile
DROP POLICY IF EXISTS "Users can view photos of discoverable profiles" ON public.photos;

-- Create a new policy that requires both users to have overlapping travel plans
-- Both users must be authenticated, have active travel plans, same destination, and overlapping dates
CREATE POLICY "Users can view photos of users with overlapping travel plans"
ON public.photos
FOR SELECT
USING (
  profile_id IN (
    SELECT tp.profile_id
    FROM travel_plans tp
    WHERE tp.is_active = true
      AND tp.profile_id != get_my_profile_id()
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