import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Search, X } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

const popularDestinations = [
  { 
    name: "Bali", 
    country: "Indonesia", 
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85",
    funFact: "Home to over 10,000 temples"
  },
  { 
    name: "Tokyo", 
    country: "Japan", 
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=85",
    funFact: "More Michelin stars than any city"
  },
  { 
    name: "Paris", 
    country: "France", 
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85",
    funFact: "Was once a Roman city called Lutetia"
  },
  { 
    name: "Barcelona", 
    country: "Spain", 
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=85",
    funFact: "Has 9 UNESCO World Heritage Sites"
  },
  { 
    name: "New York", 
    country: "USA", 
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=85",
    funFact: "Over 800 languages spoken here"
  },
  { 
    name: "Santorini", 
    country: "Greece", 
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=85",
    funFact: "Built on an ancient volcanic crater"
  },
];

// Organic floating motion for each card
const floatConfigs = [
  { yRange: [-6, 6], xRange: [-3, 3], duration: 7 },
  { yRange: [-8, 8], xRange: [2, -2], duration: 8.5 },
  { yRange: [-5, 5], xRange: [-2, 2], duration: 6 },
  { yRange: [-7, 7], xRange: [3, -3], duration: 9 },
  { yRange: [-4, 4], xRange: [-1, 1], duration: 5.5 },
  { yRange: [-6, 6], xRange: [2, -2], duration: 7.5 },
];

