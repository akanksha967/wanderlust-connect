import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const isValid = email.includes('@') && password.length >= 6;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <div className="bg-white/90 backdrop-blur-2xl rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-xl font-serif text-gray-900">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/60 transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-foreground/70" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="px-6 pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium text-gray-800 mb-2 block">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-12 pl-12 rounded-xl bg-white/70 border border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 pl-12 pr-12 rounded-xl bg-white/70 border border-gray-200 text-gray-900 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                    {!isSignUp && (
                      <p className="text-xs text-gray-600 mt-1">
                        Minimum 6 characters
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  )}
                </div>

                <div className="px-6 pb-6 pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-400 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white font-medium shadow-lg transition-all hover:scale-[1.02]"
                    disabled={!isValid || loading}
                  >
                    {loading
                      ? "Please wait..."
                      : isSignUp
                        ? "Create Account"
                        : "Sign In"}
                  </Button>

                  <p className="text-center text-sm text-gray-700">
                    {isSignUp
                      ? "Already have an account?"
                      : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailAuthModal;
