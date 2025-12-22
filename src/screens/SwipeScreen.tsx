import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { mockProfiles } from '@/data/mockProfiles';
import { Heart, X, MapPin, MessageCircle, User, Sparkles, Plane } from 'lucide-react';

const funFacts: Record<string, string[]> = {
  'Bali': [
    '🌴 Bali has over 20,000 temples!',
    '🏄 Bali is a surfer\'s paradise',
    '🌺 Balinese celebrate Nyepi - a day of silence',
    '🐒 Sacred Monkey Forest has 700+ monkeys',
  ],
  'Paris': [
    '🗼 Eiffel Tower grows 6 inches in summer',
    '🥐 Paris has 30,000+ bakeries',
    '🎨 Louvre would take 100 days to see everything',
    '💡 Paris is called the City of Light',
  ],
  'Tokyo': [
    '🍣 Tokyo has the most Michelin stars',
    '🚄 Shinkansen trains are never late',
    '🌸 Cherry blossoms bloom in spring',
    '🎮 Tokyo is the gaming capital of the world',
  ],
  'default': [
    '✈️ Adventure awaits around every corner!',
    '🌍 Travel makes you richer in experiences',
    '📸 Every trip is a story waiting to be told',
    '🤝 The best journeys are shared ones',
  ],
};

const SwipeCard = ({ 
  profile, 
  onSwipe,
  isTop 
}: { 
  profile: UserProfile; 
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ x, rotate }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300, 
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-float bg-card">
        {/* Photo */}
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

        {/* Like/Nope indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-6 right-6 px-4 py-2 border-4 border-accent rounded-xl rotate-12"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-accent text-xl font-display">LIKE</span>
            </motion.div>
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 border-4 border-destructive rounded-xl -rotate-12"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-destructive text-xl font-display">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-display text-background mb-1">
                {profile.name}, {profile.age}
              </h2>
              <div className="flex items-center gap-1 text-background/80 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>5 km away</span>
              </div>
              <p className="text-background/90 text-sm line-clamp-2 mb-2">
                {profile.bio}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.travelVibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="px-2.5 py-1 bg-background/20 backdrop-blur-sm rounded-full text-xs text-background font-medium"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SwipeScreen = () => {
  const { setScreen, setMatchedUser, setShowMatch, addMatch, travelDetails } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentFact, setCurrentFact] = useState(0);

  const destination = travelDetails?.destination || 'Bali';
  const facts = funFacts[destination] || funFacts['default'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [facts.length]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && Math.random() > 0.5) {
      const matchedProfile = profiles[currentIndex];
      addMatch(matchedProfile);
      setMatchedUser(matchedProfile);
      setShowMatch(true);
    }
    
    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const remainingProfiles = profiles.slice(currentIndex);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-4 w-12 h-12 rounded-full gradient-accent opacity-20"
        />
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-32 left-6 w-8 h-8 rounded-full bg-accent/20"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 right-8 w-6 h-6 rounded-full bg-primary/10"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-center justify-between">
        <button 
          onClick={() => setScreen('account')}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card shadow-soft transition-smooth hover:shadow-card active:scale-95"
        >
          <User className="w-5 h-5 text-foreground" />
        </button>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Plane className="w-4 h-4 text-accent" />
            <h1 className="text-xl font-display text-foreground">
              {destination}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {remainingProfiles.length} travelers nearby
          </p>
        </motion.div>

        <button 
          onClick={() => setScreen('matches')}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card shadow-soft transition-smooth hover:shadow-card active:scale-95"
        >
          <MessageCircle className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Fun Fact Banner */}
      <div className="px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFact}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20"
          >
            <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-xs text-foreground font-medium">{facts[currentFact]}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cards */}
      <div className="flex-1 relative px-4 py-2">
        <div className="relative w-full h-full max-h-[420px]">
          {remainingProfiles.length > 0 ? (
            remainingProfiles.slice(0, 2).reverse().map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={handleSwipe}
                isTop={index === remainingProfiles.slice(0, 2).length - 1}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center mb-4 shadow-glow animate-float">
                <MapPin className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-display text-foreground mb-2">
                No more travelers
              </h3>
              <p className="text-sm text-muted-foreground">
                Check back later or adjust your travel dates
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {remainingProfiles.length > 0 && (
        <div className="relative z-10 px-4 pb-6 pt-2 flex justify-center items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full bg-card shadow-card flex items-center justify-center transition-smooth hover:shadow-float border-2 border-border"
          >
            <X className="w-7 h-7 text-muted-foreground" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-20 h-20 rounded-full gradient-accent shadow-card flex items-center justify-center transition-smooth hover:shadow-glow"
          >
            <Heart className="w-9 h-9 text-accent-foreground" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default SwipeScreen;
