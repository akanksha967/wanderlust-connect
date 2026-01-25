import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import PhoneAuthModal from "@/components/PhoneAuthModal";
import EmailAuthModal from "@/components/EmailAuthModal";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

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

const LoginScreen = () => {
  const setScreen = useAppStore((state) => state.setScreen);
  const { signInWithGoogle } = useAuth();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [index, setIndex] = useState(0);

  const active = DESTINATIONS[index];

  const handlePhoneSuccess = () => setScreen("profile");
  const handleEmailSuccess = () => setScreen("profile");

  // Auto-cycle destinations
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* ---------- FULLSCREEN NATURE BACKGROUND ---------- */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80')",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-violet-500/40" />
      <div className="fixed inset-0 backdrop-blur-sm" />

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
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-1"
            >
              <h1 className="font-serif text-2xl text-foreground drop-shadow-md">RoamMate</h1>
              <p className="text-sm text-foreground/70">Travel is better with the right company</p>
            </motion.div>

            {/* ---------- DESTINATION CARD ---------- */}
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.5 }}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl"
              >
                <img src={active.image} alt={active.name} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-serif text-xl">{active.name}</span>
                  </div>
                  <p className="text-sm opacity-80">{active.country}</p>
                  <p className="text-xs opacity-60 italic mt-1">{active.tagline}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ---------- TRUST BADGE ---------- */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-sm">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-foreground/80 font-medium">Verified profiles</span>
              </div>
            </motion.div>

            {/* ---------- AUTH BUTTONS ---------- */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button 
                className="w-full h-12 rounded-2xl 
                  bg-white/50 hover:bg-white/70 
                  border border-white/50 
                  text-foreground 
                  shadow-sm backdrop-blur-sm 
                  transition-all duration-300 hover:scale-[1.02]" 
                onClick={signInWithGoogle}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <Button 
                className="w-full h-12 rounded-2xl 
                  bg-white/50 hover:bg-white/70 
                  border border-white/50 
                  text-foreground 
                  shadow-sm backdrop-blur-sm 
                  transition-all duration-300 hover:scale-[1.02]" 
                onClick={() => setShowPhoneModal(true)}
              >
                <Phone className="w-5 h-5 mr-2 text-indigo-500" />
                Continue with Phone
              </Button>

              <Button 
                className="w-full h-12 rounded-2xl 
                  bg-white/50 hover:bg-white/70 
                  border border-white/50 
                  text-foreground 
                  shadow-sm backdrop-blur-sm 
                  transition-all duration-300 hover:scale-[1.02]" 
                onClick={() => setShowEmailModal(true)}
              >
                <Mail className="w-5 h-5 mr-2 text-indigo-500" />
                Continue with Email
              </Button>

              {/* Terms */}
              <p className="text-center text-xs text-foreground/60 pt-1">
                By continuing, you agree to our{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline font-medium" onClick={() => setShowPolicyModal(true)}>
                  Terms
                </span>{" "}
                and{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline font-medium" onClick={() => setShowPolicyModal(true)}>
                  Privacy Policy
                </span>
              </p>
            </motion.div>
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
