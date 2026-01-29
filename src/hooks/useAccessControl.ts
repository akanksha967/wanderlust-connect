import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AccessStatus {
  hasAccess: boolean;
  status: 'loading' | 'none' | 'pending' | 'approved' | 'rejected' | 'admin';
}

export const useAccessControl = () => {
  const { user, loading: authLoading } = useAuth();
  const [accessStatus, setAccessStatus] = useState<AccessStatus>({
    hasAccess: false,
    status: 'loading',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        setAccessStatus({ hasAccess: false, status: 'none' });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_user_access');
        
        if (error) throw error;
        
        const result = data as { has_access: boolean; status: string };
        setAccessStatus({
          hasAccess: result.has_access,
          status: result.status as AccessStatus['status'],
        });
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessStatus({ hasAccess: false, status: 'none' });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading]);

  const requestAccess = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          user_id: user.id,
          email: user.email || user.phone || 'unknown',
        });

      if (error) throw error;
      
      setAccessStatus({ hasAccess: false, status: 'pending' });
      return true;
    } catch (error) {
      console.error('Error requesting access:', error);
      return false;
    }
  };

  const useInviteCode = async (code: string) => {
    try {
      const { data, error } = await supabase.rpc('use_invite_code', {
        invite_code: code.toUpperCase().trim(),
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        setAccessStatus({ hasAccess: true, status: 'approved' });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error using invite code:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    ...accessStatus,
    loading: loading || authLoading,
    requestAccess,
    useInviteCode,
  };
};
