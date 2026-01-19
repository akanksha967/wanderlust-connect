import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ---------- IMAGE POOL ---------- */
const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d",
];

const DESTINATIONS = [
  { name: "Bali", country: "Indonesia" },
  { name: "Tokyo", country: "Japan" },
  { name: "Paris", country: "France" },
  { name: "Santorini", country: "Greece" },
  { name: "New York", country: "USA" },
  { name: "Swiss Alps", country: "Switzerland" },
];

/* ---------- COMPONENT ---------- */
export default function TravelScreen() {
  const { setScreen, setTravelDetails } = useAppStore();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // each card has its own image index
  const [images, setImages] = useState(
    DESTINATIONS.map(() => IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)]),
  );

  /* ---------- AUTO IMAGE SWAP ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setImages((prev) => prev.map(() => IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)]));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
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

      {/* ---------- TEXT (NOT OVER ARROW) ---------- */}
      <div className="px-4 mb-4">
        <p className="text-black text-sm font-medium">Find your perfect travel companion</p>
      </div>

      {/* ---------- SEARCH BAR ---------- */}
      <div className="px-4 mb-6 relative">
        <Input
          placeholder="Where to next?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="h-12 rounded-full bg-white/80 pl-5 pr-16 text-sm"
        />
        <Calendar className="absolute right-8 top-1/2 -translate-y-1/2 text-black" />
      </div>

      {/* ---------- IMAGE GRID (3 IN LINE) ---------- */}
      <div className="px-4 grid grid-cols-3 gap-4 pb-32">
        {DESTINATIONS.map((d, i) => (
          <motion.button
            key={d.name}
            onClick={() => setDestination(d.name)}
            whileHover={{ y: -6 }}
            className="relative h-[240px] rounded-2xl overflow-hidden shadow-xl"
          >
            <motion.img
              key={images[i]}
              src={`${images[i]}?w=800&q=85`}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute bottom-3 left-3 text-left">
              <p className="text-white text-sm font-semibold flex items-center gap-1">
                <MapPin size={14} /> {d.name}
              </p>
              <p className="text-white/70 text-xs">{d.country}</p>
            </div>
          </motion.button>
        ))}
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
