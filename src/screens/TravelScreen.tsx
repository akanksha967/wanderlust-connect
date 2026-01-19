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
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
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
      {/* LIGHT PASTEL GRADIENT BACKGROUND */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#e6e1ff] via-[#d4d0f7] to-[#c7d2fe]" />
      <div className="fixed inset-0 bg-gradient-to-tr from-[#bae6fd]/30 via-transparent to-[#e0e7ff]/40" />
      
      {/* Soft floating orbs */}
      <motion.div 
        className="fixed top-16 right-8 w-40 h-40 rounded-full bg-[#c7d2fe]/50 blur-3xl"
        animate={{ 
          y: [0, -15, 0], 
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-32 left-4 w-48 h-48 rounded-full bg-[#bae6fd]/40 blur-3xl"
        animate={{ 
          y: [0, 12, 0], 
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="fixed top-1/3 left-1/3 w-32 h-32 rounded-full bg-[#e0e7ff]/50 blur-2xl"
        animate={{ 
          x: [0, 10, 0], 
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 px-4 pt-10 pb-4 flex items-center gap-3"
      >
        <motion.button
          onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-11 h-11 rounded-full bg-white/40 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)]"
        >
          <ArrowLeft className="text-[#4f46e5] w-5 h-5" />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[#3730a3] tracking-tight">Where to next?</h1>
          {!hasCompletedProfile && (
            <p className="text-sm text-[#6366f1]/70">Step 2 of 2</p>
          )}
        </div>
      </motion.div>

      {/* SCROLLABLE CONTENT */}
      <div className="relative z-10 px-4 pb-32 pt-2 overflow-y-auto h-[calc(100%-90px)] scrollbar-hide">
        
        {/* GLASS SEARCH BAR */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-5"
        >
          {mapsLoading ? (
            <div className="h-12 rounded-full bg-white/50 backdrop-blur-[16px] border border-white/60 flex items-center px-5 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)]">
              <Loader2 className="animate-spin text-[#6366f1]" size={18} />
              <span className="ml-3 text-[#6366f1]/60 text-sm">Loading maps…</span>
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
          ) : (
            <motion.div 
              className={`relative rounded-full transition-all duration-400 ${
                isFocused 
                  ? "shadow-[0_8px_30px_-8px_rgba(99,102,241,0.3)]" 
                  : "shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)]"
              }`}
            >
              <Input
                placeholder="Where do you want to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="h-12 rounded-full bg-white/50 backdrop-blur-[16px] border border-white/60 text-[#3730a3] placeholder:text-[#6366f1]/50 pl-5 pr-12 text-sm focus:border-[#a5b4fc] focus:ring-0 focus:ring-offset-0"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#6366f1]/20 backdrop-blur-sm flex items-center justify-center border border-[#a5b4fc]/40"
              >
                <Search className="w-4 h-4 text-[#4f46e5]" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* COMPACT DESTINATION CARDS - TWO COLUMN GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 mb-5"
        >
          {popularDestinations.map((dest) => (
            <motion.button
              key={dest.name}
              variants={cardVariants}
              onClick={() => setDestination(dest.name)}
              whileHover={{ 
                y: -4, 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative w-full rounded-[20px] overflow-hidden text-left transition-all duration-400
                ${destination === dest.name
                  ? "ring-2 ring-[#6366f1]/60 shadow-[0_12px_32px_-8px_rgba(99,102,241,0.4)]"
                  : "shadow-[0_8px_24px_-8px_rgba(99,102,241,0.2)]"
                }`}
            >
              {/* Glassmorphism card background */}
              <div className="absolute inset-0 bg-white/[0.18] backdrop-blur-[16px] z-[1]" />
              <div className="absolute inset-0 border border-white/30 rounded-[20px] z-[4] pointer-events-none" />
              
              {/* FIXED ASPECT RATIO IMAGE CONTAINER */}
              <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ maxHeight: '240px' }}>
                <motion.img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                
                {/* Soft gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/70 via-[#312e81]/20 to-transparent z-[2]" />
              </div>

              {/* CARD CONTENT */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-white/80" />
                  <p className="text-white font-medium text-sm">{dest.name}</p>
                </div>
                <p className="text-xs text-white/60 ml-5">{dest.country}</p>
              </div>

              {/* Selected indicator */}
              {destination === dest.name && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#6366f1]/10 z-[1] pointer-events-none"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* FLOATING GLASS DATE PICKER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`p-5 rounded-[24px] bg-white/40 backdrop-blur-[14px] border transition-all duration-300 ${
            showDateWarning && !hasDates 
              ? "border-red-300 shadow-[0_8px_30px_-8px_rgba(239,68,68,0.25)]" 
              : "border-white/50 shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4f46e5]" />
              <span className="text-[#3730a3] font-medium text-sm">Travel Dates</span>
            </div>
            {showDateWarning && !hasDates && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 text-red-500"
              >
                <AlertCircle size={14} />
                <span className="text-xs font-medium">Required</span>
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6366f1]/60 mb-1 block">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setShowDateWarning(false);
                }}
                className="h-11 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 text-[#3730a3] text-sm focus:border-[#a5b4fc] focus:ring-0 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6366f1]/60 mb-1 block">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setShowDateWarning(false);
                }}
                className="h-11 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 text-[#3730a3] text-sm focus:border-[#a5b4fc] focus:ring-0 [color-scheme:light]"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* FLOATING CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#e0e7ff] via-[#e0e7ff]/90 to-transparent z-10"
      >
        <motion.div
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.97 } : {}}
        >
          <Button
            onClick={handleContinue}
            disabled={!destination}
            className={`w-full h-13 rounded-full text-base font-medium transition-all duration-400 border-0
              ${isValid 
                ? "bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#6366f1] text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.5)] hover:shadow-[0_14px_40px_-8px_rgba(99,102,241,0.6)]" 
                : "bg-[#a5b4fc]/50 text-[#4f46e5]/60"
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
  );
};

export default TravelScreen;
