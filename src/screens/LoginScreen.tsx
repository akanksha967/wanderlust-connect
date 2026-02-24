import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import PhoneAuthModal from "@/components/PhoneAuthModal";
import EmailAuthModal from "@/components/EmailAuthModal";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { Shield, Phone, Mail, MapPin } from "lucide-react";
import roammateLogo from "@/assets/roammate-logo.png";

/* ---------------- DESTINATIONS ---------------- */
const DESTINATIONS = [
  {
    name: "Swiss Alps",
    country: "Switzerland",
    tagline: "Where peaks touch the sky",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=75&fm=webp",
  },
  {
    name: "Bali",
    country: "Indonesia",
    tagline: "Island of the gods",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=75&fm=webp",
  },
  {
    name: "Patagonia",
    country: "Argentina",
    tagline: "The end of the world",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=75&fm=webp",
  },
  {
    name: "Kyoto",
    country: "Japan",
    tagline: "Where tradition breathes",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=75&fm=webp",
  },
  {
    name: "Santorini",
    country: "Greece",
    tagline: "Where blue meets white",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=75&fm=webp",
  },
];

const LoginScreen = () => {
  const setScreen = useAppStore((state) => state.setScreen);
  const { signInWithGoogle } = useAuth();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Don't force navigation here. Let Index.tsx decide whether to go to profile setup or travel
  // based on whether a profile already exists.
  const handlePhoneSuccess = () => {
    setShowPhoneModal(false);
  };
  const handleEmailSuccess = () => {
    setShowEmailModal(false);
  };

  // Auto-cycle destinations (right to left, one direction)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getCardIndex = (offset: number) => {
    return (activeIndex + offset + DESTINATIONS.length) % DESTINATIONS.length;
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* ---------- DYNAMIC BACKGROUND (instant, no delay) ---------- */}
      {DESTINATIONS.map((dest, i) => (
        <div
          key={i}
          className="fixed inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url('${dest.image}')`,
            opacity: i === activeIndex ? 1 : 0,
            zIndex: i === activeIndex ? 0 : -1
          }}
        />
      ))}
      <div className="fixed inset-0 bg-gradient-to-br from-sky-400/50 via-indigo-400/40 to-violet-500/50" />
      <div className="fixed inset-0 backdrop-blur-md" />

      {/* ---------- CENTERED GLASS CONTAINER ---------- */}
      <div className="flex items-center justify-center h-full px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md max-h-[calc(100dvh-48px)]
            rounded-[28px] 
            bg-white/25 
            backdrop-blur-2xl 
            border border-white/40 
            shadow-[0_30px_80px_rgba(0,0,0,0.25)]
            flex flex-col overflow-hidden"
        >
          <div className="p-5 flex flex-col gap-4 flex-1 min-h-0">
            {/* ---------- HEADER ---------- */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center flex-shrink-0 flex flex-col items-center"
            >
              <img src={roammateLogo} alt="RoamMate logo" className="w-16 h-16 object-contain drop-shadow-lg" style={{ clipPath: 'circle(43% at center)' }} />
              <p className="text-xs text-foreground/70 mt-1.5">Travel is better with the right company</p>
            </motion.div>

            {/* ---------- CAROUSEL SECTION (smooth right-to-left) ---------- */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              {/* Cards Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Left Card (previous) */}
                <motion.div
                  key={`left-${getCardIndex(-1)}`}
                  animate={{ opacity: 0.4, scale: 0.7, x: "-55%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute w-[50%] aspect-[4/5] rounded-xl overflow-hidden shadow-lg"
                  style={{ zIndex: 1, filter: "blur(2px)" }}
                >
                  <img
                    src={DESTINATIONS[getCardIndex(-1)].image}
                    alt={DESTINATIONS[getCardIndex(-1)].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </motion.div>

                {/* Center Card (active) */}
                <motion.div
                  key={`center-${activeIndex}`}
                  initial={{ x: "60%", opacity: 0.5, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative w-[65%] aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl z-10"
                >
                  <img
                    src={DESTINATIONS[activeIndex].image}
                    alt={DESTINATIONS[activeIndex].name}
                    className="w-full h-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-serif text-base">{DESTINATIONS[activeIndex].name}</span>
                    </div>
                    <p className="text-xs opacity-80">{DESTINATIONS[activeIndex].country}</p>
                    <p className="text-[10px] opacity-60 italic mt-0.5">{DESTINATIONS[activeIndex].tagline}</p>
                  </div>
                </motion.div>

                {/* Right Card (next) */}
                <motion.div
                  key={`right-${getCardIndex(1)}`}
                  animate={{ opacity: 0.4, scale: 0.7, x: "55%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute w-[50%] aspect-[4/5] rounded-xl overflow-hidden shadow-lg"
                  style={{ zIndex: 1, filter: "blur(2px)" }}
                >
                  <img
                    src={DESTINATIONS[getCardIndex(1)].image}
                    alt={DESTINATIONS[getCardIndex(1)].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </motion.div>
              </div>
            </div>

            {/* ---------- VERIFIED TEXT (simple) ---------- */}
            <div className="flex justify-center items-center gap-1.5 flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs text-foreground/70">Verified profiles only</span>
            </div>

            {/* ---------- AUTH BUTTONS ---------- */}
            <div className="space-y-2 flex-shrink-0">
              <Button
                className="w-full h-10 rounded-2xl 
                  bg-white/50 hover:bg-white/70 
                  border border-white/50 
                  text-foreground text-sm
                  shadow-sm backdrop-blur-sm 
                  transition-all duration-300 hover:scale-[1.02]"
                onClick={signInWithGoogle}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-10 rounded-2xl 
                    bg-white/50 hover:bg-white/70 
                    border border-white/50 
                    text-foreground text-sm
                    shadow-sm backdrop-blur-sm 
                    transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => setShowPhoneModal(true)}
                >
                  <Phone className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Phone
                </Button>

                <Button
                  className="h-10 rounded-2xl 
                    bg-white/50 hover:bg-white/70 
                    border border-white/50 
                    text-foreground text-sm
                    shadow-sm backdrop-blur-sm 
                    transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => setShowEmailModal(true)}
                >
                  <Mail className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Email
                </Button>
              </div>

              {/* Terms */}
              <p className="text-center text-[10px] text-foreground/60">
                By continuing, you agree to our{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline font-medium" onClick={() => setShowPolicyModal(true)}>
                  Terms
                </span>{" "}
                &{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline font-medium" onClick={() => setShowPolicyModal(true)}>
                  Privacy
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <PhoneAuthModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} onSuccess={handlePhoneSuccess} />
      <EmailAuthModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSuccess={handleEmailSuccess} />
      <PrivacyPolicyModal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} />
    </div>
  );
};

export default LoginScreen;
