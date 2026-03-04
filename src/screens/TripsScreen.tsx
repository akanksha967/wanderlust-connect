import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useTrips, Trip } from '@/hooks/useTrips';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Plus, MapPin, Calendar, Users, DollarSign, Compass, Loader2, X } from 'lucide-react';

import { format } from 'date-fns';

const glassStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
};

const TripCard = ({ trip, onJoin, myProfileId }: { trip: Trip; onJoin: (id: string) => void; myProfileId: string | null }) => {
  const isCreator = trip.creator_id === myProfileId;
  const isFull = (trip.member_count || 1) >= (trip.max_travelers || 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-[20px] transition-all"
      style={glassStyle}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-display text-white drop-shadow">{trip.title}</h3>
        {trip.travel_style && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 border border-white/20">
            {trip.travel_style}
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <MapPin className="w-3.5 h-3.5" />
          <span>{trip.destination}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Calendar className="w-3.5 h-3.5" />
          <span>{format(new Date(trip.start_date), 'MMM d')} – {format(new Date(trip.end_date), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Users className="w-3.5 h-3.5" />
          <span>{trip.member_count || 1}/{trip.max_travelers || 5} travel buddies 🎒</span>
        </div>
        {trip.budget && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{trip.budget}</span>
          </div>
        )}
      </div>

      {trip.description && (
        <p className="text-xs text-white/60 mb-3 line-clamp-2">{trip.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">by {trip.creator?.name || 'Traveler'}</span>
        {!isCreator && !isFull && (
          <button
            onClick={() => onJoin(trip.id)}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-medium border border-white/30 shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            Request to Join
          </button>
        )}
        {isFull && !isCreator && (
          <span className="text-xs text-white/40">Full</span>
        )}
        {isCreator && (
          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">Your trip</span>
        )}
      </div>
    </motion.div>
  );
};

const CreateTripModal = ({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [travelStyle, setTravelStyle] = useState('');
  const [description, setDescription] = useState('');
  const [maxTravelers, setMaxTravelers] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !destination || !startDate || !endDate) return;
    setSubmitting(true);
    await onCreate({
      title, destination, start_date: startDate, end_date: endDate,
      budget: budget || undefined,
      travel_style: travelStyle || undefined,
      description: description || undefined,
      max_travelers: parseInt(maxTravelers) || 5,
    });
    setSubmitting(false);
    setTitle(''); setDestination(''); setStartDate(''); setEndDate('');
    setBudget(''); setTravelStyle(''); setDescription(''); setMaxTravelers('5');
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/80 border border-white/40 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-all";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-[24px] p-6 max-h-[85vh] overflow-y-auto"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display text-white drop-shadow">Create Trip</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all border border-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trip title" className={inputClass} />
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className={inputClass} />
            <div className="flex gap-3">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`flex-1 ${inputClass}`} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`flex-1 ${inputClass}`} />
            </div>
            <div className="flex gap-3">
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (e.g. $1200)" className={`flex-1 ${inputClass}`} />
              <input value={maxTravelers} onChange={(e) => setMaxTravelers(e.target.value)} type="number" min="2" max="20" placeholder="Crew size 🎒" className={`w-28 ${inputClass}`} />
            </div>
            <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} className={inputClass}>
              <option value="">Travel style</option>
              <option value="Backpacking">Backpacking</option>
              <option value="Luxury">Luxury</option>
              <option value="Budget">Budget</option>
              <option value="Adventure">Adventure</option>
              <option value="Cultural">Cultural</option>
              <option value="Road Trip">Road Trip</option>
            </select>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your trip..." rows={3} className={`${inputClass} resize-none`} />
            
            <button
              onClick={handleSubmit}
              disabled={!title || !destination || !startDate || !endDate || submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium shadow-lg border border-white/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? 'Creating...' : 'Create Trip Board'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TripsScreen = () => {
  const { setScreen, travelDetails } = useAppStore();
  const { profileId } = useAuth();
  const { trips, loading, createTrip, requestToJoin } = useTrips();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');

  const matchingTrips = trips.filter(t => 
    travelDetails?.destination && t.destination.toLowerCase().includes(travelDetails.destination.toLowerCase())
  );
  const displayTrips = activeTab === 'my' ? trips.filter(t => t.creator_id === profileId) : trips;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop)` }} />
      <div className="fixed inset-0 bg-gradient-to-b from-sky-300/40 via-blue-200/35 to-indigo-300/40" />
      <div className="fixed inset-0 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-4 flex items-center gap-4 border-b border-white/20">
        <button onClick={() => setScreen('swipe')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display text-white drop-shadow-lg">Trip Boards</h1>
        </div>
        
        <button onClick={() => setShowCreate(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 border border-white/30 shadow-lg">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex px-4 pt-3 gap-2">
        {(['discover', 'my'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white/30 text-white border border-white/40'
                : 'bg-white/10 text-white/60 border border-white/15'
            }`}
          >
            {tab === 'discover' ? 'Discover' : 'My Trips'}
          </button>
        ))}
      </div>

      {/* Matching destination banner */}
      {activeTab === 'discover' && matchingTrips.length > 0 && (
        <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/30">
          <p className="text-xs text-emerald-200 font-medium">
            🎯 {matchingTrips.length} trip{matchingTrips.length > 1 ? 's' : ''} matching your destination
          </p>
        </div>
      )}

      {/* Trips list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
            <p className="text-sm text-white/60">Loading trips...</p>
          </div>
        ) : displayTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Compass className="w-10 h-10 text-white/25 mb-3" />
            <p className="text-sm text-white/60">
              {activeTab === 'my' 
                ? 'You haven\'t created any trips yet. Tap + to create your first trip board!'
                : 'No trips available right now. Be the first to create one!'}
            </p>
          </div>
        ) : (
          displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onJoin={requestToJoin} myProfileId={profileId} />
          ))
        )}
      </div>

      <CreateTripModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreate={createTrip} />
    </div>
  );
};

export default TripsScreen;
