import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, MapPin, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import GoogleMapsDestinationPicker from '@/components/GoogleMapsDestinationPicker';

const popularDestinations = [
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&auto=format&fit=crop' },
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&auto=format&fit=crop' },
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&auto=format&fit=crop' },
  { name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=300&auto=format&fit=crop' },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300&auto=format&fit=crop' },
  { name: 'London', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&auto=format&fit=crop' },
];

const allDestinations = [
  'Bali', 'Tokyo', 'Paris', 'Barcelona', 'New York', 'London', 'Rome', 'Sydney',
  'Dubai', 'Singapore', 'Bangkok', 'Amsterdam', 'Berlin', 'Prague', 'Vienna',
  'Lisbon', 'Madrid', 'Athens', 'Istanbul', 'Cairo', 'Cape Town', 'Rio de Janeiro',
  'Buenos Aires', 'Mexico City', 'Los Angeles', 'San Francisco', 'Miami', 'Toronto',
  'Vancouver', 'Seoul', 'Hong Kong', 'Taipei', 'Mumbai', 'Delhi', 'Goa', 'Phuket',
  'Maldives', 'Bora Bora', 'Santorini', 'Mykonos', 'Amalfi Coast', 'Swiss Alps',
];

// Simple destination input with dropdown suggestions
const DestinationInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const filteredDestinations = value.length > 0 
    ? allDestinations.filter(d => d.toLowerCase().includes(value.toLowerCase()))
    : allDestinations.slice(0, 6);

  return (
    <div className="relative">
      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 z-10" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Search destination..."
        className="h-14 pl-14 pr-14 rounded-full bg-white/80 backdrop-blur-[16px] border border-white/40 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)] text-gray-900 placeholder:text-gray-500 text-base focus:ring-2 focus:ring-white/50 focus:bg-white/90 focus:shadow-[0_0_40px_rgba(167,139,250,0.4)] transition-all duration-300"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg"
      >
        <ArrowRight className="w-4 h-4 text-white" />
      </motion.button>
      {showSuggestions && filteredDestinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-3 rounded-2xl bg-white/15 backdrop-blur-[18px] border border-white/25 shadow-[0_16px_48px_-12px_rgba(139,92,246,0.35)] overflow-hidden z-50 max-h-52 overflow-y-auto"
        >
          {filteredDestinations.slice(0, 6).map((dest) => (
            <button
              key={dest}
              onClick={() => {
                onChange(dest);
                setShowSuggestions(false);
              }}
              className="w-full px-5 py-3.5 text-left hover:bg-white/15 transition-all duration-200 flex items-center gap-4 border-b border-white/10 last:border-b-0"
            >
              <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white/80" />
              </div>
              <span className="font-medium text-white text-sm">{dest}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const TravelScreen = () => {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading: mapsLoading } = useGoogleMapsKey();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleBack = () => {
    setScreen('profile');
  };

  const handleSelectDestination = (name: string) => {
    setDestination(name);
  };

  const handleContinue = () => {
    setTravelDetails({
      destination,
      startDate,
      endDate,
    });
    setScreen('swipe');
  };

  const isValid = destination && startDate && endDate;

  // Staggered animation for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
  };

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Nature Background Image with Lavender Overlay */}
      <div className="fixed inset-0">
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=80"
          alt="Mountain landscape"
          className="w-full h-full object-cover blur-[2px] brightness-90 saturate-75"
        />
        {/* Soft lavender gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/25 to-primary/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Floating dreamy orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-80 h-80 rounded-full bg-white/20 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 25, 0],
            x: [0, -18, 0],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-40 -left-20 w-96 h-96 rounded-full bg-accent/30 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.4, 0.25]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 px-5 pt-8 pb-4 flex items-center gap-4 shrink-0"
      >
        <motion.button 
          onClick={handleBack}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-[14px] border border-white/25 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)] transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <div>
          <h1 className="text-xl font-display font-semibold text-white drop-shadow-lg">Where to?</h1>
          {!hasCompletedProfile && (
            <p className="text-xs text-white font-medium">Step 2 of 2</p>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-5 pb-28 relative z-10 flex flex-col">
        {/* Hero Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="mb-6 shrink-0"
        >
          <label className="text-xs font-semibold text-white mb-3 block tracking-wide uppercase drop-shadow">
            Destination
          </label>
          {mapsLoading ? (
            <div className="relative">
              <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 animate-spin" />
              <Input
                disabled
                placeholder="Loading..."
                className="h-14 pl-14 rounded-full bg-white/15 backdrop-blur-[16px] border border-white/25 text-white placeholder:text-white/50"
              />
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker
              apiKey={apiKey}
              value={destination}
              onChange={setDestination}
            />
          ) : (
            <DestinationInput 
              value={destination} 
              onChange={setDestination}
            />
          )}
        </motion.div>

        {/* Popular destinations - Staggered masonry layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-5 flex-1 min-h-0"
        >
          <label className="text-xs font-semibold text-white mb-4 block tracking-wide uppercase drop-shadow">
            Popular destinations
          </label>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-4 h-[calc(100%-2rem)]"
            style={{
              gridTemplateRows: 'repeat(2, 1fr)',
            }}
          >
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                variants={cardVariants}
                onClick={() => handleSelectDestination(dest.name)}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.96 }}
                className={`relative rounded-[18px] overflow-hidden text-left group ${
                  destination === dest.name
                    ? 'ring-2 ring-white/60 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.5),0_0_40px_rgba(167,139,250,0.3)]'
                    : 'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)]'
                }`}
                style={{
                  marginTop: index % 2 === 1 ? '12px' : '0',
                }}
              >
                {/* Full-bleed Image with zoom effect */}
                <motion.img 
                  src={dest.image} 
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-115"
                />
                
                {/* Lavender gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40 to-primary/10 group-hover:from-primary/90 group-hover:via-primary/50 transition-all duration-300" />
                
                {/* Glass surface effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content with glass backdrop */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white/90" />
                    </div>
                    <p className="font-semibold text-white text-sm drop-shadow-lg">{dest.name}</p>
                  </div>
                  <p className="text-[11px] text-white/75 font-light tracking-wide drop-shadow-md ml-7">{dest.country}</p>
                </div>

                {/* Selection indicator */}
                {destination === dest.name && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Travel Dates - Glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="shrink-0 p-4 rounded-2xl bg-white/12 backdrop-blur-[14px] border border-white/20 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.25)]"
        >
          <label className="text-xs font-semibold text-white mb-3 block tracking-wide uppercase drop-shadow">
            Travel dates
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[11px] text-white/80 mb-2 block font-medium">From</label>
              <div className="relative h-11">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-full pl-10 pr-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 w-full text-sm text-white focus:ring-2 focus:ring-white/25 focus:bg-white/15 focus:shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-white/80 mb-2 block font-medium">To</label>
              <div className="relative h-11">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-full pl-10 pr-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 w-full text-sm text-white focus:ring-2 focus:ring-white/25 focus:bg-white/15 focus:shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileHover={{ scale: isValid ? 1.02 : 1 }} 
          whileTap={{ scale: isValid ? 0.97 : 1 }}
        >
          <Button
            className={`w-full h-14 rounded-full text-base font-semibold transition-all duration-300 ${
              isValid 
                ? 'bg-gradient-to-r from-primary/90 via-accent/85 to-primary/90 text-white border border-white/30 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.5),0_0_40px_rgba(167,139,250,0.25)] hover:shadow-[0_12px_48px_-8px_rgba(139,92,246,0.6),0_0_60px_rgba(167,139,250,0.35)]' 
                : 'bg-white/15 text-white/50 border border-white/10'
            }`}
            disabled={!isValid}
            onClick={handleContinue}
          >
            Find Travel Buddies
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default TravelScreen;