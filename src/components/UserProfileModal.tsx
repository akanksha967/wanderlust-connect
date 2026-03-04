import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { X, MapPin, User, Loader2, Calendar } from 'lucide-react';

const glassStyle = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
};

interface UserProfileModalProps {
    profileId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const UserProfileModal = ({ profileId, isOpen, onClose }: UserProfileModalProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!profileId || !isOpen) return;
            setLoading(true);
            try {
                const [profileRes, vibesRes, photosRes, plansRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', profileId).single(),
                    supabase.from('travel_vibes').select('vibe').eq('profile_id', profileId),
                    supabase.from('photos').select('url, is_primary').eq('profile_id', profileId).order('is_primary', { ascending: false }),
                    supabase.from('travel_plans').select('destination, start_date, end_date').eq('profile_id', profileId).eq('is_active', true).maybeSingle(),
                ]);

                if (profileRes.error) throw profileRes.error;

                setProfile({
                    ...profileRes.data,
                    vibes: vibesRes.data?.map(v => v.vibe) || [],
                    photos: photosRes.data || [],
                    plan: plansRes.data
                });
                setCurrentPhotoIndex(0);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [profileId, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative"
                        style={glassStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                <p className="text-white/60 text-sm">Loading profile...</p>
                            </div>
                        ) : profile ? (
                            <div className="flex flex-col">
                                {/* Photo Section */}
                                <div className="relative h-[300px] bg-white/5 group">
                                    {profile.photos.length > 0 ? (
                                        <>
                                            <img
                                                src={profile.photos[currentPhotoIndex].url}
                                                alt={profile.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {profile.photos.length > 1 && (
                                                <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                                                    {profile.photos.map((_: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className={`h-1 flex-1 rounded-full transition-all ${idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex">
                                                <div
                                                    className="flex-1 cursor-w-resize"
                                                    onClick={() => setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : profile.photos.length - 1)}
                                                />
                                                <div
                                                    className="flex-1 cursor-e-resize"
                                                    onClick={() => setCurrentPhotoIndex(prev => prev < profile.photos.length - 1 ? prev + 1 : 0)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-16 h-16 text-white/20" />
                                        </div>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/50 transition-all z-30"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                        <h2 className="text-2xl font-display text-white drop-shadow-lg">
                                            {profile.name}, {profile.age}
                                        </h2>
                                        {profile.plan && (
                                            <div className="flex items-center gap-2 text-white/80 mt-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="text-sm">Traveling to {profile.plan.destination}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-6 space-y-5 overflow-y-auto max-h-[300px]">
                                    {profile.bio && (
                                        <div>
                                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">About</h3>
                                            <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
                                        </div>
                                    )}

                                    {profile.vibes.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Travel Vibes</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.vibes.map((vibe: string) => (
                                                    <span key={vibe} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] text-white/70">
                                                        {vibe}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile.plan && (
                                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Trip Schedule
                                            </h3>
                                            <div className="flex justify-between items-center text-xs text-white/60">
                                                <span>{new Date(profile.plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                <div className="h-px flex-1 bg-white/10 mx-3" />
                                                <span>{new Date(profile.plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-white/40">Profile not found</div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UserProfileModal;
