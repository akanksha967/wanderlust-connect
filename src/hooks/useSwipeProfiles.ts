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
        // 1. Get current user's profile ID and matching travel plans in parallel
        const [myProfileRes, travelPlansRes] = await Promise.all([
          supabase.from('profiles').select('id').eq('user_id', user.id).single(),
          supabase.from('travel_plans')
            .select('profile_id')
            .eq('destination', destination)
            .eq('is_active', true)
            .lte('start_date', endDate)
            .gte('end_date', startDate)
        ]) as [any, any];

        const myProfile = myProfileRes.data;
        if (!myProfile || !travelPlansRes.data) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        const potentialProfileIds = (travelPlansRes.data as any[])
          .map(tp => tp.profile_id)
          .filter(id => id !== myProfile.id);

        if (potentialProfileIds.length === 0) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        // 2. Get swiped and blocked profiles in parallel
        const [swipesRes, blocksRes] = await Promise.all([
          supabase.from('swipes').select('swiped_id').eq('swiper_id', myProfile.id),
          supabase.from('blocks').select('blocked_id, blocker_id')
            .or(`blocker_id.eq.${myProfile.id},blocked_id.eq.${myProfile.id}`)
        ]) as [any, any];

        const swipedIds = new Set((swipesRes.data as any[])?.map(s => s.swiped_id) || []);
        const blockedIds = new Set((blocksRes.data as any[])?.flatMap(b => [b.blocked_id, b.blocker_id]) || []);

        // Filter eligible IDs
        const eligibleIds = [...new Set(potentialProfileIds)].filter(id =>
          !swipedIds.has(id) && !blockedIds.has(id)
        );

        if (eligibleIds.length === 0) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        // 3. Fetch full profiles with photos and vibes in ONE joined query
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id, name, age, bio, is_verified,
            photos (url, is_primary),
            travel_vibes (vibe)
          `)
          .in('id', eligibleIds);

        if (profilesError) throw profilesError;

        // Combine data
        const fullProfiles: SwipeProfile[] = (profilesData || []).map((profile: any) => ({
          id: profile.id,
          name: profile.name,
          age: profile.age,
          bio: profile.bio,
          is_verified: profile.is_verified,
          photos: (profile.photos || []).map((p: any) => ({ url: p.url, is_primary: p.is_primary })),
          travel_vibes: (profile.travel_vibes || []).map((v: any) => v.vibe),
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
