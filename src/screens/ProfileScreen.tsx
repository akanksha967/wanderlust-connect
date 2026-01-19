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
      {/* Lavender gradient overlay - enhanced wash */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(270,45%,55%,0.4)] via-[hsl(265,40%,50%,0.3)] to-[hsl(275,35%,45%,0.5)]" />
      <div className="fixed inset-0 bg-[hsl(270,30%,70%,0.08)]" />
      <div className="fixed inset-0 backdrop-blur-[2px]" />
      
      {/* Floating ethereal orbs - enhanced */}
      <motion.div 
        className="fixed top-16 right-12 w-48 h-48 rounded-full bg-[hsl(270,55%,75%,0.18)] blur-3xl pointer-events-none"
        animate={{ 
          y: [0, -20, 0], 
          opacity: [0.25, 0.45, 0.25],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="fixed bottom-24 left-8 w-36 h-36 rounded-full bg-[hsl(280,50%,72%,0.15)] blur-3xl pointer-events-none"
        animate={{ 
          y: [0, 15, 0], 
          opacity: [0.2, 0.38, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="fixed top-1/2 left-1/4 w-24 h-24 rounded-full bg-[hsl(265,45%,78%,0.12)] blur-2xl pointer-events-none"
        animate={{ 
          x: [0, 10, 0], 
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Back button - enhanced glass */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          whileHover={{ scale: 1.08, x: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleBack}
          className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-[hsl(270,35%,90%,0.18)] backdrop-blur-xl border border-[hsl(270,40%,85%,0.25)] text-white flex items-center justify-center shadow-[0_10px_36px_-8px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] transition-shadow duration-300 hover:shadow-[0_14px_44px_-8px_rgba(139,92,246,0.45)]"
        >
          <ArrowLeft size={18} />
        </motion.button>

        {/* Main Card - stronger glass effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-[28px] bg-[hsl(270,35%,92%,0.14)] backdrop-blur-[14px] border border-[hsl(270,40%,85%,0.2)] shadow-[0_30px_70px_-20px_rgba(139,92,246,0.3),0_10px_30px_-10px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.12)] p-7"
        >
          {/* Header - enhanced contrast */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <h1 className="text-[22px] font-semibold text-white text-center tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              Create Profile
            </h1>
            <p className="text-xs text-[hsl(270,60%,88%,0.9)] text-center mb-6 font-medium">Step 1 of 2</p>
          </motion.div>

          {/* Helper tip - pill-style glass banner with glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="mb-6 px-5 py-3.5 rounded-full bg-[hsl(270,45%,82%,0.18)] backdrop-blur-[12px] border border-[hsl(270,55%,78%,0.25)] text-white flex items-center gap-3 shadow-[0_6px_24px_-6px_rgba(139,92,246,0.25),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            <motion.div
              animate={{ 
                rotate: [0, 12, -12, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <Sparkles size={17} className="text-[hsl(270,70%,82%)] drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]" />
            </motion.div>
            <p className="text-[13px] text-white/95">
              Profiles with photos get <strong className="text-white font-semibold">3× more matches</strong>
            </p>
          </motion.div>

          {/* Photo slots - floating rounded tiles */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-5 mb-7"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -6, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActivePhotoIndex(i);
                  setShowPhotoSourceDialog(true);
                }}
                className="w-[76px] h-[76px] rounded-[20px] bg-[hsl(270,35%,92%,0.16)] backdrop-blur-[10px] border border-[hsl(270,45%,82%,0.22)] flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_10px_30px_-10px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_20px_rgba(167,139,250,0.05)] transition-all duration-400 hover:shadow-[0_16px_40px_-10px_rgba(139,92,246,0.4),inset_0_2px_0_rgba(255,255,255,0.18),inset_0_0_30px_rgba(167,139,250,0.08)] hover:border-[hsl(270,50%,78%,0.35)]"
              >
                {photos[i] ? (
                  <img src={photos[i]} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                ) : i === 0 ? (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Camera className="text-[hsl(270,50%,82%,0.8)] drop-shadow-[0_2px_8px_rgba(167,139,250,0.3)]" size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="text-[hsl(270,45%,80%,0.65)]" size={22} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Form inputs - pill shaped with enhanced glass */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="grid grid-cols-2 gap-4 mb-5"
          >
            <motion.div 
              className={`relative rounded-full transition-all duration-400 ${
                focusedInput === 'name' 
                  ? 'shadow-[0_0_24px_-4px_rgba(139,92,246,0.45),0_0_0_2px_rgba(167,139,250,0.15)]' 
                  : ''
              }`}
              whileFocus={{ scale: 1.01 }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="First name"
                className="h-[52px] rounded-full bg-[hsl(270,35%,93%,0.14)] backdrop-blur-[10px] border border-[hsl(270,45%,82%,0.2)] text-white placeholder:text-[hsl(270,40%,85%,0.5)] px-6 focus:border-[hsl(270,55%,75%,0.45)] focus:ring-0 focus:ring-offset-0 transition-all duration-400 text-[15px]"
              />
            </motion.div>
            <motion.div 
              className={`relative rounded-full transition-all duration-400 ${
                focusedInput === 'age' 
                  ? 'shadow-[0_0_24px_-4px_rgba(139,92,246,0.45),0_0_0_2px_rgba(167,139,250,0.15)]' 
                  : ''
              }`}
            >
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onFocus={() => setFocusedInput('age')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Age"
                className="h-[52px] rounded-full bg-[hsl(270,35%,93%,0.14)] backdrop-blur-[10px] border border-[hsl(270,45%,82%,0.2)] text-white placeholder:text-[hsl(270,40%,85%,0.5)] px-6 focus:border-[hsl(270,55%,75%,0.45)] focus:ring-0 focus:ring-offset-0 transition-all duration-400 text-[15px]"
              />
            </motion.div>
          </motion.div>

          {/* About textarea - glass style with enhanced padding */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
            className={`relative rounded-[20px] transition-all duration-400 mb-6 ${
              focusedInput === 'bio' 
                ? 'shadow-[0_0_28px_-6px_rgba(139,92,246,0.45),0_0_0_2px_rgba(167,139,250,0.12)]' 
                : ''
            }`}
          >
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedInput('bio')}
              onBlur={() => setFocusedInput(null)}
              placeholder="Solo traveler heading to Bali..."
              className="w-full h-28 p-5 rounded-[20px] bg-[hsl(270,35%,93%,0.14)] backdrop-blur-[10px] border border-[hsl(270,45%,82%,0.2)] text-white text-[15px] placeholder:text-[hsl(270,35%,80%,0.45)] resize-none focus:border-[hsl(270,55%,75%,0.45)] focus:outline-none focus:ring-0 transition-all duration-400 leading-relaxed"
            />
          </motion.div>

          {/* Travel style chips - translucent lavender pills */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="flex flex-wrap gap-2.5 mb-7"
          >
            {vibeOptions.map((v, index) => {
              const isSelected = selectedVibes.includes(v.id);
              return (
                <motion.button
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.52 + index * 0.035, ease: "easeOut" }}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleVibe(v.id)}
                  className={`px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-400 border backdrop-blur-[8px] ${
                    isSelected 
                      ? "bg-[hsl(270,50%,62%,0.45)] border-[hsl(270,55%,72%,0.55)] text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.5),0_0_0_1px_rgba(167,139,250,0.2),inset_0_1px_0_rgba(255,255,255,0.18)]" 
                      : "bg-[hsl(270,35%,92%,0.12)] border-[hsl(270,40%,85%,0.15)] text-white/85 hover:bg-[hsl(270,40%,88%,0.18)] hover:border-[hsl(270,45%,80%,0.25)] hover:shadow-[0_4px_12px_-4px_rgba(139,92,246,0.25)]"
                  }`}
                >
                  <span className="mr-1">{v.icon}</span> {v.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* CTA Button - wide pill with lavender gradient */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.58, ease: "easeOut" }}
          >
            <motion.div
              whileHover={isValid ? { scale: 1.02, y: -2 } : {}}
              whileTap={isValid ? { scale: 0.97 } : {}}
              transition={{ duration: 0.25 }}
            >
              <Button
                disabled={!isValid}
                onClick={handleContinue}
                className={`w-full h-14 rounded-full text-[15px] font-semibold transition-all duration-500 border-0 ${
                  isValid 
                    ? "bg-gradient-to-r from-[hsl(270,55%,62%)] via-[hsl(278,50%,68%)] to-[hsl(268,52%,64%)] text-white shadow-[0_14px_44px_-10px_rgba(139,92,246,0.55),0_4px_16px_-4px_rgba(139,92,246,0.3)] hover:shadow-[0_18px_54px_-10px_rgba(139,92,246,0.65),0_6px_20px_-4px_rgba(139,92,246,0.35)]" 
                    : "bg-[hsl(270,25%,55%,0.25)] text-white/45"
                }`}
              >
                Continue
              </Button>
            </motion.div>
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
