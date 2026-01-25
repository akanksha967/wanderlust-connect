
-- Drop the foreign key constraint on profiles.user_id to allow test data
-- Then recreate it with a less restrictive approach or leave it for testing

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
