-- Create table to track subscription interest clicks
CREATE TABLE public.subscription_interest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.subscription_interest ENABLE ROW LEVEL SECURITY;

-- Users can record their own interest
CREATE POLICY "Users can record subscription interest"
ON public.subscription_interest
FOR INSERT
WITH CHECK (profile_id = get_my_profile_id());

-- Admins can view all subscription interest
CREATE POLICY "Admins can view all subscription interest"
ON public.subscription_interest
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own interest
CREATE POLICY "Users can view own interest"
ON public.subscription_interest
FOR SELECT
USING (profile_id = get_my_profile_id());