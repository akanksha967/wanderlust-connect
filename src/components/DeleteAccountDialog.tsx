import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteAccountDialog = ({ isOpen, onClose, onDeleted }: DeleteAccountDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { deleteAccount } = useAuth();

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteAccount();
    setLoading(false);
    if (success) {
      onDeleted();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-background rounded-3xl p-6 shadow-elegant"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-lg font-display text-foreground">Delete Account</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your data, matches, and conversations will be permanently removed.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountDialog;
