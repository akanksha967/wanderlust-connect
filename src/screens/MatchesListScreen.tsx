import { motion } from 'framer-motion';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { ArrowLeft, MessageCircle, Heart } from 'lucide-react';

const MatchesListScreen = () => {
  const { setScreen, matches, setMatchedUser } = useAppStore();

  const handleOpenChat = (user: UserProfile) => {
    setMatchedUser(user);
    setScreen('chat');
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Full-screen background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-500/50 via-violet-500/40 to-purple-600/50" />
      <div className="fixed inset-0 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-4 flex items-center gap-4 border-b border-white/20">
        <button 
          onClick={() => setScreen('swipe')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display text-white drop-shadow-lg">Your Matches</h1>
        </div>
      </div>

      {/* Matches List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
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
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 border-2 border-white/50" />
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

                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg border border-white/30">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg animate-float">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-display text-white drop-shadow-lg mb-2">
              No matches yet
            </h3>
            <p className="text-sm text-white/80 mb-6 drop-shadow">
              Keep swiping to find your perfect travel buddy!
            </p>
            <button
              onClick={() => setScreen('swipe')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white font-medium shadow-lg border border-white/30 transition-smooth hover:shadow-xl hover:scale-105"
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
