import { useState, useEffect, useCallback, useRef } from 'react';
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
  const isClearing = useRef(false);
  const refreshTimeout = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!profileId || isClearing.current) return;

    try {
      // Fetch non-like notifications
      const { data: otherData, error: otherError } = await (supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId) as any)
        .neq('status', 'cleared')
        .not('type', 'in', '("like","destination_match")')
        .order('created_at', { ascending: false })
        .limit(20);

      if (otherError) throw otherError;

      // Fetch unread like/destination_match notifications
      const { data: unreadLikes, error: likesError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId)
        .in('type', ['like', 'destination_match'])
        .eq('status', 'unread')
        .order('created_at', { ascending: true })
        .limit(3);

      if (likesError) throw likesError;

      // Fetch read like notifications for history
      const { data: readLikes, error: readError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId)
        .in('type', ['like', 'destination_match'])
        .eq('status', 'read')
        .order('created_at', { ascending: false })
        .limit(10);

      if (readError) throw readError;

      if (isClearing.current) return;

      const all = [
        ...((otherData as any[]) || []),
        ...((unreadLikes as any[]) || []),
        ...((readLikes as any[]) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(all);
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
      .channel(`notifs-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profileId}`,
        },
        async (payload) => {
          console.log('[Realtime Notif]', payload.eventType);
          if (isClearing.current) return;

          // Debounce refresh to handle bulk updates gracefully
          if (refreshTimeout.current) window.clearTimeout(refreshTimeout.current);
          refreshTimeout.current = window.setTimeout(async () => {
            if (!isClearing.current) {
              await fetchNotifications();
            }
            refreshTimeout.current = null;
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime Subscription Status]', status);
      });

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeout.current) window.clearTimeout(refreshTimeout.current);
    };
  }, [profileId, fetchNotifications]);

  // Count unread from fetched data only (already limited to 3 likes)
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

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
    if (!profileId || isClearing.current) return;
    try {
      isClearing.current = true;

      // Cancel any pending debounced refresh
      if (refreshTimeout.current) {
        window.clearTimeout(refreshTimeout.current);
        refreshTimeout.current = null;
      }

      // Optimistically clear local state
      const previousNotifications = [...notifications];
      setNotifications([]);

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'cleared' })
        .eq('user_id', profileId)
        .neq('status', 'cleared');

      if (error) {
        console.error('Error clearing notifications:', error);
        // Rollback on error
        setNotifications(previousNotifications);
        throw error;
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      // Longer delay to ensure all real-time events have processed
      setTimeout(() => {
        isClearing.current = false;
      }, 2000);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    revealLike,
    dismissNotification,
    markAsRead,
    clearAll,
    refresh: fetchNotifications,
  };
};
