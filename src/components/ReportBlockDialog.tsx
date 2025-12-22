import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ban, Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReport: (reason: string, description?: string) => void;
  userName: string;
}

const reportReasons = [
  'Inappropriate content',
  'Fake profile',
  'Harassment',
  'Spam',
  'Other',
];

const ReportBlockDialog = ({ isOpen, onClose, onBlock, onReport, userName }: ReportBlockDialogProps) => {
  const [view, setView] = useState<'main' | 'report'>('main');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleClose = () => {
    setView('main');
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  const handleReport = () => {
    if (selectedReason) {
      onReport(selectedReason, description || undefined);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                <h3 className="text-lg font-display text-foreground">
                  {view === 'main' ? 'Actions' : 'Report User'}
                </h3>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {view === 'main' ? (
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onBlock();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/30 hover:border-destructive transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-destructive block">Block {userName}</span>
                      <span className="text-xs text-destructive/80">You won't see each other again</span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('report')}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary border-2 border-border hover:border-accent/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                      <Flag className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground block">Report {userName}</span>
                      <span className="text-xs text-muted-foreground">Help keep the community safe</span>
                    </div>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="text-xs text-destructive">Select a reason for reporting</p>
                  </div>

                  <div className="space-y-2">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`w-full p-3 rounded-xl text-left text-sm transition-all ${
                          selectedReason === reason
                            ? 'bg-accent/10 border-2 border-accent text-foreground'
                            : 'bg-secondary border-2 border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  {selectedReason === 'Other' && (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full h-20 p-3 rounded-xl bg-secondary border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setView('main')}
                    >
                      Back
                    </Button>
                    <Button
                      variant="accent"
                      className="flex-1"
                      disabled={!selectedReason}
                      onClick={handleReport}
                    >
                      Submit Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportBlockDialog;
