import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, Camera, Plus, X, Sparkles, User } from "lucide-react";
import PhotoSourceDialog from "@/components/PhotoSourceDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const vibeOptions = [
  { id: "Adventure", icon: "🏔️", label: "Adventure" },
  { id: "Relaxation", icon: "🌴", label: "Relaxation" },
  { id: "Culture", icon: "🏛️", label: "Culture" },
  { id: "Foodie", icon: "🍜", label: "Foodie" },
  { id: "Nature", icon: "🌿", label: "Nature" },
  { id: "Nightlife", icon: "🎶", label: "Nightlife" },
  { id: "Photography", icon: "📸", label: "Photography" },
  { id: "Budget", icon: "💰", label: "Budget" },
  { id: "Luxury", icon: "✨", label: "Luxury" },
  { id: "Solo", icon: "🧍", label: "Solo" },
];

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const ProfileScreen = () => {
  const { setScreen, setUserProfile } = useAppStore();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showPhotoSourceDialog, setShowPhotoSourceDialog] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const handleBack = async () => {
    await signOut();
    setScreen("login");
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
            title: "Duplicate photo",
            description: "That photo is already added. Please pick a different one.",
            variant: "destructive",
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
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleVibe = (vibeId: string) => {
    if (selectedVibes.includes(vibeId)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibeId));
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
    setScreen("travel");
  };

  const isValid = name && age && photos.length > 0 && selectedVibes.length > 0;
  const previewBio = bio.length > 80 ? bio.substring(0, 80) + "..." : bio;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Lavender Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')`,
        }}
      />
      {/* Soft lavender gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(270,40%,85%)]/80 via-[hsl(280,35%,80%)]/70 to-[hsl(260,45%,75%)]/80" />
      <div className="fixed inset-0 bg-gradient-to-t from-[hsl(270,30%,20%)]/40 via-transparent to-transparent" />

      {/* Dreamy floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[hsl(270,60%,75%)]/30 blur-[80px]"
        />
        <motion.div
          animate={{
            y: [0, 25, 0],
            x: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-5 w-80 h-80 rounded-full bg-[hsl(280,50%,70%)]/25 blur-[60px]"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-[hsl(265,55%,80%)]/20 blur-[50px]"
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
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Main Centered Card Container */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8 max-h-[90dvh] flex flex-col">
        {/* Back Button - Floating outside card */}
        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -top-2 -left-2 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg shadow-[hsl(270,30%,20%)]/20 transition-all duration-300 hover:bg-white/25 z-20"
        >
          <ArrowLeft className="w-4 h-4 text-white/20" />
        </motion.button>

        {/* Main Floating Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[26px] bg-white/12 backdrop-blur-[16px] border border-white/20 shadow-2xl shadow-[hsl(270,40%,15%)]/30"
          style={{
            boxShadow: `
              0 25px 60px -15px hsl(270 40% 20% / 0.35),
              0 10px 25px -10px hsl(270 30% 15% / 0.2),
              inset 0 1px 1px hsl(0 0% 100% / 0.15)
            `,
          }}
        >
          {/* Subtle inner glow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-gradient-to-b from-white/10 to-transparent blur-xl" />

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90dvh-80px)] overscroll-contain">
            <motion.div className="p-6" variants={containerVariants} initial="hidden" animate="visible">
              {/* Header inside card */}
              <motion.div variants={itemVariants} className="text-center mb-5">
                <h1 className="text-xl font-display font-semibold text-white/80 drop-shadow-sm">Create Profile</h1>
                <p className="text-xs text-white/70 font-medium mt-0.5">Step 1 of 2</p>
              </motion.div>

              {/* Helper Card */}
              <motion.div
                variants={itemVariants}
                className="p-3.5 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 mb-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(270,50%,70%)]/30 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                    <Sparkles className="w-4 h-4 text-white/70" />
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">
                    Profiles with photos get <span className="font-semibold text-white/80">3× more matches</span>
                  </p>
                </div>
              </motion.div>

              {/* Photo upload */}
              <motion.div variants={itemVariants} className="mb-5">
                <label className="text-xs font-medium text-white/80 mb-2.5 block">
                  Add photos <span className="text-white/60 font-normal">(1-3)</span>
                </label>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="relative w-[76px] h-[76px] rounded-2xl overflow-hidden bg-white/8 backdrop-blur-md border border-white/15 shadow-lg shadow-[hsl(270,30%,15%)]/20 transition-all duration-300 hover:border-white/30 hover:bg-white/12 group"
                    >
                      {/* Inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                      {photos[index] ? (
                        <>
                          <img src={photos[index]} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/10 hover:bg-black/80 transition-colors"
                          >
                            <X className="w-2.5 h-2.5 text-white/80" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePhotoClick(index)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5 relative z-10"
                        >
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors"
                          >
                            {index === 0 ? (
                              <Camera className="w-4 h-4 text-white/70" />
                            ) : (
                              <Plus className="w-4 h-4 text-white/70" />
                            )}
                          </motion.div>
                          <span className="text-[10px] text-white/50 font-medium">Add</span>
                        </button>
                      )}
                      {index === 0 && photos[index] && (
                        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-[hsl(270,50%,60%)]/90 backdrop-blur-sm text-white/80 text-[8px] font-semibold rounded-md shadow-sm border border-white/20">
                          Main
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Name & Age */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-white/80 mb-1.5 block">First name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John"
                    className="h-11 rounded-2xl bg-white/80 backdrop-blur-md border-0 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[hsl(270,50%,70%)]/50 focus:bg-white/90 transition-all duration-300 px-4"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/80 mb-1.5 block">Age</label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age"
                    className="h-11 rounded-2xl bg-white/80 backdrop-blur-md border-0 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[hsl(270,50%,70%)]/50 focus:bg-white/90 transition-all duration-300 px-4"
                  />
                </div>
              </motion.div>

              {/* Bio */}
              <motion.div variants={itemVariants} className="mb-5">
                <label className="text-xs font-medium text-white/80 mb-1.5 block">About you</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Solo traveler heading to Bali. Love photography & cafes."
                  className="w-full h-[72px] p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border-0 resize-none text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(270,50%,70%)]/50 focus:bg-white/90 transition-all duration-300"
                />
                <p className="text-[10px] text-white/60 mt-1.5">
                  Keep it short — helps others feel comfortable reaching out.
                </p>
              </motion.div>

              {/* Travel vibes */}
              <motion.div
                variants={itemVariants}
                className="p-4 rounded-2xl bg-white/6 backdrop-blur-md border border-white/10"
              >
                <div className="mb-3">
                  <h3 className="text-xs font-medium text-white/80">How do you like to travel?</h3>
                  <p className="text-[10px] text-white/60">Select up to 4</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe, index) => {
                    const isSelected = selectedVibes.includes(vibe.id);
                    return (
                      <motion.button
                        key={vibe.id}
                        onClick={() => toggleVibe(vibe.id)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.03 }}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[hsl(270,50%,60%)] text-white/80 shadow-lg shadow-[hsl(270,50%,50%)]/30 border border-white/20"
                            : "bg-white/8 text-white/60 border border-white/10 hover:bg-white/15 hover:text-white/70"
                        }`}
                      >
                        <span>{vibe.icon}</span>
                        <span>{vibe.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Profile Preview */}
              <motion.div variants={itemVariants} className="mt-5">
                <ProfilePreviewCard photo={photos[0]} name={name} age={age} bio={previewBio} vibes={selectedVibes} />
              </motion.div>

              {/* Continue Button */}
              <motion.div variants={itemVariants} className="mt-5">
                <p className="text-center text-[10px] text-white/60 mb-2.5 font-medium">
                  Step 1 of 2 • Takes less than a minute
                </p>
                <motion.div whileHover={{ scale: isValid ? 1.02 : 1 }} whileTap={{ scale: isValid ? 0.98 : 1 }}>
                  <Button
                    variant="default"
                    size="default"
                    className={`w-full h-12 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                      isValid
                        ? "bg-gradient-to-r from-[hsl(270,50%,60%)] to-[hsl(280,55%,65%)] hover:from-[hsl(270,55%,65%)] hover:to-[hsl(280,60%,70%)] text-white/80 shadow-lg shadow-[hsl(270,50%,50%)]/40 border border-white/20"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                    disabled={!isValid}
                    onClick={handleContinue}
                  >
                    Continue
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
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
      className="p-4 rounded-2xl bg-white/6 backdrop-blur-md border border-white/10"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-[10px] text-white/40 font-semibold mb-3 uppercase tracking-wider">Your profile preview</p>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shrink-0 flex items-center justify-center shadow-lg shadow-[hsl(270,30%,15%)]/20">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-white/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-display font-semibold text-white/80 truncate drop-shadow-sm">
            {name || "Your name"}
            {age ? `, ${age}` : ""}
          </h4>
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vibes.slice(0, 3).map((vibeId) => {
                const vibe = vibeOptions.find((v) => v.id === vibeId);
                return (
                  <span
                    key={vibeId}
                    className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 text-[9px] font-medium border border-white/10"
                  >
                    {vibe?.icon} {vibe?.label}
                  </span>
                );
              })}
            </div>
          )}
          {bio && <p className="text-[10px] text-white/40 mt-1.5 line-clamp-2">{bio}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileScreen;
