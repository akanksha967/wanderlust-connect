-- Add usage_count column to track how many itineraries each user has generated
ALTER TABLE public.ai_itinerary_users 
ADD COLUMN usage_count integer NOT NULL DEFAULT 0;

-- Create function to check and increment usage
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile_id UUID;
  current_usage INT;
  user_record RECORD;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Get user's current usage
  SELECT * INTO user_record FROM ai_itinerary_users WHERE profile_id = my_profile_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_generate', false, 'usage_count', 0, 'needs_registration', true);
  END IF;
  
  IF user_record.usage_count >= 1 THEN
    RETURN json_build_object('can_generate', false, 'usage_count', user_record.usage_count, 'needs_subscription', true);
  END IF;
  
  -- Increment usage count
  UPDATE ai_itinerary_users SET usage_count = usage_count + 1 WHERE profile_id = my_profile_id;
  
  RETURN json_build_object('can_generate', true, 'usage_count', user_record.usage_count + 1, 'needs_subscription', false);
END;
$$;