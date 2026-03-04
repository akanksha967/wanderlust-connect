import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useDailyLikes } from '@/hooks/useDailyLikes';

export const DailyLikesIndicator = () => {
  const { likesRemaining, maxLikes, loading } = useDailyLikes();

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
      }}
    >
      <div className="flex items-center gap-2">
        <Heart className="w-3.5 h-3.5 text-rose-300" />
        <span className="text-xs text-white/70">
          {likesRemaining} likes today
        </span>
      </div>
    </motion.div>
  );
};
