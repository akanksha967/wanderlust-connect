import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const MatchPopup = () => {
  const { matchedUser, showMatch, setShowMatch, setScreen, userProfile } = useAppStore();
  const { user } = useAuth();
  const [myPhoto, setMyPhoto] = useState<string>('');

  // Fetch current user's photo from database
  useEffect(() => {
    const fetchMyPhoto = async () => {
      if (!user || !showMatch) return;
      
      // First check if we have it in store
      if (userProfile.photos && userProfile.photos.length > 0) {
        setMyPhoto(userProfile.photos[0]);
        return;
      }

      // Otherwise fetch from DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: photos } = await supabase
          .from('photos')
          .select('url')
          .eq('profile_id', profile.id)
          .order('is_primary', { ascending: false })
          .limit(1);

        if (photos && photos.length > 0) {
          setMyPhoto(photos[0].url);
        }
      }
    };

    fetchMyPhoto();
  }, [user, showMatch, userProfile.photos]);

  if (!matchedUser || !showMatch) return null;

  const handleSendMessage = () => {
    setShowMatch(false);
    setScreen('chat');
  };

  const handleKeepSwiping = () => {
    setShowMatch(false);
  };

  return (
    <AnimatePresence>
      {showMatch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          {/* Confetti */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              initial={{ 
                top: '50%', 
                left: '50%',
                rotate: 0,
                opacity: 1,
              }}
              animate={{ 
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{ 
                duration: 2 + Math.random(),
                ease: 'easeOut',
              }}
              style={{
                backgroundColor: i % 2 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground))',
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-float text-center relative"
          >
            {/* Close button */}
            <button
              onClick={handleKeepSwiping}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Heart animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full gradient-accent flex items-center justify-center shadow-glow"
            >
              <Heart className="w-10 h-10 text-accent-foreground fill-current" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-display text-foreground mb-2"
            >
              It's a Match!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm mb-6"
            >
              You and {matchedUser.name} are heading to the same destination!
            </motion.p>

            {/* Profile photos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center -space-x-4 mb-8"
            >
              <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-card bg-secondary flex items-center justify-center">
                {myPhoto ? (
                  <img
                    src={myPhoto}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-2xl text-white font-display">
                      {userProfile.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-card bg-secondary flex items-center justify-center">
                {matchedUser.photos?.[0] ? (
                  <img
                    src={matchedUser.photos[0]}
                    alt={matchedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <span className="text-2xl text-white font-display">
                      {matchedUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleSendMessage}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send a Message
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleKeepSwiping}
              >
                Keep Swiping
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchPopup;
