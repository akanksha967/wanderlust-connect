import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, X } from 'lucide-react';

interface PhotoSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

const PhotoSourceDialog = ({ isOpen, onClose, onSelectCamera, onSelectGallery }: PhotoSourceDialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-8 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-3xl shadow-float p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display text-foreground">Add Photo</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Close dialog first
                    onClose();
                    // Use requestAnimationFrame for better timing
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        onSelectCamera();
                      });
                    });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-accent/10 border-2 border-accent/30 hover:border-accent transition-all"
                >
                  <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                    <Camera className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Camera</span>
                  <span className="text-xs text-muted-foreground">Take a photo</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        onSelectGallery();
                      });
                    });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-secondary border-2 border-border hover:border-accent/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Gallery</span>
                  <span className="text-xs text-muted-foreground">Choose existing</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PhotoSourceDialog;
