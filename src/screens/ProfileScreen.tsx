import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')",
        }}
      />
      <div className="fixed inset-0 bg-white/30 backdrop-blur-xl" />

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Back */}
        <button
          onClick={handleBack}
          className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Card */}
        <div className="rounded-3xl bg-white/15 backdrop-blur-2xl border border-white/30 shadow-2xl p-6">
          <h1 className="text-xl font-semibold text-white drop-shadow-[0_1px_6px_rgba(255,255,255,0.35)] text-center">
            Create Profile
          </h1>
          <p className="text-xs text-white/90 text-center mb-6">Step 1 of 2</p>

          {/* Helper */}
          <div className="mb-5 p-3 rounded-2xl bg-white/70 text-zinc-900 flex items-center gap-2">
            <Sparkles size={16} />
            <p className="text-xs">
              Profiles with photos get <strong>3× more matches</strong>
            </p>
          </div>

          {/* Photos */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                onClick={() => {
                  setActivePhotoIndex(i);
                  setShowPhotoSourceDialog(true);
                }}
                className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden cursor-pointer shadow"
              >
                {photos[i] ? (
                  <img src={photos[i]} className="w-full h-full object-cover" />
                ) : i === 0 ? (
                  <Camera className="text-zinc-400" />
                ) : (
                  <Plus className="text-zinc-400" />
                )}
              </div>
            ))}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="bg-white text-zinc-900 placeholder:text-zinc-400"
            />
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="bg-white text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Solo traveler heading to Bali..."
            className="w-full h-20 p-3 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 mb-4"
          />

          {/* Vibes */}
          <div className="flex flex-wrap gap-2 mb-6">
            {vibeOptions.map((v) => (
              <button
                key={v.id}
                onClick={() => toggleVibe(v.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  selectedVibes.includes(v.id) ? "bg-black text-white" : "bg-white text-zinc-700"
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <Button
            disabled={!isValid}
            onClick={handleContinue}
            className="w-full h-12 rounded-xl bg-black text-white shadow-[0_8px_30px_rgba(255,255,255,0.25)]"
          >
            Continue
          </Button>
        </div>
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
