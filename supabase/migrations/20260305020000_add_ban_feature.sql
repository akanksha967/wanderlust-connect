
-- Add is_banned column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create a function to check if a user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(u_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = u_id AND is_banned = true);
END;
$$;

-- Update RLS policies or add a global check?
-- For now, let's add a policy to prevent banned users from doing anything.
-- Actually, a better way is to check this in the middleware/hook, but let's add DB level protection.

-- Example: Trigger to block inserts/updates from banned users
CREATE OR REPLACE FUNCTION public.check_banned_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_user_banned(auth.uid()) THEN
    RAISE EXCEPTION 'User is banned from the platform';
  END IF;
  RETURN NEW;
END;
$$;

-- Apply search for banned status on critical tables
-- Notifications
CREATE TRIGGER tr_check_banned_notifications
  BEFORE INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Trips
CREATE TRIGGER tr_check_banned_trips
  BEFORE INSERT OR UPDATE OR DELETE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Trip Members
CREATE TRIGGER tr_check_banned_trip_members
  BEFORE INSERT OR UPDATE OR DELETE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();

-- Swipes
CREATE TRIGGER tr_check_banned_swipes
  BEFORE INSERT OR UPDATE OR DELETE ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.check_banned_user();
