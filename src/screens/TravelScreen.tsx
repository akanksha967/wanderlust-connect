import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, MapPin, Calendar, Loader2, Search, Sparkles } from 'lucide-react';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import GoogleMapsDestinationPicker from '@/components/GoogleMapsDestinationPicker';

const popularDestinations = [
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&auto=format&fit=crop&q=80' },
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&auto=format&fit=crop&q=80' },
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop&q=80' },
  { name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&auto=format&fit=crop&q=80' },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&auto=format&fit=crop&q=80' },
  { name: 'Santorini', country: 'Greece', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&auto=format&fit=crop&q=80' },
];

const allDestinations = [
  'Bali', 'Tokyo', 'Paris', 'Barcelona', 'New York', 'London', 'Rome', 'Sydney',
  'Dubai', 'Singapore', 'Bangkok', 'Amsterdam', 'Berlin', 'Prague', 'Vienna',
  'Lisbon', 'Madrid', 'Athens', 'Istanbul', 'Cairo', 'Cape Town', 'Rio de Janeiro',
  'Buenos Aires', 'Mexico City', 'Los Angeles', 'San Francisco', 'Miami', 'Toronto',
  'Vancouver', 'Seoul', 'Hong Kong', 'Taipei', 'Mumbai', 'Delhi', 'Goa', 'Phuket',
  'Maldives', 'Bora Bora', 'Santorini', 'Mykonos', 'Amalfi Coast', 'Swiss Alps',
];

// Floating glass search input with dreamy styling
const DestinationInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const filteredDestinations = value.length > 0 
    ? allDestinations.filter(d => d.toLowerCase().includes(value.toLowerCase()))
    : allDestinations.slice(0, 6);

  return (
    <motion.div 
      className="relative"
      animate={{ 
        boxShadow: isFocused 
          ? '0 0 60px rgba(167, 139, 250, 0.4), 0 20px 50px -15px rgba(139, 92, 246, 0.35)' 
          : '0 12px 40px -10px rgba(139, 92, 246, 0.3)'
      }}
      style={{ borderRadius: '9999px' }}
      transition={{ duration: 0.4 }}
    >
      {/* Soft inner glow effect */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 blur-xl" />
      </div>
      
      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60 z-10" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { setShowSuggestions(true); setIsFocused(true); }}
        onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); setIsFocused(false); }}
        placeholder="Where do you dream of going?"
        className="relative h-16 pl-16 pr-16 rounded-full bg-white/85 backdrop-blur-[18px] border-2 border-white/50 text-gray-800 placeholder:text-gray-400 text-base font-medium focus:ring-0 focus:border-primary/40 focus:bg-white/95 transition-all duration-400"
      />
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-primary/80 to-accent/70 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg"
      >
        <Search className="w-4 h-4 text-white" />
      </motion.button>
      
      {showSuggestions && filteredDestinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-full left-4 right-4 mt-4 rounded-3xl bg-white/20 backdrop-blur-[20px] border border-white/30 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.4)] overflow-hidden z-50 max-h-60 overflow-y-auto"
        >
          {filteredDestinations.slice(0, 6).map((dest, index) => (
            <motion.button
              key={dest}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                onChange(dest);
                setShowSuggestions(false);
              }}
              className="w-full px-6 py-4 text-left hover:bg-white/20 transition-all duration-300 flex items-center gap-4 border-b border-white/10 last:border-b-0 group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 backdrop-blur-md flex items-center justify-center group-hover:from-primary/50 group-hover:to-accent/40 transition-all duration-300">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-white text-sm tracking-wide">{dest}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
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

  // Staggered animation for floating cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.4,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.85, rotateX: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
  };

  // Heights for staggered masonry effect
  const cardHeights = ['h-36', 'h-44', 'h-40', 'h-48', 'h-36', 'h-42'];
  const cardOffsets = [0, 16, 8, 20, 4, 12];

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Nature Background Image with Lavender Overlay */}
      <div className="fixed inset-0">
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&auto=format&fit=crop&q=85"
          alt="Mountain landscape"
          className="w-full h-full object-cover blur-[1px] brightness-95 saturate-[0.85]"
        />
        {/* Dreamy lavender gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/35 via-primary/20 to-primary/45" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/25 via-transparent to-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      {/* Floating ethereal orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -40, 0],
            x: [0, 25, 0],
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-5 w-72 h-72 rounded-full bg-white/25 blur-[80px]"
        />
        <motion.div
          animate={{ 
            y: [0, 35, 0],
            x: [0, -25, 0],
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-32 -left-16 w-80 h-80 rounded-full bg-accent/35 blur-[90px]"
        />
        <motion.div
          animate={{ 
            y: [0, -25, 0],
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-primary/20 blur-[100px]"
        />
        
        {/* Sparkle effects */}
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 left-20 w-2 h-2 rounded-full bg-white/70"
        />
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-32 w-1.5 h-1.5 rounded-full bg-white/60"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-60 left-1/3 w-2 h-2 rounded-full bg-white/50"
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 px-5 pt-10 pb-5 flex items-center gap-4 shrink-0"
      >
        <motion.button 
          onClick={handleBack}
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-[16px] border border-white/30 shadow-[0_10px_40px_-10px_rgba(139,92,246,0.4)] transition-all duration-300 hover:bg-white/25"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <div className="flex-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-2xl font-display font-semibold text-white drop-shadow-lg tracking-tight"
          >
            Where to next?
          </motion.h1>
          {!hasCompletedProfile && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-white/70 font-medium mt-0.5"
            >
              Step 2 of 2
            </motion.p>
          )}
        </div>
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center border border-white/20"
        >
          <Sparkles className="w-5 h-5 text-white/80" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 relative z-10 flex flex-col scrollbar-hide">
        {/* Hero Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="mb-8 shrink-0"
        >
          <motion.label 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-semibold text-white/90 mb-4 block tracking-widest uppercase drop-shadow flex items-center gap-2"
          >
            <span className="w-8 h-px bg-gradient-to-r from-white/50 to-transparent" />
            Destination
          </motion.label>
          {mapsLoading ? (
            <div className="relative h-16 rounded-full bg-white/20 backdrop-blur-[18px] border-2 border-white/30 flex items-center px-6">
              <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
              <span className="ml-4 text-white/60 text-base">Finding places...</span>
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

        {/* Floating Destination Cards - Staggered Masonry */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 flex-1"
        >
          <motion.label 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-semibold text-white/90 mb-5 block tracking-widest uppercase drop-shadow flex items-center gap-2"
          >
            <span className="w-8 h-px bg-gradient-to-r from-white/50 to-transparent" />
            Popular destinations
          </motion.label>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4"
          >
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                variants={cardVariants}
                onClick={() => handleSelectDestination(dest.name)}
                whileHover={{ 
                  scale: 1.04, 
                  y: -12,
                  rotateY: 5,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  marginTop: cardOffsets[index],
                  perspective: '1000px',
                }}
                className={`relative overflow-hidden rounded-[20px] text-left group ${cardHeights[index]} ${
                  destination === dest.name
                    ? 'ring-2 ring-white/70 shadow-[0_25px_70px_-15px_rgba(139,92,246,0.6),0_0_50px_rgba(167,139,250,0.4)]'
                    : 'shadow-[0_15px_45px_-12px_rgba(0,0,0,0.35)] hover:shadow-[0_25px_70px_-15px_rgba(139,92,246,0.5)]'
                }`}
              >
                {/* Full-bleed Image with smooth zoom */}
                <motion.div
                  className="absolute inset-0"
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <img 
                    src={dest.image} 
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                {/* Lavender glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent group-hover:from-primary/90 group-hover:via-primary/45 transition-all duration-500" />
                
                {/* Frosted glass edge effect */}
                <div className="absolute inset-0 rounded-[20px] border border-white/20 group-hover:border-white/35 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <p className="font-semibold text-white text-base drop-shadow-lg tracking-tight">{dest.name}</p>
                  </div>
                  <p className="text-xs text-white/80 font-medium tracking-wider drop-shadow-md ml-8">{dest.country}</p>
                </div>

                {/* Floating selection indicator */}
                {destination === dest.name && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/35 backdrop-blur-md flex items-center justify-center border border-white/50 shadow-lg"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: "spring" }}
                      className="w-3.5 h-3.5 rounded-full bg-white shadow-inner"
                    />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Travel Dates - Floating Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="shrink-0 p-5 rounded-3xl bg-white/15 backdrop-blur-[16px] border border-white/25 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.35)]"
        >
          <label className="text-xs font-semibold text-white/90 mb-4 block tracking-widest uppercase drop-shadow flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-white/50 to-transparent" />
            Travel dates
          </label>
          
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="text-[11px] text-white/70 mb-2.5 block font-medium tracking-wide">From</label>
              <motion.div 
                className="relative h-12 group"
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none z-10 group-focus-within:text-white/90 transition-colors" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-full pl-11 pr-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 w-full text-sm text-white focus:ring-0 focus:border-white/40 focus:bg-white/20 focus:shadow-[0_0_30px_rgba(167,139,250,0.35)] transition-all duration-400 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                />
              </motion.div>
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-white/70 mb-2.5 block font-medium tracking-wide">To</label>
              <motion.div 
                className="relative h-12 group"
                whileHover={{ scale: 1.02 }}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none z-10 group-focus-within:text-white/90 transition-colors" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-full pl-11 pr-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 w-full text-sm text-white focus:ring-0 focus:border-white/40 focus:bg-white/20 focus:shadow-[0_0_30px_rgba(167,139,250,0.35)] transition-all duration-400 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer CTA - Premium Pill Button */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 bg-gradient-to-t from-primary/60 via-primary/30 to-transparent z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: isValid ? 1.03 : 1 }} 
          whileTap={{ scale: isValid ? 0.96 : 1 }}
        >
          <Button
            className={`w-full h-14 rounded-full text-base font-semibold tracking-wide transition-all duration-400 ${
              isValid 
                ? 'bg-gradient-to-r from-primary via-accent to-primary text-white border border-white/40 shadow-[0_12px_40px_-10px_rgba(139,92,246,0.6),0_0_50px_rgba(167,139,250,0.3)] hover:shadow-[0_16px_60px_-10px_rgba(139,92,246,0.7),0_0_70px_rgba(167,139,250,0.4)]' 
                : 'bg-white/15 text-white/50 border border-white/15 backdrop-blur-md'
            }`}
            disabled={!isValid}
            onClick={handleContinue}
          >
            {isValid ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Find Travel Buddies
              </span>
            ) : (
              'Select destination & dates'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default TravelScreen;