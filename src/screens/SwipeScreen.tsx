import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { X, MapPin, MessageCircle, User, Heart, Shield, MoreVertical, Loader2 } from 'lucide-react';
import ReportBlockDialog from '@/components/ReportBlockDialog';
import { useSwipeProfiles, SwipeProfile } from '@/hooks/useSwipeProfiles';
import { useAuth } from '@/hooks/useAuth';

const destinationImages: Record<string, string> = {
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop',
  'Swiss Alps': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop',
  'Patagonia': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
};

interface SwipeCardProps {
  profile: SwipeProfile;
  destination: string;
  onSwipe: (direction: 'left' | 'right') => void;
  onOpenMenu: () => void;
  isTop: boolean;
}

const SwipeCard = ({ 
  profile, 
  destination,
  onSwipe,
  onOpenMenu,
  isTop 
}: SwipeCardProps) => {
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

  const primaryPhoto = profile.photos.find(p => p.is_primary)?.url || profile.photos[0]?.url;

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
      <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] bg-white/30 backdrop-blur-2xl border border-white/40">
        {/* Photo - object-top to show faces */}
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={profile.name}
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400/50 via-blue-400/50 to-violet-400/50 flex items-center justify-center">
            <User className="w-24 h-24 text-white/50" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* More options (block/report) button */}
        {isTop && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/30"
            aria-label="Report or block user"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Like/Nope indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 border-4 border-green-400 rounded-xl -rotate-12 bg-green-400/20 backdrop-blur-sm"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-green-400 text-xl font-display font-bold">LIKE</span>
            </motion.div>
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 border-4 border-red-400 rounded-xl -rotate-12 bg-red-400/20 backdrop-blur-sm"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-red-400 text-xl font-display font-bold">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-display text-white">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                </h2>
                {profile.is_verified && (
                  <Shield className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="flex items-center gap-1 text-white/90 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{destination}</span>
              </div>
              {profile.bio && (
                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                  {profile.bio}
                </p>
              )}
              {profile.travel_vibes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.travel_vibes.map((vibe) => (
                    <span
                      key={vibe}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium border border-white/20"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              )}
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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SwipeProfile | null>(null);

  const destination = travelDetails?.destination || '';
  const bgImage = destinationImages[destination] || destinationImages['default'];

  // Fetch real profiles from database
  const { profiles, loading, recordSwipe, blockUser, reportUser } = useSwipeProfiles(
    destination,
    travelDetails?.startDate || '',
    travelDetails?.endDate || ''
  );

  const remainingProfiles = profiles.slice(currentIndex);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (remainingProfiles.length === 0) return;
    
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    
    // Record swipe in backend
    if (user) {
      const result = await recordSwipe(currentProfile.id, direction);
      if (result.matched) {
        // Convert to UserProfile format for match popup
        const matchedUser = {
          id: currentProfile.id,
          name: currentProfile.name,
          age: currentProfile.age || 0,
          bio: currentProfile.bio || '',
          photos: currentProfile.photos.map(p => p.url),
          travelVibes: currentProfile.travel_vibes,
        };
        addMatch(matchedUser);
        setMatchedUser(matchedUser);
        setShowMatch(true);
      }
    }
    
    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const handleOpenMenu = (profile: SwipeProfile) => {
    setSelectedProfile(profile);
    setShowReportDialog(true);
  };

  const handleBlock = async () => {
    if (selectedProfile) {
      await blockUser(selectedProfile.id);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReport = async (reason: string, description?: string) => {
    if (selectedProfile) {
      await reportUser(selectedProfile.id, reason, description);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full-screen background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-violet-500/40" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-center justify-between shrink-0">
        <button 
          onClick={() => setScreen('account')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-lg transition-all hover:bg-white/50 active:scale-95"
        >
          <User className="w-5 h-5 text-gray-800" />
        </button>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-display text-white drop-shadow-md">
            {destination || 'Discover'}
          </h1>
        </motion.div>

        <button 
          onClick={() => setScreen('matches')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/30 shadow-lg transition-all hover:bg-white/50 active:scale-95"
        >
          <MessageCircle className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      {/* Cards area */}
      <div className="relative z-10 flex-1 px-4 py-2 overflow-hidden flex items-center justify-center" style={{ marginBottom: '100px' }}>
        <div className="relative w-full h-full max-w-md mx-auto" style={{ aspectRatio: '3/4', maxHeight: 'calc(100% - 20px)' }}>
          <AnimatePresence>
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-xl border border-white/40 flex items-center justify-center mb-4 shadow-lg">
                  <Loader2 className="w-10 h-10 text-gray-800 animate-spin" />
                </div>
                <p className="text-sm text-white/80 drop-shadow">Finding travelers...</p>
              </motion.div>
            ) : remainingProfiles.length > 0 ? (
              remainingProfiles.slice(0, 2).reverse().map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  destination={destination}
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400 flex items-center justify-center mb-4 shadow-lg">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-display text-white drop-shadow-md mb-2">
                  No more travelers
                </h3>
                <p className="text-sm text-white/80 max-w-xs drop-shadow">
                  Check back later or adjust your travel dates to find more companions
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      {!loading && remainingProfiles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-4 flex justify-center items-center gap-8 bg-gradient-to-t from-background/80 to-transparent">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 flex items-center justify-center transition-all"
          >
            <X className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-16 h-16 flex items-center justify-center transition-all"
          >
            <Heart className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
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
