-- Add payment tracking columns to ai_itinerary_users if they don't exist
ALTER TABLE public.ai_itinerary_users 
ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);

-- Create function to get global count of users who have access (free or paid)
CREATE OR REPLACE FUNCTION public.get_global_ai_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Count total users who have successfully generated an itinerary (implied by existence in table)
  RETURN (SELECT COUNT(*) FROM public.ai_itinerary_users);
END;
$$;

-- Function to record payment and grant access
CREATE OR REPLACE FUNCTION public.record_ai_payment(payment_id_param TEXT, amount_param DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  user_profile_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get profile id
  SELECT id INTO user_profile_id FROM public.profiles WHERE user_id = current_user_id;
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Insert or Update user record
  INSERT INTO public.ai_itinerary_users (profile_id, has_paid, payment_id, payment_date, amount_paid, usage_count)
  VALUES (user_profile_id, TRUE, payment_id_param, NOW(), amount_param, 0)
  ON CONFLICT (profile_id) 
  DO UPDATE SET 
    has_paid = TRUE, 
    payment_id = payment_id_param, 
    payment_date = NOW(),
    amount_paid = amount_param;

  RETURN json_build_object('success', true);
END;
$$;

-- Update check_and_increment_ai_usage to enforce 50 user limit
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  user_profile_id UUID;
  user_record RECORD;
  global_count INTEGER;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Get profile id
  SELECT id INTO user_profile_id FROM public.profiles WHERE user_id = current_user_id;
  
  -- Get user record
  SELECT * INTO user_record FROM public.ai_itinerary_users WHERE profile_id = user_profile_id;

  -- Check global count
  SELECT COUNT(*) INTO global_count FROM public.ai_itinerary_users;

  -- Logic:
  -- 1. If user already has a record:
  --    a. If usage_count >= 1 -> Limit reached
  --    b. If usage_count < 1 -> Allow (they already claimed a spot)
  -- 2. If user does NOT have a record:
  --    a. If global_count < 50 -> Allow (Free tier)
  --    b. If global_count >= 50 -> Require Payment

  IF user_record IS NOT NULL THEN
     IF user_record.usage_count >= 1 THEN
        RETURN json_build_object(
          'can_generate', false,
          'limit_reached', true,
          'message', 'Usage limit reached (1/1)'
        );
     END IF;
     -- Existing user, not hit limit yet, allow.
  ELSE
     -- New user trying to generate
     IF global_count >= 50 THEN
        RETURN json_build_object(
          'can_generate', false,
          'needs_payment', true,
          'message', 'Free tier full. Payment required.'
        );
     END IF;
     
     -- Free tier available, insert record
     INSERT INTO public.ai_itinerary_users (profile_id, usage_count)
     VALUES (user_profile_id, 0);
  END IF;

  -- Increment usage
  UPDATE public.ai_itinerary_users SET usage_count = usage_count + 1 WHERE profile_id = user_profile_id;

  RETURN json_build_object('can_generate', true);
END;
$$;
