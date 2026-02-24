import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ProfileData {
  name: string;
  age: number;
  bio?: string;
  photos: string[];
  travelVibes: string[];
}

interface TravelData {
  destination: string;
  startDate: string;
  endDate: string;
}

export const useProfileSave = () => {
  const [saving, setSaving] = useState(false);
  const { user, profileId: myProfileId } = useAuth();
  const { toast } = useToast();

  const saveProfile = async (profileData: ProfileData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to save your profile',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);

    try {
      let profileId = myProfileId;

      // If profile doesn't exist, create it
      if (!profileId) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: profileData.name,
            age: profileData.age,
            bio: profileData.bio || null,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        profileId = newProfile.id;
      } else {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            age: profileData.age,
            bio: profileData.bio || null,
          })
          .eq('id', profileId);

        if (profileError) throw profileError;
      }

      if (!profileId) throw new Error('Failed to create or find profile');

      // Delete existing photos and add new ones
      await supabase.from('photos').delete().eq('profile_id', profileId);

      if (profileData.photos.length > 0) {
        const photosToInsert = profileData.photos.map((url, index) => ({
          profile_id: profileId,
          url,
          is_primary: index === 0,
        }));

        const { error: photosError } = await supabase
          .from('photos')
          .insert(photosToInsert);

        if (photosError) throw photosError;
      }

      // Delete existing vibes and add new ones
      await supabase.from('travel_vibes').delete().eq('profile_id', profileId);

      if (profileData.travelVibes.length > 0) {
        const vibesToInsert = profileData.travelVibes.map((vibe) => ({
          profile_id: profileId,
          vibe,
        }));

        const { error: vibesError } = await supabase
          .from('travel_vibes')
          .insert(vibesToInsert);

        if (vibesError) throw vibesError;
      }

      return true;
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveTravelPlan = async (travelData: TravelData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to save travel plans',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);

    try {
      if (!myProfileId) throw new Error('Profile not found. Please complete your profile first.');

      // Deactivate any existing travel plans
      await supabase
        .from('travel_plans')
        .update({ is_active: false })
        .eq('profile_id', myProfileId);

      // Insert new travel plan
      const { error: travelError } = await supabase
        .from('travel_plans')
        .insert({
          profile_id: myProfileId,
          destination: travelData.destination,
          start_date: travelData.startDate,
          end_date: travelData.endDate,
          is_active: true,
        });

      if (travelError) throw travelError;

      return true;
    } catch (error: any) {
      console.error('Error saving travel plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save travel plan',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    saveProfile,
    saveTravelPlan,
    saving,
  };
};
