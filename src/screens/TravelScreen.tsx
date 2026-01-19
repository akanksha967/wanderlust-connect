import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Loader2, Sparkles } from "lucide-react";
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

const TravelScreen = () => {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading: mapsLoading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isValid = destination && startDate && endDate;

  const handleContinue = () => {
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600"
          className="w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/20 to-black/40" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 px-5 pt-10 flex items-center gap-4">
        <button
          onClick={() => setScreen("profile")}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
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
            <div className="h-14 rounded-full bg-white/20 flex items-center px-5">
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
              className="h-14 rounded-full bg-white/80 backdrop-blur-md"
            />
          )}
        </div>

        {/* ✅ FIXED MASONRY GRID */}
        <div className="columns-2 gap-4 space-y-4">
          {popularDestinations.map((dest) => (
            <motion.button
              key={dest.name}
              onClick={() => setDestination(dest.name)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              className={`relative w-full break-inside-avoid rounded-2xl overflow-hidden text-left
                ${
                  destination === dest.name
                    ? "ring-2 ring-white/70 shadow-[0_25px_60px_-15px_rgba(139,92,246,0.6)]"
                    : "shadow-[0_15px_40px_-12px_rgba(0,0,0,0.4)]"
                }`}
            >
              {/* IMAGE – NO STRETCH */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <motion.img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

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

        {/* DATES */}
        <div className="mt-10 p-5 rounded-3xl bg-white/15 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/20 text-white"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/20 text-white"
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-primary/70 to-transparent z-10">
        <Button
          disabled={!isValid}
          onClick={handleContinue}
          className={`w-full h-14 rounded-full text-lg
            ${isValid ? "bg-gradient-to-r from-primary via-accent to-primary" : "bg-white/20"}`}
        >
          {isValid ? "Find Travel Buddies ✨" : "Select destination & dates"}
        </Button>
      </div>
    </div>
  );
};

export default TravelScreen;
