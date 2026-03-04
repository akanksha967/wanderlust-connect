
-- 1. Create trigger to auto-add creator to trip_members when a trip is created
CREATE OR REPLACE FUNCTION public.auto_add_trip_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO trip_members (trip_id, user_id, status, joined_at)
  VALUES (NEW.id, NEW.creator_id, 'approved', now())
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trip_created_add_creator
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_trip_creator();

-- 2. Fix existing trips: add creator as member where missing
INSERT INTO trip_members (trip_id, user_id, status, joined_at)
SELECT t.id, t.creator_id, 'approved', t.created_at
FROM trips t
WHERE NOT EXISTS (
  SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = t.creator_id
)
ON CONFLICT (trip_id, user_id) DO NOTHING;

-- 3. Create update_updated_at triggers (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
    CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_travel_plans') THEN
    CREATE TRIGGER set_updated_at_travel_plans BEFORE UPDATE ON public.travel_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_trips') THEN
    CREATE TRIGGER set_updated_at_trips BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_message_before_insert') THEN
    CREATE TRIGGER validate_message_before_insert BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.validate_message_content();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_report_before_insert') THEN
    CREATE TRIGGER validate_report_before_insert BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.validate_report_content();
  END IF;
END;
$$
