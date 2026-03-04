
-- =============================================
-- 1. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'destination_match', 'trip_interest', 'trip_join', 'trip_story', 'trip_request'
  reference_id UUID, -- polymorphic reference (like_id, trip_id, etc.)
  reference_type TEXT, -- 'like', 'trip', 'story', etc.
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT, -- emoji or icon name
  status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'cleared'
  metadata JSONB DEFAULT '{}'::jsonb, -- extra data (e.g. destination, liker_name after reveal)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = get_my_profile_id());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = get_my_profile_id());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = get_my_profile_id());

-- System inserts notifications via triggers/functions
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- 2. DAILY LIKES TRACKING
-- =============================================
CREATE TABLE public.daily_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  like_date DATE NOT NULL DEFAULT CURRENT_DATE,
  likes_used INTEGER NOT NULL DEFAULT 0,
  max_likes INTEGER NOT NULL DEFAULT 10,
  UNIQUE(profile_id, like_date)
);

ALTER TABLE public.daily_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily likes"
  ON public.daily_likes FOR SELECT
  USING (profile_id = get_my_profile_id());

CREATE POLICY "Users can manage own daily likes"
  ON public.daily_likes FOR ALL
  USING (profile_id = get_my_profile_id());

-- =============================================
-- 3. ENHANCED LIKES TABLE (with reveal)
-- =============================================
-- Add 'revealed' column to swipes for hidden likes
ALTER TABLE public.swipes ADD COLUMN IF NOT EXISTS revealed BOOLEAN DEFAULT false;

-- =============================================
-- 4. TRIPS TABLE
-- =============================================
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget TEXT,
  travel_style TEXT,
  description TEXT,
  max_travelers INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  share_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 10)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active trips (discovery)
CREATE POLICY "Authenticated users can view active trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (is_active = true OR creator_id = get_my_profile_id());

CREATE POLICY "Users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (creator_id = get_my_profile_id());

CREATE POLICY "Creators can update own trips"
  ON public.trips FOR UPDATE
  USING (creator_id = get_my_profile_id());

CREATE POLICY "Creators can delete own trips"
  ON public.trips FOR DELETE
  USING (creator_id = get_my_profile_id());

CREATE INDEX idx_trips_destination ON public.trips(destination);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);
CREATE INDEX idx_trips_active ON public.trips(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. TRIP MEMBERS TABLE
-- =============================================
CREATE TABLE public.trip_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trip members of trips they can see"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can request to join trips"
  ON public.trip_members FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "Trip creators can manage members"
  ON public.trip_members FOR UPDATE
  USING (trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id()));

CREATE POLICY "Users can leave trips"
  ON public.trip_members FOR DELETE
  USING (user_id = get_my_profile_id() OR trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id()));

-- =============================================
-- 6. TRIP STORIES TABLE
-- =============================================
CREATE TABLE public.trip_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trip stories"
  ON public.trip_stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trip members can create stories"
  ON public.trip_stories FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "Users can delete own stories"
  ON public.trip_stories FOR DELETE
  USING (user_id = get_my_profile_id());

-- =============================================
-- 7. TRIP MESSAGES (Group Chat)
-- =============================================
CREATE TABLE public.trip_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location', 'itinerary'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip members can view messages"
  ON public.trip_messages FOR SELECT
  TO authenticated
  USING (trip_id IN (
    SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved'
  ) OR trip_id IN (
    SELECT id FROM public.trips WHERE creator_id = get_my_profile_id()
  ));

CREATE POLICY "Trip members can send messages"
  ON public.trip_messages FOR INSERT
  WITH CHECK (sender_id = get_my_profile_id() AND (
    trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = get_my_profile_id() AND status = 'approved')
    OR trip_id IN (SELECT id FROM public.trips WHERE creator_id = get_my_profile_id())
  ));

CREATE POLICY "Users can delete own trip messages"
  ON public.trip_messages FOR DELETE
  USING (sender_id = get_my_profile_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;

-- =============================================
-- 8. FUNCTION: Create like with daily limit + notification
-- =============================================
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

  -- Check destination match
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

  -- Create swipe (existing trigger handles match creation)
  INSERT INTO swipes (swiper_id, swiped_id, direction, revealed)
  VALUES (my_profile, target_profile_id, 'right', false);

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
    json_build_object('liker_id', my_profile, 'revealed', false, 'destination', target_destination)::jsonb
  );

  RETURN json_build_object(
    'success', true, 
    'likes_remaining', max_allowed - current_used - 1,
    'is_destination_match', is_destination_match
  );
END;
$$;

-- =============================================
-- 9. FUNCTION: Reveal like identity
-- =============================================
CREATE OR REPLACE FUNCTION public.reveal_like(notification_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notif RECORD;
  liker_name TEXT;
  liker_photo TEXT;
BEGIN
  SELECT * INTO notif FROM notifications WHERE id = notification_id AND user_id = get_my_profile_id();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Notification not found');
  END IF;

  -- Get liker info
  SELECT p.name INTO liker_name FROM profiles p WHERE p.id = (notif.metadata->>'liker_id')::UUID;
  SELECT ph.url INTO liker_photo FROM photos ph WHERE ph.profile_id = (notif.metadata->>'liker_id')::UUID AND ph.is_primary = true LIMIT 1;

  -- Mark swipe as revealed
  UPDATE swipes SET revealed = true WHERE swiper_id = (notif.metadata->>'liker_id')::UUID AND swiped_id = get_my_profile_id();

  -- Update notification with revealed info
  UPDATE notifications 
  SET metadata = notif.metadata || jsonb_build_object('revealed', true, 'liker_name', liker_name, 'liker_photo', COALESCE(liker_photo, '')),
      status = 'read',
      title = liker_name || ' liked your profile'
  WHERE id = notification_id;

  RETURN json_build_object('success', true, 'liker_name', liker_name, 'liker_photo', liker_photo, 'liker_id', notif.metadata->>'liker_id');
END;
$$;

-- =============================================
-- 10. FUNCTION: Get daily likes remaining
-- =============================================
CREATE OR REPLACE FUNCTION public.get_daily_likes_remaining()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile UUID;
  current_used INT := 0;
  max_allowed INT := 10;
BEGIN
  my_profile := get_my_profile_id();
  
  SELECT likes_used, max_likes INTO current_used, max_allowed
  FROM daily_likes WHERE profile_id = my_profile AND like_date = CURRENT_DATE;

  IF NOT FOUND THEN
    current_used := 0;
  END IF;

  RETURN json_build_object('likes_remaining', max_allowed - current_used, 'likes_used', current_used, 'max_likes', max_allowed);
END;
$$;
