import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Calendar,
  LogOut,
  Trash2,
  ChevronRight,
  Edit2,
  X,
  Plus,
  Loader2,
  Shield,
} from "lucide-react";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import PhotoSourceDialog from "@/components/PhotoSourceDialog";
import InviteFriendsCard from "@/components/InviteFriendsCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const vibeOptions = [
  "Adventure",
  "Relaxation",
  "Culture",
  "Foodie",
  "Nature",
  "Nightlife",
  "Photography",
  "Budget",
  "Luxury",
  "Solo",
];

const AccountScreen = () => {
  const { setScreen, userProfile, travelDetails, setTravelDetails, setUserProfile } = useAppStore();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoSourceDialog, setShowPhotoSourceDialog] = useState(false);
  const [editingTravel, setEditingTravel] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [destination, setDestination] = useState(travelDetails?.destination || "");
  const [startDate, setStartDate] = useState(travelDetails?.startDate || "");
  const [endDate, setEndDate] = useState(travelDetails?.endDate || "");

  // Profile editing state - initialized empty, will be populated from DB
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(userProfile.travelVibes || []);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch profile data from database on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [roleResponse, profileResponse] = await Promise.all([
          // 1. Check if user is admin (Parallel)
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle(),

          // 2. Get profile and all related data in ONE query (Parallel)
          supabase
            .from("profiles")
            .select(`
              id, name, age, bio,
              photos (url, is_primary),
              travel_vibes (vibe),
              travel_plans (destination, start_date, end_date, is_active)
            `)
            .eq("user_id", user.id)
            .maybeSingle()
        ]);

        setIsAdmin(!!roleResponse.data);

        // Type checking for the joined response can be tricky, casting to any for flexibility in this optimization
        const profile = profileResponse.data as any;

        if (profile) {
          // Process Photos - Sort by is_primary desc in JS since it's hard to order joined relations in select string without specific syntax
          const sortedPhotos = (profile.photos || [])
            .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
            .map((p: any) => p.url);

          // Process Vibes
          const vibes = (profile.travel_vibes || []).map((v: any) => v.vibe);

          // Process Travel Plan - Find the active one
          const activePlan = (profile.travel_plans || []).find((tp: any) => tp.is_active);

          // Update local state
          setName(profile.name || "");
          setAge(profile.age?.toString() || "");
          setBio(profile.bio || "");
          setPhotos(sortedPhotos);
          setSelectedVibes(vibes);

          // Update global store
          setUserProfile({
            id: profile.id,
            name: profile.name,
            age: profile.age || undefined,
            bio: profile.bio || "",
            photos: sortedPhotos,
            travelVibes: vibes,
          });

          // Update travel details
          if (activePlan) {
            const travelInfo = {
              destination: activePlan.destination,
              startDate: activePlan.start_date,
              endDate: activePlan.end_date,
            };
            setDestination(activePlan.destination);
            setStartDate(activePlan.start_date);
            setEndDate(activePlan.end_date);
            setTravelDetails(travelInfo);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, setUserProfile, setTravelDetails]);

  const handleAccountDeleted = () => {
    setScreen("login");
  };

  const handleSignOut = async () => {
    await signOut();
    setScreen("login");
  };

  const handleSaveTravel = () => {
    setTravelDetails({
      destination,
      startDate,
      endDate,
    });
    setEditingTravel(false);
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
    if (file && activePhotoIndex !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string | undefined;
        if (!dataUrl) return;

        // Prevent duplicate photos (but allow re-selecting the same photo for the same slot)
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
    // Reset file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibe));
    } else if (selectedVibes.length < 4) {
      setSelectedVibes([...selectedVibes, vibe]);
    }
  };

  const handleSaveProfile = () => {
    setUserProfile({
      name,
      age: parseInt(age),
      bio,
      photos,
      travelVibes: selectedVibes,
    });
    setEditingProfile(false);
  };

  const handleCancelProfileEdit = () => {
    setName(userProfile.name || "");
    setAge(userProfile.age?.toString() || "");
    setBio(userProfile.bio || "");
    setPhotos(userProfile.photos || []);
    setSelectedVibes(userProfile.travelVibes || []);
    setEditingProfile(false);
  };

  const isProfileValid =
    name && age && Number(age) >= 18 && Number(age) <= 99 && photos.length > 0 && selectedVibes.length > 0;

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Full-screen nature background - lighter lavender-blue */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-300/45 via-blue-200/40 to-lavender-300/45" />
      <div className="fixed inset-0 backdrop-blur-sm" />
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 right-6 z-50 flex items-center gap-3"
      >
        <button
          onClick={() => setScreen("swipe")}
          className="h-11 w-11 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-all hover:bg-white/50"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-serif text-white drop-shadow-lg">My Account</h1>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-24 relative z-10 h-full">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_30px_80px_rgba(0,0,0,0.15)] mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white drop-shadow">Profile</h3>
            <button
              onClick={() => (editingProfile ? handleCancelProfileEdit() : setEditingProfile(true))}
              className="text-xs text-white/90 font-medium hover:text-white drop-shadow"
            >
              {editingProfile ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/80 mb-2 block drop-shadow">
                  Photos (1-3) - Tap to add from camera or gallery
                </label>
                <div className="flex gap-3">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/40 border border-white/30 shadow-lg"
                    >
                      {photos[index] ? (
                        <>
                          <img src={photos[index]} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-foreground/80 rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-background" />
                          </button>
                          <button
                            onClick={() => handlePhotoClick(index)}
                            className="absolute bottom-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
                          >
                            <Edit2 className="w-3 h-3 text-accent-foreground" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePhotoClick(index)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/50"
                        >
                          {index === 0 ? (
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="text-[10px] text-white/70">Add</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Name & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/80 mb-1 block drop-shadow">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-10 rounded-xl bg-white/80 border border-white/50 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/80 mb-1 block drop-shadow">Age </label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (Number(val) >= 0 && Number(val) <= 99)) {
                        setAge(val);
                      }
                    }}
                    min={18}
                    max={99}
                    placeholder="Age"
                    className="h-10 rounded-xl bg-white/80 border border-white/50 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs text-white/80 mb-1 block drop-shadow">Bio ({bio.length}/300)</label>
                <textarea
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setBio(e.target.value);
                    }
                  }}
                  maxLength={300}
                  placeholder="Tell fellow travelers about yourself..."
                  className="w-full h-20 p-3 rounded-xl bg-white/80 border border-white/50 resize-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </div>

              {/* Travel vibes */}
              <div>
                <label className="text-xs text-white/80 mb-2 block drop-shadow">Travel vibes (select up to 4)</label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => (
                    <button
                      key={vibe}
                      onClick={() => toggleVibe(vibe)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedVibes.includes(vibe)
                        ? "bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 text-white shadow-lg"
                        : "bg-white/50 border border-white/40 text-gray-700 hover:bg-white/60"
                        }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50"
                onClick={handleSaveProfile}
                disabled={!isProfileValid}
              >
                Save Profile
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {userProfile.photos?.[0] ? (
                    <img src={userProfile.photos[0]} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/40 border border-white/30 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg text-white drop-shadow">{userProfile.name || "Traveler"}</h2>
                  <p className="text-sm text-white/80 drop-shadow">{user?.phone || user?.email || "No contact info"}</p>
                  {userProfile.age && (
                    <p className="text-xs text-white/70 mt-1 drop-shadow">{userProfile.age} years old</p>
                  )}
                </div>
              </div>

              {userProfile.bio && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-sm text-white/80 drop-shadow break-words overflow-hidden p-2 rounded-lg bg-white/10 backdrop-blur-sm max-h-24 overflow-y-auto">
                    {userProfile.bio}
                  </p>
                </div>
              )}

              {userProfile.travelVibes && userProfile.travelVibes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-white/70 mb-2 drop-shadow">Travel Vibes</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.travelVibes.map((vibe) => (
                      <span
                        key={vibe}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/30 text-white border border-white/30"
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Current Trip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white drop-shadow">Current Trip</h3>
            <button
              onClick={() => setEditingTravel(!editingTravel)}
              className="text-xs text-white/90 font-medium hover:text-white drop-shadow"
            >
              {editingTravel ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingTravel ? (
            <div className="p-5 rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_30px_80px_rgba(0,0,0,0.15)] space-y-4">
              <div>
                <label className="text-xs text-white/80 mb-1 block drop-shadow">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where are you going?"
                    className="h-12 pl-10 rounded-xl bg-white/80 border border-white/50 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/80 mb-1 block drop-shadow">From</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl bg-white/80 border border-white/50 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/80 mb-1 block drop-shadow">To</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl bg-white/80 border border-white/50 text-gray-900"
                    />
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50"
                onClick={handleSaveTravel}
                disabled={!destination || !startDate || !endDate}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="p-5 rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_30px_80px_rgba(0,0,0,0.15)]">
              {travelDetails ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/30 border border-white/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white drop-shadow">{travelDetails.destination}</p>
                      <p className="text-xs text-white/80 drop-shadow">
                        {travelDetails.startDate} → {travelDetails.endDate}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/70 text-center py-4 drop-shadow">No trip planned yet</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Invite Friends Card */}
        <div className="mb-6">
          <InviteFriendsCard />
        </div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-medium text-white drop-shadow mb-3">Settings</h3>
          <div className="rounded-[24px] bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_30px_80px_rgba(0,0,0,0.15)] overflow-hidden">
            <button
              onClick={() => setScreen("travel")}
              className="w-full flex items-center justify-between p-4 hover:bg-white/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/30 border border-white/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white drop-shadow">Plan New Trip</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </button>

            {isAdmin && (
              <>
                <div className="h-px bg-white/20 mx-4" />
                <button
                  onClick={() => setScreen("admin")}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-white drop-shadow">Admin Panel</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
              </>
            )}

            <div className="h-px bg-white/20 mx-4" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-white/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/30 border border-white/30 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white drop-shadow">Sign Out</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </button>

            <div className="h-px bg-white/20 mx-4" />

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100/50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm text-red-500">Delete Account</span>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
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

export default AccountScreen;
