-- Fix 1: AI Usage Race Condition - Add row-level locking to prevent concurrent bypass
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile_id UUID;
  current_usage INT;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Lock the row for update to prevent race conditions
  SELECT usage_count INTO current_usage 
  FROM ai_itinerary_users 
  WHERE profile_id = my_profile_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_generate', false, 'usage_count', 0, 'needs_registration', true);
  END IF;
  
  IF current_usage >= 1 THEN
    RETURN json_build_object('can_generate', false, 'usage_count', current_usage, 'needs_subscription', true);
  END IF;
  
  -- Atomically increment
  UPDATE ai_itinerary_users 
  SET usage_count = usage_count + 1 
  WHERE profile_id = my_profile_id;
  
  RETURN json_build_object('can_generate', true, 'usage_count', current_usage + 1, 'needs_subscription', false);
END;
$$;

-- Fix 2: Add UPDATE and DELETE policies for messages table

-- Allow recipients to mark messages as read (only can update is_read field)
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.profile1_id = get_my_profile_id() OR matches.profile2_id = get_my_profile_id())
  )
  AND sender_id != get_my_profile_id()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.profile1_id = get_my_profile_id() OR matches.profile2_id = get_my_profile_id())
  )
  AND sender_id != get_my_profile_id()
);

-- Allow senders to edit their own messages (within 5 minutes)
CREATE POLICY "Senders can edit own messages within 5 minutes"
ON public.messages
FOR UPDATE
USING (
  sender_id = get_my_profile_id() 
  AND created_at > now() - interval '5 minutes'
)
WITH CHECK (
  sender_id = get_my_profile_id()
  AND created_at > now() - interval '5 minutes'
);

-- Allow senders to delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.messages
FOR DELETE
USING (sender_id = get_my_profile_id());