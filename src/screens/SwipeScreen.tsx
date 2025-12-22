import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { mockProfiles } from '@/data/mockProfiles';
import { X, MapPin, MessageCircle, User, Heart, Shield, MoreVertical } from 'lucide-react';
import ReportBlockDialog from '@/components/ReportBlockDialog';
import { useSwipeProfiles } from '@/hooks/useSwipeProfiles';
import { useAuth } from '@/hooks/useAuth';

const destinationImages: Record<string, string> = {
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
};

const SwipeCard = ({ 
  profile, 
  onSwipe,
  onOpenMenu,
  isTop 
}: { 
  profile: UserProfile; 
  onSwipe: (direction: 'left' | 'right') => void;
  onOpenMenu: () => void;
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

        {/* More options (block/report) button */}
        {isTop && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-background/30"
            aria-label="Report or block user"
          >
            <MoreVertical className="w-5 h-5 text-background" />
          </button>
        )}

        {/* Like/Nope indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 border-4 border-accent rounded-xl -rotate-12"
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
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-display text-background">
                  {profile.name}, {profile.age}
                </h2>
                {/* Verified badge placeholder */}
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="flex items-center gap-1 text-background/80 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>Same destination</span>
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
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles] = useState(mockProfiles);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const destination = travelDetails?.destination || 'Bali';
  const bgImage = destinationImages[destination] || destinationImages['default'];

  // Use backend hook when user is logged in
  const { recordSwipe, blockUser, reportUser } = useSwipeProfiles(
    destination,
    travelDetails?.startDate || '',
    travelDetails?.endDate || ''
  );

  const handleSwipe = async (direction: 'left' | 'right') => {
    // Don't allow swiping if no profiles remaining
    if (remainingProfiles.length === 0) return;
    
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    
    // Record swipe in backend if logged in
    if (user) {
      const result = await recordSwipe(currentProfile.id, direction);
      if (result.matched) {
        addMatch(currentProfile);
        setMatchedUser(currentProfile);
        setShowMatch(true);
      }
    } else if (direction === 'right' && Math.random() > 0.5) {
      // Fallback for demo mode
      addMatch(currentProfile);
      setMatchedUser(currentProfile);
      setShowMatch(true);
    }
    
    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const handleOpenMenu = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setShowReportDialog(true);
  };

  const handleBlock = async () => {
    if (selectedProfile) {
      await blockUser(selectedProfile.id);
      // Skip to next profile
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReport = async (reason: string, description?: string) => {
    if (selectedProfile) {
      await reportUser(selectedProfile.id, reason, description);
    }
  };

  const remainingProfiles = profiles.slice(currentIndex);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Full-screen background like Apple homescreen */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-accent/30 via-background/70 to-background/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-center justify-between">
        <button 
          onClick={() => setScreen('account')}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card/60 backdrop-blur-sm shadow-soft transition-smooth hover:shadow-card active:scale-95"
        >
          <User className="w-5 h-5 text-foreground" />
        </button>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-display text-foreground">
            {destination}
          </h1>
        </motion.div>

        <button 
          onClick={() => setScreen('matches')}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card/60 backdrop-blur-sm shadow-soft transition-smooth hover:shadow-card active:scale-95"
        >
          <MessageCircle className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Cards - Centered */}
      <div className="flex-1 relative px-4 py-2 flex items-center justify-center">
        <div className="relative w-full h-full max-h-[450px]">
          <AnimatePresence>
            {remainingProfiles.length > 0 ? (
              remainingProfiles.slice(0, 2).reverse().map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  onSwipe={handleSwipe}
                  onOpenMenu={() => handleOpenMenu(profile)}
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
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons - No background, floating on image */}
      {remainingProfiles.length > 0 && (
        <div className="relative z-10 px-4 pb-8 flex justify-center items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full border-2 border-background/80 flex items-center justify-center transition-smooth"
          >
            <X className="w-10 h-10 text-background drop-shadow-lg" strokeWidth={3} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-20 h-20 rounded-full border-2 border-background/80 flex items-center justify-center transition-smooth"
          >
            <Heart className="w-12 h-12 text-background drop-shadow-lg" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}

      {/* Report/Block Dialog */}
      <ReportBlockDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onBlock={handleBlock}
        onReport={handleReport}
        userName={selectedProfile?.name || ''}
      />
    </div>
  );
};

export default SwipeScreen;
