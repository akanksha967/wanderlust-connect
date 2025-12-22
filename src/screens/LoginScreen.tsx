import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import roammateLogo from '@/assets/roammate-logo.png';
import travelIllustration from '@/assets/travel-illustration.png';
import { Users, Shield } from 'lucide-react';

const LoginScreen = () => {
  const setScreen = useAppStore((state) => state.setScreen);

  return (
    <div className="h-full flex flex-col bg-background px-6 pt-14 pb-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <img 
          src={roammateLogo} 
          alt="RoamMate" 
          className="h-14 w-auto"
        />
      </motion.div>

      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 flex items-center justify-center py-4"
      >
        <img 
          src={travelIllustration} 
          alt="Travel together" 
          className="w-full max-w-[260px] h-auto animate-float"
        />
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-display text-foreground mb-3">
          Find Your Perfect Travel Buddy
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Connect with like-minded travelers heading to your dream destination
        </p>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center gap-6 mb-8"
      >
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Shield className="w-4 h-4 text-accent" />
          <span>Verified profiles</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Users className="w-4 h-4 text-accent" />
          <span>50k+ travelers</span>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-3"
      >
        <Button 
          variant="accent" 
          size="lg" 
          className="w-full"
          onClick={() => setScreen('profile')}
        >
          Get Started
        </Button>
        
        <Button 
          variant="social" 
          size="lg" 
          className="w-full"
          onClick={() => setScreen('profile')}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-2">
          By continuing, you agree to our{' '}
          <span className="text-accent">Terms</span> and{' '}
          <span className="text-accent">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
