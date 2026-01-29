-- Grant access to all existing users who already have profiles with photos
-- This ensures existing users aren't locked out when the invite system goes live
INSERT INTO public.access_requests (user_id, email, status, reviewed_at)
SELECT 
  p.user_id,
  COALESCE(u.email, u.phone, 'unknown'),
  'approved',
  now()
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE EXISTS (
  SELECT 1 FROM public.photos ph WHERE ph.profile_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;