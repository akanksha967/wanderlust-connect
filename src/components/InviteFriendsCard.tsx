import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Ticket, Copy, Check, Loader2, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteInfo {
  code: string;
  createdAt: string;
  used: boolean;
}

const InviteFriendsCard = () => {
  const { toast } = useToast();
  const [inviteSlots, setInviteSlots] = useState(0);
  const [invites, setInvites] = useState<InviteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInviteData();
  }, []);

  const fetchInviteData = async () => {
    try {
      // Get profile with invite slots
      const { data: profile } = await supabase
        .from('profiles')
        .select('invite_slots')
        .single();

      if (profile) {
        setInviteSlots(profile.invite_slots);
      }

      // Get existing invites
      const { data: invitesData } = await supabase
        .from('invites')
        .select('code, created_at, used_by_profile_id')
        .order('created_at', { ascending: false });

      if (invitesData) {
        setInvites(invitesData.map(inv => ({
          code: inv.code,
          createdAt: inv.created_at,
          used: !!inv.used_by_profile_id,
        })));
      }
    } catch (error) {
      console.error('Error fetching invite data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_invite_code');
      
      if (error) throw error;
      
      const result = data as { success: boolean; code?: string; slots_remaining?: number; error?: string };
      
      if (result.success) {
        toast({
          title: 'Invite Created!',
          description: `Code: ${result.code}`,
        });
        setInviteSlots(result.slots_remaining || 0);
        setInvites(prev => [{
          code: result.code!,
          createdAt: new Date().toISOString(),
          used: false,
        }, ...prev]);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate invite.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invite.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard.',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy code.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-lg">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white drop-shadow">Invite Friends</h3>
          <p className="text-xs text-white/70">{inviteSlots} invites remaining</p>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium mb-4"
        onClick={handleGenerateInvite}
        disabled={generating || inviteSlots <= 0}
      >
        {generating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Ticket className="w-4 h-4 mr-2" />
        )}
        {inviteSlots <= 0 ? 'No Invites Left' : 'Generate Invite Code'}
      </Button>

      {/* Existing Invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/70 drop-shadow">Your invite codes:</p>
          {invites.map((invite) => (
            <div
              key={invite.code}
              className={`flex items-center justify-between p-3 rounded-xl ${
                invite.used 
                  ? 'bg-white/20 opacity-60' 
                  : 'bg-white/40'
              } border border-white/30`}
            >
              <div>
                <span className="font-mono text-sm tracking-widest text-foreground">
                  {invite.code}
                </span>
                {invite.used && (
                  <span className="ml-2 text-xs text-green-600 font-medium">Used</span>
                )}
              </div>
              {!invite.used && (
                <button
                  onClick={() => handleCopyCode(invite.code)}
                  className="p-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {copiedCode === invite.code ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-foreground/70" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default InviteFriendsCard;
