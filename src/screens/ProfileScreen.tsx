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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;
        if (photos.some((p, i) => p === dataUrl && i !== activePhotoIndex)) {
          toast({ title: "Duplicate photo", variant: "destructive" });
          return;
        }
        const newPhotos = [...photos];
        if (activePhotoIndex < newPhotos.length) newPhotos[activePhotoIndex] = dataUrl;
        else newPhotos.push(dataUrl);
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVibe = (vibeId: string) => {
    if (selectedVibes.includes(vibeId)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibeId));
    } else if (selectedVibes.length < 4) {
      setSelectedVibes([...selectedVibes, vibeId]);
    }
  };

  const handleContinue = () => {
    setUserProfile({ name, age: parseInt(age), bio, photos, travelVibes: selectedVibes });
    useAppStore.getState().setHasCompletedProfile(true);
    setScreen("travel");
  };

  const isValid = name && age && photos.length > 0 && selectedVibes.length > 0;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(270,40%,85%)]/80 via-[hsl(280,35%,80%)]/70 to-[hsl(260,45%,75%)]/80" />

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <div className="relative z-10 w-full max-w-md mx-4 my-8 max-h-[90dvh] flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[26px] bg-white/15 backdrop-blur-[20px] border border-white/30 shadow-2xl"
        >
          <div className="overflow-y-auto max-h-[calc(90dvh-40px)] p-6 overscroll-contain">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="text-center mb-6">
                <h1 className="text-xl font-semibold text-zinc-100">Create Profile</h1>
                <p className="text-xs text-zinc-400 font-medium">Step 1 of 2</p>
              </motion.div>

              {/* Photo Upload Area */}
              <motion.div variants={itemVariants} className="mb-6">
                <label className="text-xs font-semibold text-zinc-300 mb-2.5 block">Add photos</label>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-2xl bg-white/10 border border-white/20 overflow-hidden"
                    >
                      {photos[index] ? (
                        <img src={photos[index]} className="w-full h-full object-cover" />
                      ) : (
                        <button
                          onClick={() => handlePhotoClick(index)}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5 text-zinc-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Inputs with Black Font */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 mb-1.5 block">First name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Akanksha"
                    className="h-11 rounded-xl bg-white/90 border-0 text-zinc-900 placeholder:text-zinc-500 font-medium focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 mb-1.5 block">Age</label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-11 rounded-xl bg-white/90 border-0 text-zinc-900 font-medium focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-5">
                <label className="text-xs font-medium text-zinc-300 mb-1.5 block">About you</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about your travel style..."
                  className="w-full h-20 p-3 rounded-xl bg-white/90 border-0 text-zinc-900 placeholder:text-zinc-500 font-medium focus:ring-2 focus:ring-purple-400 resize-none outline-none text-sm"
                />
              </motion.div>

              {/* Vibes Selection */}
              <motion.div variants={itemVariants} className="p-4 rounded-2xl bg-white/10 border border-white/10 mb-6">
                <h3 className="text-xs font-medium text-zinc-200 mb-3">How do you like to travel?</h3>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => {
                    const isSelected = selectedVibes.includes(vibe.id);
                    return (
                      <button
                        key={vibe.id}
                        onClick={() => toggleVibe(vibe.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                          isSelected
                            ? "bg-white text-zinc-900 border-white"
                            : "bg-white/5 text-zinc-300 border-white/10"
                        }`}
                      >
                        {vibe.icon} {vibe.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  disabled={!isValid}
                  onClick={handleContinue}
                  className={`w-full h-12 rounded-xl font-bold transition-all ${
                    isValid ? "bg-zinc-100 text-zinc-900 hover:bg-white" : "bg-white/10 text-zinc-500"
                  }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <PhotoSourceDialog
        isOpen={showPhotoSourceDialog}
        onClose={() => setShowPhotoSourceDialog(false)}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectGallery={() => galleryInputRef.current?.click()}
      />
    </div>
  );
};

export default ProfileScreen;
