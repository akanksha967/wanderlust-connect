import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Heart, Globe, Plane, Users, ChevronRight } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ReactNode> = {
  '❤️': <Heart className="w-4 h-4 text-pink-400" />,
  '🌍': <Globe className="w-4 h-4 text-emerald-400" />,
  '✈️': <Plane className="w-4 h-4 text-sky-400" />,
  '👋': <Users className="w-4 h-4 text-amber-400" />,
};

const NotificationItem = ({
  notification,
  onReveal,
  onDismiss,
}: {
  notification: Notification;
  onReveal: (id: string) => void;
  onDismiss: (id: string) => void;
}) => {
  const isUnrevealed = (notification.type === 'like' || notification.type === 'destination_match') && 
    !notification.metadata?.revealed && notification.status === 'unread';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={`flex items-start gap-3 p-4 rounded-2xl transition-all cursor-pointer ${
        notification.status === 'unread'
          ? 'bg-white/[0.12] border border-white/20'
          : 'bg-white/[0.06] border border-white/10'
      }`}
      onClick={() => {
        if (isUnrevealed) onReveal(notification.id);
      }}
    >
      <div className="w-9 h-9 rounded-full bg-white/[0.12] backdrop-blur-sm flex items-center justify-center shrink-0">
        {iconMap[notification.icon || '❤️'] || <Bell className="w-4 h-4 text-white/70" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug">{notification.title}</p>
        {notification.body && (
          <p className="text-xs text-white/50 mt-1">{notification.body}</p>
        )}
        <p className="text-xs text-white/30 mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {isUnrevealed && (
          <div className="w-7 h-7 rounded-full bg-white/[0.1] flex items-center justify-center">
            <ChevronRight className="w-3.5 h-3.5 text-white/60" />
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
          className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center hover:bg-white/[0.15] transition-all"
        >
          <X className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>
    </motion.div>
  );
};

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, revealLike, dismissNotification, clearAll } = useNotifications();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg transition-all hover:bg-white/40 active:scale-95 relative"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center border-2 border-white/30"
          >
            <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-14 w-[320px] max-h-[420px] rounded-[20px] overflow-hidden z-50"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.1]">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-white/40">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-sm text-white/30">No new notifications</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onReveal={revealLike}
                      onDismiss={dismissNotification}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
