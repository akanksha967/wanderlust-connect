
-- 1. Function to handle trip message notifications
CREATE OR REPLACE FUNCTION public.handle_trip_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  rec_recipient_id UUID;
  sender_name TEXT;
  trip_name TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  -- Get trip name
  SELECT title INTO trip_name FROM public.trips WHERE id = NEW.trip_id;

  -- Notify all approved members except sender
  FOR rec_recipient_id IN 
    (SELECT user_id FROM public.trip_members WHERE trip_id = NEW.trip_id AND status = 'approved' AND user_id != NEW.sender_id)
    UNION
    (SELECT creator_id FROM public.trips WHERE id = NEW.trip_id AND creator_id != NEW.sender_id)
  LOOP
    INSERT INTO public.notifications (user_id, type, reference_id, reference_type, title, body, icon)
    VALUES (
      rec_recipient_id,
      'trip_message',
      NEW.trip_id,
      'trip',
      'New msg in ' || trip_name,
      sender_name || ': ' || (CASE WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 47) || '...' ELSE NEW.content END),
      '💬'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_trip_message_inserted ON public.trip_messages;
CREATE TRIGGER on_trip_message_inserted
  AFTER INSERT ON public.trip_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_message_notification();

-- 2. Function to handle match message notifications (DMs)
CREATE OR REPLACE FUNCTION public.handle_match_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  -- Find recipient in the match
  SELECT (CASE WHEN profile1_id = NEW.sender_id THEN profile2_id ELSE profile1_id END)
  INTO recipient_id
  FROM public.matches
  WHERE id = NEW.match_id;

  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, reference_id, reference_type, title, body, icon)
    VALUES (
      recipient_id,
      'direct_message',
      NEW.match_id,
      'match',
      'Message from ' || sender_name,
      (CASE WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 47) || '...' ELSE NEW.content END),
      '💌'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_match_message_inserted ON public.messages;
CREATE TRIGGER on_match_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_match_message_notification();
