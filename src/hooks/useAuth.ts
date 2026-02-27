import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const pendingHashSessionRef = { current: false } as { current: boolean };

    const syncSessionState = (nextSession: Session | null) => {
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfileId(null);
      } else {
        // Profile fetch should not block auth initialization
        void fetchProfileId(nextSession.user.id);
      }

      // Always unblock initialization once we have a resolved auth state
      setLoading(false);
    };

    const getHashTokens = () => {
      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;

      const params = new URLSearchParams(rawHash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) return null;
      return { access_token, refresh_token };
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        // Avoid resolving auth to null while we're still processing OAuth hash tokens
        if (pendingHashSessionRef.current && !nextSession) {
          return;
        }
        syncSessionState(nextSession);
      }
    );

    const initializeSession = async () => {
      setLoading(true);

      const hashTokens = getHashTokens();
      if (hashTokens) {
        pendingHashSessionRef.current = true;
        try {
          const { data, error } = await supabase.auth.setSession(hashTokens);
          if (error) throw error;

          syncSessionState(data.session ?? null);

          // Clean URL hash after successful token consumption
          if (!cancelled) {
            window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
          }
          return;
        } catch (error) {
          console.error('Error restoring OAuth session from URL hash:', error);
        } finally {
          pendingHashSessionRef.current = false;
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        syncSessionState(session ?? null);
      } catch (error) {
        console.error('Error initializing session:', error);
        syncSessionState(null);
      } finally {
        // Always end loading even if listener hasn't fired
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfileId = async (uid: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (profileData) {
        setProfileId(profileData.id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signInWithGoogle = async () => {
    const { lovable } = await import('@/integrations/lovable/index');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
      extraParams: {
        prompt: 'select_account',
      },
    });
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      });
    }
  };

  const sendOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    toast({
      title: 'OTP Sent',
      description: 'Check your phone for the verification code',
    });
    return true;
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account.',
          variant: 'destructive',
        });
        return false;
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete account');
      }

      // Clear local state
      await supabase.auth.signOut();

      toast({
        title: 'Account Deleted',
        description: 'Your account and all data have been permanently removed.',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    user,
    session,
    profileId,
    loading,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    signOut,
    deleteAccount,
  };
};
