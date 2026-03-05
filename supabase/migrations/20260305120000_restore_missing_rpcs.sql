
-- Migration to fix RPC 404 errors by restoring missing functions and ensuring proper permissions

-- 1. Helper: get_my_profile_id
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

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated, anon;

-- 2. Helper: has_role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = $2
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, anon;

-- 3. Function: get_global_ai_users_count
CREATE OR REPLACE FUNCTION public.get_global_ai_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.ai_itinerary_users);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_ai_users_count() TO authenticated, anon;

-- 4. Function: check_user_access
CREATE OR REPLACE FUNCTION public.check_user_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_status TEXT;
  is_admin BOOLEAN;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
  IF is_admin THEN
    RETURN json_build_object('has_access', true, 'status', 'admin');
  END IF;

  SELECT status INTO request_status
  FROM public.access_requests
  WHERE user_id = auth.uid();

  IF request_status = 'approved' THEN
    RETURN json_build_object('has_access', true, 'status', 'approved');
  ELSIF request_status = 'pending' THEN
    RETURN json_build_object('has_access', false, 'status', 'pending');
  ELSIF request_status = 'rejected' THEN
    RETURN json_build_object('has_access', false, 'status', 'rejected');
  ELSE
    RETURN json_build_object('has_access', false, 'status', 'none');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_access() TO authenticated, anon;

