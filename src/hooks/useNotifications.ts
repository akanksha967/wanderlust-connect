import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  title: string;
  body: string | null;
  icon: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { profileId } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!profileId) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId)
        .neq('status', 'cleared')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profileId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchNotifications]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  
  // Only show first 3 unread like notifications (queued system)
  const visibleNotifications = (() => {
    const likeNotifs = notifications.filter(n => (n.type === 'like' || n.type === 'destination_match') && n.status === 'unread');
    const otherNotifs = notifications.filter(n => n.type !== 'like' && n.type !== 'destination_match');
    const readLikeNotifs = notifications.filter(n => (n.type === 'like' || n.type === 'destination_match') && n.status === 'read');
    
    return [...otherNotifs, ...likeNotifs.slice(0, 3), ...readLikeNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  })();

  const revealLike = async (notificationId: string) => {
    try {
      const { data, error } = await supabase.rpc('reveal_like', { notification_id: notificationId });
      if (error) throw error;
      await fetchNotifications();
      return data as any;
    } catch (error) {
      console.error('Error revealing like:', error);
      return null;
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'cleared' })
        .eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'cleared' })
        .eq('user_id', profileId!);
      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return {
    notifications: visibleNotifications,
    unreadCount,
    loading,
    revealLike,
    dismissNotification,
    markAsRead,
    clearAll,
    refresh: fetchNotifications,
  };
};
