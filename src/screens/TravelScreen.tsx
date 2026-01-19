import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, MapPin, Calendar, Search, Loader2, AlertCircle } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import GoogleMapsDestinationPicker from "@/components/GoogleMapsDestinationPicker";

/* ---------------- DATA ---------------- */

const destinations = [
  { name: "Bali", country: "Indonesia", h: 260, img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4" },
  { name: "Tokyo", country: "Japan", h: 220, img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf" },
  { name: "Paris", country: "France", h: 300, img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34" },
  { name: "Barcelona", country: "Spain", h: 240, img: "https://images.unsplash.com/photo-1583422409516-2895a77efded" },
  { name: "Santorini", country: "Greece", h: 280, img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff" },
  { name: "New York", country: "USA", h: 230, img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9" },
  { name: "Kyoto", country: "Japan", h: 260, img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9" },
  {
    name: "Swiss Alps",
    country: "Switzerland",
    h: 300,
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  },
];

/* ---------------- COMPONENT ---------------- */

export default function TravelScreen() {
  const { setScreen, setTravelDetails, hasCompletedProfile } = useAppStore();
  const { apiKey, loading } = useGoogleMapsKey();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const valid = destination && startDate && endDate;

  const handleContinue = () => {
    if (!startDate || !endDate) {
      setShowWarning(true);
      return;
    }
    setTravelDetails({ destination, startDate, endDate });
    setScreen("swipe");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ---------- BACKGROUND ---------- */}
      <div className="fixed inset-0 -z-10">
        {/* nature image */}
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        {/* lavender-blue gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e6ff]/90 via-[#dbeafe]/85 to-[#c7d2fe]/90" />
      </div>

      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 backdrop-blur-xl bg-white/30">
        <button
          onClick={() => setScreen(hasCompletedProfile ? "account" : "profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 border border-white/70 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-indigo-600" />
        </button>

        <span className="text-sm font-medium text-indigo-700/80">Where to next?</span>
      </header>

      {/* ---------- CONTENT ---------- */}
      <main className="px-4 pt-4 pb-32">
        {/* SEARCH */}
        <div className="mb-6">
          {loading ? (
            <div className="flex h-12 items-center gap-3 rounded-full bg-white/60 px-5">
              <Loader2 className="animate-spin text-indigo-500" />
              <span className="text-sm text-indigo-400">Loading maps…</span>
            </div>
          ) : apiKey ? (
            <GoogleMapsDestinationPicker apiKey={apiKey} value={destination} onChange={setDestination} />
          ) : (
            <div className="relative">
              <Input
                placeholder="Where do you want to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 rounded-full bg-white/70 pl-5 pr-12"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500" />
            </div>
          )}
        </div>

        {/* MASONRY GRID */}
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {destinations.map((d) => (
            <motion.button
              key={d.name}
              whileHover={{ y: -6 }}
              onClick={() => setDestination(d.name)}
              className="relative w-full overflow-hidden rounded-2xl shadow-lg"
              style={{ height: d.h }}
            >
              <img src={`${d.img}?w=600&q=80`} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 text-left">
                <p className="text-white font-medium text-sm flex items-center gap-1">
                  <MapPin size={14} /> {d.name}
                </p>
                <p className="text-xs text-white/70">{d.country}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* DATES */}
        <div className="mt-8 rounded-2xl bg-white/60 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Travel dates</span>
            {showWarning && (
              <span className="ml-auto text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </main>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#e8e6ff] to-transparent">
        <Button
          onClick={handleContinue}
          disabled={!valid}
          className={`w-full h-12 rounded-full ${
            valid ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white" : "bg-indigo-200 text-indigo-500"
          }`}
        >
          {valid ? "Find Travel Buddies ✨" : "Select destination & dates"}
        </Button>
      </div>
    </div>
  );
}
