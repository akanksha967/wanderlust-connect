-- Allow users to delete their own matches
CREATE POLICY "Users can delete own matches"
ON public.matches
FOR DELETE
USING (profile1_id = get_my_profile_id() OR profile2_id = get_my_profile_id());

-- When a match is deleted, cascade delete the messages (optional cleanup)
-- Messages will be orphaned otherwise since match_id references are broken
-- Actually, let's delete messages first before match is deleted via application code