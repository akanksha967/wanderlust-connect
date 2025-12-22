import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SwipeProfile {
  id: string;
  name: string;
  age: number | null;
  bio: string | null;
  is_verified: boolean | null;
  photos: { url: string; is_primary: boolean | null }[];
  travel_vibes: string[];
}

export const useSwipeProfiles = (destination: string, startDate: string, endDate: string) => {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !destination) {
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      try {
        // Get current user's profile id
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!myProfile) {
          setLoading(false);
          return;
        }

        // Get profiles with matching travel plans
        const { data: travelPlans, error: travelError } = await supabase
          .from('travel_plans')
          .select(`
            profile_id,
            destination,
            start_date,
            end_date
          `)
          .eq('destination', destination)
          .eq('is_active', true)
          .neq('profile_id', myProfile.id)
          .lte('start_date', endDate)
          .gte('end_date', startDate);

        if (travelError) throw travelError;

        if (!travelPlans || travelPlans.length === 0) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        const profileIds = [...new Set(travelPlans.map(tp => tp.profile_id))];

        // Get already swiped profiles
        const { data: swipedProfiles } = await supabase
          .from('swipes')
          .select('swiped_id')
          .eq('swiper_id', myProfile.id);

        const swipedIds = swipedProfiles?.map(s => s.swiped_id) || [];

        // Get blocked profiles (both directions)
        const { data: blockedProfiles } = await supabase
          .from('blocks')
          .select('blocked_id, blocker_id')
          .or(`blocker_id.eq.${myProfile.id},blocked_id.eq.${myProfile.id}`);

        const blockedIds = blockedProfiles?.flatMap(b => [b.blocked_id, b.blocker_id]) || [];

        // Filter out swiped and blocked profiles
        const eligibleIds = profileIds.filter(id => 
          !swipedIds.includes(id) && !blockedIds.includes(id)
        );

        if (eligibleIds.length === 0) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        // Fetch full profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, age, bio, is_verified')
          .in('id', eligibleIds);

        if (profilesError) throw profilesError;

        // Fetch photos for all profiles
        const { data: photosData } = await supabase
          .from('photos')
          .select('profile_id, url, is_primary')
          .in('profile_id', eligibleIds);

        // Fetch travel vibes
        const { data: vibesData } = await supabase
          .from('travel_vibes')
          .select('profile_id, vibe')
          .in('profile_id', eligibleIds);

        // Combine data
        const fullProfiles: SwipeProfile[] = (profilesData || []).map(profile => ({
          ...profile,
          photos: (photosData || [])
            .filter(p => p.profile_id === profile.id)
            .map(p => ({ url: p.url, is_primary: p.is_primary })),
          travel_vibes: (vibesData || [])
            .filter(v => v.profile_id === profile.id)
            .map(v => v.vibe),
        }));

        setProfiles(fullProfiles);
      } catch (error: any) {
        console.error('Error fetching profiles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profiles',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user, destination, startDate, endDate, toast]);

  const recordSwipe = async (swipedId: string, direction: 'left' | 'right') => {
    if (!user) return { matched: false };

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) return { matched: false };

      // Insert swipe
      const { error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: myProfile.id,
          swiped_id: swipedId,
          direction,
        });

      if (error) throw error;

      // If right swipe, check if match was created by trigger
      if (direction === 'right') {
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .or(`and(profile1_id.eq.${myProfile.id},profile2_id.eq.${swipedId}),and(profile1_id.eq.${swipedId},profile2_id.eq.${myProfile.id})`)
          .single();

        return { matched: !!match };
      }

      return { matched: false };
    } catch (error: any) {
      console.error('Error recording swipe:', error);
      return { matched: false };
    }
  };

  const blockUser = async (blockedId: string) => {
    if (!user) return false;

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) return false;

      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: myProfile.id,
          blocked_id: blockedId,
        });

      if (error) throw error;

      // Remove from local profiles
      setProfiles(prev => prev.filter(p => p.id !== blockedId));
      
      toast({
        title: 'User blocked',
        description: 'You will no longer see this profile',
      });

      return true;
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive',
      });
      return false;
    }
  };

  const reportUser = async (reportedId: string, reason: string, description?: string) => {
    if (!user) return false;

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) return false;

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: myProfile.id,
          reported_id: reportedId,
          reason,
          description,
        });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe',
      });

      return true;
    } catch (error: any) {
      console.error('Error reporting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    profiles,
    loading,
    recordSwipe,
    blockUser,
    reportUser,
  };
};
