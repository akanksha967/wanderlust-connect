-- Create table for tracking payment button clicks
CREATE TABLE IF NOT EXISTS public.payment_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS
ALTER TABLE public.payment_clicks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own clicks
CREATE POLICY "Users can insert their own payment clicks"
ON public.payment_clicks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Optional: Allow admin to view all (if you have an admin role logic, otherwise just authenticated specific)
-- For now, we'll keep it simple: insert only for users.

-- RPC to log click (optional wrapper, but direct insert is fine too)
-- We will use direct insert from frontend for simplicity unless complex logic is needed.