const TravelScreen = () => {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading: mapsLoading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const hasDates = startDate && endDate;
  const isValid = destination && hasDates;

  const handleContinue = () => {
    if (!hasDates) {
      setShowCalendar(true);
      return;
    }
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return null;
    const format = (d: string) => {
      if (!d) return "...";
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    return `${format(startDate)} → ${format(endDate)}`;
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Dreamy Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(250,55%,95%)] via-[hsl(260,50%,92%)] to-[hsl(265,45%,88%)]" />
      
      {/* Ambient Light Orbs */}
      <motion.div 
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(260,60%,88%)]/50 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[hsl(220,55%,90%)]/60 blur-[100px]"
        animate={{ x: [-20, 20, -20], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Content */}
      <div className="relative z-10 h-[100dvh] flex flex-col">
        
        {/* ═══════════════════════════════════════════════════════════════════
            TOP NAV
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-5 pt-6 pb-2">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="text-[hsl(270,40%,30%)] w-5 h-5" />
          </motion.button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION - Emotional & Aspirational
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 px-6 pt-4 pb-6 text-center"
        >
          <h1 className="font-display text-[2.5rem] leading-tight font-semibold text-[hsl(270,35%,18%)] mb-2">
            Where to next?
          </h1>
          <p className="font-outfit text-[hsl(270,25%,50%)] text-base">
            Let the adventure find you
          </p>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            ONE FLOATING SEARCH BAR (Search + Calendar Trigger)
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-shrink-0 px-5 pb-5"
        >
          <div 
            className={`flex items-center h-14 rounded-full bg-white/50 backdrop-blur-xl transition-all duration-300 ${
              searchFocused ? "shadow-[0_8px_40px_-10px_rgba(139,92,246,0.3)]" : "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]"
            }`}
          >
            <Search className="ml-5 w-5 h-5 text-[hsl(270,35%,50%)] flex-shrink-0" />
            
            {/* Destination Input */}
            <div className="flex-1 px-3">
              {mapsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin text-[hsl(270,50%,55%)] mr-2" size={16} />
                  <span className="font-outfit text-[hsl(270,30%,55%)] text-sm">Loading…</span>
                </div>
              ) : apiKey ? (
                <GoogleMapsDestinationPicker 
                  apiKey={apiKey} 
                  value={destination} 
                  onChange={setDestination}
                />
              ) : (
                <Input
                  placeholder="Search destination..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="bg-transparent border-0 text-[hsl(270,35%,18%)] placeholder:text-[hsl(270,25%,55%)] font-outfit text-[15px] h-full focus:ring-0 focus:outline-none p-0"
                />
              )}
            </div>

            {/* Calendar Trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCalendar(!showCalendar)}
              className={`mr-2 h-10 rounded-full flex items-center gap-2 px-4 transition-colors ${
                hasDates 
                  ? "bg-[hsl(270,55%,60%)] text-white" 
                  : "bg-[hsl(270,40%,92%)] text-[hsl(270,35%,40%)]"
              }`}
            >
              <Calendar className="w-4 h-4" />
              {formatDateRange() && (
                <span className="font-outfit text-xs font-medium whitespace-nowrap">
                  {formatDateRange()}
                </span>
              )}
            </motion.button>
          </div>

          {/* Expandable Calendar (Hidden by default) */}
          <motion.div
            initial={false}
            animate={{ 
              height: showCalendar ? "auto" : 0,
              opacity: showCalendar ? 1 : 0,
              marginTop: showCalendar ? 12 : 0
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 backdrop-blur-xl">
              <div className="flex-1">
                <p className="font-outfit text-[10px] text-[hsl(270,30%,50%)] uppercase tracking-wider mb-1">From</p>
                <input
                  ref={startDateRef}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/60 rounded-xl h-10 px-3 font-outfit text-sm text-[hsl(270,35%,25%)] border-0 focus:ring-2 focus:ring-[hsl(270,50%,70%)] [color-scheme:light]"
                />
              </div>
              <div className="flex-1">
                <p className="font-outfit text-[10px] text-[hsl(270,30%,50%)] uppercase tracking-wider mb-1">To</p>
                <input
                  ref={endDateRef}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/60 rounded-xl h-10 px-3 font-outfit text-sm text-[hsl(270,35%,25%)] border-0 focus:ring-2 focus:ring-[hsl(270,50%,70%)] [color-scheme:light]"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCalendar(false)}
                className="w-8 h-8 rounded-full bg-[hsl(270,30%,85%)] flex items-center justify-center mt-4"
              >
                <X className="w-4 h-4 text-[hsl(270,35%,40%)]" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            FLOATING DESTINATION CARDS - Living, Breathing, No Boxes
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex-1 overflow-hidden relative px-4"
        >
          <div className="grid grid-cols-2 gap-4 pb-24">
            {popularDestinations.map((dest, index) => (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  ...(hoveredCard !== dest.name && {
                    y: floatConfigs[index].yRange,
                    x: floatConfigs[index].xRange,
                  })
                }}
                transition={
                  hoveredCard === dest.name 
                    ? { duration: 0.25 } 
                    : { 
                        opacity: { duration: 0.5, delay: index * 0.08 },
                        y: { duration: floatConfigs[index].duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: index * 0.3 },
                        x: { duration: floatConfigs[index].duration * 1.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: index * 0.5 }
                      }
                }
                onClick={() => setDestination(dest.name)}
                onMouseEnter={() => setHoveredCard(dest.name)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -10, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer group
                  ${destination === dest.name ? "ring-[3px] ring-[hsl(270,60%,60%)]" : ""}
                  ${index % 2 === 1 ? "mt-8" : ""}`}
                style={{
                  boxShadow: hoveredCard === dest.name 
                    ? '0 30px 60px -15px rgba(139,92,246,0.4), 0 0 50px rgba(167,139,250,0.15)' 
                    : '0 15px 40px -12px rgba(0,0,0,0.2)'
                }}
              >
                {/* Sharp Full-Bleed Image */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Subtle Gradient (Not Heavy) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Default State: Name + Country */}
                <motion.div 
                  className="absolute inset-0 flex flex-col justify-end p-4"
                  animate={{ opacity: hoveredCard === dest.name ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-white/80" />
                    <div>
                      <p className="font-outfit font-semibold text-white text-base leading-tight">{dest.name}</p>
                      <p className="font-outfit text-[11px] text-white/70">{dest.country}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Hover State: Fun Fact Overlay */}
                <motion.div 
                  className="absolute inset-0 flex flex-col justify-end p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === dest.name ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3">
                    <p className="font-display text-white text-lg font-semibold mb-0.5">{dest.name}</p>
                    <p className="font-outfit text-white/80 text-[11px] mb-2">{dest.country}</p>
                    <p className="font-outfit text-white/95 text-xs leading-relaxed">
                      ✨ {dest.funFact}
                    </p>
                  </div>
                </motion.div>

                {/* Selected Indicator */}
                {destination === dest.name && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[hsl(270,55%,55%)]" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            FLOATING CTA
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[hsl(265,45%,90%)] via-[hsl(265,45%,90%)]/90 to-transparent z-20 pointer-events-none"
        >
          <motion.div
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
            className="pointer-events-auto"
          >
            <Button
              onClick={handleContinue}
              disabled={!destination}
              className={`w-full h-14 rounded-full font-outfit text-[15px] font-semibold transition-all duration-300
                ${isValid 
                  ? "bg-[hsl(270,50%,55%)] text-white shadow-[0_15px_50px_-12px_rgba(139,92,246,0.5)]" 
                  : "bg-white/50 backdrop-blur-sm text-[hsl(270,30%,45%)]"
                }`}
            >
              {!destination 
                ? "Pick a destination" 
                : !hasDates 
                  ? "When are you going?" 
                  : "Find travel buddies"}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TravelScreen;
