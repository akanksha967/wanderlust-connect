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
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-accent/20 via-background/80 to-background/95" />
      
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
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3 shrink-0">
        <button 
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-card/70 backdrop-blur-md border border-border/40 transition-all duration-200 hover:bg-card active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-display text-foreground">Create Profile</h1>
          <p className="text-[10px] text-muted-foreground">Step 1 of 2</p>
        </div>
      </div>

      {/* Main Content - Two column layout on desktop */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 relative z-10">
        <div className="max-w-3xl mx-auto flex flex-col lg:flex-row lg:gap-6">
          {/* Left Column - Form */}
          <div className="flex-1 flex flex-col gap-3 lg:max-w-md">
            {/* Helper Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-card/50 backdrop-blur-md border border-border/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] leading-relaxed text-foreground/80">
                  Profiles with photos get <span className="font-semibold text-foreground">3× more matches</span>. Help travelers get to know you!
                </p>
              </div>
            </motion.div>

            {/* Photo upload */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <label className="text-[11px] font-medium text-foreground mb-1.5 block">
                Add photos <span className="text-muted-foreground font-normal">(1-3)</span>
              </label>
              <div className="flex gap-2">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-card/70 backdrop-blur-md border border-border/40"
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
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-foreground/80 rounded-full flex items-center justify-center"
                        >
                          <X className="w-2 h-2 text-background" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handlePhotoClick(index)}
                        className="w-full h-full flex flex-col items-center justify-center gap-0.5"
                      >
                        {index === 0 ? (
                          <Camera className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-[8px] text-muted-foreground">Add</span>
                      </button>
                    )}
                    {index === 0 && photos[index] && (
                      <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-accent text-accent-foreground text-[7px] font-medium rounded">
                        Main
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Name & Age */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-2"
            >
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 block">First name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Akanksha"
                  className="h-8 rounded-lg bg-card/70 backdrop-blur-md border-border/40 text-xs placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-foreground mb-1 block">Age</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  className="h-8 rounded-lg bg-card/70 backdrop-blur-md border-border/40 text-xs placeholder:text-muted-foreground/50"
                />
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="text-[11px] font-medium text-foreground mb-1 block">About you</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Solo traveler heading to Bali. Love photography & cafes."
                className="w-full h-12 p-2 rounded-lg bg-card/70 backdrop-blur-md border border-border/40 resize-none text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Keep it short — helps others feel comfortable reaching out.
              </p>
            </motion.div>

            {/* Travel vibes */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-2.5 rounded-xl bg-card/40 backdrop-blur-md border border-border/30"
            >
              <div className="mb-2">
                <h3 className="text-[11px] font-medium text-foreground">How do you like to travel?</h3>
                <p className="text-[9px] text-muted-foreground">Select up to 4</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {vibeOptions.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  return (
                    <motion.button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all duration-150 flex items-center gap-0.5 ${
                        isSelected
                          ? 'gradient-accent text-accent-foreground shadow-sm'
                          : 'bg-card/70 text-muted-foreground border border-border/40'
                      }`}
                    >
                      <span>{vibe.icon}</span>
                      <span>{vibe.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile Preview (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="hidden lg:block lg:w-64 lg:sticky lg:top-0 shrink-0"
          >
            <ProfilePreviewCard
              photo={photos[0]}
              name={name}
              age={age}
              bio={previewBio}
              vibes={selectedVibes}
            />
          </motion.div>

          {/* Mobile Profile Preview */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:hidden mt-3"
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
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[9px] text-muted-foreground mb-1.5">
            Step 1 of 2 • Takes less than a minute
          </p>
          <motion.div whileTap={{ scale: isValid ? 0.98 : 1 }}>
            <Button
              variant="accent"
              size="default"
              className={`w-full h-10 text-sm font-medium transition-all duration-200 ${
                isValid ? 'shadow-glow' : 'opacity-50'
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
    <div className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border/30">
      <p className="text-[9px] text-muted-foreground font-medium mb-2 uppercase tracking-wide">
        Your profile preview
      </p>
      <div className="flex items-start gap-2.5">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/50 border border-border/40 shrink-0 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display text-foreground truncate">
            {name || 'Your name'}{age ? `, ${age}` : ''}
          </h4>
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {vibes.slice(0, 3).map((vibeId) => {
                const vibe = vibeOptions.find(v => v.id === vibeId);
                return (
                  <span 
                    key={vibeId}
                    className="px-1 py-0.5 rounded bg-accent/20 text-accent text-[8px] font-medium"
                  >
                    {vibe?.icon} {vibe?.label}
                  </span>
                );
              })}
            </div>
          )}
          {bio && (
            <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{bio}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
