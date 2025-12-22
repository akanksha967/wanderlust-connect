import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Phone, ArrowRight } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const countryCodes = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'SG' },
];

const PhoneAuthModal = ({ isOpen, onClose, onSuccess }: PhoneAuthModalProps) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOtp, verifyOtp } = useAuth();

  const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;

  const handleSendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    const success = await sendOtp(fullPhoneNumber);
    setLoading(false);
    if (success) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    const success = await verifyOtp(fullPhoneNumber, otp);
    setLoading(false);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-background rounded-3xl p-6 shadow-elegant"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent-foreground" />
                </div>
                <h2 className="text-lg font-display text-foreground">
                  {step === 'phone' ? 'Enter Phone' : 'Verify OTP'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {step === 'phone' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll send you a verification code to confirm your number.
                </p>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24 h-12 rounded-xl bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} {c.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="h-12 rounded-xl bg-secondary border-0 flex-1"
                  />
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={!phone || loading}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to {fullPhoneNumber}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-accent hover:underline"
                >
                  Change phone number
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhoneAuthModal;
