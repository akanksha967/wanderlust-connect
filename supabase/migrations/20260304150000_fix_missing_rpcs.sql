
-- 1. Ensure get_my_profile_id exists
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT id FROM public.profiles WHERE user_id = auth.uid());
END;
$$;

-- 2. Ensure invite_slots column exists in profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'invite_slots') THEN
    ALTER TABLE public.profiles ADD COLUMN invite_slots INT NOT NULL DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'invited_by') THEN
    ALTER TABLE public.profiles ADD COLUMN invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Ensure ai_itinerary_users table and its functions exist
CREATE TABLE IF NOT EXISTS public.ai_itinerary_users (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  has_paid BOOLEAN DEFAULT FALSE,
  payment_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. get_global_ai_users_count
CREATE OR REPLACE FUNCTION public.get_global_ai_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.ai_itinerary_users);
END;
$$;

-- 5. record_ai_payment
CREATE OR REPLACE FUNCTION public.record_ai_payment(payment_id_param TEXT, amount_param DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  user_profile_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO user_profile_id FROM public.profiles WHERE user_id = current_user_id;
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

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

-- 6. check_and_increment_ai_usage
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
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT id INTO user_profile_id FROM public.profiles WHERE user_id = current_user_id;
  SELECT * INTO user_record FROM public.ai_itinerary_users WHERE profile_id = user_profile_id;
  SELECT COUNT(*) INTO global_count FROM public.ai_itinerary_users;

  IF user_record IS NOT NULL THEN
     IF user_record.has_paid = TRUE THEN
        -- Paid users have unlimited for now (or a higher limit)
        UPDATE public.ai_itinerary_users SET usage_count = usage_count + 1 WHERE profile_id = user_profile_id;
        RETURN json_build_object('can_generate', true);
     END IF;

     IF user_record.usage_count >= 1 THEN
        RETURN json_build_object(
          'can_generate', false,
          'limit_reached', true,
          'message', 'Usage limit reached (1/1). Upgrade to Premium!'
        );
     END IF;
  ELSE
     -- New user
     IF global_count >= 50 THEN
        RETURN json_build_object(
          'can_generate', false,
          'needs_payment', true,
          'message', 'Free tier full. Payment required.'
        );
     END IF;
     
     INSERT INTO public.ai_itinerary_users (profile_id, usage_count)
     VALUES (user_profile_id, 0);
  END IF;

  UPDATE public.ai_itinerary_users SET usage_count = usage_count + 1 WHERE profile_id = user_profile_id;
  RETURN json_build_object('can_generate', true);
END;
$$;

-- 7. generate_invite_code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile_id UUID;
  current_slots INT;
  new_code TEXT;
BEGIN
  my_profile_id := get_my_profile_id();
  
  SELECT invite_slots INTO current_slots
  FROM public.profiles
  WHERE id = my_profile_id
  FOR UPDATE;

  IF current_slots <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No invite slots remaining');
  END IF;

  new_code := upper(substr(md5(random()::text), 1, 8));

  INSERT INTO public.invites (code, creator_profile_id)
  VALUES (new_code, my_profile_id);

  UPDATE public.profiles
  SET invite_slots = invite_slots - 1
  WHERE id = my_profile_id;

  RETURN json_build_object('success', true, 'code', new_code, 'slots_remaining', current_slots - 1);
END;
$$;

-- 8. Enable RLS and add basic policies if they don't exist
ALTER TABLE public.ai_itinerary_users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_itinerary_users' AND policyname = 'Users can view own AI status') THEN
    CREATE POLICY "Users can view own AI status" ON public.ai_itinerary_users
    FOR SELECT USING (profile_id = get_my_profile_id());
  END IF;
END $$;
