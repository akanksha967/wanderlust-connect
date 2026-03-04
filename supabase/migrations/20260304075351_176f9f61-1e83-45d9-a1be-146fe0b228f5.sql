
-- Fix the overly permissive INSERT policy on notifications
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow inserts through security definer functions (no direct client inserts)
CREATE POLICY "No direct inserts on notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (false);
