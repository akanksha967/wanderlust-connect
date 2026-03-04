-- Add unique constraint on trip_members to prevent duplicate join requests
ALTER TABLE public.trip_members ADD CONSTRAINT trip_members_trip_user_unique UNIQUE (trip_id, user_id);