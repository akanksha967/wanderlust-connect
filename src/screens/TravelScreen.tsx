import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

/* ---------------- DESTINATIONS ---------------- */

const DESTINATIONS = [
  {
    name: "Bali",
    country: "Indonesia",
    images: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    ],
  },
  {
    name: "Tokyo",
    country: "Japan",
    images: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
      "https://images.unsplash.com/photo-1491884662610-dfcd28f30cf1",
    ],
  },
  {
    name: "Paris",
    country: "France",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
      "https://images.unsplash.com/photo-1522098543979-ffc7f79d8f8a",
    ],
  },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    ],
  },
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
  const [imageIndex, setImageIndex] = useState(0);

  const active = DESTINATIONS[index];

  /* ---- AUTO SWIPE DESTINATIONS ---- */
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setIndex((i) => (i + 1) % DESTINATIONS.length);
      setImageIndex(0);
    }, 5000);

    return () => clearInterval(slideTimer);
  }, []);

  /* ---- AUTO SWAP IMAGE IN CARD ---- */
  useEffect(() => {
    const imageTimer = setInterval(() => {
      setImageIndex((i) => (i + 1) % active.images.length);
    }, 2500);

    return () => clearInterval(imageTimer);
  }, [active]);

  return (
    <div className="relative min-h-screen">
      {/* ---------- BACKGROUND ---------- */}
      <div className="fixed inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e6ff]/85 via-[#dbeafe]/80 to-[#c7d2fe]/85" />
      </div>

      {/* ---------- HEADER ---------- */}
      <header className="flex items-center px-4 py-4">
        <button
          onClick={() => setScreen("profile")}
          className="h-10 w-10 rounded-full bg-white/70 flex items-center justify-center shadow"
        >
          <ArrowLeft className="text-black" />
        </button>
      </header>

      {/* ---------- TEXT ---------- */}
      <div className="px-4 mb-3">
        <p className="text-black text-sm font-medium">Find your perfect travel companion</p>
      </div>

      {/* ---------- SEARCH + CALENDAR ---------- */}
      <div className="px-4 mb-4 relative z-20">
        {loading ? (
          <Input disabled placeholder="Loading…" />
        ) : apiKey ? (
          <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
        ) : (
          <div className="relative">
            <Input
              placeholder="Where to next?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-12 rounded-full bg-white/80 pl-5 pr-16"
            />
            <button onClick={() => setShowDates((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2">
              <Calendar className="text-black" />
            </button>
          </div>
        )}
      </div>

      {/* ---------- DATE PICKER ---------- */}
      {showDates && (
        <div className="px-4 mb-6">
          <div className="bg-white/80 rounded-2xl p-4 grid grid-cols-2 gap-3">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      {/* ---------- ONE ROW AUTO-SWIPING CARD ---------- */}
      <div className="px-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative h-[280px] rounded-3xl overflow-hidden shadow-2xl"
            onClick={() => setDestination(active.name)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={imageIndex}
                src={`${active.images[imageIndex]}?w=1200&q=85`}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-lg font-semibold flex items-center gap-1">
                <MapPin size={16} /> {active.name}
              </p>
              <p className="text-sm opacity-80">{active.country}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---------- CTA ---------- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#e8e6ff] to-transparent">
        <Button
          onClick={() => setTravelDetails({ destination, startDate, endDate })}
          className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
        >
          Find Travel Buddies ✨
        </Button>
      </div>
    </div>
  );
}
