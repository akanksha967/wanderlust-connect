import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isProcessingOAuthRef = useRef(false);
  const AUTH_INIT_TIMEOUT_MS = 10000;

  const withTimeout = async <T,>(promise: Promise<T>, label: string): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), AUTH_INIT_TIMEOUT_MS)
      ),
    ]);
  };
  useEffect(() => {
    let cancelled = false;

    const syncSessionState = (nextSession: Session | null) => {
      if (cancelled) return;
      console.log('[useAuth] syncSessionState:', nextSession ? `user=${nextSession.user.id}` : 'null');
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfileId(null);
      } else {
        void fetchProfileId(nextSession.user.id);
      }
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        console.log('[useAuth] onAuthStateChange:', _event, 'processing:', isProcessingOAuthRef.current);
        if (isProcessingOAuthRef.current && !nextSession) return;
        syncSessionState(nextSession);
      }
    );

    const initializeAuth = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hasHashTokens = !!accessToken;
        console.log('[useAuth] initializeAuth: hasHashTokens=', hasHashTokens);

        if (accessToken && refreshToken) {
          isProcessingOAuthRef.current = true;
          try {
            await withTimeout(
              supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              }),
              'setSession'
            );
          } catch (error) {
            console.error('[useAuth] setSession failed:', error);
          }
        }

        if (hasHashTokens) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}`
          );
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'getSession');
        console.log('[useAuth] getSession:', session ? `user=${session.user.id}` : 'null');

        if (!cancelled) {
          syncSessionState(session ?? null);
        }
      } catch (error) {
        console.error('[useAuth] initializeAuth failed:', error);
        if (!cancelled) {
          syncSessionState(null);
        }
      } finally {
        isProcessingOAuthRef.current = false;
      }
    };

    void initializeAuth();

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
