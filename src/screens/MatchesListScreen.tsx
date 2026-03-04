import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { ArrowLeft, MessageCircle, Heart, RefreshCw } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';

const MatchesListScreen = () => {
  const { setScreen, matches, setMatchedUser } = useAppStore();
  const { loading, refreshing, refresh } = useMatches();
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const PULL_THRESHOLD = 80;

  const handleOpenChat = (user: UserProfile) => {
    setMatchedUser(user);
    setScreen('chat');
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    
    if (diff > 0 && scrollRef.current?.scrollTop === 0) {
      const resistance = 0.4;
      setPullDistance(Math.min(diff * resistance, PULL_THRESHOLD * 1.5));
    }
  }, [isPulling, refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      refresh(true);
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, refreshing, refresh]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Full-screen background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
      <div className="fixed inset-0 backdrop-blur-[2px]" />

      {/* Header - no refresh button */}
      <div className="relative z-10 px-4 pt-12 pb-4 flex items-center gap-4 border-b border-white/20">
        <button 
          onClick={() => setScreen('swipe')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display text-white drop-shadow-lg">Your Matches</h1>
          {refreshing && (
            <p className="text-xs text-white/70 mt-0.5">Refreshing...</p>
          )}
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute left-0 right-0 flex justify-center z-20 transition-transform"
          style={{ 
            top: 120,
            transform: `translateY(${pullDistance - 40}px)`,
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
          }}
        >
          <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-lg">
            <RefreshCw 
              className={`w-5 h-5 text-white transition-transform ${pullDistance >= PULL_THRESHOLD ? 'rotate-180' : ''}`}
              style={{ transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 180}deg)` }}
            />
          </div>
        </div>
      )}

      {/* Matches List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 relative z-10"
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match, index) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleOpenChat(match)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-smooth hover:bg-white/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative">
                  <img
                    src={match.photos[0]}
                    alt={match.name}
                    className="w-16 h-16 rounded-xl object-cover border border-white/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 border-2 border-white/50" />
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className="font-display text-lg text-white drop-shadow-md">
                    {match.name}, {match.age}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-1 drop-shadow">
                    {match.bio}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {match.travelVibes.slice(0, 2).map((vibe) => (
                      <span
                        key={vibe}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>

                <div 
                  className="w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(167,139,250,0.5)',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.2)',
                  }}
                >
                  <MessageCircle className="w-4.5 h-4.5 text-violet-300" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-xl border border-white/40 flex items-center justify-center mb-6 shadow-lg">
              <div className="w-8 h-8 border-4 border-white/60 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-display text-white drop-shadow-lg mb-2">Loading matches…</h3>
            <p className="text-sm text-white/80 drop-shadow">Fetching your chats from the backend</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <div 
              className="w-24 h-24 rounded-full backdrop-blur-xl flex items-center justify-center mb-6 shadow-lg animate-float"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(167,139,250,0.4)',
                boxShadow: '0 8px 32px rgba(139,92,246,0.25), 0 0 40px rgba(167,139,250,0.15)',
              }}
            >
              <Heart className="w-10 h-10 text-violet-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-display text-white drop-shadow-lg mb-2">
              No matches yet
            </h3>
            <p className="text-sm text-white/80 mb-6 drop-shadow">
              Keep swiping to find your perfect travel buddy!
            </p>
            <button
              onClick={() => setScreen('swipe')}
              className="px-6 py-3 rounded-full backdrop-blur-xl text-violet-200 font-medium shadow-lg transition-smooth hover:shadow-xl hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1.5px solid rgba(167,139,250,0.45)',
                boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
              }}
            >
              Start Swiping
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MatchesListScreen;
