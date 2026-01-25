import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import DestinationSlideshow from "@/components/DestinationSlideshow";
import PhoneAuthModal from "@/components/PhoneAuthModal";
import EmailAuthModal from "@/components/EmailAuthModal";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { Shield, Phone, Mail } from "lucide-react";

const LoginScreen = () => {
  const setScreen = useAppStore((state) => state.setScreen);
  const { signInWithGoogle } = useAuth();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handlePhoneSuccess = () => setScreen("profile");
  const handleEmailSuccess = () => setScreen("profile");

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Full-screen nature background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop')`,
        }}
      />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-sky-400/40 via-indigo-400/30 to-violet-500/40 backdrop-blur-sm" />

      {/* Floating decorative orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 right-8 w-24 h-24 bg-sky-300/30 rounded-full blur-xl"
          animate={{ y: [0, 15, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div 
          className="absolute top-1/3 right-16 w-16 h-16 bg-indigo-300/25 rounded-full blur-lg"
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-6 pb-5 overflow-hidden">
        {/* App Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-3"
        >
          <h1 className="text-3xl font-serif text-foreground drop-shadow-md">RoamMate</h1>
          <p className="text-sm text-foreground/70 mt-1 drop-shadow-sm">Travel is better with the right company.</p>
        </motion.div>

        {/* Slideshow in glass container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex items-center justify-center py-2 min-h-0"
        >
          <div className="w-full h-full max-h-[280px] bg-white/25 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-lg p-3 overflow-hidden">
            <DestinationSlideshow />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center my-4"
        >
          <h2 className="text-xl font-serif text-foreground mb-1 drop-shadow-md">Find Your Perfect Travel Buddy</h2>
          <p className="text-foreground/70 text-sm leading-relaxed drop-shadow-sm">
            Connect with like-minded travelers heading to your dream destination
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-6 mb-4"
        >
          <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-sm">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-foreground/80 font-medium">Verified profiles</span>
          </div>
        </motion.div>

        {/* Auth Buttons in glass container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/30 backdrop-blur-xl rounded-[20px] border border-white/40 shadow-lg p-4 space-y-3"
        >
          <Button 
            className="w-full h-12 bg-white/50 hover:bg-white/70 border border-white/50 text-foreground shadow-sm backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-[1.02]" 
            onClick={signInWithGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button 
            className="w-full h-12 bg-white/50 hover:bg-white/70 border border-white/50 text-foreground shadow-sm backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-[1.02]" 
            onClick={() => setShowPhoneModal(true)}
          >
            <Phone className="w-5 h-5 mr-2 text-indigo-500" />
            Continue with Phone
          </Button>

          <Button 
            className="w-full h-12 bg-white/50 hover:bg-white/70 border border-white/50 text-foreground shadow-sm backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-[1.02]" 
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

      {/* Modals */}
      <PhoneAuthModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} onSuccess={handlePhoneSuccess} />
      <EmailAuthModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSuccess={handleEmailSuccess} />
      <PrivacyPolicyModal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} />
    </div>
  );
};

export default LoginScreen;
