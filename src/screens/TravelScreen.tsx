import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";
import { useProfileSave } from "@/hooks/useProfileSave";

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
];

/* ---------------- COMPONENT ---------------- */

export default function TravelScreen() {
  const { setScreen, setTravelDetails } = useAppStore();
  const { apiKey, loading } = useGoogleMapsKey();
  const { saveTravelPlan, saving } = useProfileSave();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [index, setIndex] = useState(0);

  const active = DESTINATIONS[index];
  const canProceed = destination && startDate && endDate;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* ---------- FULLSCREEN NATURE BACKGROUND (FIXED) ---------- */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80')",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-violet-500/40" />
      <div className="fixed inset-0 backdrop-blur-sm" />

      {/* ---------- BACK BUTTON ---------- */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setScreen("profile")}
        className="absolute top-6 left-6 z-50 
          h-11 w-11 rounded-full 
          bg-white/40 backdrop-blur-md 
          border border-white/30 
          flex items-center justify-center
          shadow-lg"
      >
        <ArrowLeft className="h-5 w-5" />
      </motion.button>

      {/* ---------- CENTERED GLASS BOX ---------- */}
      <div className="flex items-center justify-center h-full px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md 
            rounded-[32px] 
            bg-white/30 
            backdrop-blur-2xl 
            border border-white/40 
            shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
        >
          <div className="p-6 space-y-5">
            {/* ---------- HEADER ---------- */}
            <div className="text-center space-y-1">
              <h1 className="font-serif text-2xl">Where to next?</h1>
              <p className="text-sm text-muted-foreground">Let the destination surprise you</p>
            </div>

            {/* ---------- DESTINATION INPUT ---------- */}
            {loading ? (
              <div className="h-12 rounded-2xl bg-white/40 flex items-center justify-center text-sm">Loading…</div>
            ) : apiKey ? (
              <div className="relative">
                <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
                <button
                  onClick={() => setShowDates((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/30"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                  placeholder="Search destinations..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 rounded-2xl bg-white/40 pl-11 pr-12"
                />
                <button
                  onClick={() => setShowDates((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ---------- DATE PICKER ---------- */}
            <AnimatePresence>
              {showDates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 gap-3 overflow-hidden"
                >
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---------- DESTINATION CARD ---------- */}
            <AnimatePresence mode="wait">
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.5 }}
                onClick={() => setDestination(active.name)}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl"
              >
                <img src={active.image} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-serif text-xl">{active.name}</span>
                  </div>
                  <p className="text-sm opacity-80">{active.country}</p>
                  <p className="text-xs opacity-60 italic mt-1">{active.tagline}</p>
                </div>
              </motion.button>
            </AnimatePresence>

            {/* ---------- CTA ---------- */}
            <Button
              onClick={async () => {
                if (canProceed && !saving) {
                  const success = await saveTravelPlan({ destination, startDate, endDate });
                  if (success) {
                    setTravelDetails({ destination, startDate, endDate });
                    setScreen("swipe");
                  }
                } else if (!showDates) {
                  setShowDates(true);
                }
              }}
              disabled={(showDates && !canProceed) || saving}
              className="w-full h-12 rounded-2xl 
                bg-gradient-to-r from-indigo-400 via-blue-400 to-violet-400
                hover:from-indigo-500 hover:via-blue-500 hover:to-violet-500
                text-white font-medium transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : !showDates ? "Pick your travel dates" : canProceed ? "Continue your journey" : "Almost there…"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
