import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmailAuthModal = ({ isOpen, onClose, onSuccess }: EmailAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For now, just proceed to profile
      // In real implementation, you'd call supabase.auth.signInWithPassword or signUp
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const isValid = email.includes('@') && password.length >= 6;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-3xl shadow-float p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-foreground">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-12 pl-12 rounded-xl bg-secondary border-0 shadow-soft"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 pl-12 pr-12 rounded-xl bg-secondary border-0 shadow-soft"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {!isSignUp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 6 characters
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={!isValid || loading}
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-accent font-medium"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailAuthModal;
