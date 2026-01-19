import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, Camera, Plus } from "lucide-react";
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

const MAX_VIBES = 4;

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
    reader.onload = () => {
      const dataUrl = reader.result as string;

      if (photos.includes(dataUrl)) {
        toast({
          title: "Duplicate photo",
          description: "This photo is already added.",
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
    setSelectedVibes((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= MAX_VIBES) return prev;
      return [...prev, id];
    });
  };

  const isValid = name.trim().length > 0 && Number(age) >= 18 && photos.length > 0 && selectedVibes.length > 0;

  const handleContinue = () => {
    if (!isValid) return;

    setUserProfile({
      name: name.trim(),
      age: Number(age),
      bio: bio.trim(),
      photos,
      travelVibes: selectedVibes,
    });

    useAppStore.getState().setHasCompletedProfile(true);
    setScreen("travel");
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/40 via-purple-400/30 to-purple-600/40" />
      <div className="fixed inset-0 backdrop-blur-sm" />

      {/* Back Arrow */}
      <button
        onClick={handleBack}
        className="fixed top-6 left-6 z-20 w-11 h-11 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center text-white shadow-lg"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="rounded-[28px] bg-white/15 backdrop-blur-xl border border-white/20 shadow-2xl p-5">
          <h1 className="text-lg font-semibold text-white text-center">Create Profile</h1>
          <p className="text-xs text-white/70 text-center mb-5">Step 1 of 2</p>

          {/* Photos */}
          <div className="flex justify-center gap-3 mb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                onClick={() => {
                  setActivePhotoIndex(i);
                  setShowPhotoSourceDialog(true);
                }}
                className="w-[72px] h-[72px] rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {photos[i] ? (
                  <img src={photos[i]} className="w-full h-full object-cover" alt="" />
                ) : i === 0 ? (
                  <Camera className="text-white/70" />
                ) : (
                  <Plus className="text-white/50" />
                )}
              </div>
            ))}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="h-11 rounded-full bg-white/20 border-white/25 text-white placeholder:text-white/50"
            />
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="h-11 rounded-full bg-white/20 border-white/25 text-white placeholder:text-white/50 appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Solo traveler heading to Bali..."
            className="w-full h-20 p-4 rounded-2xl bg-white/20 border border-white/25 text-white placeholder:text-white/50 resize-none mb-4"
          />

          {/* Vibes */}
          <div className="flex flex-wrap gap-2 mb-5">
            {vibeOptions.map((v) => {
              const active = selectedVibes.includes(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggleVibe(v.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    active
                      ? "bg-purple-500/60 border-purple-300 text-white"
                      : "bg-white/15 border-white/20 text-white/80"
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <Button
            disabled={!isValid}
            onClick={handleContinue}
            className={`w-full h-12 rounded-full font-semibold ${
              isValid ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white" : "bg-white/20 text-white/40"
            }`}
          >
            Continue
          </Button>
        </div>
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