-- 5. Function: get_discover_feed
CREATE OR REPLACE FUNCTION public.get_discover_feed(
  p_profile_id UUID,
  p_destination TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_travel_styles TEXT[];
  v_my_region TEXT;
  v_travelers JSONB := '[]'::jsonb;
  v_trips JSONB := '[]'::jsonb;
  v_target_trips_ratio FLOAT := 0.3;
  v_max_trips INT;
  v_max_travelers INT;
BEGIN
  v_max_trips := ceil(p_limit * v_target_trips_ratio);
  v_max_travelers := p_limit - v_max_trips;

  -- 1. Get my travel vibes (styles)
  SELECT array_agg(vibe) INTO v_my_travel_styles
  FROM travel_vibes WHERE profile_id = p_profile_id;

  -- 2. Get region for the target destination
  SELECT region INTO v_my_region FROM destination_regions WHERE destination = p_destination;

  -- 3. Accumulate Travelers
  WITH swiped AS (
    SELECT swiped_id FROM swipes WHERE swiper_id = p_profile_id
  ),
  blocked AS (
    SELECT blocked_id FROM blocks WHERE blocker_id = p_profile_id
    UNION
    SELECT blocker_id FROM blocks WHERE blocked_id = p_profile_id
  ),
  potential_travelers AS (
    SELECT 
      p.id, p.name, p.age, p.bio, p.is_verified,
      tp.destination, tp.start_date, tp.end_date,
      dr.region,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('url', ph.url, 'is_primary', ph.is_primary)), '[]'::jsonb) FROM photos ph WHERE ph.profile_id = p.id) as photos,
      (SELECT COALESCE(array_agg(tv.vibe), '{}'::text[]) FROM travel_vibes tv WHERE tv.profile_id = p.id) as vibes
    FROM profiles p
    JOIN travel_plans tp ON p.id = tp.profile_id
    LEFT JOIN destination_regions dr ON tp.destination = dr.destination
    WHERE p.id != p_profile_id
    AND p.id NOT IN (SELECT swiped_id FROM swiped)
    AND p.id NOT IN (SELECT * FROM blocked)
    AND tp.is_active = true
  ),
  ranked_travelers AS (
    SELECT pt.*, CASE
      WHEN pt.destination = p_destination AND pt.start_date <= p_end_date AND pt.end_date >= p_start_date THEN 1
      WHEN pt.destination = p_destination THEN 2
      WHEN pt.region IS NOT NULL AND pt.region = v_my_region THEN 3
      WHEN pt.vibes && v_my_travel_styles THEN 4
      ELSE 5
    END as tier FROM potential_travelers pt
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', 'traveler', 'tier', tier, 'data', jsonb_build_object('id', id, 'name', name, 'age', age, 'bio', bio, 'is_verified', is_verified, 'destination', destination, 'start_date', start_date, 'end_date', end_date, 'photos', photos, 'travel_vibes', vibes))), '[]'::jsonb) INTO v_travelers
  FROM (SELECT * FROM ranked_travelers ORDER BY tier ASC, id LIMIT v_max_travelers) t;

  -- 4. Get Trips
  WITH joined_trips AS (
    SELECT trip_id FROM trip_members WHERE user_id = p_profile_id
  ),
  potential_trips AS (
    SELECT t.*, p.name as creator_name,
      (SELECT count(*) FROM trip_members tm WHERE tm.trip_id = t.id AND tm.status = 'approved') + 1 as member_count,
      CASE WHEN t.destination = p_destination AND t.start_date <= p_end_date AND t.end_date >= p_start_date THEN 1 WHEN t.destination = p_destination THEN 2 ELSE 3 END as priority
    FROM trips t
    JOIN profiles p ON t.creator_id = p.id
    WHERE t.is_active = true
    AND t.creator_id != p_profile_id
    AND t.id NOT IN (SELECT trip_id FROM joined_trips)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', 'trip', 'priority', priority, 'data', jsonb_build_object('id', id, 'creator_id', creator_id, 'title', title, 'destination', destination, 'start_date', start_date, 'end_date', end_date, 'budget', budget, 'travel_style', travel_style, 'description', description, 'max_travelers', max_travelers, 'member_count', member_count, 'creator_name', creator_name))), '[]'::jsonb) INTO v_trips
  FROM (SELECT * FROM potential_trips ORDER BY priority ASC, member_count ASC, created_at DESC LIMIT v_max_trips) tr;

  RETURN v_travelers || v_trips;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_discover_feed(UUID, TEXT, DATE, DATE, INT) TO authenticated, anon;

-- 6. Function: check_and_increment_ai_usage
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

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage() TO authenticated, anon;

-- 7. Function: record_ai_payment
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

GRANT EXECUTE ON FUNCTION public.record_ai_payment(TEXT, DECIMAL) TO authenticated, anon;

-- 8. Function: use_invite_code
CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
  my_profile_id UUID;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Find the invite
  SELECT * INTO invite_record
  FROM public.invites
  WHERE code = invite_code
  AND used_by_profile_id IS NULL
  AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Mark invite as used
  UPDATE public.invites
  SET used_by_profile_id = my_profile_id, used_at = now()
  WHERE id = invite_record.id;

  -- Update profile with invited_by
  UPDATE public.profiles
  SET invited_by = invite_record.creator_profile_id
  WHERE id = my_profile_id;

  -- Create approved access request
  INSERT INTO public.access_requests (user_id, email, status, reviewed_at)
  SELECT auth.uid(), u.email, 'approved', now()
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO UPDATE SET status = 'approved', reviewed_at = now();

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_invite_code(TEXT) TO authenticated, anon;

-- 9. Function: create_like_with_limit
CREATE OR REPLACE FUNCTION public.create_like_with_limit(target_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile UUID;
  today DATE := CURRENT_DATE;
  current_used INT;
  max_allowed INT := 10;
  is_destination_match BOOLEAN := false;
  target_destination TEXT;
  v_is_match BOOLEAN := false;
  v_match_id UUID := NULL;
BEGIN
  my_profile := get_my_profile_id();
  
  -- Check blocked
  IF EXISTS (SELECT 1 FROM blocks WHERE (blocker_id = target_profile_id AND blocked_id = my_profile) OR (blocker_id = my_profile AND blocked_id = target_profile_id)) THEN
    RETURN json_build_object('success', false, 'error', 'Cannot interact with this user');
  END IF;

  -- Check duplicate
  IF EXISTS (SELECT 1 FROM swipes WHERE swiper_id = my_profile AND swiped_id = target_profile_id AND direction = 'right') THEN
    RETURN json_build_object('success', false, 'error', 'Already liked this user');
  END IF;

  -- Check/create daily limit
  INSERT INTO daily_likes (profile_id, like_date, likes_used)
  VALUES (my_profile, today, 0)
  ON CONFLICT (profile_id, like_date) DO NOTHING;

  SELECT likes_used, max_likes INTO current_used, max_allowed
  FROM daily_likes WHERE profile_id = my_profile AND like_date = today
  FOR UPDATE;

  IF current_used >= max_allowed THEN
    RETURN json_build_object('success', false, 'error', 'Daily like limit reached', 'likes_remaining', 0);
  END IF;

  -- Increment daily count
  UPDATE daily_likes SET likes_used = likes_used + 1 WHERE profile_id = my_profile AND like_date = today;

  -- Destination matching logic
  SELECT tp.destination INTO target_destination
  FROM travel_plans tp
  WHERE tp.profile_id = target_profile_id AND tp.is_active = true
  AND EXISTS (
    SELECT 1 FROM travel_plans my_tp
    WHERE my_tp.profile_id = my_profile AND my_tp.is_active = true
    AND my_tp.destination = tp.destination
    AND my_tp.start_date <= tp.end_date AND my_tp.end_date >= tp.start_date
  )
  LIMIT 1;

  is_destination_match := target_destination IS NOT NULL;

  -- Check if other user already liked me
  SELECT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = target_profile_id
    AND swiped_id = my_profile
    AND direction = 'right'
  ) INTO v_is_match;

  -- Create swipe
  INSERT INTO swipes (swiper_id, swiped_id, direction, revealed)
  VALUES (my_profile, target_profile_id, 'right', false);

  -- If it's a match, get the match ID (created by the trigger on 'swipes' above)
  IF v_is_match THEN
    SELECT id INTO v_match_id FROM public.matches 
    WHERE (profile1_id = LEAST(my_profile, target_profile_id) AND profile2_id = GREATEST(my_profile, target_profile_id));
  END IF;

  -- Create notification for liked user
  INSERT INTO notifications (user_id, type, reference_id, reference_type, title, body, icon, metadata)
  VALUES (
    target_profile_id,
    CASE WHEN is_destination_match THEN 'destination_match' ELSE 'like' END,
    my_profile,
    'like',
    CASE WHEN is_destination_match 
      THEN 'Someone traveling to ' || target_destination || ' liked you'
      ELSE 'Someone liked your profile'
    END,
    'Tap to reveal who liked you',
    CASE WHEN is_destination_match THEN '🌍' ELSE '❤️' END,
    jsonb_build_object('liker_id', my_profile, 'revealed', false, 'destination', target_destination)
  );

  RETURN json_build_object(
    'success', true, 
    'likes_remaining', max_allowed - current_used - 1,
    'is_destination_match', is_destination_match,
    'matched', v_is_match,
    'match_id', v_match_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_like_with_limit(UUID) TO authenticated, anon;
