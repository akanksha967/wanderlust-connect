import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, AlertCircle, ArrowRight } from "lucide-react";
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
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
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
    <div className="min-h-[100dvh] relative overflow-x-hidden overflow-y-auto">
      {/* SOFT LAVENDER-BLUE GRADIENT BACKGROUND */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(250,55%,92%)] via-[hsl(255,50%,88%)] to-[hsl(220,55%,91%)]" />
      <div className="fixed inset-0 bg-gradient-to-t from-[hsl(260,45%,92%)]/80 via-transparent to-[hsl(245,50%,95%)]/60" />
      
      {/* Ambient floating orbs */}
      <motion.div 
        className="fixed top-20 right-6 w-56 h-56 rounded-full bg-[hsl(255,65%,88%)]/50 blur-[80px]"
        animate={{ y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-40 left-0 w-48 h-48 rounded-full bg-[hsl(220,60%,90%)]/60 blur-[70px]"
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[hsl(270,50%,88%)]/30 blur-[90px]"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* MAIN CONTENT - Natural page scroll */}
      <div className="relative z-10 px-5 pb-8">
        
        {/* ═══════════════════════════════════════════════════════════════
            HERO SECTION - Large, calm, breathing space
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="pt-10 pb-6"
        >
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] mb-8"
          >
            <ArrowLeft className="text-[hsl(255,45%,35%)] w-5 h-5" />
          </motion.button>

          {/* Hero Title */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl font-bold text-[hsl(255,40%,22%)] tracking-tight mb-2">
              Where to next?
            </h1>
            <p className="font-outfit text-[hsl(255,25%,50%)] text-base">
              Find your perfect travel companion
            </p>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════
              UNIFIED SEARCH + CALENDAR GLASS PANEL
          ═══════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-3xl backdrop-blur-xl border shadow-[0_8px_40px_-12px_rgba(99,102,241,0.15)] transition-all duration-300 ${
              showDateWarning && !hasDates 
                ? "bg-red-50/60 border-red-200/50" 
                : "bg-white/50 border-white/60"
            }`}
          >
            {/* Search Bar */}
            <div className="p-4 pb-3">
              {mapsLoading ? (
                <div className="h-12 rounded-full bg-white/60 flex items-center px-4">
                  <Loader2 className="animate-spin text-[hsl(255,55%,55%)]" size={18} />
                  <span className="ml-3 font-outfit text-[hsl(255,30%,50%)] text-sm">Loading maps…</span>
                </div>
              ) : apiKey ? (
                <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
              ) : (
                <div 
                  className={`flex items-center h-12 rounded-full bg-white/70 border transition-all duration-200 ${
                    isFocused 
                      ? "border-[hsl(255,60%,70%)] shadow-[0_0_0_3px_rgba(139,92,246,0.1)]" 
                      : "border-white/60"
                  }`}
                >
                  <Search className="ml-4 w-5 h-5 text-[hsl(255,40%,55%)]" />
                  <Input
                    placeholder="Search destination..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="flex-1 h-full bg-transparent border-0 text-[hsl(255,40%,20%)] placeholder:text-[hsl(255,25%,60%)] font-outfit text-sm pl-2 pr-2 focus:ring-0 focus:outline-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mr-1 w-10 h-10 rounded-full bg-[hsl(235,75%,60%)] flex items-center justify-center shadow-md"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[hsl(255,40%,80%)]/50 to-transparent" />

            {/* Date Selection - Compact inline */}
            <div className="p-4 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[hsl(255,55%,55%)]" />
                <span className="font-outfit text-xs font-medium text-[hsl(255,35%,40%)] uppercase tracking-wide">
                  Travel Dates
                </span>
                {showDateWarning && !hasDates && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto flex items-center gap-1 text-red-500 text-xs font-medium"
                  >
                    <AlertCircle size={12} />
                    Required
                  </motion.span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setShowDateWarning(false);
                  }}
                  placeholder="Start"
                  className="h-10 rounded-xl bg-white/60 border border-white/50 text-[hsl(255,40%,25%)] font-outfit text-sm focus:border-[hsl(255,55%,65%)] focus:ring-0 [color-scheme:light]"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setShowDateWarning(false);
                  }}
                  placeholder="End"
                  className="h-10 rounded-xl bg-white/60 border border-white/50 text-[hsl(255,40%,25%)] font-outfit text-sm focus:border-[hsl(255,55%,65%)] focus:ring-0 [color-scheme:light]"
                />
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            FLOATING DESTINATION CARDS - No inner scroll
        ═══════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pb-24"
        >
          <p className="font-outfit text-xs font-semibold text-[hsl(255,30%,50%)] uppercase tracking-wider mb-4">
            Popular Destinations
          </p>
          
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
                onClick={() => setDestination(dest.name)}
                whileHover={{ 
                  y: -8, 
                  scale: 1.03,
                  boxShadow: "0 20px 50px -15px rgba(99,102,241,0.25)",
                  transition: { duration: 0.25 } 
                }}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-[20px] overflow-hidden text-left aspect-[3/4] group
                  ${destination === dest.name
                    ? "ring-[3px] ring-[hsl(255,70%,60%)] shadow-[0_15px_45px_-10px_rgba(99,102,241,0.35)]"
                    : "shadow-[0_10px_35px_-10px_rgba(0,0,0,0.12)]"
                  }`}
                style={{ 
                  marginTop: index % 2 === 1 ? `${(index * 8) % 32}px` : '0px' 
                }}
              >
                {/* SHARP Image */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                  loading="lazy"
                />
                
                {/* Subtle gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(255,30%,10%)]/65 via-[hsl(255,20%,15%)]/15 to-transparent" />
                
                {/* Glass border */}
                <div className="absolute inset-0 rounded-[20px] border border-white/20 pointer-events-none" />

                {/* Top badge */}
                <div className="absolute top-3 left-3">
                  <div className="w-7 h-7 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Card content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-outfit font-semibold text-white text-[15px] leading-tight mb-0.5">{dest.name}</p>
                  <p className="font-outfit text-[11px] text-white/75 tracking-wide">{dest.country}</p>
                </div>

                {/* Selected glow overlay */}
                {destination === dest.name && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[hsl(255,70%,60%)]/12 pointer-events-none"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            FLOATING CTA BUTTON
        ═══════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[hsl(255,50%,92%)] via-[hsl(255,50%,92%)]/95 to-transparent z-20"
        >
          <motion.div
            whileHover={isValid ? { scale: 1.02, y: -2 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleContinue}
              disabled={!destination}
              className={`w-full h-14 rounded-2xl font-outfit text-[15px] font-semibold transition-all duration-300
                ${isValid 
                  ? "bg-gradient-to-r from-[hsl(250,70%,55%)] via-[hsl(260,65%,58%)] to-[hsl(270,60%,55%)] text-white shadow-[0_12px_40px_-10px_rgba(139,92,246,0.5)] hover:shadow-[0_18px_50px_-10px_rgba(139,92,246,0.6)]" 
                  : "bg-white/60 backdrop-blur-sm text-[hsl(255,30%,50%)] border border-white/50"
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
