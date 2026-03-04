
-- Create a table for destination regions to support Tier 3 mapping
CREATE TABLE IF NOT EXISTS public.destination_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL
);

-- Seed some initial region data
INSERT INTO public.destination_regions (destination, region) VALUES
('Goa', 'Coastal'),
('Gokarna', 'Coastal'),
('Kerala', 'Coastal'),
('Pondicherry', 'Coastal'),
('Andaman', 'Coastal'),
('Manali', 'Mountains'),
('Shimla', 'Mountains'),
('Leh', 'Mountains'),
('Ladakh', 'Mountains'),
('Kasol', 'Mountains'),
('Rishikesh', 'Mountains'),
('Mumbai', 'Metro'),
('Delhi', 'Metro'),
('Bangalore', 'Metro'),
('Hyderabad', 'Metro'),
('Jaipur', 'Cultural'),
('Udaipur', 'Cultural'),
('Varanasi', 'Cultural'),
('Hampi', 'Cultural')
ON CONFLICT (destination) DO NOTHING;

-- Function to get the discover feed with 5 tiers and trips
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
  v_traveler_count INT := 0;
  v_trip_count INT := 0;
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

  -- 3. Accumulate Travelers in Tiers
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
      p.id,
      p.name,
      p.age,
      p.bio,
      p.is_verified,
      tp.destination,
      tp.start_date,
      tp.end_date,
      dr.region,
      (
        SELECT jsonb_agg(jsonb_build_object('url', ph.url, 'is_primary', ph.is_primary))
        FROM photos ph WHERE ph.profile_id = p.id
      ) as photos,
      (
        SELECT array_agg(tv.vibe)
        FROM travel_vibes tv WHERE tv.profile_id = p.id
      ) as vibes
    FROM profiles p
    JOIN travel_plans tp ON p.id = tp.profile_id
    LEFT JOIN destination_regions dr ON tp.destination = dr.destination
    WHERE p.id != p_profile_id
    AND p.id NOT IN (SELECT swiped_id FROM swiped)
    AND p.id NOT IN (SELECT * FROM blocked)
    AND tp.is_active = true
  ),
  ranked_travelers AS (
    SELECT 
      pt.*,
      CASE
        -- Tier 1: Same destination + Overlapping dates
        WHEN pt.destination = p_destination AND pt.start_date <= p_end_date AND pt.end_date >= p_start_date THEN 1
        -- Tier 2: Same destination
        WHEN pt.destination = p_destination THEN 2
        -- Tier 3: Nearby Destinations (Same Region)
        WHEN pt.region IS NOT NULL AND pt.region = v_my_region THEN 3
        -- Tier 4: Travel Style Match
        WHEN pt.vibes && v_my_travel_styles THEN 4
        -- Tier 5: Global Travelers (any active trip)
        ELSE 5
      END as tier
    FROM potential_travelers pt
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', 'traveler',
      'tier', tier,
      'data', jsonb_build_object(
        'id', id,
        'name', name,
        'age', age,
        'bio', bio,
        'is_verified', is_verified,
        'destination', destination,
        'start_date', start_date,
        'end_date', end_date,
        'photos', photos,
        'travel_vibes', vibes
      )
    )
  ) INTO v_results
  FROM (
    SELECT * FROM ranked_travelers
    ORDER BY tier ASC, id -- stable sort
    LIMIT v_max_travelers
  ) t;

  -- 4. Get Trips
  WITH joined_trips AS (
    SELECT trip_id FROM trip_members WHERE user_id = p_profile_id
  ),
  potential_trips AS (
    SELECT 
      t.*,
      p.name as creator_name,
      (SELECT count(*) FROM trip_members tm WHERE tm.trip_id = t.id AND tm.status = 'approved') + 1 as member_count,
      CASE
        WHEN t.destination = p_destination AND t.start_date <= p_end_date AND t.end_date >= p_start_date THEN 1
        WHEN t.destination = p_destination THEN 2
        ELSE 3
      END as priority
    FROM trips t
    JOIN profiles p ON t.creator_id = p.id
    WHERE t.is_active = true
    AND t.creator_id != p_profile_id
    AND t.id NOT IN (SELECT trip_id FROM joined_trips)
  )
  SELECT v_results || COALESCE(jsonb_agg(
    jsonb_build_object(
      'type', 'trip',
      'priority', priority,
      'data', jsonb_build_object(
        'id', id,
        'creator_id', creator_id,
        'title', title,
        'destination', destination,
        'start_date', start_date,
        'end_date', end_date,
        'budget', budget,
        'travel_style', travel_style,
        'description', description,
        'max_travelers', max_travelers,
        'member_count', member_count,
        'creator_name', creator_name
      )
    )
  ), '[]'::jsonb) INTO v_results
  FROM (
    SELECT * FROM potential_trips
    -- Prioritize by match, then fewer members (as requested), then recency
    ORDER BY priority ASC, member_count ASC, created_at DESC
    LIMIT v_max_trips
  ) tr;

  -- Final mixing or empty-feed prevention
  -- If we don't have enough travelers, we could fetch more trips here if needed,
  -- but the limits above are balanced.

  RETURN v_results;
END;
$$;
