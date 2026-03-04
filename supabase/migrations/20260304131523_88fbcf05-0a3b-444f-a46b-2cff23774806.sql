
CREATE OR REPLACE FUNCTION public.handle_trip_join_request(p_trip_id uuid, p_requester_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trip_record RECORD;
  member_count INT;
  requester_name TEXT;
BEGIN
  -- Get trip info
  SELECT id, creator_id, title, max_travelers INTO trip_record
  FROM trips WHERE id = p_trip_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM trip_members WHERE trip_id = p_trip_id AND user_id = p_requester_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already requested to join');
  END IF;

  -- Check if full
  SELECT COUNT(*) INTO member_count FROM trip_members WHERE trip_id = p_trip_id AND status = 'approved';
  IF member_count + 1 >= COALESCE(trip_record.max_travelers, 5) THEN
    RETURN json_build_object('success', false, 'error', 'Trip is full');
  END IF;

  -- Insert member request
  INSERT INTO trip_members (trip_id, user_id, status) VALUES (p_trip_id, p_requester_id, 'pending');

  -- Get requester name
  SELECT name INTO requester_name FROM profiles WHERE id = p_requester_id;

  -- Create notification for trip creator
  INSERT INTO notifications (user_id, type, reference_id, reference_type, title, body, icon, metadata)
  VALUES (
    trip_record.creator_id,
    'trip_join_request',
    p_trip_id,
    'trip',
    COALESCE(requester_name, 'Someone') || ' wants to join your ' || trip_record.title,
    'Tap to approve or decline',
    '✈️',
    json_build_object('requester_id', p_requester_id, 'trip_id', p_trip_id)::jsonb
  );

  RETURN json_build_object('success', true);
END;
$$;
