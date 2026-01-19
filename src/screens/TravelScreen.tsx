import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, Sparkles } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

const popularDestinations = [
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800" },
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800" },
  { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800" },
  { name: "New York", country: "USA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800" },
  { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800" },
];

// Staggered card offsets for floating effect
const cardOffsets = [0, 24, 8, 32, 16, 12];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
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

  const isValid = destination && startDate && endDate;

  const handleContinue = () => {
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden bg-[hsl(260,30%,15%)]">
      {/* DREAMY NATURE BACKGROUND */}
      <div className="fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600"
          alt="Mountain landscape"
          className="w-full h-full object-cover brightness-[0.85] saturate-[0.9]"
        />
        {/* Soft lavender gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(270,40%,60%,0.35)] via-[hsl(260,35%,50%,0.25)] to-[hsl(250,30%,20%,0.6)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(280,40%,70%,0.15)] to-transparent" />
        
        {/* Floating ethereal orbs */}
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 rounded-full bg-[hsl(270,50%,80%,0.15)] blur-3xl"
          animate={{ 
            y: [0, -20, 0], 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 left-5 w-40 h-40 rounded-full bg-[hsl(280,45%,75%,0.12)] blur-3xl"
          animate={{ 
            y: [0, 15, 0], 
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 px-5 pt-10 flex items-center gap-4"
      >
        <motion.button
          onClick={() => setScreen("profile")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-full bg-[hsl(270,30%,90%,0.15)] backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)]"
        >
          <ArrowLeft className="text-white/90 w-5 h-5" />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white/95 tracking-tight">Where to next?</h1>
          {!hasCompletedProfile && (
            <p className="text-sm text-[hsl(270,40%,85%,0.8)]">Step 2 of 2</p>
          )}
        </div>

        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="text-[hsl(270,50%,85%,0.9)] w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* SCROLLABLE CONTENT */}
      <div className="relative z-10 px-5 pb-36 pt-6 overflow-y-auto h-[calc(100%-80px)] scrollbar-hide">
        
        {/* GLASS SEARCH BAR */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          {mapsLoading ? (
            <div className="h-14 rounded-full bg-[hsl(270,30%,90%,0.12)] backdrop-blur-[16px] border border-white/10 flex items-center px-6 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Loader2 className="animate-spin text-[hsl(270,50%,85%)]" />
              <span className="ml-3 text-white/60">Loading maps…</span>
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
          ) : (
            <motion.div 
              className={`relative rounded-full transition-all duration-500 ${
                isFocused 
                  ? "shadow-[0_12px_40px_-8px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]" 
                  : "shadow-[0_8px_32px_-8px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
              }`}
            >
              <Input
                placeholder="Where do you want to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="h-14 rounded-full bg-[hsl(270,30%,90%,0.12)] backdrop-blur-[16px] border border-white/10 text-white placeholder:text-white/50 pl-6 pr-14 text-base focus:border-[hsl(270,50%,75%,0.4)] focus:ring-0 focus:ring-offset-0"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[hsl(270,40%,70%,0.3)] backdrop-blur-sm flex items-center justify-center border border-white/10"
              >
                <Search className="w-4 h-4 text-white/90" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* FLOATING DESTINATION CARDS - STAGGERED MASONRY */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="columns-2 gap-5"
        >
          {popularDestinations.map((dest, index) => (
            <motion.button
              key={dest.name}
              variants={cardVariants}
              onClick={() => setDestination(dest.name)}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: index < 2 ? 0 : cardOffsets[index] }}
              className={`relative w-full break-inside-avoid mb-5 rounded-[20px] overflow-hidden text-left transition-all duration-500
                ${destination === dest.name
                  ? "ring-2 ring-[hsl(270,50%,80%,0.6)] shadow-[0_25px_60px_-15px_rgba(139,92,246,0.5)]"
                  : "shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]"
                }`}
            >
              {/* Glassmorphism card overlay */}
              <div className="absolute inset-0 bg-[hsl(270,30%,90%,0.05)] backdrop-blur-[2px] z-[1] pointer-events-none" />
              
              {/* DESTINATION IMAGE */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <motion.img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>

              {/* LAVENDER GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(270,30%,15%,0.85)] via-[hsl(270,25%,20%,0.3)] to-transparent z-[2]" />

              {/* CARD CONTENT */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-[3]">
                <div className="flex items-center gap-2 mb-0.5">
                  <MapPin className="w-4 h-4 text-[hsl(270,50%,85%)]" />
                  <p className="text-white font-semibold text-base">{dest.name}</p>
                </div>
                <p className="text-sm text-[hsl(270,40%,85%,0.7)] ml-6">{dest.country}</p>
              </div>

              {/* Selected indicator glow */}
              {destination === dest.name && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[hsl(270,50%,70%,0.1)] z-[1] pointer-events-none"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* FLOATING GLASS DATE PICKER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 p-6 rounded-3xl bg-[hsl(270,30%,90%,0.1)] backdrop-blur-[14px] border border-white/10 shadow-[0_20px_50px_-15px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[hsl(270,50%,85%)]" />
            <span className="text-white/90 font-medium">Travel Dates</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-xs text-[hsl(270,40%,85%,0.7)] mb-1.5 block">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 rounded-2xl bg-[hsl(270,30%,90%,0.1)] backdrop-blur-sm border border-white/10 text-white focus:border-[hsl(270,50%,75%,0.4)] focus:ring-0 [color-scheme:dark]"
              />
            </div>
            <div className="relative">
              <label className="text-xs text-[hsl(270,40%,85%,0.7)] mb-1.5 block">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 rounded-2xl bg-[hsl(270,30%,90%,0.1)] backdrop-blur-sm border border-white/10 text-white focus:border-[hsl(270,50%,75%,0.4)] focus:ring-0 [color-scheme:dark]"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* FLOATING CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[hsl(270,30%,15%,0.95)] via-[hsl(270,25%,20%,0.8)] to-transparent z-10"
      >
        <motion.div
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          <Button
            disabled={!isValid}
            onClick={handleContinue}
            className={`w-full h-14 rounded-full text-lg font-medium transition-all duration-500 border-0
              ${isValid 
                ? "bg-gradient-to-r from-[hsl(270,50%,65%)] via-[hsl(280,45%,70%)] to-[hsl(270,50%,65%)] text-white shadow-[0_12px_40px_-8px_rgba(139,92,246,0.5)] hover:shadow-[0_16px_50px_-8px_rgba(139,92,246,0.6)]" 
                : "bg-[hsl(270,20%,50%,0.3)] text-white/50"
              }`}
          >
            {isValid ? "Find Travel Buddies ✨" : "Select destination & dates"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TravelScreen;
