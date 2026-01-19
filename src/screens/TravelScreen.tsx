import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

const popularDestinations = [
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900" },
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900" },
  { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=900" },
  { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=900" },
  { name: "New York", country: "USA", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900" },
];

export default function TravelScreen() {
  const { setScreen, setTravelDetails } = useAppStore();

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isValid = destination && startDate && endDate;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* 🌈 Pastel Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#ECEBFF] via-[#DDE4FF] to-[#C7D2FF]" />
      <div className="fixed inset-0 backdrop-blur-[1px]" />

      {/* ✨ Header */}
      <div className="relative z-10 px-6 pt-10 flex items-center gap-4">
        <button
          onClick={() => setScreen("profile")}
          className="w-11 h-11 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-[#2E2E5D]" />
        </button>

        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-[#2E2E5D]">Travel Travel</h1>
          <p className="text-sm text-[#6B6BA0] mt-1">Get inspired & plan your next escape</p>
        </div>

        <Sparkles className="text-[#6B6BA0]" />
      </div>

      {/* 🌐 Content */}
      <div className="relative z-10 px-6 pt-10 pb-36">
        {/* 🔍 Glass Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Inspire travel now"
              className="
                h-16 pl-14 pr-16 rounded-full
                bg-white/40 backdrop-blur-xl
                border border-white/60
                text-[#2E2E5D]
                placeholder:text-[#7A7AA8]
                shadow-[0_30px_80px_-25px_rgba(120,140,255,0.6)]
              "
            />
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B6BA0]" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-[#6B7CFF] to-[#8B9BFF] flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">→</span>
            </div>
          </div>
        </motion.div>

        {/* 🖼️ Masonry Cards */}
        <div className="columns-2 gap-5 space-y-5">
          {popularDestinations.map((dest) => (
            <motion.button
              key={dest.name}
              onClick={() => setDestination(dest.name)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              className="
                w-full break-inside-avoid rounded-3xl overflow-hidden
                bg-white/35 backdrop-blur-xl
                border border-white/60
                shadow-[0_20px_60px_-25px_rgba(120,140,255,0.5)]
                text-left
              "
            >
              {/* Image */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <motion.img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />

              {/* Text */}
              <div className="absolute bottom-0 p-4">
                <p className="text-[#2E2E5D] font-semibold">{dest.name}</p>
                <p className="text-xs text-[#6B6BA0]">{dest.country}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 📅 Dates */}
        <div className="mt-12 p-6 rounded-3xl bg-white/35 backdrop-blur-xl border border-white/60 max-w-xl mx-auto">
          <p className="text-sm font-semibold text-[#2E2E5D] mb-4">Travel dates</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/50 text-[#2E2E5D]"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/50 text-[#2E2E5D]"
            />
          </div>
        </div>
      </div>

      {/* 🚀 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#C7D2FF] to-transparent">
        <Button
          disabled={!isValid}
          onClick={() => {
            setTravelDetails({ destination, startDate, endDate });
            setScreen("swipe");
          }}
          className="
            w-full h-14 rounded-full text-base font-semibold
            bg-gradient-to-r from-[#6B7CFF] to-[#8B9BFF]
            text-white shadow-[0_20px_60px_-20px_rgba(120,140,255,0.8)]
            disabled:opacity-40
          "
        >
          Find Travel Buddies ✨
        </Button>
      </div>
    </div>
  );
}
