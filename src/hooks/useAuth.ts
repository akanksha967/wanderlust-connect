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
    // Track whether initial session has been resolved.
    // Until this is true, onAuthStateChange must NOT flip loading to false
    // with a stale/null session (which would trigger a redirect to /login).
    let initialised = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Before initialisation completes, only accept non-null sessions from
        // the listener (e.g. Supabase SDK recovering from localStorage).
        // A null session at this stage is likely the INITIAL_SESSION event
        // firing before we've had a chance to process hash tokens.
        if (!initialised && !session) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setLoading(false);
          setProfileId(null);
        } else {
          fetchProfileId(session.user.id);
        }
      }
    );

    const initializeSession = async () => {
      // Recover OAuth sessions when provider redirects with hash tokens
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: setSessionData, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          const recoveredSession = setSessionData.session;
          setSession(recoveredSession);
          setUser(recoveredSession?.user ?? null);

          if (recoveredSession?.user) {
            await fetchProfileId(recoveredSession.user.id);
          } else {
            setLoading(false);
          }

          // Remove sensitive tokens from URL after session is established
          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
          initialised = true;
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setLoading(false);
      } else {
        fetchProfileId(session.user.id);
      }

      initialised = true;
    };

    initializeSession();

    return () => subscription.unsubscribe();
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
    } finally {
      setLoading(false);
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
