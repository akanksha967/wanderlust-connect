import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Camera, Plus, X, Settings, Trash2, Sparkles, User } from 'lucide-react';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';
import PhotoSourceDialog from '@/components/PhotoSourceDialog';
import { useToast } from '@/hooks/use-toast';

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
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoSourceDialog, setShowPhotoSourceDialog] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

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

        // Prevent duplicate photos (but allow re-selecting the same photo for the same slot)
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
    // Reset file inputs
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

  const handleAccountDeleted = () => {
    setScreen('login');
  };

  const isValid = name && age && photos.length > 0 && selectedVibes.length > 0;

  // Get preview bio (first 2 lines or ~100 chars)
  const previewBio = bio.length > 100 ? bio.substring(0, 100) + '...' : bio;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Full-screen background like Apple homescreen */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-accent/30 via-background/70 to-background/80 backdrop-blur-[2px]" />
      
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
      <div className="relative z-10 px-4 pt-6 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen('login')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/80 backdrop-blur-md border border-border/50 transition-all duration-300 hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-display text-foreground">Create Profile</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Step 1 of 2</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/80 backdrop-blur-md border border-border/50 transition-all duration-300 hover:bg-card"
        >
          <Settings className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-2 p-3 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shrink-0 relative z-10"
          >
            <h3 className="text-xs font-medium text-foreground mb-2">Account Settings</h3>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-medium">Delete Account</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 pb-20 relative z-10 flex flex-col lg:flex-row lg:gap-6">
        {/* Form Column */}
        <div className="flex-1 flex flex-col lg:max-w-md">
          {/* Helper Card - Frosted Glass */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 shadow-soft shrink-0"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/80">
                Profiles with photos and clear travel vibes get up to <span className="font-semibold text-foreground">3× more matches</span>. Take one minute to help fellow travelers get to know you.
              </p>
            </div>
          </motion.div>

          {/* Photo upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-3 shrink-0"
          >
            <label className="text-xs font-medium text-foreground mb-2 block">
              Add photos <span className="text-muted-foreground font-normal">(1-3)</span>
            </label>
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-card/80 backdrop-blur-md border border-border/50 shadow-soft"
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
                        className="absolute top-1 right-1 w-5 h-5 bg-foreground/80 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      >
                        <X className="w-2.5 h-2.5 text-background" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handlePhotoClick(index)}
                      className="w-full h-full flex flex-col items-center justify-center gap-0.5 transition-all hover:bg-card/90"
                    >
                      {index === 0 ? (
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-[9px] text-muted-foreground">Add</span>
                    </button>
                  )}
                  {index === 0 && photos[index] && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-accent text-accent-foreground text-[8px] font-medium rounded-full">
                      Main
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Name & Age */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-2 mb-2 shrink-0"
          >
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                First name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Akanksha"
                className="h-9 rounded-lg bg-card/80 backdrop-blur-md border-border/50 shadow-soft text-sm placeholder:text-muted-foreground/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Age
              </label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
                className="h-9 rounded-lg bg-card/80 backdrop-blur-md border-border/50 shadow-soft text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-2 shrink-0"
          >
            <label className="text-xs font-medium text-foreground mb-1 block">
              About you
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Solo traveler heading to Bali in Feb. Love photography, cafes, slow travel & meeting new people."
              className="w-full h-14 p-2.5 rounded-lg bg-card/80 backdrop-blur-md border border-border/50 shadow-soft resize-none text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Keep it short and friendly — this helps others feel comfortable reaching out.
            </p>
          </motion.div>

          {/* Travel vibes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="shrink-0 p-3 rounded-xl bg-card/40 backdrop-blur-md border border-border/30"
          >
            <div className="mb-2">
              <h3 className="text-xs font-medium text-foreground">How do you like to travel?</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Select up to 4 — we use this to match you better.</p>
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
                        ? 'gradient-accent text-accent-foreground shadow-soft ring-2 ring-accent/30'
                        : 'bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    <span>{vibe.icon}</span>
                    <span>{vibe.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Mobile Profile Preview - Shows below form on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 lg:hidden shrink-0"
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

        {/* Desktop Profile Preview - Shows on right side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden lg:block lg:w-64 shrink-0"
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

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-5 bg-gradient-to-t from-background via-background to-transparent z-10">
        <p className="text-center text-[10px] text-muted-foreground mb-2">
          Step 1 of 2 • Takes less than a minute
        </p>
        <motion.div
          whileHover={{ scale: isValid ? 1.01 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
        >
          <Button
            variant="accent"
            size="default"
            className={`w-full h-11 text-sm font-medium transition-all duration-300 ${
              isValid 
                ? 'shadow-glow hover:shadow-float' 
                : 'opacity-50'
            }`}
            disabled={!isValid}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </motion.div>
      </div>

      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={handleAccountDeleted}
      />

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
  const displayVibes = vibes.slice(0, 3);
  
  return (
    <div className="p-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 shadow-card">
      <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wide">
        Your profile preview
      </p>
      <div className="flex items-start gap-3">
        {/* Photo */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary/50 border-2 border-border/50 shrink-0 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display text-foreground truncate">
            {name || 'Your name'}{age ? `, ${age}` : ''}
          </h4>
          
          {/* Vibes */}
          {displayVibes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {displayVibes.map((vibeId) => {
                const vibe = vibeOptions.find(v => v.id === vibeId);
                return (
                  <span 
                    key={vibeId}
                    className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[9px] font-medium"
                  >
                    {vibe?.icon} {vibe?.label}
                  </span>
                );
              })}
            </div>
          )}
          
          {/* Bio preview */}
          {bio && (
            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
