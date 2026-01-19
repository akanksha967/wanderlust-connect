import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Sparkles, X } from "lucide-react";
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

export default function TravelScreen() {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading: mapsLoading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isValid = destination && startDate && endDate;

  const handleContinue = () => {
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden">
      {/* 🌈 LAVENDER / BLUE BACKGROUND */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#dcd6ff] via-[#b6c5ff] to-[#7db9ff]" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />

      {/* HEADER */}
      <div className="relative z-10 px-5 pt-10 flex items-center gap-4">
        <button
          onClick={() => setScreen("profile")}
          className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-xl flex items-center justify-center"
        >
          <ArrowLeft className="text-white" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white">Where to next?</h1>
          {!hasCompletedProfile && <p className="text-sm text-white/70">Step 2 of 2</p>}
        </div>

        <Sparkles className="text-white/80" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 px-5 pb-36 pt-6 overflow-y-auto h-full">
        {/* DESTINATION INPUT */}
        <div className="mb-8">
          {mapsLoading ? (
            <div className="h-14 rounded-full bg-white/25 backdrop-blur-xl flex items-center px-5">
              <Loader2 className="animate-spin text-white" />
              <span className="ml-3 text-white/70">Loading maps…</span>
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
          ) : (
            <Input
              placeholder="Where do you want to go?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-14 rounded-full bg-white/80 backdrop-blur-xl"
            />
          )}
        </div>

        {/* 🪟 GLASSMORPHIC FLOATING CARDS */}
        <div className="columns-2 gap-4 space-y-4">
          {popularDestinations.map((dest, i) => (
            <motion.button
              key={dest.name}
              onClick={() => setDestination(dest.name)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative w-full break-inside-avoid rounded-3xl overflow-hidden text-left
                bg-white/20 backdrop-blur-xl border border-white/30
                shadow-[0_25px_60px_-20px_rgba(0,0,0,0.35)]
                ${destination === dest.name ? "ring-2 ring-white/80" : ""}`}
            >
              {/* IMAGE */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-[3/4] w-full"
              >
                <img src={dest.image} className="absolute inset-0 w-full h-full object-cover" />
              </motion.div>

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* TEXT */}
              <div className="absolute bottom-0 p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white" />
                  <p className="text-white font-semibold">{dest.name}</p>
                </div>
                <p className="text-xs text-white/70 ml-6">{dest.country}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 📅 FLOATING CALENDAR TRIGGER */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setCalendarOpen(true)}
          className="mt-10 w-full h-14 rounded-full bg-white/25 backdrop-blur-xl flex items-center justify-center gap-3 text-white"
        >
          <Calendar />
          {startDate && endDate ? `${startDate} → ${endDate}` : "Select travel dates"}
        </motion.button>
      </div>

      {/* 📅 CALENDAR MODAL */}
      <AnimatePresence>
        {calendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end"
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full rounded-t-3xl bg-white p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Travel Dates</h3>
                <button onClick={() => setCalendarOpen(false)}>
                  <X />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <Button onClick={() => setCalendarOpen(false)} className="mt-6 w-full rounded-full">
                Confirm Dates
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/30 to-transparent z-10">
        <Button
          disabled={!isValid}
          onClick={handleContinue}
          className={`w-full h-14 rounded-full text-lg
            ${isValid ? "bg-gradient-to-r from-[#7c7cff] via-[#9f8cff] to-[#7c7cff]" : "bg-white/20"}`}
        >
          Find Travel Buddies ✨
        </Button>
      </div>
    </div>
  );
}

export default TravelScreen;
