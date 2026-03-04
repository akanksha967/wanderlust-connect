import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Trip } from './useTrips';

export interface SwipeProfile {
  id: string;
  name: string;
  age: number | null;
  bio: string | null;
  is_verified: boolean | null;
  photos: { url: string; is_primary: boolean | null }[];
  travel_vibes: string[];
  destination?: string;
  start_date?: string;
  end_date?: string;
}

export type DiscoverItem =
  | { type: 'traveler'; tier: number; data: SwipeProfile }
  | { type: 'trip'; priority: number; data: Trip & { creator_name?: string } };

export const useSwipeProfiles = (destination: string, startDate: string, endDate: string) => {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profileId: myProfileId } = useAuth();
  const { toast } = useToast();

  const fetchDiscoverFeed = useCallback(async () => {
    if (!user || !myProfileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get already swiped profile IDs
      const { data: swipedData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', myProfileId);
      const swipedIds = (swipedData || []).map(s => s.swiped_id);

      // Get blocked IDs
      const { data: blockedData } = await supabase
        .from('blocks')
        .select('blocked_id, blocker_id')
        .or(`blocker_id.eq.${myProfileId},blocked_id.eq.${myProfileId}`);
      const blockedIds = (blockedData || []).flatMap(b =>
        b.blocker_id === myProfileId ? [b.blocked_id] : [b.blocker_id]
      );

      const excludeIds = [...new Set([myProfileId, ...swipedIds, ...blockedIds])];

      // Fetch profiles with overlapping travel plans
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, age, bio, is_verified')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(20);

      if (error) throw error;

      // Fetch photos and vibes for these profiles
      const profileIds = (profiles || []).map(p => p.id);

      const [photosRes, vibesRes, plansRes] = await Promise.all([
        profileIds.length > 0
          ? supabase.from('photos').select('profile_id, url, is_primary').in('profile_id', profileIds)
          : { data: [] },
        profileIds.length > 0
          ? supabase.from('travel_vibes').select('profile_id, vibe').in('profile_id', profileIds)
          : { data: [] },
        profileIds.length > 0
          ? supabase.from('travel_plans').select('profile_id, destination, start_date, end_date').in('profile_id', profileIds).eq('is_active', true)
          : { data: [] },
      ]);

      const photosMap = new Map<string, { url: string; is_primary: boolean | null }[]>();
      for (const p of (photosRes.data || [])) {
        if (!photosMap.has(p.profile_id)) photosMap.set(p.profile_id, []);
        photosMap.get(p.profile_id)!.push({ url: p.url, is_primary: p.is_primary });
      }

      const vibesMap = new Map<string, string[]>();
      for (const v of (vibesRes.data || [])) {
        if (!vibesMap.has(v.profile_id)) vibesMap.set(v.profile_id, []);
        vibesMap.get(v.profile_id)!.push(v.vibe);
      }

      const plansMap = new Map<string, { destination: string; start_date: string; end_date: string }>();
      for (const tp of (plansRes.data || [])) {
        plansMap.set(tp.profile_id, tp);
      }

      const travelerItems: DiscoverItem[] = (profiles || []).map(p => {
        const plan = plansMap.get(p.id);
        return {
          type: 'traveler' as const,
          tier: 1,
          data: {
            id: p.id,
            name: p.name,
            age: p.age,
            bio: p.bio,
            is_verified: p.is_verified,
            photos: photosMap.get(p.id) || [],
            travel_vibes: vibesMap.get(p.id) || [],
            destination: plan?.destination,
            start_date: plan?.start_date,
            end_date: plan?.end_date,
          },
        };
      });

      // Fetch active trips (exclude own)
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('is_active', true)
        .neq('creator_id', myProfileId)
        .limit(10);

      const tripItems: DiscoverItem[] = (tripsData || []).map(t => ({
        type: 'trip' as const,
        priority: 1,
        data: t as Trip,
      }));

      // Interleave: Traveler -> Traveler -> Trip
      const mixed: DiscoverItem[] = [];
      let tIdx = 0, trIdx = 0;
      while (tIdx < travelerItems.length || trIdx < tripItems.length) {
        if (tIdx < travelerItems.length) mixed.push(travelerItems[tIdx++]);
        if (tIdx < travelerItems.length) mixed.push(travelerItems[tIdx++]);
        if (trIdx < tripItems.length) mixed.push(tripItems[trIdx++]);
        if (tIdx >= travelerItems.length && trIdx < tripItems.length) {
          mixed.push(tripItems[trIdx++]);
        }
      }

      setItems(mixed);
    } catch (error: any) {
      console.error('Error fetching discover feed:', error);
      // Don't show error toast for empty results - it's normal
    } finally {
      setLoading(false);
    }
  }, [user, myProfileId, destination, startDate, endDate, toast]);

  useEffect(() => {
    fetchDiscoverFeed();
  }, [fetchDiscoverFeed]);

  const recordSwipe = async (swipedId: string, direction: 'left' | 'right') => {
    if (!user || !myProfileId) return { matched: false };

    try {
      const { error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: myProfileId,
          swiped_id: swipedId,
          direction,
        });

      if (error) throw error;

      if (direction === 'right') {
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .or(`and(profile1_id.eq.${myProfileId},profile2_id.eq.${swipedId}),and(profile1_id.eq.${swipedId},profile2_id.eq.${myProfileId})`)
          .maybeSingle();

        return { matched: !!match };
      }

      return { matched: false };
    } catch (error: any) {
      console.error('Error recording swipe:', error);
      return { matched: false };
    }
  };

  const blockUser = async (blockedId: string) => {
    if (!user || !myProfileId) return false;

    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: myProfileId,
          blocked_id: blockedId,
        });

      if (error) throw error;

      setItems(prev => prev.filter(item => item.type === 'traveler' ? item.data.id !== blockedId : true));
      toast({
        title: 'User blocked',
        description: 'You will no longer see this profile',
      });
      return true;
    } catch (error: any) {
      console.error('Error blocking user:', error);
      return false;
    }
  };

  const reportUser = async (reportedId: string, reason: string, description?: string) => {
    if (!user || !myProfileId) return false;

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: myProfileId,
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
      return false;
    }
  };

  return {
    items,
    profiles: items.filter(i => i.type === 'traveler').map(i => i.data),
    loading,
    recordSwipe,
    blockUser,
    reportUser,
    refresh: fetchDiscoverFeed
  };
};
