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
    <div className="h-[100dvh] flex flex-col bg-background px-5 pt-6 pb-5 overflow-hidden">
      {/* App Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3"
      >
        <h1 className="text-2xl font-display text-foreground">RoamMate</h1>
        <p className="text-xs text-muted-foreground mt-1">Travel is better with the right company.</p>
      </motion.div>

      {/* Slideshow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center py-2 min-h-0"
      >
        <DestinationSlideshow />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3"
      >
        <h2 className="text-xl font-display text-foreground mb-1">Find Your Perfect Travel Buddy</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Connect with like-minded travelers heading to your dream destination
        </p>
      </motion.div>

      {/* Trust Badge */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Shield className="w-4 h-4 text-accent" />
          <span>Verified profiles</span>
        </div>
      </div>

      {/* Auth Buttons */}
      <div className="space-y-2">
        <Button variant="social" className="w-full h-11" onClick={signInWithGoogle}>
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <Button variant="social" className="w-full h-11" onClick={() => setShowPhoneModal(true)}>
          <Phone className="w-4 h-4" />
          Continue with Phone
        </Button>

        <Button variant="social" className="w-full h-11" onClick={() => setShowEmailModal(true)}>
          <Mail className="w-4 h-4" />
          Continue with Email
        </Button>

        {/* Terms */}
        <p className="text-center text-[10px] text-muted-foreground pt-1">
          By continuing, you agree to our{" "}
          <span className="text-accent cursor-pointer" onClick={() => setShowPolicyModal(true)}>
            Terms
          </span>{" "}
          and{" "}
          <span className="text-accent cursor-pointer" onClick={() => setShowPolicyModal(true)}>
            Privacy Policy
          </span>
        </p>
      </div>

      {/* Modals */}
      <PhoneAuthModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} onSuccess={handlePhoneSuccess} />

      <EmailAuthModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} onSuccess={handleEmailSuccess} />

      <PrivacyPolicyModal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} />
    </div>
  );
};

export default LoginScreen;
