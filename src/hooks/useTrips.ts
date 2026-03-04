import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Trip {
  id: string;
  creator_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: string | null;
  travel_style: string | null;
  description: string | null;
  max_travelers: number | null;
  is_active: boolean | null;
  share_code: string | null;
  created_at: string;
  creator?: { name: string; photos?: { url: string }[] };
  member_count?: number;
  recent_members?: { name: string; joined_at: string }[];
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  status: string;
  joined_at: string | null;
  created_at: string;
  profile?: { name: string; photos?: { url: string }[] };
}

export interface TripStory {
  id: string;
  trip_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: { name: string; photo?: string };
}

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { profileId } = useAuth();
  const { toast } = useToast();

  const fetchTrips = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tripsData = (data as any[]) || [];
      const tripIds = tripsData.map(t => t.id);
      const creatorIds = [...new Set(tripsData.map(t => t.creator_id))];

      // Batch fetch member counts and creator info
      const [membersRes, creatorsRes] = await Promise.all([
        tripIds.length > 0
          ? supabase.from('trip_members').select('trip_id, user_id, joined_at, status').in('trip_id', tripIds).eq('status', 'approved')
          : { data: [] },
        creatorIds.length > 0
          ? supabase.from('profiles').select('id, name').in('id', creatorIds)
          : { data: [] },
      ]);

      const memberCountMap = new Map<string, number>();
      const recentMembersMap = new Map<string, { user_id: string; joined_at: string }[]>();
      for (const m of (membersRes.data || [])) {
        memberCountMap.set(m.trip_id, (memberCountMap.get(m.trip_id) || 0) + 1);
        if (!recentMembersMap.has(m.trip_id)) recentMembersMap.set(m.trip_id, []);
        if (m.joined_at) recentMembersMap.get(m.trip_id)!.push({ user_id: m.user_id, joined_at: m.joined_at });
      }

      const creatorMap = new Map((creatorsRes.data || []).map(c => [c.id, c]));

      // Get recent member names
      const allRecentUserIds = [...new Set([...recentMembersMap.values()].flat().map(m => m.user_id))];
      let recentNameMap = new Map<string, string>();
      if (allRecentUserIds.length > 0) {
        const { data: names } = await supabase.from('profiles').select('id, name').in('id', allRecentUserIds);
        recentNameMap = new Map((names || []).map(n => [n.id, n.name]));
      }

      const tripsWithCounts = tripsData.map(trip => ({
        ...trip,
        member_count: (memberCountMap.get(trip.id) || 0) + 1, // +1 for creator
        creator: creatorMap.get(trip.creator_id),
        recent_members: (recentMembersMap.get(trip.id) || [])
          .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
          .slice(0, 3)
          .map(m => ({ name: recentNameMap.get(m.user_id) || 'Traveler', joined_at: m.joined_at })),
      }));

      setTrips(tripsWithCounts);
      if (profileId) {
        setMyTrips(tripsWithCounts.filter(t => t.creator_id === profileId));
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = async (tripData: {
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    budget?: string;
    travel_style?: string;
    description?: string;
    max_travelers?: number;
  }) => {
    if (!profileId) return null;
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({ ...tripData, creator_id: profileId })
        .select()
        .single();

      if (error) throw error;

      // Auto-add creator as approved member
      await supabase
        .from('trip_members')
        .insert({
          trip_id: data.id,
          user_id: profileId,
          status: 'approved',
          joined_at: new Date().toISOString(),
        });

      toast({ title: 'Trip created! 🎒', description: 'Your trip board is live' });
      await fetchTrips();
      return data;
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({ title: 'Error', description: 'Failed to create trip', variant: 'destructive' });
      return null;
    }
  };

  const requestToJoin = async (tripId: string) => {
    if (!profileId) return false;
    try {
      // Check if trip is full
      const trip = trips.find(t => t.id === tripId);
      if (trip && trip.member_count && trip.max_travelers && trip.member_count >= trip.max_travelers) {
        toast({ title: 'Trip full', description: 'This trip has no more spots available' });
        return false;
      }

      const { error } = await supabase
        .from('trip_members')
        .insert({ trip_id: tripId, user_id: profileId, status: 'pending' });

      if (error) throw error;

      // Create notification for trip creator
      if (trip) {
        try {
          const { data: myProfile } = await supabase.from('profiles').select('name').eq('id', profileId).single();
          await supabase.from('notifications').insert({
            user_id: trip.creator_id,
            type: 'trip_join_request',
            reference_id: tripId,
            reference_type: 'trip',
            title: `${myProfile?.name || 'Someone'} wants to join your ${trip.title}`,
            body: 'Tap to approve or decline',
            icon: '✈️',
            metadata: { requester_id: profileId, trip_id: tripId },
          });
        } catch {
          // notifications insert may fail due to RLS, that's ok
        }
      }

      toast({ title: 'Request sent! ✈️', description: 'The trip creator will review your request' });
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: 'Already requested', description: 'You already requested to join this trip' });
      } else {
        toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
      }
      return false;
    }
  };

  const manageMember = async (memberId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData: any = { status };
      if (status === 'approved') updateData.joined_at = new Date().toISOString();

      const { error } = await supabase
        .from('trip_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: status === 'approved' ? 'Member approved! 🎉' : 'Request declined' });
      await fetchTrips();
      return true;
    } catch (error) {
      console.error('Error managing member:', error);
      return false;
    }
  };

  const fetchTripMembers = async (tripId: string): Promise<TripMember[]> => {
    try {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const memberIds = (data || []).map(m => m.user_id);
      if (memberIds.length === 0) return [];

      const [profilesRes, photosRes] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', memberIds),
        supabase.from('photos').select('profile_id, url').in('profile_id', memberIds).eq('is_primary', true),
      ]);

      const nameMap = new Map((profilesRes.data || []).map(p => [p.id, p.name]));
      const photoMap = new Map((photosRes.data || []).map(p => [p.profile_id, p.url]));

      return (data || []).map(m => ({
        ...m,
        profile: {
          name: nameMap.get(m.user_id) || 'Traveler',
          photos: photoMap.has(m.user_id) ? [{ url: photoMap.get(m.user_id)! }] : [],
        },
      }));
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  };

  const fetchTripStories = async (tripId: string): Promise<TripStory[]> => {
    try {
      const { data, error } = await supabase
        .from('trip_stories')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(s => s.user_id))];
      if (userIds.length === 0) return [];

      const [profilesRes, photosRes] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', userIds),
        supabase.from('photos').select('profile_id, url').in('profile_id', userIds).eq('is_primary', true),
      ]);

      const nameMap = new Map((profilesRes.data || []).map(p => [p.id, p.name]));
      const photoMap = new Map((photosRes.data || []).map(p => [p.profile_id, p.url]));

      return (data || []).map(s => ({
        ...s,
        author: { name: nameMap.get(s.user_id) || 'Traveler', photo: photoMap.get(s.user_id) },
      }));
    } catch (error) {
      console.error('Error fetching stories:', error);
      return [];
    }
  };

  const postStory = async (tripId: string, content: string, imageUrl?: string) => {
    if (!profileId) return false;
    try {
      const { error } = await supabase.from('trip_stories').insert({
        trip_id: tripId,
        user_id: profileId,
        content,
        image_url: imageUrl || null,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error posting story:', error);
      return false;
    }
  };

  return {
    trips,
    myTrips,
    loading,
    createTrip,
    requestToJoin,
    manageMember,
    fetchTripMembers,
    fetchTripStories,
    postStory,
    refresh: fetchTrips,
  };
};
