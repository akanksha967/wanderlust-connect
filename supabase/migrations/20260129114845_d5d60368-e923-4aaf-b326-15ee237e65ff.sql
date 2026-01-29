-- Access requests table for admin approval flow
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Invites table for referral system
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  creator_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Add invite_slots to profiles (each user gets 3 invite slots)
ALTER TABLE public.profiles ADD COLUMN invite_slots INT NOT NULL DEFAULT 3;

-- Add invited_by to track who invited a user
ALTER TABLE public.profiles ADD COLUMN invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Access requests policies
CREATE POLICY "Users can view their own access request"
ON public.access_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own access request"
ON public.access_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all access requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update access requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Invites policies
CREATE POLICY "Users can view their own invites"
ON public.invites FOR SELECT
USING (creator_profile_id = public.get_my_profile_id());

CREATE POLICY "Users can create invites if they have slots"
ON public.invites FOR INSERT
WITH CHECK (
  creator_profile_id = public.get_my_profile_id() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = public.get_my_profile_id() 
    AND invite_slots > 0
  )
);

CREATE POLICY "Anyone can view invite by code for validation"
ON public.invites FOR SELECT
USING (true);

CREATE POLICY "System can update invites when used"
ON public.invites FOR UPDATE
USING (used_by_profile_id IS NULL OR used_by_profile_id = public.get_my_profile_id());

-- Function to check if user has access (approved or used valid invite)
CREATE OR REPLACE FUNCTION public.check_user_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_status TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (admins always have access)
  SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
  IF is_admin THEN
    RETURN json_build_object('has_access', true, 'status', 'admin');
  END IF;

  -- Check access request status
  SELECT status INTO request_status
  FROM public.access_requests
  WHERE user_id = auth.uid();

  IF request_status = 'approved' THEN
    RETURN json_build_object('has_access', true, 'status', 'approved');
  ELSIF request_status = 'pending' THEN
    RETURN json_build_object('has_access', false, 'status', 'pending');
  ELSIF request_status = 'rejected' THEN
    RETURN json_build_object('has_access', false, 'status', 'rejected');
  ELSE
    RETURN json_build_object('has_access', false, 'status', 'none');
  END IF;
END;
$$;

-- Function to use an invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
  my_profile_id UUID;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Find the invite
  SELECT * INTO invite_record
  FROM public.invites
  WHERE code = invite_code
  AND used_by_profile_id IS NULL
  AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Mark invite as used
  UPDATE public.invites
  SET used_by_profile_id = my_profile_id, used_at = now()
  WHERE id = invite_record.id;

  -- Update profile with invited_by
  UPDATE public.profiles
  SET invited_by = invite_record.creator_profile_id
  WHERE id = my_profile_id;

  -- Create approved access request
  INSERT INTO public.access_requests (user_id, email, status, reviewed_at)
  SELECT auth.uid(), u.email, 'approved', now()
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (user_id) DO UPDATE SET status = 'approved', reviewed_at = now();

  RETURN json_build_object('success', true);
END;
$$;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  my_profile_id UUID;
  current_slots INT;
  new_code TEXT;
BEGIN
  my_profile_id := get_my_profile_id();
  
  -- Check slots
  SELECT invite_slots INTO current_slots
  FROM public.profiles
  WHERE id = my_profile_id
  FOR UPDATE;

  IF current_slots <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No invite slots remaining');
  END IF;

  -- Generate unique code
  new_code := upper(substr(md5(random()::text), 1, 8));

  -- Create invite
  INSERT INTO public.invites (code, creator_profile_id)
  VALUES (new_code, my_profile_id);

  -- Decrement slots
  UPDATE public.profiles
  SET invite_slots = invite_slots - 1
  WHERE id = my_profile_id;

  RETURN json_build_object('success', true, 'code', new_code, 'slots_remaining', current_slots - 1);
END;
$$;