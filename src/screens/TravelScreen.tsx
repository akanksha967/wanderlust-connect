import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, AlertCircle } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

const popularDestinations = [
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80" },
  { name: "New York", country: "USA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80" },
  { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const TravelScreen = () => {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading: mapsLoading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);

  const hasDates = startDate && endDate;
  const isValid = destination && hasDates;

  const handleContinue = () => {
    if (!hasDates) {
      setShowDateWarning(true);
      return;
    }
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden bg-gradient-to-br from-[hsl(270,40%,95%)] via-[hsl(265,35%,92%)] to-[hsl(200,50%,92%)]">
      {/* Subtle floating orbs */}
      <motion.div 
        className="fixed top-20 right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-40 left-6 w-40 h-40 rounded-full bg-accent/15 blur-3xl"
        animate={{ y: [0, 8, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* MAIN CONTAINER - Box-based layout */}
      <div className="h-full flex flex-col px-4 py-6">
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-4 shrink-0"
        >
          <motion.button
            onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full glass-card shadow-card flex items-center justify-center"
          >
            <ArrowLeft className="text-primary w-5 h-5" />
          </motion.button>

          <div className="flex-1">
            <h1 className="font-display text-xl font-semibold text-foreground tracking-tight">
              Where to next?
            </h1>
            {!hasCompletedProfile && (
              <p className="font-outfit text-sm text-muted-foreground">Step 2 of 2</p>
            )}
          </div>
        </motion.header>

        {/* GLASSMORPHIC MAIN BOX */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 glass-card rounded-3xl shadow-glass-lg p-4 overflow-hidden flex flex-col"
        >
          {/* SEARCH BAR */}
          <div className="shrink-0 mb-4">
            {mapsLoading ? (
              <div className="h-11 rounded-full glass flex items-center px-4 shadow-card">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span className="ml-3 font-outfit text-muted-foreground text-sm">Loading maps…</span>
              </div>
            ) : apiKey ? (
              <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
            ) : (
              <motion.div 
                className={`relative rounded-full transition-smooth ${
                  isFocused ? "shadow-glow" : "shadow-card"
                }`}
              >
                <Input
                  placeholder="Search destination..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="h-11 rounded-full glass border-white/40 text-foreground placeholder:text-muted-foreground font-outfit text-sm pl-4 pr-11 focus:border-primary/50 focus:ring-0"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary" />
                </button>
              </motion.div>
            )}
          </div>

          {/* DATE PICKER - TOP PRIORITY */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`shrink-0 mb-4 p-3 rounded-2xl transition-smooth ${
              showDateWarning && !hasDates 
                ? "bg-destructive/10 border border-destructive/30" 
                : "glass border-white/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-outfit text-sm font-medium text-foreground">Travel Dates</span>
              </div>
              {showDateWarning && !hasDates && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 text-destructive"
                >
                  <AlertCircle size={12} />
                  <span className="text-xs font-medium font-outfit">Required</span>
                </motion.div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-outfit text-xs text-muted-foreground mb-1 block">From</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setShowDateWarning(false);
                  }}
                  className="h-10 rounded-xl glass border-white/40 text-foreground font-outfit text-sm focus:border-primary/50 focus:ring-0 [color-scheme:light]"
                />
              </div>
              <div>
                <label className="font-outfit text-xs text-muted-foreground mb-1 block">To</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setShowDateWarning(false);
                  }}
                  className="h-10 rounded-xl glass border-white/40 text-foreground font-outfit text-sm focus:border-primary/50 focus:ring-0 [color-scheme:light]"
                />
              </div>
            </div>
          </motion.div>

          {/* DESTINATION CARDS - Sharp, compact, 2-column grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide -mx-1 px-1">
            <p className="font-outfit text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Popular Destinations
            </p>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 pb-2"
            >
              {popularDestinations.map((dest) => (
                <motion.button
                  key={dest.name}
                  variants={cardVariants}
                  onClick={() => setDestination(dest.name)}
                  whileHover={{ y: -3, transition: { duration: 0.25 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative rounded-2xl overflow-hidden text-left transition-smooth group
                    ${destination === dest.name
                      ? "ring-2 ring-primary shadow-glow"
                      : "shadow-card hover:shadow-glass"
                    }`}
                >
                  {/* Fixed aspect ratio container - SHARP image */}
                  <div className="relative aspect-[3/4] w-full">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Subtle gradient for text - NOT blurry */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Glassmorphism border overlay */}
                    <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none" />
                  </div>

                  {/* Card content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-white/90" />
                      <p className="font-outfit font-medium text-white text-sm">{dest.name}</p>
                    </div>
                    <p className="font-outfit text-xs text-white/70 ml-4.5">{dest.country}</p>
                  </div>

                  {/* Selected overlay */}
                  {destination === dest.name && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-primary/15 pointer-events-none"
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.main>

        {/* CTA BUTTON */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="shrink-0 pt-4"
        >
          <motion.div
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleContinue}
              disabled={!destination}
              className={`w-full h-12 rounded-full font-outfit text-base font-medium transition-smooth
                ${isValid 
                  ? "gradient-lavender-deep text-primary-foreground shadow-float hover:shadow-glow" 
                  : "bg-muted text-muted-foreground"
                }`}
            >
              {!destination 
                ? "Select a destination" 
                : !hasDates 
                  ? "Add travel dates to continue" 
                  : "Find Travel Buddies ✨"}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TravelScreen;
