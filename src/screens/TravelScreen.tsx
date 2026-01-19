import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, AlertCircle, Sparkles } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

const popularDestinations = [
  { 
    name: "Bali", 
    country: "Indonesia", 
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    funFact: "Home to over 10,000 temples"
  },
  { 
    name: "Tokyo", 
    country: "Japan", 
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    funFact: "More Michelin stars than any city"
  },
  { 
    name: "Paris", 
    country: "France", 
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    funFact: "Was once a Roman city called Lutetia"
  },
  { 
    name: "Barcelona", 
    country: "Spain", 
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80",
    funFact: "Has 9 UNESCO World Heritage Sites"
  },
  { 
    name: "New York", 
    country: "USA", 
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    funFact: "Over 800 languages spoken here"
  },
  { 
    name: "Santorini", 
    country: "Greece", 
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80",
    funFact: "Built on an ancient volcanic crater"
  },
];

// Floating animation keyframes for each card
const floatVariants = [
  { y: [0, -8, 0], duration: 5 },
  { y: [0, -12, 0], duration: 6.5 },
  { y: [0, -6, 0], duration: 4.5 },
  { y: [0, -10, 0], duration: 5.5 },
  { y: [0, -7, 0], duration: 6 },
  { y: [0, -9, 0], duration: 5.2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
      {/* Dreamy Lavender-Blue Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(255,50%,94%)] via-[hsl(265,45%,90%)] to-[hsl(220,50%,93%)]" />
      <div className="fixed inset-0 bg-gradient-to-t from-[hsl(270,40%,94%)]/70 via-transparent to-[hsl(250,45%,96%)]/50" />
      
      {/* Ambient Floating Orbs */}
      <motion.div 
        className="fixed top-16 right-8 w-72 h-72 rounded-full bg-[hsl(265,60%,85%)]/40 blur-[100px]"
        animate={{ 
          y: [0, -25, 0], 
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-32 -left-12 w-64 h-64 rounded-full bg-[hsl(220,55%,88%)]/50 blur-[90px]"
        animate={{ x: [0, 20, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[hsl(275,45%,90%)]/30 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Content */}
      <div className="relative z-10 px-5 pb-8">
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="pt-8 pb-4"
        >
          <motion.button
            onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-full glass-lavender shadow-glass flex items-center justify-center"
          >
            <ArrowLeft className="text-[hsl(270,45%,35%)] w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════
            UNIFIED HEADER: Title + Search + Calendar (Glass Box)
        ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`rounded-[28px] p-6 backdrop-blur-xl border shadow-glass-lg transition-colors duration-300 mb-8 ${
            showDateWarning && !hasDates 
              ? "bg-red-50/50 border-red-200/40" 
              : "glass-lavender"
          }`}
        >
          {/* Hero Title */}
          <div className="text-center mb-5">
            <h1 className="font-display text-3xl font-semibold text-[hsl(270,40%,20%)] tracking-tight mb-1">
              Where to next?
            </h1>
            <p className="font-outfit text-[hsl(270,25%,55%)] text-sm">
              Discover your next adventure
            </p>
          </div>

          {/* Unified Search Bar */}
          <div className="mb-4">
            {mapsLoading ? (
              <div className="h-12 rounded-2xl bg-white/50 flex items-center px-4 border border-white/50">
                <Loader2 className="animate-spin text-[hsl(270,50%,55%)]" size={18} />
                <span className="ml-3 font-outfit text-[hsl(270,30%,50%)] text-sm">Loading maps…</span>
              </div>
            ) : apiKey ? (
              <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
            ) : (
              <div 
                className={`flex items-center h-12 rounded-2xl bg-white/60 border transition-all duration-200 ${
                  isFocused 
                    ? "border-[hsl(270,55%,70%)] shadow-[0_0_0_3px_rgba(167,139,250,0.12)]" 
                    : "border-white/50"
                }`}
              >
                <Search className="ml-4 w-5 h-5 text-[hsl(270,40%,55%)]" />
                <Input
                  placeholder="Search destination..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 h-full bg-transparent border-0 text-[hsl(270,40%,20%)] placeholder:text-[hsl(270,25%,60%)] font-outfit text-sm pl-2 pr-4 focus:ring-0 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Compact Calendar Section */}
          <div className="rounded-xl bg-white/40 border border-white/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[hsl(270,50%,55%)]" />
              <span className="font-outfit text-xs font-medium text-[hsl(270,35%,45%)] uppercase tracking-wider">
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
                className="h-10 rounded-xl bg-white/60 border border-white/50 text-[hsl(270,40%,25%)] font-outfit text-sm focus:border-[hsl(270,55%,65%)] focus:ring-0 [color-scheme:light]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setShowDateWarning(false);
                }}
                placeholder="End"
                className="h-10 rounded-xl bg-white/60 border border-white/50 text-[hsl(270,40%,25%)] font-outfit text-sm focus:border-[hsl(270,55%,65%)] focus:ring-0 [color-scheme:light]"
              />
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            FLOATING DESTINATION CARDS - Self-Animating, Playful Hover
        ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-28"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[hsl(270,50%,55%)]" />
            <p className="font-outfit text-xs font-semibold text-[hsl(270,30%,50%)] uppercase tracking-wider">
              Popular Destinations
            </p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-5"
          >
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                variants={cardVariants}
                onClick={() => setDestination(dest.name)}
                onMouseEnter={() => setHoveredCard(dest.name)}
                onMouseLeave={() => setHoveredCard(null)}
                animate={{
                  y: hoveredCard === dest.name ? -12 : floatVariants[index].y,
                }}
                transition={
                  hoveredCard === dest.name 
                    ? { duration: 0.3, ease: "easeOut" }
                    : { 
                        duration: floatVariants[index].duration, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: index * 0.5
                      }
                }
                className={`relative rounded-[22px] overflow-hidden text-left aspect-[3/4] group cursor-pointer
                  ${destination === dest.name
                    ? "ring-[3px] ring-[hsl(270,65%,60%)]"
                    : ""
                  }`}
                style={{ 
                  marginTop: index % 2 === 1 ? '24px' : '0px',
                  boxShadow: hoveredCard === dest.name 
                    ? '0 25px 60px -12px rgba(139,92,246,0.35), 0 0 40px rgba(167,139,250,0.2)' 
                    : '0 12px 40px -10px rgba(0,0,0,0.15)'
                }}
              >
                {/* Sharp Image */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Default Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(270,25%,8%)]/70 via-[hsl(270,20%,12%)]/20 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
                
                {/* Hover Overlay with Fun Fact */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === dest.name ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-[hsl(270,50%,20%)]/85 via-[hsl(270,45%,25%)]/60 to-[hsl(270,40%,30%)]/30 flex flex-col justify-end p-4"
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ 
                      y: hoveredCard === dest.name ? 0 : 10, 
                      opacity: hoveredCard === dest.name ? 1 : 0 
                    }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="font-display text-white text-xl font-semibold mb-0.5">{dest.name}</p>
                    <p className="font-outfit text-white/80 text-xs mb-3">{dest.country}</p>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <p className="font-outfit text-white/95 text-[11px] leading-relaxed">
                        ✨ {dest.funFact}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
                
                {/* Default Content (visible when not hovered) */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-4"
                  animate={{ opacity: hoveredCard === dest.name ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-outfit font-semibold text-white text-[15px] leading-tight">{dest.name}</p>
                      <p className="font-outfit text-[11px] text-white/75">{dest.country}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Glass Border */}
                <div className="absolute inset-0 rounded-[22px] border border-white/20 pointer-events-none" />

                {/* Selected Glow */}
                {destination === dest.name && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[hsl(270,65%,60%)]/15 pointer-events-none"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            FLOATING CTA BUTTON
        ══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[hsl(265,45%,94%)] via-[hsl(265,45%,94%)]/95 to-transparent z-20"
        >
          <motion.div
            whileHover={isValid ? { scale: 1.02, y: -3 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleContinue}
              disabled={!destination}
              className={`w-full h-14 rounded-2xl font-outfit text-[15px] font-semibold transition-all duration-300
                ${isValid 
                  ? "gradient-lavender-deep text-white shadow-float hover:shadow-glow" 
                  : "bg-white/60 backdrop-blur-sm text-[hsl(270,30%,50%)] border border-white/50"
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
