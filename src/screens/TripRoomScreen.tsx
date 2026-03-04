import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useTrips, Trip, TripMember, TripStory } from '@/hooks/useTrips';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Calendar, Users, Send, Check, X,
  Share2, Clock, MessageCircle, BookOpen, User, Loader2, Copy, Camera, Trash2
} from 'lucide-react';
import UserProfileModal from '@/components/UserProfileModal';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';

const glassStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
};

interface TripMessage {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

const TripRoomScreen = () => {
  const { setScreen, selectedTripId } = useAppStore();
  const { profileId } = useAuth();
  const { fetchTripMembers, manageMember, removeMember, fetchTripStories, postStory, requestToJoin } = useTrips();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [stories, setStories] = useState<TripStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'stories'>('details');
  const [messageInput, setMessageInput] = useState('');
  const [storyInput, setStoryInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCreator = trip?.creator_id === profileId;
  const isMember = members.some(m => m.user_id === profileId && m.status === 'approved') || isCreator;
  const hasPendingRequest = members.some(m => m.user_id === profileId && m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');
  const pendingMembers = members.filter(m => m.status === 'pending');
  // Creator is already in approvedMembers due to DB trigger
  const spotsLeft = (trip?.max_travelers || 5) - (approvedMembers.length);
  const isFull = spotsLeft <= 0;

  const daysUntilStart = trip ? differenceInDays(new Date(trip.start_date), new Date()) : 0;
  const isCompleted = trip ? new Date(trip.end_date) < new Date() : false;
  const isStartingSoon = daysUntilStart <= 7 && daysUntilStart > 0;

  const loadTripData = useCallback(async () => {
    if (!selectedTripId) return;
    setLoading(true);
    try {
      const { data: tripData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', selectedTripId)
        .single();

      if (error) throw error;
      setTrip(tripData as Trip);

      const membersData = await fetchTripMembers(selectedTripId);
      setMembers(membersData);

      const storiesData = await fetchTripStories(selectedTripId);
      setStories(storiesData);

      // Fetch chat messages
      await loadMessages(selectedTripId);
    } catch (error) {
      console.error('Error loading trip:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTripId]);

  const loadMessages = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('trip_messages')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      let nameMap = new Map<string, string>();
      let photoMap = new Map<string, string>();

      if (senderIds.length > 0) {
        const [profilesRes, photosRes] = await Promise.all([
          supabase.from('profiles').select('id, name').in('id', senderIds),
          supabase.from('photos').select('profile_id, url').in('profile_id', senderIds).eq('is_primary', true),
        ]);
        nameMap = new Map((profilesRes.data || []).map(p => [p.id, p.name]));
        photoMap = new Map((photosRes.data || []).map(p => [p.profile_id, p.url]));
      }

      setMessages((data || []).map(m => ({
        ...m,
        sender_name: nameMap.get(m.sender_id) || 'Traveler',
        sender_photo: photoMap.get(m.sender_id),
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Realtime subscription for chat
  useEffect(() => {
    if (!selectedTripId || !isMember) return;

    const channel = supabase
      .channel(`trip-chat-${selectedTripId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_messages',
        filter: `trip_id=eq.${selectedTripId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', newMsg.sender_id).single();
        const { data: photo } = await supabase.from('photos').select('url').eq('profile_id', newMsg.sender_id).eq('is_primary', true).maybeSingle();
        setMessages(prev => [...prev, {
          ...newMsg,
          sender_name: profile?.name || 'Traveler',
          sender_photo: photo?.url,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTripId, isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !profileId || !selectedTripId || sendingMessage) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from('trip_messages').insert({
        trip_id: selectedTripId,
        sender_id: profileId,
        content: messageInput.trim(),
      });
      if (error) throw error;
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePostStory = async () => {
    if (!storyInput.trim() || !selectedTripId) return;

    let imageUrl = undefined;

    // If there's a file, we should have uploaded it already or do it now
    // For simplicity in this step, I'll add the UI for it first

    const success = await postStory(selectedTripId, storyInput.trim(), imageUrl);
    if (success) {
      setStoryInput('');
      toast({ title: 'Story posted! 📸' });
      const storiesData = await fetchTripStories(selectedTripId);
      setStories(storiesData);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTripId || !profileId) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `trip-stories/${selectedTripId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const success = await postStory(selectedTripId, storyInput.trim() || 'Shared a photo', publicUrl);
      if (success) {
        setStoryInput('');
        toast({ title: 'Photo shared! 📸' });
        const storiesData = await fetchTripStories(selectedTripId);
        setStories(storiesData);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShare = (platform: string) => {
    if (!trip) return;
    const shareUrl = `${window.location.origin}/trip?code=${trip.share_code}`;
    const text = `Join my trip: ${trip.title} to ${trip.destination}! ${spotsLeft} spots left 🎒`;

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      copy: shareUrl,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied! 🔗' });
    } else {
      window.open(urls[platform], '_blank');
    }
    setShowShareMenu(false);
  };

  const handleManageMember = async (memberId: string, status: 'approved' | 'rejected') => {
    const success = await manageMember(memberId, status);
    if (success) {
      const membersData = await fetchTripMembers(selectedTripId!);
      setMembers(membersData);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this crew?`)) return;
    const success = await removeMember(memberId);
    if (success) {
      const membersData = await fetchTripMembers(selectedTripId!);
      setMembers(membersData);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center relative">
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200)` }} />
        <div className="fixed inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
        <div className="fixed inset-0 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
          <p className="text-sm text-white/60">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-full flex items-center justify-center relative">
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200)` }} />
        <div className="fixed inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
        <div className="fixed inset-0 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center">
          <p className="text-white/60">Trip not found</p>
          <button onClick={() => setScreen('trips')} className="mt-4 px-4 py-2 rounded-full bg-white/20 text-white text-sm">Back to Trips</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200)` }} />
      <div className="fixed inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
      <div className="fixed inset-0 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/20">
        <button onClick={() => setScreen('trips')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display text-white drop-shadow-lg truncate">{trip.title}</h1>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <MapPin className="w-3 h-3" />
            <span>{trip.destination}</span>
            <span>·</span>
            <Users className="w-3 h-3" />
            <span>{approvedMembers.length} travelers</span>
          </div>
        </div>
        <button onClick={() => setShowShareMenu(!showShareMenu)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg">
          <Share2 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Crew Avatars Row */}
      <div className="relative z-10 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex -space-x-2 mr-1">
          {approvedMembers.slice(0, 5).map((member, i) => (
            <motion.button
              key={member.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedProfileId(member.user_id)}
              className="w-8 h-8 rounded-full border-2 border-indigo-400 bg-white/20 overflow-hidden shadow-lg hover:scale-110 hover:z-30 transition-all"
            >
              {member.profile?.photos?.[0]?.url ? (
                <img src={member.profile.photos[0].url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white/40" />
                </div>
              )}
            </motion.button>
          ))}
          {approvedMembers.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold shadow-lg">
              +{approvedMembers.length - 5}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-white/70 font-display uppercase tracking-wider">Active Crew</p>
          <div className="flex flex-wrap gap-1">
            {approvedMembers.slice(0, 3).map(m => (
              <span key={m.id} className="text-[11px] text-white/90">{m.profile?.name}{approvedMembers.indexOf(m) < Math.min(approvedMembers.length - 1, 2) ? ',' : ''}</span>
            ))}
            {approvedMembers.length > 3 && <span className="text-[11px] text-white/40">& {approvedMembers.length - 3} others</span>}
          </div>
        </div>
      </div>

      {/* Share dropdown */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-28 z-50 rounded-2xl p-3 space-y-2 w-48"
            style={glassStyle}
          >
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
              { id: 'telegram', label: 'Telegram', icon: '✈️' },
              { id: 'copy', label: 'Copy Link', icon: '🔗' },
            ].map(p => (
              <button key={p.id} onClick={() => handleShare(p.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/15 text-white/80 text-sm transition-all">
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="relative z-10 flex px-4 pt-3 gap-2">
        {([
          { id: 'details' as const, label: 'Details', icon: <MapPin className="w-3.5 h-3.5" /> },
          { id: 'chat' as const, label: 'Chat', icon: <MessageCircle className="w-3.5 h-3.5" /> },
          { id: 'stories' as const, label: 'Stories', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all ${activeTab === tab.id
              ? 'bg-white/30 text-white border border-white/40'
              : 'bg-white/10 text-white/60 border border-white/15'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'details' && (
          <div className="px-4 py-4 space-y-4">
            {/* Countdown / Status */}
            <div className="p-4 rounded-2xl text-center" style={glassStyle}>
              {isCompleted ? (
                <div>
                  <p className="text-lg font-display text-white/90">Completed Trip ✅</p>
                  <p className="text-xs text-white/50 mt-1">This adventure has ended</p>
                </div>
              ) : isStartingSoon ? (
                <div>
                  <p className="text-lg font-display text-amber-300">Trip starting soon! 🔥</p>
                  <p className="text-xs text-white/60 mt-1">Only {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''} away</p>
                </div>
              ) : daysUntilStart > 0 ? (
                <div>
                  <p className="text-3xl font-display text-white">{daysUntilStart}</p>
                  <p className="text-xs text-white/60">days until trip starts</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-display text-emerald-300">Trip in progress! 🌍</p>
                </div>
              )}
            </div>

            {/* Trip Info */}
            <div className="p-4 rounded-2xl space-y-3" style={glassStyle}>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Calendar className="w-4 h-4 text-violet-300" />
                <span>{format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}</span>
              </div>
              {trip.budget && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-violet-300 text-base">💰</span>
                  <span>{trip.budget}</span>
                </div>
              )}
              {trip.travel_style && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-violet-300 text-base">🎒</span>
                  <span>{trip.travel_style}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-violet-300" />
                <span className="text-white/80">{approvedMembers.length}/{trip.max_travelers || 5} travelers</span>
                <span className="text-xs ml-1">
                  {isFull ? (
                    <span className="text-amber-300">Trip full</span>
                  ) : (
                    <span className="text-emerald-300">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
                  )}
                </span>
              </div>
              {trip.description && (
                <p className="text-sm text-white/60 pt-2 border-t border-white/10">{trip.description}</p>
              )}
            </div>

            {/* Join / Status */}
            {!isMember && !hasPendingRequest && !isFull && !isCompleted && (
              <button
                onClick={() => requestToJoin(trip.id)}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ ...glassStyle, border: '1.5px solid rgba(167,139,250,0.5)', boxShadow: '0 8px 32px rgba(139,92,246,0.2)' }}
              >
                Join This Trip ✈️
              </button>
            )}
            {hasPendingRequest && (
              <div className="py-3 rounded-2xl text-center text-white/60 text-sm" style={glassStyle}>
                <Clock className="w-4 h-4 inline mr-1" /> Request pending...
              </div>
            )}

            {/* Members */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/70 px-1">Travelers</h3>
              {/* Creator */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={glassStyle}>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <User className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/90">{trip.creator?.name || 'Creator'}</p>
                  <p className="text-xs text-violet-300">Organizer</p>
                </div>
              </div>
              {approvedMembers.filter(m => m.user_id !== trip.creator_id).map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl group" style={glassStyle}>
                  <button
                    onClick={() => setSelectedProfileId(member.user_id)}
                    className="flex-shrink-0"
                  >
                    {member.profile?.photos?.[0]?.url ? (
                      <img src={member.profile.photos[0].url} className="w-9 h-9 rounded-full object-cover border border-white/20 hover:border-violet-300 transition-all" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                        <User className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedProfileId(member.user_id)}
                      className="text-sm text-white/90 hover:text-violet-300 transition-all text-left truncate w-full font-medium"
                    >
                      {member.profile?.name}
                    </button>
                    {member.joined_at && (
                      <p className="text-xs text-white/40">Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}</p>
                    )}
                  </div>
                  {isCreator && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.profile?.name || 'this traveler')}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Pending requests (creator only) */}
              {isCreator && pendingMembers.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h4 className="text-xs font-medium text-amber-300 px-1">Pending Requests</h4>
                  {pendingMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30" style={{ ...glassStyle, background: 'rgba(245,158,11,0.08)' }}>
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                        <User className="w-4 h-4 text-white/60" />
                      </div>
                      <p className="flex-1 text-sm text-white/90">{member.profile?.name}</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleManageMember(member.id, 'approved')}
                          className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/50 transition-all"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                        </button>
                        <button
                          onClick={() => handleManageMember(member.id, 'rejected')}
                          className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center hover:bg-red-500/50 transition-all"
                        >
                          <X className="w-4 h-4 text-red-300" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            {trip.recent_members && trip.recent_members.length > 0 && (
              <div className="p-3 rounded-xl text-xs text-white/50" style={glassStyle}>
                {trip.recent_members.map((m, i) => (
                  <p key={i}>{m.name} joined {formatDistanceToNow(new Date(m.joined_at), { addSuffix: true })}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {!isMember ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-white/5 backdrop-blur-md m-4 rounded-[32px] border border-white/10 shadow-2xl">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <MessageCircle className="w-10 h-10 text-white/40" />
                </div>
                <h3 className="text-xl font-display text-white mb-2">Chat Room Locked 🔒</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-[240px]">
                  Only approved members can join the group chat.
                  {hasPendingRequest ? "Your request is currently being reviewed." : "Join this trip to start planning together!"}
                </p>
                {!hasPendingRequest && !isFull && !isCompleted && (
                  <button
                    onClick={() => requestToJoin(trip.id)}
                    className="mt-8 px-8 py-3 rounded-full bg-white text-indigo-600 font-bold text-sm hover:bg-white/90 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Request Access
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-10 h-10 text-white/20 mb-3" />
                      <p className="text-sm text-white/50">No messages yet. Start the conversation! 💬</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === profileId;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                              <p className="text-[10px] text-white/40 mb-0.5 px-1">{msg.sender_name}</p>
                            )}
                            <div
                              className={`px-3.5 py-2 rounded-2xl text-sm ${isMe
                                ? 'rounded-br-md text-white'
                                : 'rounded-bl-md text-white/90'
                                }`}
                              style={{
                                background: isMe ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(12px)',
                                border: `1px solid ${isMe ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.15)'}`,
                              }}
                            >
                              {msg.content}
                            </div>
                            <p className="text-[10px] text-white/30 mt-0.5 px-1">
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="px-4 pb-6 pt-2">
                  <div className="flex gap-2 items-center p-2 rounded-2xl" style={glassStyle}>
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none px-2"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                      style={{ background: 'rgba(139,92,246,0.4)', border: '1px solid rgba(167,139,250,0.3)' }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="px-4 py-4 space-y-4">
            {!isMember ? (
              <div className="flex flex-col items-center justify-center px-8 py-16 text-center bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <BookOpen className="w-10 h-10 text-white/40" />
                </div>
                <h3 className="text-xl font-display text-white mb-2">Trip Stories Locked 🔒</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-[240px]">
                  Explore the journey of this crew once you are an approved traveler.
                </p>
              </div>
            ) : (
              <>
                {/* Post story (members only) */}
                {isMember && (
                  <div className="p-4 rounded-[24px] space-y-3 shadow-lg" style={glassStyle}>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 shrink-0 flex items-center justify-center border border-white/10">
                        <User className="w-5 h-5 text-white/40" />
                      </div>
                      <textarea
                        value={storyInput}
                        onChange={(e) => setStoryInput(e.target.value)}
                        placeholder="What's happening? 🌍"
                        rows={2}
                        className="flex-1 bg-transparent text-white text-base placeholder:text-white/30 outline-none resize-none pt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-violet-300 transition-all"
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>

                      <button
                        onClick={handlePostStory}
                        disabled={!storyInput.trim() || uploadingImage}
                        className="px-5 py-1.5 rounded-full bg-white text-indigo-600 text-sm font-bold transition-all disabled:opacity-50 hover:bg-white/90"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}

                {stories.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/50">No updates yet. Share the first vibe!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.map(story => (
                      <div key={story.id} className="p-4 rounded-[24px] shadow-sm animate-in fade-in slide-in-from-bottom-2" style={glassStyle}>
                        <div className="flex items-start gap-3">
                          {story.author?.photo ? (
                            <img src={story.author.photo} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-white/50" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-sm text-white font-bold truncate">{story.author?.name}</span>
                              <span className="text-[11px] text-white/40">· {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                            </div>

                            <p className="text-sm text-white/90 leading-relaxed mb-3">{story.content}</p>

                            {story.image_url && (
                              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner max-h-72">
                                <img
                                  src={story.image_url}
                                  alt="Story update"
                                  className="w-full h-full object-cover"
                                  onClick={() => window.open(story.image_url!, '_blank')}
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-6 mt-3 text-white/40">
                              <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-[11px]">Reply</span>
                              </button>
                              <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="text-[11px]">Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <UserProfileModal
        profileId={selectedProfileId}
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
};

export default TripRoomScreen;
