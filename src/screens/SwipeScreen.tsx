import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { mockProfiles } from '@/data/mockProfiles';
import { Heart, X, MapPin, MessageCircle, User } from 'lucide-react';

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
              className="absolute top-8 right-8 px-4 py-2 border-4 border-green-500 rounded-lg rotate-12"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-500 text-2xl font-bold">LIKE</span>
            </motion.div>
            <motion.div
              className="absolute top-8 left-8 px-4 py-2 border-4 border-red-500 rounded-lg -rotate-12"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-red-500 text-2xl font-bold">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-background mb-1">
                {profile.name}, {profile.age}
              </h2>
              <div className="flex items-center gap-1 text-background/80 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>5 km away</span>
              </div>
              <p className="text-background/90 text-sm line-clamp-2 mb-3">
                {profile.bio}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.travelVibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="px-3 py-1 bg-background/20 backdrop-blur-sm rounded-full text-xs text-background font-medium"
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
  const { setScreen, setMatchedUser, setShowMatch, travelDetails } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState(mockProfiles);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right' && Math.random() > 0.5) {
      // Simulate a match
      setMatchedUser(profiles[currentIndex]);
      setShowMatch(true);
    }
    
    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const remainingProfiles = profiles.slice(currentIndex);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-2 flex items-center justify-between">
        <button 
          onClick={() => setScreen('account')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70"
        >
          <User className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-display text-foreground">
            {travelDetails?.destination || 'Bali'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {remainingProfiles.length} travelers nearby
          </p>
        </div>

        <button 
          onClick={() => setScreen('chat')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70"
        >
          <MessageCircle className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 relative px-4 py-2">
        <div className="relative w-full h-full max-h-[500px]">
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
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No more travelers
              </h3>
              <p className="text-sm text-muted-foreground">
                Check back later or adjust your travel dates
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {remainingProfiles.length > 0 && (
        <div className="px-4 pb-8 flex justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full bg-card shadow-card flex items-center justify-center transition-smooth hover:shadow-float"
          >
            <X className="w-8 h-8 text-muted-foreground" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-16 h-16 rounded-full gradient-accent shadow-card flex items-center justify-center transition-smooth hover:shadow-glow"
          >
            <Heart className="w-8 h-8 text-accent-foreground" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default SwipeScreen;
