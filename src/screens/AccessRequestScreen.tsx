import { useState } from 'react';
import roammateLogo from "@/assets/roammate-logo.png";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Ticket, Loader2, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AccessRequestScreen = () => {
  const { status, requestAccess, useInviteCode, loading } = useAccessControl();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestAccess = async () => {
    setSubmitting(true);
    const success = await requestAccess();
    setSubmitting(false);
    
    if (success) {
      toast({
        title: 'Request Submitted',
        description: 'You\'ll be notified when your access is approved.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUseInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Enter Code',
        description: 'Please enter an invite code.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const result = await useInviteCode(inviteCode);
    setSubmitting(false);

    if (result.success) {
      toast({
        title: 'Welcome!',
        description: 'Your invite code was accepted. Enjoy RoamMate!',
      });
      // Refresh the page to trigger access check
      window.location.reload();
    } else {
      toast({
        title: 'Invalid Code',
        description: result.error || 'This invite code is invalid or expired.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=90')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-400/50 via-indigo-400/40 to-violet-500/50" />
      <div className="fixed inset-0 backdrop-blur-md" />

      {/* Content */}
      <div className="flex items-center justify-center h-full px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md rounded-[28px] bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-6"
        >
          {/* Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <img src={roammateLogo} alt="RoamMate logo" className="w-14 h-14 object-contain drop-shadow-lg" style={{ clipPath: 'circle(43% at center)' }} />
            <p className="text-xs text-foreground/70 mt-1.5">Invite-only travel companion</p>
          </div>

          {/* Status Display */}
          {status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="font-medium text-lg text-foreground mb-2">Access Pending</h2>
              <p className="text-sm text-foreground/70">
                Your request is being reviewed. We'll notify you once approved!
              </p>
            </motion.div>
          )}

          {status === 'rejected' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="font-medium text-lg text-foreground mb-2">Request Declined</h2>
              <p className="text-sm text-foreground/70">
                Unfortunately, your access request was not approved. You can try with an invite code from a friend.
              </p>
            </motion.div>
          )}

          {status === 'none' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Ticket className="w-8 h-8 text-sky-600" />
              </div>
              <h2 className="font-medium text-lg text-foreground mb-2">Join RoamMate</h2>
              <p className="text-sm text-foreground/70">
                RoamMate is invite-only. Request access or enter an invite code from a friend.
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {(status === 'none' || status === 'rejected') && (
              <>
                {!showInviteInput ? (
                  <>
                    <Button
                      className="w-full h-11 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium"
                      onClick={handleRequestAccess}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Request Access
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-2xl bg-white/50 hover:bg-white/70 border border-white/50 text-foreground"
                      onClick={() => setShowInviteInput(true)}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Have an Invite Code?
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter invite code"
                      className="h-11 rounded-2xl bg-white/80 border border-white/50 text-center font-mono text-lg tracking-widest uppercase"
                      maxLength={8}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-2xl bg-white/50 hover:bg-white/70 border border-white/50"
                        onClick={() => {
                          setShowInviteInput(false);
                          setInviteCode('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium"
                        onClick={handleUseInviteCode}
                        disabled={submitting || !inviteCode.trim()}
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Submit'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {status === 'pending' && (
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl bg-white/50 hover:bg-white/70 border border-white/50 text-foreground"
                onClick={() => setShowInviteInput(!showInviteInput)}
              >
                <Ticket className="w-4 h-4 mr-2" />
                {showInviteInput ? 'Hide' : 'Use Invite Code Instead'}
              </Button>
            )}

            {(status === 'pending' && showInviteInput) && (
              <div className="space-y-3">
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  className="h-11 rounded-2xl bg-white/80 border border-white/50 text-center font-mono text-lg tracking-widest uppercase"
                  maxLength={8}
                />
                <Button
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium"
                  onClick={handleUseInviteCode}
                  disabled={submitting || !inviteCode.trim()}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Submit Code'
                  )}
                </Button>
              </div>
            )}

            {/* Sign out option */}
            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-foreground/60 text-center mb-2">
                Signed in as {user?.email || user?.phone}
              </p>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-foreground/70 hover:text-foreground hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccessRequestScreen;
