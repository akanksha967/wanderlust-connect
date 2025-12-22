import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-background rounded-t-2xl w-full max-h-[85vh] px-5 py-4 overflow-y-auto"
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display">Privacy Policy & Terms</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong>Privacy Policy</strong>
            </p>

            <p>RoamMate respects your privacy and is committed to protecting your personal information.</p>

            <p>
              We collect basic details such as your name, email address or phone number, profile photo, travel
              preferences, and in-app messages to provide core functionality and ensure a safe experience.
            </p>

            <p>
              Your data is used to match you with compatible travelers, improve app features, and prevent misuse. We
              never sell your personal data and store all information securely using industry-standard practices.
            </p>

            <p>You may request deletion of your account and associated data at any time.</p>

            <p>
              <strong>Terms of Service</strong>
            </p>

            <p>
              By using RoamMate, you agree to provide accurate information and interact respectfully with other users.
              Harassment, abuse, impersonation, or misuse may result in account suspension or removal.
            </p>

            <p>
              RoamMate is a platform for connecting travelers. We do not verify travel arrangements and are not
              responsible for offline interactions between users. Please prioritize your personal safety.
            </p>

            <p>We may update these terms periodically. Continued use of the app indicates acceptance of any changes.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyPolicyModal;
