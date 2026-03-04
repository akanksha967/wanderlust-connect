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

  const fetchDiscoverFeed = useCallback(async (isBackground = false) => {
    if (!user || !myProfileId) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground && items.length === 0) {
        setLoading(true);
      }

      // @ts-ignore - function exists in DB but not in generated types
      const { data, error } = await supabase.rpc('get_discover_feed', {
        p_profile_id: myProfileId,
        p_destination: destination,
        p_start_date: startDate || new Date().toISOString().split('T')[0],
        p_end_date: endDate || new Date().toISOString().split('T')[0],
        p_limit: 30
      });

      if (error) throw error;

      const mixed = (data as any[]) || [];

      if (isBackground) {
        // When background refreshing, append uniquely by data id
        setItems(prev => {
          const prevIds = new Set(prev.map(i => i.data.id));
          const newItems = mixed.filter(i => !prevIds.has(i.data.id));
          return [...prev, ...newItems];
        });
      } else {
        setItems(mixed);
      }
    } catch (error: any) {
      console.error('Error fetching discover feed:', error);
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
