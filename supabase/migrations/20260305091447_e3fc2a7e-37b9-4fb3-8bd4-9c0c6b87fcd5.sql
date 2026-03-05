
CREATE OR REPLACE FUNCTION public.get_or_create_crew_chat(p_other_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile UUID;
  existing_match_id UUID;
  shared_trip BOOLEAN;
BEGIN
  my_profile := get_my_profile_id();
  
  IF my_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF my_profile = p_other_profile_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot chat with yourself');
  END IF;

  -- Check if they share an approved trip membership
  SELECT EXISTS (
    SELECT 1 FROM trip_members tm1
    JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
    WHERE tm1.user_id = my_profile AND tm1.status = 'approved'
      AND tm2.user_id = p_other_profile_id AND tm2.status = 'approved'
  ) INTO shared_trip;

  IF NOT shared_trip THEN
    RETURN json_build_object('success', false, 'error', 'You must be in the same crew to chat');
  END IF;

  -- Check for existing match
  SELECT id INTO existing_match_id
  FROM matches
  WHERE (profile1_id = LEAST(my_profile, p_other_profile_id) AND profile2_id = GREATEST(my_profile, p_other_profile_id));

  IF existing_match_id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'match_id', existing_match_id, 'created', false);
  END IF;

  -- Create a match for crew members
  INSERT INTO matches (profile1_id, profile2_id)
  VALUES (LEAST(my_profile, p_other_profile_id), GREATEST(my_profile, p_other_profile_id))
  RETURNING id INTO existing_match_id;

  RETURN json_build_object('success', true, 'match_id', existing_match_id, 'created', true);
END;
$$;
