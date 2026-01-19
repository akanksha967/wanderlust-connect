import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, Camera, Plus, Sparkles } from "lucide-react";
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleBack = async () => {
    await signOut();
    setScreen("login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (photos.includes(dataUrl)) {
        toast({
          title: "Duplicate photo",
          description: "That photo is already added.",
          variant: "destructive",
        });
        return;
      }

      const updated = [...photos];
      updated[activePhotoIndex] = dataUrl;
      setPhotos(updated.filter(Boolean));
    };
    reader.readAsDataURL(file);
  };

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background with lavender overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')",
        }}
      />
      {/* Lavender gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[hsl(270,40%,60%,0.35)] via-[hsl(260,35%,50%,0.25)] to-[hsl(270,30%,40%,0.45)]" />
      <div className="fixed inset-0 backdrop-blur-sm" />
      
      {/* Floating ethereal orbs */}
      <motion.div 
        className="fixed top-20 right-16 w-40 h-40 rounded-full bg-[hsl(270,50%,80%,0.15)] blur-3xl pointer-events-none"
        animate={{ 
          y: [0, -15, 0], 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-32 left-10 w-32 h-32 rounded-full bg-[hsl(280,45%,75%,0.12)] blur-3xl pointer-events-none"
        animate={{ 
          y: [0, 12, 0], 
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="absolute -top-4 -left-4 w-11 h-11 rounded-full bg-[hsl(270,30%,95%,0.2)] backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(139,92,246,0.3)]"
        >
          <ArrowLeft size={18} />
        </motion.button>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-3xl bg-[hsl(270,30%,90%,0.12)] backdrop-blur-[14px] border border-white/15 shadow-[0_25px_60px_-15px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] p-6"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h1 className="text-xl font-semibold text-white/95 text-center tracking-tight">
              Create Profile
            </h1>
            <p className="text-xs text-[hsl(270,50%,85%,0.8)] text-center mb-6">Step 1 of 2</p>
          </motion.div>

          {/* Helper tip - pill-style glass banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-5 px-4 py-3 rounded-full bg-[hsl(270,40%,85%,0.15)] backdrop-blur-sm border border-[hsl(270,50%,80%,0.2)] text-white/90 flex items-center gap-2.5 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-[hsl(270,60%,80%)]" />
            </motion.div>
            <p className="text-xs">
              Profiles with photos get <strong className="text-white">3× more matches</strong>
            </p>
          </motion.div>

          {/* Photo slots */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex justify-center gap-4 mb-6"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setActivePhotoIndex(i);
                  setShowPhotoSourceDialog(true);
                }}
                className="w-[72px] h-[72px] rounded-2xl bg-[hsl(270,30%,95%,0.15)] backdrop-blur-sm border border-white/15 flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_8px_24px_-8px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.35),inset_0_2px_0_rgba(255,255,255,0.15)]"
              >
                {photos[i] ? (
                  <img src={photos[i]} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                ) : i === 0 ? (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Camera className="text-[hsl(270,40%,85%,0.7)]" size={22} />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="text-[hsl(270,40%,85%,0.6)]" size={20} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Form inputs - pill shaped with glass */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div className={`relative rounded-full transition-all duration-300 ${
              focusedInput === 'name' 
                ? 'shadow-[0_0_20px_-4px_rgba(139,92,246,0.4)]' 
                : ''
            }`}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Name"
                className="h-12 rounded-full bg-[hsl(270,30%,95%,0.12)] backdrop-blur-sm border border-white/15 text-white placeholder:text-white/40 px-5 focus:border-[hsl(270,50%,75%,0.4)] focus:ring-0 focus:ring-offset-0 transition-all duration-300"
              />
            </div>
            <div className={`relative rounded-full transition-all duration-300 ${
              focusedInput === 'age' 
                ? 'shadow-[0_0_20px_-4px_rgba(139,92,246,0.4)]' 
                : ''
            }`}>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onFocus={() => setFocusedInput('age')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Age"
                className="h-12 rounded-full bg-[hsl(270,30%,95%,0.12)] backdrop-blur-sm border border-white/15 text-white placeholder:text-white/40 px-5 focus:border-[hsl(270,50%,75%,0.4)] focus:ring-0 focus:ring-offset-0 transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* About textarea - glass style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className={`relative rounded-2xl transition-all duration-300 mb-5 ${
              focusedInput === 'bio' 
                ? 'shadow-[0_0_24px_-4px_rgba(139,92,246,0.4)]' 
                : ''
            }`}
          >
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedInput('bio')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Solo traveler heading to Bali..."
              className="w-full h-24 p-4 rounded-2xl bg-[hsl(270,30%,95%,0.12)] backdrop-blur-sm border border-white/15 text-white placeholder:text-white/35 resize-none focus:border-[hsl(270,50%,75%,0.4)] focus:outline-none focus:ring-0 transition-all duration-300"
            />
          </motion.div>

          {/* Travel style chips */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {vibeOptions.map((v, index) => {
              const isSelected = selectedVibes.includes(v.id);
              return (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleVibe(v.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${
                    isSelected 
                      ? "bg-[hsl(270,45%,65%,0.4)] border-[hsl(270,50%,75%,0.5)] text-white shadow-[0_4px_16px_-4px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]" 
                      : "bg-[hsl(270,30%,95%,0.1)] border-white/10 text-white/80 hover:bg-[hsl(270,30%,90%,0.15)] hover:border-white/20"
                  }`}
                >
                  {v.icon} {v.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.98 } : {}}
          >
            <Button
              disabled={!isValid}
              onClick={handleContinue}
              className={`w-full h-13 rounded-full text-base font-medium transition-all duration-500 border-0 ${
                isValid 
                  ? "bg-gradient-to-r from-[hsl(270,50%,65%)] via-[hsl(280,45%,70%)] to-[hsl(270,50%,65%)] text-white shadow-[0_12px_40px_-8px_rgba(139,92,246,0.5)] hover:shadow-[0_16px_50px_-8px_rgba(139,92,246,0.6)]" 
                  : "bg-[hsl(270,20%,50%,0.3)] text-white/50"
              }`}
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

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
