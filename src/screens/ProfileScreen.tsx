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
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80')",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(270,40%,85%)]/80 via-[hsl(280,35%,80%)]/70 to-[hsl(260,45%,75%)]/80" />
      <div className="fixed inset-0 bg-gradient-to-t from-[hsl(270,30%,20%)]/40 via-transparent to-transparent" />

      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 my-8">
        <button
          onClick={handleBack}
          className="absolute -top-2 -left-2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-white/90" />
        </button>

        <div className="rounded-[26px] bg-white/12 backdrop-blur-[16px] border border-white/20 shadow-2xl p-6">
          <h1 className="text-xl font-display font-semibold text-white text-center">Create Profile</h1>
          <p className="text-xs text-white/75 text-center mb-6">Step 1 of 2</p>

          {/* Helper */}
          <div className="mb-5 p-3.5 rounded-2xl bg-white/8 border border-white/10 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-white/90" />
            <p className="text-xs text-white/80">
              Profiles with photos get <span className="font-semibold text-white">3× more matches</span>
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
                className="w-[76px] h-[76px] rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {photos[i] ? (
                  <img src={photos[i]} className="w-full h-full object-cover" />
                ) : i === 0 ? (
                  <Camera className="text-white/90" />
                ) : (
                  <Plus className="text-white/90" />
                )}
              </div>
            ))}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="bg-white/80 text-gray-900 placeholder:text-gray-500"
            />
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="bg-white/80 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Solo traveler heading to Bali..."
            className="w-full h-[72px] p-3.5 rounded-2xl bg-white/80 text-gray-900 placeholder:text-gray-500 mb-4"
          />

          {/* Vibes */}
          <div className="flex flex-wrap gap-2 mb-6">
            {vibeOptions.map((v) => (
              <button
                key={v.id}
                onClick={() => toggleVibe(v.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium ${
                  selectedVibes.includes(v.id) ? "bg-[hsl(270,50%,60%)] text-white" : "bg-white/10 text-white/80"
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <Button
            disabled={!isValid}
            onClick={handleContinue}
            className={`w-full h-12 rounded-2xl font-semibold ${
              isValid
                ? "bg-gradient-to-r from-[hsl(270,50%,60%)] to-[hsl(280,55%,65%)] text-white"
                : "bg-white/10 text-white/40"
            }`}
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
