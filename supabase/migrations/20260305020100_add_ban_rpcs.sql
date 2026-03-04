
-- Function to ban a user
CREATE OR REPLACE FUNCTION public.ban_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET is_banned = true
  WHERE id = target_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Function to unban a user
CREATE OR REPLACE FUNCTION public.unban_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET is_banned = false
  WHERE id = target_user_id;

  RETURN json_build_object('success', true);
END;
$$;
