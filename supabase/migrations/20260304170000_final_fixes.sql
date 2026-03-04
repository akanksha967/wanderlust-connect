
-- 1. Ensure get_discover_feed excludes user's own trips explicitly
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
  v_results JSONB := '[]'::jsonb;
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

  -- 4. Get Trips (Excluding OWN TRIPS)
  WITH potential_trips AS (
    SELECT t.*, p.name as creator_name,
      (SELECT count(*) FROM trip_members tm WHERE tm.trip_id = t.id AND tm.status = 'approved') + 1 as member_count,
      CASE WHEN t.destination = p_destination AND t.start_date <= p_end_date AND t.end_date >= p_start_date THEN 1 WHEN t.destination = p_destination THEN 2 ELSE 3 END as priority
    FROM trips t
    JOIN profiles p ON t.creator_id = p.id
    WHERE t.is_active = true
    AND t.creator_id != p_profile_id -- CRITICAL: Exclude own trips
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', 'trip', 'priority', priority, 'data', jsonb_build_object('id', id, 'creator_id', creator_id, 'title', title, 'destination', destination, 'start_date', start_date, 'end_date', end_date, 'budget', budget, 'travel_style', travel_style, 'description', description, 'max_travelers', max_travelers, 'member_count', member_count, 'creator_name', creator_name))), '[]'::jsonb) INTO v_trips
  FROM (SELECT * FROM potential_trips ORDER BY priority ASC, member_count ASC, created_at DESC LIMIT v_max_trips) tr;

  RETURN v_travelers || v_trips;
END;
$$;

-- 2. Enforce status='approved' for Chat and Stories via RLS
DROP POLICY IF EXISTS "Trip members can view messages" ON public.trip_messages;
CREATE POLICY "Trip members can view messages"
  ON public.trip_messages FOR SELECT
  USING (
    trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id())
    OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Trip members can send messages" ON public.trip_messages;
CREATE POLICY "Trip members can send messages"
  ON public.trip_messages FOR INSERT
  WITH CHECK (
    sender_id = get_my_profile_id() AND (
      trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id())
      OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view trip stories" ON public.trip_stories;
CREATE POLICY "Authenticated users can view trip stories"
  ON public.trip_stories FOR SELECT
  USING (
    trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id())
    OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Trip members can create stories" ON public.trip_stories;
CREATE POLICY "Trip members can create stories"
  ON public.trip_stories FOR INSERT
  WITH CHECK (
    user_id = get_my_profile_id() AND (
      trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id())
      OR trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved')
    )
  );

-- 4. Automatically notify user when their trip request is approved
CREATE OR REPLACE FUNCTION public.handle_trip_member_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_title TEXT;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT title INTO v_trip_title FROM trips WHERE id = NEW.trip_id;
    
    INSERT INTO notifications (user_id, type, reference_id, reference_type, title, body, icon, metadata)
    VALUES (
      NEW.user_id,
      'trip_approval',
      NEW.trip_id,
      'trip',
      'You were approved for ' || COALESCE(v_trip_title, 'trip'),
      'You can now chat and post stories!',
      '🎒',
      json_build_object('trip_id', NEW.trip_id)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trip_member_approval ON public.trip_members;
CREATE TRIGGER on_trip_member_approval
  AFTER UPDATE ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_member_approval();

-- 5. Set REPLICA IDENTITY FULL for notifications real-time filtering
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
