-- Create table to track AI itinerary feature usage
CREATE TABLE public.ai_itinerary_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_ai_user UNIQUE (profile_id)
);

-- Enable RLS
ALTER TABLE public.ai_itinerary_users ENABLE ROW LEVEL SECURITY;

-- Users can check if they have access
CREATE POLICY "Users can view own AI access"
ON public.ai_itinerary_users
FOR SELECT
USING (profile_id = get_my_profile_id());

-- Users can register for AI access (if under limit)
CREATE POLICY "Users can register for AI access"
ON public.ai_itinerary_users
FOR INSERT
WITH CHECK (
  profile_id = get_my_profile_id() 
  AND (SELECT COUNT(*) FROM public.ai_itinerary_users) < 50
);

-- Create function to check AI access eligibility
CREATE OR REPLACE FUNCTION public.check_ai_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_profile_id UUID;
  current_count INT;
  has_access BOOLEAN;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Check if user already has access
  SELECT EXISTS(SELECT 1 FROM ai_itinerary_users WHERE profile_id = my_profile_id) INTO has_access;
  
  -- Get current count
  SELECT COUNT(*) INTO current_count FROM ai_itinerary_users;
  
  RETURN json_build_object(
    'has_access', has_access,
    'current_count', current_count,
    'spots_remaining', GREATEST(0, 50 - current_count)
  );
END;
$$;