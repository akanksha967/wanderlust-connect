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
            <h2 className="text-lg font-display">
              Privacy Policy & Terms
            </h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong>RoamMate</strong> helps travelers connect safely and
              meaningfully.
            </p>
            <p>
              <strong>Data we collect:</strong> Name, email or phone number,
              profile photo, travel preferences, and in-app messages.
            </p>
            <p>
              <strong>How we use it:</strong> To match you with compatible
              travelers, improve recommendations, and ensure platform safety.
            </p>
            <p>
              <strong>Privacy:</strong> We never sell your personal data. All
              information is securely stored using industry standards.
            </p>
            <p>
              <strong>User responsibility:</strong> Respectful behavior is
              mandatory. Abuse, harassment, or misuse may lead to account
              suspension.
            </p>
            <p>
              By using RoamMate, you agree to these terms and privacy practices.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyPolicyModal;
