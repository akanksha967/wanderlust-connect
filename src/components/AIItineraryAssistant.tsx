import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, MapPin, DollarSign, Calendar, Lock } from 'lucide-react';
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
  const [spotsRemaining, setSpotsRemaining] = useState(50);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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
      setSpotsRemaining(result.spots_remaining);
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
      setSpotsRemaining(prev => prev - 1);
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

    setIsGenerating(true);
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
    }
  };

  if (isCheckingAccess) return null;

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg flex items-center justify-center"
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
              className="w-full max-w-lg max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">AI Travel Planner</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {!hasAccess ? (
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Early Access Feature</h3>
                  <p className="text-gray-600 mb-4">
                    Get AI-powered travel itineraries for free! Limited to first 50 users.
                  </p>
                  <div className="bg-indigo-50 rounded-xl p-4 mb-6 w-full">
                    <div className="text-3xl font-bold text-indigo-600">{spotsRemaining}</div>
                    <div className="text-sm text-indigo-500">spots remaining</div>
                  </div>
                  <Button
                    onClick={claimAccess}
                    disabled={spotsRemaining === 0}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {spotsRemaining > 0 ? 'Claim Your Spot' : 'No Spots Available'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Input Form */}
                  <div className="p-4 border-b space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">{destination || 'Select a destination'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Budget (e.g., $2000)"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="pl-9 rounded-xl"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Days"
                          value={days}
                          onChange={(e) => setDays(e.target.value)}
                          min="1"
                          max="30"
                          className="pl-9 rounded-xl"
                        />
                      </div>
                    </div>

                    <Input
                      placeholder="Preferences (e.g., adventure, food, culture...)"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="rounded-xl"
                    />

                    <Button
                      onClick={generateItinerary}
                      disabled={isGenerating || !destination}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl"
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
                      <div className="prose prose-sm max-w-none prose-headings:text-indigo-900 prose-p:text-gray-700">
                        <ReactMarkdown>{itinerary}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-8">
                        <Sparkles className="w-12 h-12 text-indigo-200 mb-4" />
                        <p className="font-medium">Your personalized itinerary will appear here</p>
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
