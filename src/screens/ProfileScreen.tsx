import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Camera, Plus, X, Sparkles, User } from 'lucide-react';
import PhotoSourceDialog from '@/components/PhotoSourceDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const vibeOptions = [
  { id: 'Adventure', icon: '🏔️', label: 'Adventure' },
  { id: 'Relaxation', icon: '🌴', label: 'Relaxation' },
  { id: 'Culture', icon: '🏛️', label: 'Culture' },
  { id: 'Foodie', icon: '🍜', label: 'Foodie' },
  { id: 'Nature', icon: '🌿', label: 'Nature' },
  { id: 'Nightlife', icon: '🎶', label: 'Nightlife' },
  { id: 'Photography', icon: '📸', label: 'Photography' },
  { id: 'Budget', icon: '💰', label: 'Budget' },
  { id: 'Luxury', icon: '✨', label: 'Luxury' },
  { id: 'Solo', icon: '🧍', label: 'Solo' },
];

const ProfileScreen = () => {
  const { setScreen, setUserProfile } = useAppStore();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showPhotoSourceDialog, setShowPhotoSourceDialog] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const handleBack = async () => {
    await signOut();
    setScreen('login');
  };

  const handlePhotoClick = (index: number) => {
    setActivePhotoIndex(index);
    setShowPhotoSourceDialog(true);
  };

  const handleCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string | undefined;
        if (!dataUrl) return;

        const isDuplicate = photos.some((p, i) => p === dataUrl && i !== activePhotoIndex);
        if (isDuplicate) {
          toast({
            title: 'Duplicate photo',
            description: 'That photo is already added. Please pick a different one.',
            variant: 'destructive',
          });
          return;
        }

        const newPhotos = [...photos];
        if (activePhotoIndex < newPhotos.length) {
          newPhotos[activePhotoIndex] = dataUrl;
        } else {
          newPhotos.push(dataUrl);
        }
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleVibe = (vibeId: string) => {
    if (selectedVibes.includes(vibeId)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibeId));
    } else if (selectedVibes.length < 4) {
      setSelectedVibes([...selectedVibes, vibeId]);
    }
  };

  const handleContinue = () => {
    setUserProfile({
      name,
      age: parseInt(age),
      bio,
      photos,
      travelVibes: selectedVibes,
    });
    useAppStore.getState().setHasCompletedProfile(true);
    setScreen('travel');
  };

  const isValid = name && age && photos.length > 0 && selectedVibes.length > 0;
  const previewBio = bio.length > 80 ? bio.substring(0, 80) + '...' : bio;

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden">
      {/* Lavender Gradient Background */}
      <div className="fixed inset-0 gradient-hero" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
      
      {/* Subtle floating orbs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            x: [0, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 -left-20 w-72 h-72 rounded-full bg-accent/15 blur-3xl"
        />
      </div>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3 shrink-0"
      >
        <motion.button 
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl glass-lavender shadow-glass transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">Create Profile</h1>
          <p className="text-[11px] text-muted-foreground font-medium">Step 1 of 2</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Floating Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="glass-card rounded-3xl p-5 shadow-float glow-edge"
          >
            {/* Helper Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-3 rounded-2xl glass-lavender mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs leading-relaxed text-foreground/80">
                  Profiles with photos get <span className="font-semibold text-foreground">3× more matches</span>
                </p>
              </div>
            </motion.div>

            {/* Photo upload */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-4"
            >
              <label className="text-xs font-medium text-foreground mb-2 block">
                Add photos <span className="text-muted-foreground font-normal">(1-3)</span>
              </label>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden glass-lavender shadow-glass transition-all duration-300"
                  >
                    {photos[index] ? (
                      <>
                        <img
                          src={photos[index]}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-foreground/80 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <X className="w-2.5 h-2.5 text-background" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePhotoClick(index)}
                        className="w-full h-full flex flex-col items-center justify-center gap-1"
                      >
                        {index === 0 ? (
                          <Camera className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="text-[9px] text-muted-foreground font-medium">Add</span>
                      </button>
                    )}
                    {index === 0 && photos[index] && (
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded-md shadow-sm">
                        Main
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Name & Age */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-3 mb-4"
            >
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">First name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Akanksha"
                  className="h-10 rounded-xl glass-lavender border-0 text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Age</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  className="h-10 rounded-xl glass-lavender border-0 text-sm placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200"
                />
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-4"
            >
              <label className="text-xs font-medium text-foreground mb-1.5 block">About you</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Solo traveler heading to Bali. Love photography & cafes."
                className="w-full h-16 p-3 rounded-xl glass-lavender border-0 resize-none text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-glow transition-all duration-200"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Keep it short — helps others feel comfortable reaching out.
              </p>
            </motion.div>

            {/* Travel vibes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-3 rounded-2xl glass-lavender"
            >
              <div className="mb-2">
                <h3 className="text-xs font-medium text-foreground">How do you like to travel?</h3>
                <p className="text-[10px] text-muted-foreground">Select up to 4</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vibeOptions.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  return (
                    <motion.button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center gap-1 ${
                        isSelected
                          ? 'gradient-lavender-deep text-primary-foreground shadow-glass glow-lavender'
                          : 'glass text-foreground/80 hover:bg-primary/10'
                      }`}
                    >
                      <span>{vibe.icon}</span>
                      <span>{vibe.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Profile Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4"
          >
            <ProfilePreviewCard
              photo={photos[0]}
              name={name}
              age={age}
              bio={previewBio}
              vibes={selectedVibes}
            />
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-[10px] text-muted-foreground mb-2 font-medium">
            Step 1 of 2 • Takes less than a minute
          </p>
          <motion.div whileHover={{ scale: isValid ? 1.01 : 1 }} whileTap={{ scale: isValid ? 0.98 : 1 }}>
            <Button
              variant="accent"
              size="default"
              className={`w-full h-12 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                isValid ? 'shadow-float glow-lavender' : 'opacity-50'
              }`}
              disabled={!isValid}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </div>

      <PhotoSourceDialog
        isOpen={showPhotoSourceDialog}
        onClose={() => setShowPhotoSourceDialog(false)}
        onSelectCamera={handleCameraSelect}
        onSelectGallery={handleGallerySelect}
      />
    </div>
  );
};

// Profile Preview Card Component
interface ProfilePreviewCardProps {
  photo?: string;
  name: string;
  age: string;
  bio: string;
  vibes: string[];
}

const ProfilePreviewCard = ({ photo, name, age, bio, vibes }: ProfilePreviewCardProps) => {
  return (
    <motion.div 
      className="p-4 rounded-2xl glass-card shadow-glass glow-edge"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-[10px] text-muted-foreground font-semibold mb-3 uppercase tracking-wider">
        Your profile preview
      </p>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden glass-lavender border-2 border-primary/30 shrink-0 flex items-center justify-center shadow-glass">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-display font-semibold text-foreground truncate">
            {name || 'Your name'}{age ? `, ${age}` : ''}
          </h4>
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vibes.slice(0, 3).map((vibeId) => {
                const vibe = vibeOptions.find(v => v.id === vibeId);
                return (
                  <span 
                    key={vibeId}
                    className="px-1.5 py-0.5 rounded-md glass-lavender text-foreground/80 text-[9px] font-medium"
                  >
                    {vibe?.icon} {vibe?.label}
                  </span>
                );
              })}
            </div>
          )}
          {bio && (
            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{bio}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileScreen;