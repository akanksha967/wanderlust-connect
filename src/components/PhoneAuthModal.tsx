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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white/30 backdrop-blur-2xl rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/40"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-400 to-blue-400 flex items-center justify-center shadow-lg">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-serif text-gray-900">
                  {step === 'phone' ? 'Enter Phone' : 'Verify OTP'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/60 transition-all"
              >
                <X className="w-4 h-4 text-foreground/70" />
              </button>
            </div>

            {step === 'phone' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  We'll send you a verification code to confirm your number.
                </p>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24 h-12 rounded-xl bg-white/40 border border-white/30 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-xl border border-white/40">
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
                    className="h-12 rounded-xl bg-white/40 border border-white/30 flex-1 text-gray-900 placeholder:text-foreground/40"
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-400 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white font-medium shadow-lg transition-all hover:scale-[1.02]"
                  onClick={handleSendOtp}
                  disabled={!phone || loading}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Enter the 6-digit code sent to {fullPhoneNumber}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                      <InputOTPSlot index={1} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                      <InputOTPSlot index={2} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                      <InputOTPSlot index={3} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                      <InputOTPSlot index={4} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                      <InputOTPSlot index={5} className="bg-white/40 border-white/30 text-gray-900 rounded-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-400 hover:from-indigo-500 hover:via-blue-500 hover:to-sky-500 text-white font-medium shadow-lg transition-all hover:scale-[1.02]"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-indigo-600 hover:underline"
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
