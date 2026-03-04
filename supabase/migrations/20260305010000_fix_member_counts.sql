
-- Ensure like notifications are triggered correctly in create_like_with_limit
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
  ELSE
    -- ONLY create a 'like' notification if it's NOT a match
    -- Matches have their own "You matched with..." notifications created by handle_swipe_match trigger
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
  END IF;

  RETURN json_build_object(
    'success', true, 
    'likes_remaining', max_allowed - current_used - 1,
    'is_destination_match', is_destination_match,
    'matched', v_is_match,
    'match_id', v_match_id
  );
END;
$$;
