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
  const [needsPayment, setNeedsPayment] = useState(false);
  const [isFreeTierAvailable, setIsFreeTierAvailable] = useState(false);
  const [globalCount, setGlobalCount] = useState(0);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
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
      // Check global count
      // @ts-ignore - function exists in DB but not in generated types
      const { data: count, error: countError } = await supabase.rpc('get_global_ai_users_count');
      if (countError) throw countError;

      setGlobalCount(count as number);
      setIsFreeTierAvailable((count as number) < 50);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsCheckingAccess(false);
        return;
      }

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
          .single() as any;

        if (aiUser) {
          // If they have paid, they have access
          if (aiUser?.has_paid) {
            setHasAccess(true);
            setNeedsPayment(false);
          } else {
            // If they haven't paid, check if they used their free turn
            if (aiUser?.usage_count >= 1) {
              setHasAccess(false);
              setNeedsPayment(true);
            } else {
              // Haven't used free turn yet.
              setHasAccess(true);
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

  const initPayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Login required", description: "Please login to pay", variant: "destructive" });
      return;
    }

    // Track click
    try {
      // @ts-ignore - table exists in DB but not in generated types
      await (supabase as any).from('payment_clicks').insert({
        user_id: user.id,
        metadata: { method: 'razorpay_button' }
      });
    } catch (err) {
      console.error("Failed to track click:", err);
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: 15000, // Amount in paise (150 INR)
      currency: "INR",
      name: "Wanderlust Connect",
      description: "Premium AI Itinerary",
      handler: async function (response: any) {
        try {
          // @ts-ignore - function exists in DB but not in generated types
          const { error } = await supabase.rpc('record_ai_payment', {
            payment_id_param: response.razorpay_payment_id,
            amount_param: 150.00
          });

          if (error) throw error;

          toast({ title: "Payment Successful", description: "Premium features unlocked!" });
          setHasAccess(true);
          setNeedsPayment(false);
          checkAccess();
        } catch (err) {
          console.error("Payment record error:", err);
          toast({ title: "Error", description: "Payment succeeded but recording failed. Contact support.", variant: "destructive" });
        }
      },
      prefill: {
        email: user.email,
      },
      theme: {
        color: "#6366f1"
      }
    };

    const rzp1 = new (window as any).Razorpay(options);
    rzp1.open();
  };

  const claimAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Error', description: 'Please log in first', variant: 'destructive' });
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (!profile) return;

      // Double check global limit before inserting
      // @ts-ignore - function exists in DB but not in generated types
      const { data: count } = await supabase.rpc('get_global_ai_users_count');
      if ((count as number) >= 50) {
        setIsFreeTierAvailable(false);
        setNeedsPayment(true);
        toast({ title: 'Free Tier Full', description: 'Sorry, free spots are gone!', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('ai_itinerary_users')
        .insert({ profile_id: profile.id, usage_count: 0 });

      if (error) throw error;

      setHasAccess(true);
      toast({ title: 'Access granted!', description: 'You claimed a free spot!' });
      checkAccess(); // Refresh state
    } catch (error: any) {
      console.error('Error claiming access:', error);
      toast({ title: 'Error', description: 'Failed to claim access.', variant: 'destructive' });
    }
  };

  const generateItinerary = async () => {
    if (!destination) {
      toast({ title: 'Error', description: 'Please select a destination first', variant: 'destructive' });
      return;
    }

    // Check usage limit logic via RPC
    try {
      const { data: usageCheck, error: usageError } = await supabase.rpc('check_and_increment_ai_usage');

      if (usageError) throw usageError;

      const result = usageCheck as { can_generate: boolean; needs_payment?: boolean; limit_reached?: boolean; message?: string };

      if (result.needs_payment) {
        setNeedsPayment(true);
        toast({ title: 'Payment Required', description: result.message || 'Please upgrade to Premium', variant: 'destructive' });
        return;
      }

      if (result.limit_reached) {
        setNeedsPayment(true); // Treat limit reached as needing upgrade/payment
        toast({ title: 'Limit Reached', description: result.message, variant: 'destructive' });
        return;
      }

      if (!result.can_generate) {
        toast({ title: 'Error', description: result.message || 'Cannot generate', variant: 'destructive' });
        return;
      }

    } catch (error) {
      console.error('Error checking usage:', error);
      // Fallback: If RPC fails, user might not have a record yet, try to claim if free tier checks out
      // But really, the RPC handles "new user" logic too. So this is a real error.
      toast({ title: 'Error', description: 'Failed to verify access', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setIsComplete(false);
    setItinerary('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            destination,
            budget: budget ? `${budget} ${currency}` : 'moderate',
            currency,
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
        // ... (existing stream parsing logic logic kept same implicitly by React state updates, but here I'm replacing the function so I need to include it)
        // Wait, replace_file_content replaces the BLOCK. I need to make sure I include the stream parsing logic if I'm replacing the whole function. 
        // I am replacing the whole component body basically.

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
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-white/40 backdrop-blur-xl text-indigo-600 shadow-lg flex items-center justify-center border border-white/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

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

              {needsPayment ? (
                <div className="p-6 flex flex-col items-center text-center overflow-y-auto">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center mb-4 border border-white/30">
                    <Lock className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white/90 mb-2">Unlock Premium Itinerary</h3>
                  <p className="text-white/70 mb-6">
                    {!isFreeTierAvailable ? "Free spots are all claimed!" : "You've used your free itinerary."} <br /> Get unlimited access to premium features for just <span className="font-bold text-white">₹150</span>.
                  </p>

                  {/* Premium Perks Box */}
                  <div className="w-full bg-white/10 rounded-xl p-4 mb-6 text-left border border-white/20">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" /> Premium Includes:
                    </h4>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span> Detailed day-wise plan
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span> Budget breakdown
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span> Local hidden gems
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span> Safety notes
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span> AI personalization
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={initPayment}
                    className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white border-0 py-6 text-lg font-medium shadow-xl"
                  >
                    Pay ₹150 to Unlock
                  </Button>
                  <p className="text-xs text-white/50 mt-4">Secured by Razorpay</p>
                </div>
              ) : !hasAccess ? (
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center mb-4 border border-white/30">
                    <Sparkles className="w-8 h-8 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white/90 mb-2">Try AI Travel Planner</h3>
                  <p className="text-white/70 mb-4">
                    Get a personalized itinerary crafted just for your adventure! ✨
                  </p>
                  <Button
                    onClick={claimAccess}
                    className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white border-0"
                  >
                    Get Started Free
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/20 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <MapPin className="w-4 h-4 text-indigo-300" />
                      <span className="font-medium">{destination || 'Select a destination'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative flex items-center">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="absolute left-1 z-10 bg-transparent text-gray-600 text-xs font-medium appearance-none cursor-pointer pr-1 pl-2 py-1 rounded-lg hover:bg-white/50 transition-colors focus:outline-none w-12"
                        >
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                          <option value="EUR">€</option>
                          <option value="GBP">£</option>
                          <option value="JPY">¥</option>
                          <option value="AUD">A$</option>
                          <option value="THB">฿</option>
                        </select>
                        <Input
                          placeholder={currency === 'INR' ? 'e.g. 50,000' : currency === 'USD' ? 'e.g. 2,000' : 'e.g. 1,500'}
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="pl-12 rounded-xl bg-white/80 backdrop-blur-xl border-white/30 text-gray-900 placeholder:text-gray-500 h-10"
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
