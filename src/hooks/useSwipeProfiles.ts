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

      const [membershipsRes, profilesRes, tripsRes] = await Promise.all([
        supabase.from('trip_members').select('trip_id').eq('user_id', myProfileId),
        supabase
          .from('profiles')
          .select('id, name, age, bio, is_verified')
          .neq('id', myProfileId)
          .limit(40),
        supabase
          .from('trips')
          .select('*')
          .eq('is_active', true)
          .neq('creator_id', myProfileId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (membershipsRes.error) throw membershipsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (tripsRes.error) throw tripsRes.error;

      const excludedTripIds = new Set((membershipsRes.data || []).map((m) => m.trip_id));

      let travelPlansQuery = supabase
        .from('travel_plans')
        .select('profile_id, destination, start_date, end_date')
        .eq('is_active', true);

      if (destination) {
        travelPlansQuery = travelPlansQuery.ilike('destination', `%${destination}%`);
      }
      if (startDate) {
        travelPlansQuery = travelPlansQuery.lte('start_date', endDate || startDate);
      }
      if (endDate) {
        travelPlansQuery = travelPlansQuery.gte('end_date', startDate || endDate);
      }

      const { data: travelPlans, error: travelPlansError } = await travelPlansQuery.limit(200);
      if (travelPlansError) throw travelPlansError;

      const travelPlanMap = new Map<string, { destination: string; start_date: string; end_date: string }>();
      for (const tp of travelPlans || []) {
        if (!travelPlanMap.has(tp.profile_id)) {
          travelPlanMap.set(tp.profile_id, {
            destination: tp.destination,
            start_date: tp.start_date,
            end_date: tp.end_date,
          });
        }
      }

      const eligibleProfiles = (profilesRes.data || []).filter((p) => travelPlanMap.has(p.id));
      const profileIds = eligibleProfiles.map((p) => p.id);

      const [photosRes, vibesRes] = await Promise.all([
        profileIds.length > 0
          ? supabase
              .from('photos')
              .select('profile_id, url, is_primary')
              .in('profile_id', profileIds)
          : Promise.resolve({ data: [], error: null } as any),
        profileIds.length > 0
          ? supabase
              .from('travel_vibes')
              .select('profile_id, vibe')
              .in('profile_id', profileIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (photosRes.error) throw photosRes.error;
      if (vibesRes.error) throw vibesRes.error;

      const photosByProfile = new Map<string, { url: string; is_primary: boolean | null }[]>();
      for (const photo of photosRes.data || []) {
        if (!photosByProfile.has(photo.profile_id)) photosByProfile.set(photo.profile_id, []);
        photosByProfile.get(photo.profile_id)!.push({
          url: photo.url,
          is_primary: photo.is_primary,
        });
      }

      for (const [profileId, photos] of photosByProfile) {
        photos.sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)));
        photosByProfile.set(profileId, photos);
      }

      const vibesByProfile = new Map<string, string[]>();
      for (const vibe of vibesRes.data || []) {
        if (!vibesByProfile.has(vibe.profile_id)) vibesByProfile.set(vibe.profile_id, []);
        vibesByProfile.get(vibe.profile_id)!.push(vibe.vibe);
      }

      const travelers: SwipeProfile[] = eligibleProfiles.map((profile) => ({
        ...profile,
        photos: photosByProfile.get(profile.id) || [],
        travel_vibes: vibesByProfile.get(profile.id) || [],
        destination: travelPlanMap.get(profile.id)?.destination,
        start_date: travelPlanMap.get(profile.id)?.start_date,
        end_date: travelPlanMap.get(profile.id)?.end_date,
      }));

      const visibleTrips = (tripsRes.data || []).filter((trip) => !excludedTripIds.has(trip.id));

      const creatorIds = [...new Set(visibleTrips.map((trip) => trip.creator_id))];
      const [creatorsRes, tripMembersRes] = await Promise.all([
        creatorIds.length > 0
          ? supabase.from('profiles').select('id, name').in('id', creatorIds)
          : Promise.resolve({ data: [], error: null } as any),
        visibleTrips.length > 0
          ? supabase
              .from('trip_members')
              .select('trip_id, status')
              .in('trip_id', visibleTrips.map((trip) => trip.id))
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (creatorsRes.error) throw creatorsRes.error;
      if (tripMembersRes.error) throw tripMembersRes.error;

      const creatorNameMap = new Map<string, string>(
        (creatorsRes.data || []).map((c: any) => [c.id, c.name])
      );
      const approvedCountMap = new Map<string, number>();

      for (const member of tripMembersRes.data || []) {
        if (member.status !== 'approved') continue;
        approvedCountMap.set(member.trip_id, (approvedCountMap.get(member.trip_id) || 0) + 1);
      }

      const discoverTrips: (Trip & { creator_name?: string })[] = visibleTrips.map((trip: any) => ({
        ...trip,
        creator_name: creatorNameMap.get(trip.creator_id) || 'Traveler',
        member_count: approvedCountMap.get(trip.id) || 1,
      }));

      const mixed = interleaveDiscoverItems(travelers, discoverTrips);

      if (isBackground) {
        setItems((prev) => {
          const prevKeys = new Set(prev.map((i) => `${i.type}:${i.data.id}`));
          const newItems = mixed.filter((i) => !prevKeys.has(`${i.type}:${i.data.id}`));
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
