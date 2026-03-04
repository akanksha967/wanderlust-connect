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

      // Fetch member counts
      const tripsWithCounts = await Promise.all(
        ((data as any[]) || []).map(async (trip: any) => {
          const { count } = await supabase
            .from('trip_members')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id)
            .eq('status', 'approved');

          // Fetch creator info
          const { data: creator } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', trip.creator_id)
            .single();

          return { ...trip, member_count: (count || 0) + 1, creator }; // +1 for creator
        })
      );

      setTrips(tripsWithCounts);

      if (profileId) {
        setMyTrips(tripsWithCounts.filter((t: any) => t.creator_id === profileId));
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
      toast({ title: 'Trip created!', description: 'Your trip board is live' });
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
      const { error } = await supabase
        .from('trip_members')
        .insert({ trip_id: tripId, user_id: profileId, status: 'pending' });

      if (error) throw error;
      toast({ title: 'Request sent!', description: 'The trip creator will review your request' });
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
      toast({ title: `Member ${status}` });
      return true;
    } catch (error) {
      console.error('Error managing member:', error);
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
    refresh: fetchTrips,
  };
};
