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

const interleaveDiscoverItems = (
  travelers: SwipeProfile[],
  trips: (Trip & { creator_name?: string })[]
): DiscoverItem[] => {
  const mixed: DiscoverItem[] = [];
  let travelerIndex = 0;
  let tripIndex = 0;

  while (travelerIndex < travelers.length || tripIndex < trips.length) {
    for (let i = 0; i < 2 && travelerIndex < travelers.length; i += 1) {
      mixed.push({ type: 'traveler', tier: 1, data: travelers[travelerIndex] });
      travelerIndex += 1;
    }

    if (tripIndex < trips.length) {
      mixed.push({ type: 'trip', priority: 1, data: trips[tripIndex] });
      tripIndex += 1;
    }

    if (travelerIndex >= travelers.length && tripIndex < trips.length) {
      mixed.push(...trips.slice(tripIndex).map((trip) => ({ type: 'trip' as const, priority: 1, data: trip })));
      break;
    }

    if (tripIndex >= trips.length && travelerIndex < travelers.length) {
      mixed.push(
        ...travelers.slice(travelerIndex).map((traveler) => ({ type: 'traveler' as const, tier: 1, data: traveler }))
      );
      break;
    }
  }

  return mixed;
};

export const useSwipeProfiles = (destination: string, startDate: string, endDate: string) => {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profileId: myProfileId } = useAuth();
  const { toast } = useToast();

  const fetchDiscoverFeed = useCallback(async (isBackground = false) => {
    if (!user || !myProfileId) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground && items.length === 0) {
        setLoading(true);
      }

      const effectiveDestination = destination?.trim() || 'Bali';
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      // @ts-ignore - function exists in DB but not in generated types
      const { data, error } = await supabase.rpc('get_discover_feed', {
        p_profile_id: myProfileId,
        p_destination: effectiveDestination,
        p_start_date: start,
        p_end_date: end,
        p_limit: 30
      });

      if (error) throw error;

      const raw = data as unknown;
      const mixed = Array.isArray(raw) ? raw : [];

      if (isBackground) {
        setItems(prev => {
          const prevKeys = new Set(prev.map(i => `${i.type}:${i.data.id}`));
          const newItems = mixed.filter((i: DiscoverItem) => !prevKeys.has(`${i.type}:${i.data.id}`));
          return [...prev, ...newItems];
        });
      } else {
        setItems(mixed);
      }
    } catch (error: any) {
      console.error('Error fetching discover feed:', error);
      toast({
        title: 'Couldn’t load feed',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive',
      });
      if (!isBackground) setItems([]);
    } finally {
      if (items.length === 0 || !isBackground) {
        setLoading(false);
      }
    }
  }, [user, myProfileId, destination, startDate, endDate, items.length]);

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

      setItems((prev) => prev.filter((item) => (item.type === 'traveler' ? item.data.id !== blockedId : true)));
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
    profiles: items.filter((i) => i.type === 'traveler').map((i) => i.data),
    loading,
    recordSwipe,
    blockUser,
    reportUser,
    refresh: fetchDiscoverFeed,
  };
};
