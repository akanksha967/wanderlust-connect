import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, AlertCircle, ArrowRight, Wifi } from "lucide-react";
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

// Staggered heights for masonry effect (like reference image)
const cardHeights = ["h-[280px]", "h-[220px]", "h-[260px]", "h-[200px]", "h-[240px]", "h-[270px]"];
const cardOffsets = ["mt-0", "mt-8", "mt-4", "mt-12", "mt-2", "mt-6"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
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
    <div className="h-[100dvh] relative overflow-hidden">
      {/* SOFT LAVENDER-BLUE GRADIENT BACKGROUND (like reference) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(250,60%,88%)] via-[hsl(260,50%,85%)] to-[hsl(220,60%,90%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(250,50%,92%)]/50 via-transparent to-[hsl(270,40%,88%)]/60" />
      
      {/* Subtle animated orbs */}
      <motion.div 
        className="absolute top-16 right-8 w-48 h-48 rounded-full bg-[hsl(250,70%,85%)]/40 blur-3xl"
        animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-32 left-4 w-40 h-40 rounded-full bg-[hsl(220,70%,88%)]/50 blur-3xl"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-5 pt-8 pb-2 shrink-0"
        >
          <motion.button
            onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg mb-4"
          >
            <ArrowLeft className="text-[hsl(250,50%,40%)] w-5 h-5" />
          </motion.button>

          {/* Title & Subtitle */}
          <h1 className="font-display text-3xl font-bold text-[hsl(250,40%,25%)] tracking-tight mb-1">
            Travel
          </h1>
          <p className="font-outfit text-[hsl(250,30%,45%)] text-sm leading-relaxed">
            Discover amazing destinations and find your perfect travel companion
          </p>
        </motion.header>

        {/* GLASSMORPHIC SEARCH BAR (like reference) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-5 mb-4 shrink-0"
        >
          {mapsLoading ? (
            <div className="h-14 rounded-full bg-white/50 backdrop-blur-xl border border-white/60 flex items-center px-5 shadow-xl">
              <Loader2 className="animate-spin text-[hsl(250,60%,55%)]" size={20} />
              <span className="ml-3 font-outfit text-[hsl(250,30%,50%)] text-sm">Loading maps…</span>
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
          ) : (
            <motion.div 
              className={`relative rounded-full transition-all duration-300 ${
                isFocused 
                  ? "shadow-[0_8px_40px_-8px_rgba(99,102,241,0.35)]" 
                  : "shadow-xl"
              }`}
            >
              <div className="flex items-center h-14 rounded-full bg-white/60 backdrop-blur-xl border border-white/70">
                <Search className="ml-5 w-5 h-5 text-[hsl(250,40%,55%)]" />
                <Input
                  placeholder="Inspire travel now..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 h-full bg-transparent border-0 text-[hsl(250,40%,25%)] placeholder:text-[hsl(250,30%,55%)] font-outfit text-base pl-3 pr-4 focus:ring-0 focus:outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mr-1.5 w-11 h-11 rounded-full bg-[hsl(230,80%,60%)] flex items-center justify-center shadow-lg"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* FLOATING DATE PICKER PANEL */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className={`mx-5 mb-4 p-4 rounded-2xl shrink-0 transition-all duration-300 ${
            showDateWarning && !hasDates 
              ? "bg-red-50/80 backdrop-blur-lg border border-red-200/60" 
              : "bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[hsl(250,60%,55%)]" />
              <span className="font-outfit text-sm font-semibold text-[hsl(250,40%,30%)]">Travel Dates</span>
            </div>
            {showDateWarning && !hasDates && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 text-red-500"
              >
                <AlertCircle size={14} />
                <span className="text-xs font-medium font-outfit">Required</span>
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-outfit text-xs text-[hsl(250,30%,50%)] mb-1.5 block font-medium">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setShowDateWarning(false);
                }}
                className="h-11 rounded-xl bg-white/60 backdrop-blur-sm border border-white/60 text-[hsl(250,40%,25%)] font-outfit text-sm focus:border-[hsl(250,60%,70%)] focus:ring-0 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="font-outfit text-xs text-[hsl(250,30%,50%)] mb-1.5 block font-medium">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setShowDateWarning(false);
                }}
                className="h-11 rounded-xl bg-white/60 backdrop-blur-sm border border-white/60 text-[hsl(250,40%,25%)] font-outfit text-sm focus:border-[hsl(250,60%,70%)] focus:ring-0 [color-scheme:light]"
              />
            </div>
          </div>
        </motion.div>

        {/* DESTINATION CARDS - Staggered Masonry Layout (like reference) */}
        <div className="flex-1 overflow-y-auto px-5 pb-28 scrollbar-hide">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                variants={cardVariants}
                onClick={() => setDestination(dest.name)}
                whileHover={{ 
                  y: -6, 
                  scale: 1.02,
                  transition: { duration: 0.3 } 
                }}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-[24px] overflow-hidden text-left group ${cardHeights[index]} ${cardOffsets[index]}
                  ${destination === dest.name
                    ? "ring-2 ring-[hsl(250,70%,60%)] shadow-[0_12px_40px_-8px_rgba(99,102,241,0.4)]"
                    : "shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)]"
                  }`}
              >
                {/* SHARP Image - No blur */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Subtle gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(250,40%,15%)]/70 via-[hsl(250,30%,20%)]/20 to-transparent" />
                
                {/* Glass border effect */}
                <div className="absolute inset-0 rounded-[24px] border border-white/25 pointer-events-none" />

                {/* Top decorative elements (like reference) */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Wifi className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Card content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-outfit font-semibold text-white text-base mb-0.5">{dest.name}</p>
                  <p className="font-outfit text-xs text-white/70">{dest.country}</p>
                </div>

                {/* Selected overlay */}
                {destination === dest.name && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[hsl(250,70%,60%)]/15 pointer-events-none"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* FLOATING CTA BUTTON */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[hsl(260,50%,90%)] via-[hsl(260,50%,90%)]/90 to-transparent"
        >
          <motion.div
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleContinue}
              disabled={!destination}
              className={`w-full h-14 rounded-full font-outfit text-base font-semibold transition-all duration-300
                ${isValid 
                  ? "bg-gradient-to-r from-[hsl(250,70%,55%)] via-[hsl(260,65%,60%)] to-[hsl(250,70%,55%)] text-white shadow-[0_12px_35px_-8px_rgba(99,102,241,0.5)] hover:shadow-[0_16px_45px_-8px_rgba(99,102,241,0.6)]" 
                  : "bg-white/50 backdrop-blur-sm text-[hsl(250,30%,50%)] border border-white/60"
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
