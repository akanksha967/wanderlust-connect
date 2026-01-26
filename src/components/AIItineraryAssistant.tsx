import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, MapPin, Calendar, Lock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface AIItineraryAssistantProps {
  destination: string;
}

export const AIItineraryAssistant = ({ destination }: AIItineraryAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [budget, setBudget] = useState('');
  const [days, setDays] = useState('5');
  const [preferences, setPreferences] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [itinerary]);

  const checkAccess = async () => {
    try {
      const { data, error } = await supabase.rpc('check_ai_access');
      if (error) throw error;
      
      const result = data as { has_access: boolean; spots_remaining: number };
      setHasAccess(result.has_access);
      
      // Check if user has already used their free generation
      if (result.has_access) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            const { data: aiUser } = await supabase
              .from('ai_itinerary_users')
              .select('usage_count')
              .eq('profile_id', profile.id)
              .single();
            
            if (aiUser && aiUser.usage_count >= 1) {
              setNeedsSubscription(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking AI access:', error);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const claimAccess = async () => {
    try {
      // Get the current user's session first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: 'Error', description: 'Please log in first', variant: 'destructive' });
        return;
      }

      // Get profile using user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        toast({ title: 'Error', description: 'Please complete your profile first', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('ai_itinerary_users')
        .insert({ profile_id: profile.id });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already registered', description: 'You already have access!' });
          setHasAccess(true);
        } else {
          throw error;
        }
        return;
      }

      setHasAccess(true);
      toast({ title: 'Access granted!', description: 'You can now use the AI itinerary assistant' });
    } catch (error: any) {
      console.error('Error claiming access:', error);
      toast({ title: 'Error', description: 'Failed to claim access. Spots may be full.', variant: 'destructive' });
    }
  };

  const generateItinerary = async () => {
    if (!destination) {
      toast({ title: 'Error', description: 'Please select a destination first', variant: 'destructive' });
      return;
    }

    // Check usage limit before generating
    try {
      const { data: usageCheck, error: usageError } = await supabase.rpc('check_and_increment_ai_usage');
      if (usageError) throw usageError;
      
      const result = usageCheck as { can_generate: boolean; needs_subscription?: boolean; needs_registration?: boolean };
      
      if (result.needs_registration) {
        toast({ title: 'Access required', description: 'Please claim your spot first', variant: 'destructive' });
        return;
      }
      
      if (result.needs_subscription || !result.can_generate) {
        setNeedsSubscription(true);
        return;
      }
    } catch (error) {
      console.error('Error checking usage:', error);
      toast({ title: 'Error', description: 'Failed to verify access', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setIsComplete(false);
    setItinerary('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            destination,
            budget: budget || 'moderate',
            days: parseInt(days) || 5,
            preferences,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate itinerary');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setItinerary(prev => prev + content);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setIsComplete(true);
    }
  };

  const downloadItinerary = () => {
    if (!itinerary) return;
    
    const blob = new Blob([`# Travel Itinerary: ${destination}\n\n${itinerary}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${destination.replace(/[^a-zA-Z0-9]/g, '-')}-itinerary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'Your itinerary has been saved' });
  };

  if (isCheckingAccess) return null;

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-white/40 backdrop-blur-xl text-indigo-600 shadow-lg flex items-center justify-center border border-white/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] bg-white/30 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/30"
            >
              {/* Header */}
              <div className="p-4 bg-white/20 backdrop-blur-xl flex items-center justify-between border-b border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white/90">AI Travel Planner</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              {/* Content */}
              {needsSubscription ? (
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center mb-4 border border-white/30">
                    <Lock className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white/90 mb-2">Free Trial Used</h3>
                  <p className="text-white/70 mb-4">
                    You've used your free itinerary generation. Subscribe to unlock unlimited AI-powered travel planning!
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          const { data: profile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('user_id', user.id)
                            .single();
                          
                          if (profile) {
                            await supabase
                              .from('subscription_interest')
                              .insert({ profile_id: profile.id })
                              .select();
                          }
                        }
                      } catch (error) {
                        console.error('Error recording subscription interest:', error);
                      }
                      toast({ title: 'Coming Soon', description: 'Subscription feature is under development' });
                    }}
                    className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white border-0"
                  >
                    Subscribe Now
                  </Button>
                </div>
              ) : !hasAccess ? (
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center mb-4 border border-white/30">
                    <Lock className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white/90 mb-2">Early Access Feature</h3>
                  <p className="text-white/70 mb-4">
                    Get one free AI-powered travel itinerary! Claim your spot now.
                  </p>
                  <Button
                    onClick={claimAccess}
                    className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white border-0"
                  >
                    Claim Your Free Itinerary
                  </Button>
                </div>
              ) : (
                <>
                  {/* Input Form */}
                  <div className="p-4 border-b border-white/20 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <MapPin className="w-4 h-4 text-indigo-300" />
                      <span className="font-medium">{destination || 'Select a destination'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-gray-500 text-sm font-medium">₹</span>
                        <Input
                          placeholder="e.g. 50,000"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="pl-8 rounded-xl bg-white/80 backdrop-blur-xl border-white/30 text-gray-900 placeholder:text-gray-500 h-10"
                        />
                      </div>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          type="number"
                          placeholder="Days"
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          min="1"
                          max="30"
                          className="pl-9 rounded-xl bg-white/80 backdrop-blur-xl border-white/30 text-gray-900 placeholder:text-gray-500 h-10"
                        />
                      </div>
                    </div>

                    <Input
                      placeholder="Preferences (e.g., adventure, food, culture...)"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="rounded-xl bg-white/80 backdrop-blur-xl border-white/30 text-gray-900 placeholder:text-gray-500"
                    />

                    <Button
                      onClick={generateItinerary}
                      disabled={isGenerating || !destination}
                      className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 rounded-xl text-white border-0"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Itinerary
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Itinerary Content */}
                  <div ref={contentRef} className="flex-1 overflow-y-auto p-4">
                    {itinerary ? (
                      <div className="space-y-4">
                        <div className="prose prose-sm max-w-none prose-headings:text-white/90 prose-p:text-white/80 prose-strong:text-white/90 prose-li:text-white/80">
                          <ReactMarkdown>{itinerary}</ReactMarkdown>
                        </div>
                        <Button
                          onClick={downloadItinerary}
                          disabled={!isComplete || isGenerating}
                          className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl text-white border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isGenerating ? 'Generating...' : 'Download Itinerary'}
                        </Button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/60 py-8">
                        <Sparkles className="w-12 h-12 text-white/30 mb-4" />
                        <p className="font-medium text-white/80">Your personalized itinerary will appear here</p>
                        <p className="text-sm mt-1">Enter your budget and preferences above</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
