import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, MapPin, Calendar, Plane } from 'lucide-react';

const popularDestinations = [
  { name: 'Bali', country: 'Indonesia', emoji: '🌴', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&auto=format&fit=crop' },
  { name: 'Tokyo', country: 'Japan', emoji: '🗼', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&auto=format&fit=crop' },
  { name: 'Paris', country: 'France', emoji: '🗼', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop' },
  { name: 'Barcelona', country: 'Spain', emoji: '🌊', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&auto=format&fit=crop' },
];

const TravelScreen = () => {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  // Always start with empty fields when adding a new trip
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

  // Get background image for selected destination
  const selectedDest = popularDestinations.find(d => d.name === destination);
  const bgImage = selectedDest?.image || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop';

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background Image */}
      <motion.div 
        key={destination}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all duration-300 hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-display text-foreground">Where to?</h1>
          {!hasCompletedProfile && <p className="text-xs text-muted-foreground">Step 2 of 2</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 relative z-10">
        {/* Destination input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-2 block">
            Destination
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Search destination..."
              className="h-14 pl-12 rounded-2xl bg-secondary border-0 shadow-soft text-base"
            />
          </div>
        </motion.div>

        {/* Popular destinations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="text-sm font-medium text-foreground mb-3 block">
            Popular destinations
          </label>
          <div className="grid grid-cols-2 gap-3">
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => handleSelectDestination(dest.name)}
                className={`relative overflow-hidden p-4 rounded-2xl text-left transition-smooth ${
                  destination === dest.name
                    ? 'ring-2 ring-accent shadow-glow'
                    : 'shadow-soft hover:shadow-card'
                }`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${dest.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />
                <div className="relative z-10">
                  <span className="text-2xl mb-2 block">{dest.emoji}</span>
                  <p className="font-medium text-background">{dest.name}</p>
                  <p className="text-xs text-background/70">{dest.country}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Dates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <label className="text-sm font-medium text-foreground block">
            Travel dates
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 pl-10 rounded-xl bg-secondary border-0 shadow-soft"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12 pl-10 rounded-xl bg-secondary border-0 shadow-soft"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info card with flying airplane */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border overflow-hidden relative"
        >
          {/* Animated flying airplane */}
          <motion.div
            animate={{ 
              x: [0, 200, 0],
              y: [0, -20, 0],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-2 right-0"
          >
            <Plane className="w-6 h-6 text-accent rotate-45" />
          </motion.div>

          <div className="flex gap-3">
            <motion.div 
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shrink-0"
            >
              <Plane className="w-5 h-5 text-accent-foreground" />
            </motion.div>
            <div>
              <p className="font-medium text-foreground text-sm">Find your travel match</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We'll show you travelers heading to the same destination around your dates
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent z-10">
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!isValid}
          onClick={handleContinue}
        >
          Find Travel Buddies
        </Button>
      </div>
    </div>
  );
};

export default TravelScreen;
