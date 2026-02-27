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

    const syncSessionState = (nextSession: Session | null) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfileId(null);
      } else {
        void fetchProfileId(nextSession.user.id);
      }
      setLoading(false);
    };

    // Set up auth state listener FIRST — Supabase auto-detects hash tokens
    // and fires SIGNED_IN here, so no manual hash parsing needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        syncSessionState(nextSession);
      }
    );

    // Then get any existing session (for page refreshes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        syncSessionState(session);
      }
    }).catch(() => {
      if (!cancelled) {
        syncSessionState(null);
      }
    });

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
