-- Fix 1: Add policies for admins to manage user_roles
-- Allow admins to manage all roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  -- Prevent the last admin from removing their own admin role
  AND NOT (
    user_id = auth.uid() 
    AND role = 'admin'
    AND (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') = 1
  )
);

-- Fix 2: Remove the overly permissive public SELECT policy on invites
-- and replace with a secure function for invite validation
DROP POLICY IF EXISTS "Anyone can view invite by code for validation" ON public.invites;

-- Create a secure function to validate invite codes without exposing the table
CREATE OR REPLACE FUNCTION public.validate_invite_code(invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  SELECT id, creator_profile_id, expires_at, used_by_profile_id
  INTO invite_record
  FROM public.invites
  WHERE code = invite_code
  AND (expires_at IS NULL OR expires_at > now())
  AND used_by_profile_id IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired invite code');
  END IF;

  RETURN json_build_object('valid', true);
END;
$$;