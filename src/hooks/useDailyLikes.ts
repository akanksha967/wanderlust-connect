import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useDailyLikes = () => {
  const [likesRemaining, setLikesRemaining] = useState(10);
  const [likesUsed, setLikesUsed] = useState(0);
  const [maxLikes, setMaxLikes] = useState(10);
  const [loading, setLoading] = useState(true);
  const { profileId } = useAuth();

  const fetchLimits = useCallback(async () => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase.rpc('get_daily_likes_remaining');
      if (error) throw error;
      const result = data as any;
      setLikesRemaining(result.likes_remaining);
      setLikesUsed(result.likes_used);
      setMaxLikes(result.max_likes);
    } catch (error) {
      console.error('Error fetching daily likes:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const createLike = async (targetProfileId: string) => {
    try {
      const { data, error } = await supabase.rpc('create_like_with_limit', {
        target_profile_id: targetProfileId,
      });
      if (error) throw error;
      const result = data as any;
      if (result.success) {
        setLikesRemaining(result.likes_remaining);
        setLikesUsed(prev => prev + 1);
      }
      return result;
    } catch (error) {
      console.error('Error creating like:', error);
      return { success: false, error: 'Failed to like' };
    }
  };

  return {
    likesRemaining,
    likesUsed,
    maxLikes,
    loading,
    createLike,
    refresh: fetchLimits,
    isExhausted: likesRemaining <= 0,
  };
};
