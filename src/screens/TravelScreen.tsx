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
        className="h-14 pl-12 rounded-2xl bg-card/80 backdrop-blur-sm border-0 shadow-soft text-base"
      />
      {showSuggestions && filteredDestinations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg border border-border overflow-hidden z-50 max-h-48 overflow-y-auto"
          style={{ backgroundColor: 'hsl(var(--card))' }}
        >
          {filteredDestinations.slice(0, 6).map((dest) => (
            <button
              key={dest}
              onClick={() => {
                onChange(dest);
                setShowSuggestions(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center gap-3 border-b border-border/50 last:border-b-0"
              style={{ backgroundColor: 'hsl(var(--card))' }}
            >
              <MapPin className="w-4 h-4 text-accent shrink-0" />
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

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Full-screen background like Apple homescreen */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-accent/30 via-background/70 to-background/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-8 pb-2 flex items-center gap-3 shrink-0">
        <button 
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/80 backdrop-blur-sm transition-all duration-300 hover:bg-card"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-display text-foreground">Where to?</h1>
          {!hasCompletedProfile && <p className="text-[10px] text-muted-foreground">Step 2 of 2</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 pb-20 relative z-10 flex flex-col">
        {/* Destination input with autocomplete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 shrink-0"
        >
          <label className="text-xs font-medium text-foreground mb-1 block">
            Destination
          </label>
          {mapsLoading ? (
            <div className="relative">
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              <Input
                disabled
                placeholder="Loading..."
                className="h-10 pl-10 rounded-xl bg-card/80 backdrop-blur-sm border-0 shadow-soft text-sm"
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

        {/* Popular destinations - 3x2 grid with smaller cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3 flex-1 min-h-0"
        >
          <label className="text-xs font-medium text-foreground mb-2 block">
            Popular destinations
          </label>
          <div className="grid grid-cols-3 gap-2 h-[calc(100%-1.5rem)]">
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.03 }}
                onClick={() => handleSelectDestination(dest.name)}
                className={`relative rounded-xl overflow-hidden text-left transition-smooth ${
                  destination === dest.name
                    ? 'ring-2 ring-accent shadow-glow'
                    : 'shadow-soft hover:shadow-card'
                }`}
              >
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="font-medium text-background text-xs">{dest.name}</p>
                  <p className="text-[10px] text-background/80">{dest.country}</p>
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
          className="shrink-0"
        >
          <label className="text-xs font-medium text-foreground mb-1 block">
            Travel dates
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <label className="text-[10px] text-muted-foreground mb-1 block">From</label>
              <div className="relative h-9">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-full pl-8 pr-2 rounded-lg bg-card/80 backdrop-blur-sm border-0 shadow-soft w-full text-xs [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-muted-foreground mb-1 block">To</label>
              <div className="relative h-9">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-full pl-8 pr-2 rounded-lg bg-card/80 backdrop-blur-sm border-0 shadow-soft w-full text-xs [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-5 bg-gradient-to-t from-background via-background to-transparent z-10">
        <Button
          variant="accent"
          size="default"
          className="w-full h-10"
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
