import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MapPin, Calendar, Users, DollarSign, Info, Compass, Heart, X } from 'lucide-react';
import { Trip } from '@/hooks/useTrips';
import { format } from 'date-fns';

interface SwipeTripCardProps {
    trip: Trip & { creator_name?: string };
    onSwipe: (direction: 'left' | 'right') => void;
    onViewDetails: () => void;
    isTop: boolean;
}

const SwipeTripCard = ({
    trip,
    onSwipe,
    onViewDetails,
    isTop
}: SwipeTripCardProps) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const joinOpacity = useTransform(x, [0, 100], [0, 1]);
    const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    const isFull = (trip.member_count || 1) >= (trip.max_travelers || 5);

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
                className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] bg-gradient-to-br from-indigo-900/90 via-blue-900/90 to-slate-900/90 backdrop-blur-2xl border border-white/20 p-6 flex flex-col"
            >
                {/* Trip Badge */}
                <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 backdrop-blur-md">
                        <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Trip Board</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:bg-white/20"
                    >
                        <Info className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Central Content */}
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center shadow-2xl mb-2 rotate-3">
                        <Compass className="w-10 h-10 text-white" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-display font-bold text-white mb-1 drop-shadow-lg">
                            {trip.title}
                        </h2>
                        <div className="flex items-center justify-center gap-1.5 text-sky-200">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium tracking-wide uppercase">{trip.destination}</span>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Calendar className="w-4 h-4 text-sky-400 mb-1 mx-auto" />
                            <p className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">Dates</p>
                            <p className="text-xs text-white font-medium">
                                {format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d')}
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Users className="w-4 h-4 text-emerald-400 mb-1 mx-auto" />
                            <p className="text-[10px] text-white/50 uppercase font-bold tracking-tighter">Travelers</p>
                            <p className="text-xs text-white font-medium">
                                {trip.member_count || 1}/{trip.max_travelers || 5} Spots
                            </p>
                        </div>
                    </div>

                    {trip.travel_style && (
                        <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 text-sm font-medium">
                            ✨ {trip.travel_style} Trip
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                            <Compass className="w-4 h-4 text-white/70" />
                        </div>
                        <span className="text-xs text-white/60">by {trip.creator_name || 'Traveler'}</span>
                    </div>
                    {trip.budget && (
                        <div className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{trip.budget}</span>
                        </div>
                    )}
                </div>

                {/* Swipe Indicators */}
                {isTop && (
                    <>
                        <motion.div className="absolute top-1/2 left-10 -translate-y-1/2 px-4 py-2 border-4 border-green-400 rounded-xl -rotate-12 bg-green-400/20 backdrop-blur-sm z-30" style={{ opacity: joinOpacity }}>
                            <span className="text-green-400 text-2xl font-display font-bold">JOIN</span>
                        </motion.div>
                        <motion.div className="absolute top-1/2 right-10 -translate-y-1/2 px-4 py-2 border-4 border-red-400 rounded-xl rotate-12 bg-red-400/20 backdrop-blur-sm z-30" style={{ opacity: skipOpacity }}>
                            <span className="text-red-400 text-2xl font-display font-bold">SKIP</span>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default SwipeTripCard;
