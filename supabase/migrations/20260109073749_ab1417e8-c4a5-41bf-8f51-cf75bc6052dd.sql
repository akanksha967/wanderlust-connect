-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view non-blocked profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view active travel plans" ON public.travel_plans;
DROP POLICY IF EXISTS "Users can view travel vibes" ON public.travel_vibes;

-- Create secure profile visibility policy: own profile OR matched users only
CREATE POLICY "Users can view own or matched profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR id IN (
    SELECT CASE 
      WHEN profile1_id = get_my_profile_id() THEN profile2_id 
      ELSE profile1_id 
    END
    FROM public.matches 
    WHERE profile1_id = get_my_profile_id() OR profile2_id = get_my_profile_id()
  )
  OR id IN (
    SELECT swiped_id FROM public.swipes WHERE swiper_id = get_my_profile_id()
  )
);

-- Create secure photos visibility policy: own photos OR matched users only  
CREATE POLICY "Users can view own or matched photos"
ON public.photos
FOR SELECT
USING (
  profile_id = get_my_profile_id()
  OR profile_id IN (
    SELECT CASE 
      WHEN profile1_id = get_my_profile_id() THEN profile2_id 
      ELSE profile1_id 
    END
    FROM public.matches 
    WHERE profile1_id = get_my_profile_id() OR profile2_id = get_my_profile_id()
  )
  OR profile_id IN (
    SELECT swiped_id FROM public.swipes WHERE swiper_id = get_my_profile_id()
  )
);

-- Create secure travel plans visibility policy: own plans OR matched users only
CREATE POLICY "Users can view own or matched travel plans"
ON public.travel_plans
FOR SELECT
USING (
  profile_id = get_my_profile_id()
  OR profile_id IN (
    SELECT CASE 
      WHEN profile1_id = get_my_profile_id() THEN profile2_id 
      ELSE profile1_id 
    END
    FROM public.matches 
    WHERE profile1_id = get_my_profile_id() OR profile2_id = get_my_profile_id()
  )
);

-- Create secure travel vibes visibility policy: own vibes OR matched users OR profiles being swiped
CREATE POLICY "Users can view own or matched vibes"
ON public.travel_vibes
FOR SELECT
USING (
  profile_id = get_my_profile_id()
  OR profile_id IN (
    SELECT CASE 
      WHEN profile1_id = get_my_profile_id() THEN profile2_id 
      ELSE profile1_id 
    END
    FROM public.matches 
    WHERE profile1_id = get_my_profile_id() OR profile2_id = get_my_profile_id()
  )
  OR profile_id IN (
    SELECT swiped_id FROM public.swipes WHERE swiper_id = get_my_profile_id()
  )
);