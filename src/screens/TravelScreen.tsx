import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

/* ---------------- DESTINATIONS ---------------- */

const DESTINATIONS = [
  {
    name: "Swiss Alps",
    country: "Switzerland",
    tagline: "Where peaks touch the sky",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=90",
  },
  {
    name: "Bali",
    country: "Indonesia",
    tagline: "Island of the gods",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=90",
  },
  {
    name: "Patagonia",
    country: "Argentina",
    tagline: "The end of the world",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=90",
  },
  {
    name: "Kyoto",
    country: "Japan",
    tagline: "Where tradition breathes",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=90",
  },
  {
    name: "Santorini",
    country: "Greece",
    tagline: "Dreams painted in white and blue",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=90",
  },
];

/* ---------------- BACKGROUND IMAGES ---------------- */

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85", // Mountains
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=85", // Forest
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=85", // Lake
];

/* ---------------- COMPONENT ---------------- */

export default function TravelScreen() {
  const { setScreen, setTravelDetails } = useAppStore();
  const { apiKey, loading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDates, setShowDates] = useState(false);

  const [index, setIndex] = useState(0);
  const active = DESTINATIONS[index];

  /* ---- AUTO CHANGE DESTINATION ---- */
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const canProceed = destination && startDate && endDate;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* ---------- FULL-SCREEN NATURE BACKGROUND ---------- */}
      <div className="fixed inset-0 -z-10">
        <img
          src={BACKGROUNDS[0]}
          alt="Nature background"
          className="h-full w-full object-cover"
        />
        {/* Soft blue + lavender gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,80%,95%)]/80 via-[hsl(220,80%,92%)]/70 to-[hsl(260,60%,90%)]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,60%,85%)]/40 to-transparent" />
      </div>

      {/* ---------- BACK BUTTON (Outside glass box) ---------- */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setScreen("profile")}
        className="absolute top-6 left-6 z-50 h-11 w-11 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 hover:bg-background/80 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </motion.button>

      {/* ---------- CENTERED GLASS BOX ---------- */}
      <div className="flex items-center justify-center h-full px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-background/40 backdrop-blur-xl rounded-[28px] border border-white/40 shadow-2xl overflow-hidden"
        >
          {/* ---- Inner Content ---- */}
          <div className="p-6 space-y-5">
            {/* ---- Header Text ---- */}
            <div className="text-center space-y-1">
              <h1 className="font-serif text-2xl text-foreground tracking-tight">
                Where to next?
              </h1>
              <p className="text-sm text-muted-foreground">
                Let the destination find you
              </p>
            </div>

            {/* ---- Search Bar with Calendar Icon ---- */}
            <div className="relative">
              {loading ? (
                <div className="h-12 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : apiKey ? (
                <div className="relative">
                  <GoogleMapsDestinationPicker 
                    apiKey={apiKey} 
                    value={destination} 
                    onChange={setDestination} 
                  />
                  <button 
                    onClick={() => setShowDates((v) => !v)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-accent/50 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search destinations..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-12 rounded-2xl bg-background/60 backdrop-blur-sm pl-11 pr-12 border-white/30 placeholder:text-muted-foreground/60 focus:border-primary/50"
                  />
                  <button 
                    onClick={() => setShowDates((v) => !v)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-accent/50 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* ---- Date Picker (Compact) ---- */}
            <AnimatePresence>
              {showDates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="h-11 rounded-xl bg-background/60 backdrop-blur-sm border-white/30 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="h-11 rounded-xl bg-background/60 backdrop-blur-sm border-white/30 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- ONE Destination Card ---- */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onClick={() => setDestination(active.name)}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl group cursor-pointer"
                >
                  {/* Sharp Image */}
                  <img
                    src={active.image}
                    alt={active.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/20 to-transparent" />
                  
                  {/* Destination Info */}
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 p-5 text-white"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="font-serif text-xl font-medium">{active.name}</span>
                    </div>
                    <p className="text-sm text-white/80">{active.country}</p>
                    <p className="text-xs text-white/60 mt-2 italic">{active.tagline}</p>
                  </motion.div>

                  {/* Tap hint */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to select
                  </div>
                </motion.button>
              </AnimatePresence>

              {/* Progress Dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {DESTINATIONS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index 
                        ? "w-6 bg-primary" 
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ---- CTA Button ---- */}
            <Button
              onClick={() => {
                if (canProceed) {
                  setTravelDetails({ destination, startDate, endDate });
                } else if (!showDates) {
                  setShowDates(true);
                }
              }}
              disabled={showDates && !canProceed}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {!showDates ? "Select Dates" : canProceed ? "Find Travel Buddies" : "Select destination & dates"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
