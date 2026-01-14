import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, MapPin, Calendar, Loader2 } from 'lucide-react';
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
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Search destination..."
        className="h-12 pl-12 rounded-2xl glass-lavender border-0 shadow-glass text-sm focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200"
      />
      {showSuggestions && filteredDestinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-float overflow-hidden z-50 max-h-48 overflow-y-auto glass-card"
        >
          {filteredDestinations.slice(0, 6).map((dest) => (
            <button
              key={dest}
              onClick={() => {
                onChange(dest);
                setShowSuggestions(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-all duration-200 flex items-center gap-3 border-b border-border/20 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium text-foreground text-sm">{dest}</span>
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
    setScreen(hasCompletedProfile ? 'account' : 'profile');
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
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
    },
  };

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Lavender Gradient Background */}
      <div className="fixed inset-0 gradient-hero" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />

      {/* Floating orbs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -25, 0],
            x: [0, 15, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-0 w-72 h-72 rounded-full bg-primary/25 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            x: [0, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 -left-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 px-4 pt-6 pb-3 flex items-center gap-3 shrink-0"
      >
        <motion.button 
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl glass-lavender shadow-glass transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">Where to?</h1>
          {!hasCompletedProfile && <p className="text-[11px] text-muted-foreground font-medium">Step 2 of 2</p>}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 pb-24 relative z-10 flex flex-col">
        {/* Destination input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-4 shrink-0"
        >
          <label className="text-xs font-medium text-foreground mb-2 block">
            Destination
          </label>
          {mapsLoading ? (
            <div className="relative">
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              <Input
                disabled
                placeholder="Loading..."
                className="h-12 pl-12 rounded-2xl glass-lavender border-0 shadow-glass text-sm"
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

        {/* Popular destinations - Masonry-style staggered layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-4 flex-1 min-h-0"
        >
          <label className="text-xs font-medium text-foreground mb-3 block">
            Popular destinations
          </label>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3 h-[calc(100%-1.5rem)]"
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
                  scale: 1.04, 
                  y: -4,
                  transition: { duration: 0.25, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-2xl overflow-hidden text-left transition-all duration-300 ${
                  destination === dest.name
                    ? 'ring-2 ring-primary shadow-float glow-lavender'
                    : 'shadow-glass hover:shadow-float'
                }`}
                style={{
                  marginTop: index % 2 === 1 ? '8px' : '0', // Staggered vertical offset
                }}
              >
                {/* Image */}
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                
                {/* Lavender gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
                
                {/* Glass overlay for text */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="font-semibold text-primary-foreground text-xs drop-shadow-lg">{dest.name}</p>
                  <p className="text-[10px] text-primary-foreground/80 drop-shadow-md">{dest.country}</p>
                </div>

                {/* Selection indicator */}
                {destination === dest.name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center shadow-lg"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Dates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="shrink-0"
        >
          <label className="text-xs font-medium text-foreground mb-2 block">
            Travel dates
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">From</label>
              <div className="relative h-10">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-full pl-9 pr-2 rounded-xl glass-lavender border-0 shadow-glass w-full text-xs focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">To</label>
              <div className="relative h-10">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-full pl-9 pr-2 rounded-xl glass-lavender border-0 shadow-glass w-full text-xs focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
        <motion.div 
          whileHover={{ scale: isValid ? 1.01 : 1 }} 
          whileTap={{ scale: isValid ? 0.98 : 1 }}
        >
          <Button
            variant="accent"
            size="default"
            className={`w-full h-12 rounded-2xl text-sm font-semibold transition-all duration-300 ${
              isValid ? 'shadow-float glow-lavender' : 'opacity-50'
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