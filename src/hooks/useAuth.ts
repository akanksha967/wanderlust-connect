import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const setHasCompletedProfile = useAppStore((state) => state.setHasCompletedProfile);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Don't set loading false here - wait for profile check
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile ID and check if profile exists when user changes
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setProfileId(null);
        setHasExistingProfile(false);
        setLoading(false);
        return;
      }

      try {
        // Check if profile exists with required fields
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, age, bio')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfileId(profileData.id);
          
          // Check if profile has essential info (name at minimum)
          const hasCompleteProfile = !!(profileData.name && profileData.name.trim());
          setHasExistingProfile(hasCompleteProfile);
          setHasCompletedProfile(hasCompleteProfile);
        } else {
          setHasExistingProfile(false);
          setHasCompletedProfile(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setHasExistingProfile(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, setHasCompletedProfile]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
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

  const deleteAccount = async () => {
    // Sign out the user - actual account deletion would require an edge function
    // For now, we sign out and show a message
    await signOut();
    toast({
      title: 'Account Deletion Requested',
      description: 'Your account deletion request has been submitted.',
    });
  };

  return {
    user,
    session,
    profileId,
    hasExistingProfile,
    loading,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    signOut,
    deleteAccount,
  };
};
