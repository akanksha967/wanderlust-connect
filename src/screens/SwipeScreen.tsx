import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { X, MapPin, MessageCircle, User, Heart, Shield, MoreVertical, Loader2, Compass } from 'lucide-react';
import ReportBlockDialog from '@/components/ReportBlockDialog';
import { useSwipeProfiles, DiscoverItem } from '@/hooks/useSwipeProfiles';
import { useAuth } from '@/hooks/useAuth';
import { AIItineraryAssistant } from '@/components/AIItineraryAssistant';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBell } from '@/components/NotificationBell';

import { useDailyLikes } from '@/hooks/useDailyLikes';
import SwipeTripCard from '@/components/SwipeTripCard';
import { useTrips } from '@/hooks/useTrips';

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
  profile: any;
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const photos = (profile.photos || []).slice(0, 3);
  const currentPhoto = photos[currentPhotoIndex]?.url || photos[0]?.url;

  const handlePhotoTap = (e: React.MouseEvent) => {
    if (!isTop || photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;
    if (isLeftSide) {
      setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    } else {
      setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
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
      <div
        className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] bg-white/30 backdrop-blur-2xl border border-white/40"
        onClick={handlePhotoTap}
      >
        {photos.length > 1 && (
          <div className="absolute top-4 left-4 right-14 z-20 flex gap-1">
            {photos.map((_, idx: number) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}

        {currentPhoto ? (
          <img src={currentPhoto} alt={profile.name} className="w-full h-full object-cover object-top" draggable={false} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400/50 via-blue-400/50 to-violet-400/50 flex items-center justify-center">
            <User className="w-24 h-24 text-white/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {isTop && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenMenu(); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:bg-white/30"
            aria-label="Report or block user"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        )}

        {isTop && (
          <>
            <motion.div className="absolute top-6 left-6 px-4 py-2 border-4 border-green-400 rounded-xl -rotate-12 bg-green-400/20 backdrop-blur-sm" style={{ opacity: likeOpacity }}>
              <span className="text-green-400 text-xl font-display font-bold">LIKE</span>
            </motion.div>
            <motion.div className="absolute top-6 left-6 px-4 py-2 border-4 border-red-400 rounded-xl -rotate-12 bg-red-400/20 backdrop-blur-sm" style={{ opacity: nopeOpacity }}>
              <span className="text-red-400 text-xl font-display font-bold">NOPE</span>
            </motion.div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-display text-white">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                </h2>
                {profile.is_verified && <Shield className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex items-center gap-1 text-white/90 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.destination || destination}</span>
              </div>
              {profile.bio && (
                <div className="mb-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm max-h-16 overflow-y-auto">
                  <p className="text-white/80 text-sm break-words">{profile.bio}</p>
                </div>
              )}
              {profile.travel_vibes && profile.travel_vibes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.travel_vibes.map((vibe: string) => (
                    <span key={vibe} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium border border-white/20">
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
  const { user, profileId: myProfileId } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const { createLike, isExhausted, loading: likesLoading } = useDailyLikes();
  const { requestToJoin } = useTrips();

  const destination = travelDetails?.destination || '';
  const bgImage = destinationImages[destination] || destinationImages['default'];

  const { items, loading, recordSwipe, blockUser, reportUser, refresh } = useSwipeProfiles(
    destination,
    travelDetails?.startDate || '',
    travelDetails?.endDate || ''
  );

  const remainingItems = items.slice(currentIndex);

  // Auto-refresh when getting low
  useEffect(() => {
    if (remainingItems.length === 2 && !loading) {
      // Just a hint that we're low, maybe we could fetch more in the background
    }
  }, [remainingItems.length, loading]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (remainingItems.length === 0) return;
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    if (currentItem.type === 'traveler') {
      const currentProfile = currentItem.data;
      if (direction === 'right') {
        if (isExhausted) {
          // Still move past the card but inform user
          setCurrentIndex((prev) => prev + 1);
          return;
        }
        if (user) {
          const result = await createLike(currentProfile.id);
          if (!result.success) {
            // Move past card even on failure
            setCurrentIndex((prev) => prev + 1);
            return;
          }
          const { data: match } = await supabase
            .from('matches')
            .select('id')
            .or(`and(profile1_id.eq.${myProfileId},profile2_id.eq.${currentProfile.id}),and(profile1_id.eq.${currentProfile.id},profile2_id.eq.${myProfileId})`)
            .maybeSingle();

          if (match) {
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
      } else {
        if (user) {
          await recordSwipe(currentProfile.id, direction);
        }
      }
    } else if (currentItem.type === 'trip') {
      const currentTrip = currentItem.data;
      if (direction === 'right') {
        if (user) {
          await requestToJoin(currentTrip.id);
        }
      }
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const handleOpenMenu = (profile: any) => {
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
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-center justify-between shrink-0">
        <button
          onClick={() => setScreen('account')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40 active:scale-95"
        >
          <User className="w-5 h-5 text-white" />
        </button>

        <motion.div className="text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-display text-white drop-shadow-lg">
            {destination || 'Discover'}
          </h1>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen('trips')}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40 active:scale-95"
          >
            <Compass className="w-5 h-5 text-white" />
          </button>
          <NotificationBell />
          <button
            onClick={() => setScreen('matches')}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40 active:scale-95"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Cards area */}
      <div className="relative z-10 flex-1 px-4 py-2 overflow-hidden flex items-center justify-center" style={{ marginBottom: '100px' }}>
        <div className="relative w-full h-full max-w-md mx-auto" style={{ aspectRatio: '3/4', maxHeight: 'calc(100% - 20px)' }}>
          <AnimatePresence>
            {loading || likesLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-xl border border-white/40 flex items-center justify-center mb-4 shadow-lg">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <p className="text-sm text-white drop-shadow-lg">Scanning the globe for your crew ✈️</p>
              </motion.div>
            ) : remainingItems.length > 0 ? (
              remainingItems.slice(0, 2).reverse().map((item, index) => {
                const isTop = index === remainingItems.slice(0, 2).length - 1;

                if (item.type === 'traveler') {
                  return (
                    <SwipeCard
                      key={item.data.id}
                      profile={item.data}
                      destination={destination}
                      onSwipe={handleSwipe}
                      onOpenMenu={() => handleOpenMenu(item.data)}
                      isTop={isTop}
                    />
                  );
                } else {
                  return (
                    <SwipeTripCard
                      key={item.data.id}
                      trip={item.data}
                      onSwipe={handleSwipe}
                      onViewDetails={() => { }} // Could open trip screen/details
                      isTop={isTop}
                    />
                  );
                }
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-center px-4"
              >
                <Compass className="w-10 h-10 text-white/25 mb-3" />
                <p className="text-sm text-white/60 max-w-xs mb-4">
                  You've seen everyone nearby 🌍 Check back soon — new travelers join every day!
                </p>
                <button
                  onClick={() => refresh()}
                  className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium"
                >
                  Refresh Feed
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      {!loading && !likesLoading && remainingItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-4 flex justify-center items-center gap-6 bg-gradient-to-t from-black/20 to-transparent">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-xl shadow-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.2)',
            }}
          >
            <X className="w-6 h-6 text-white/80" strokeWidth={2} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-14 h-14 flex items-center justify-center rounded-full backdrop-blur-xl shadow-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(167,139,250,0.5)',
              boxShadow: '0 8px 32px -8px rgba(139,92,246,0.25), 0 0 20px rgba(167,139,250,0.15)',
            }}
          >
            {remainingItems[0]?.type === 'trip' ? (
              <Compass className="w-6 h-6 text-violet-300" strokeWidth={2} />
            ) : (
              <Heart className="w-6 h-6 text-violet-300" strokeWidth={2} />
            )}
          </motion.button>
        </div>
      )}

      <ReportBlockDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onBlock={handleBlock}
        onReport={handleReport}
        userName={selectedProfile?.name || ''}
      />

      
      <AIItineraryAssistant destination={destination} />
    </div>
  );
};

export default SwipeScreen;
