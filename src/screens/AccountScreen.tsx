import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Camera, MapPin, Calendar, LogOut, Trash2, ChevronRight, Edit2, X, Plus } from 'lucide-react';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';
import PhotoSourceDialog from '@/components/PhotoSourceDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const vibeOptions = [
  'Adventure', 'Relaxation', 'Culture', 'Foodie', 'Nature',
  'Nightlife', 'Photography', 'Budget', 'Luxury', 'Solo'
];

const AccountScreen = () => {
  const { setScreen, userProfile, travelDetails, setTravelDetails, setUserProfile } = useAppStore();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoSourceDialog, setShowPhotoSourceDialog] = useState(false);
  const [editingTravel, setEditingTravel] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [destination, setDestination] = useState(travelDetails?.destination || '');
  const [startDate, setStartDate] = useState(travelDetails?.startDate || '');
  const [endDate, setEndDate] = useState(travelDetails?.endDate || '');
  
  // Profile editing state
  const [name, setName] = useState(userProfile.name || '');
  const [age, setAge] = useState(userProfile.age?.toString() || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [photos, setPhotos] = useState<string[]>(userProfile.photos || []);
  const [selectedVibes, setSelectedVibes] = useState<string[]>(userProfile.travelVibes || []);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const handleAccountDeleted = () => {
    setScreen('login');
  };

  const handleSignOut = async () => {
    await signOut();
    setScreen('login');
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

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibe));
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
    setName(userProfile.name || '');
    setAge(userProfile.age?.toString() || '');
    setBio(userProfile.bio || '');
    setPhotos(userProfile.photos || []);
    setSelectedVibes(userProfile.travelVibes || []);
    setEditingProfile(false);
  };

  const isProfileValid = name && age && photos.length > 0 && selectedVibes.length > 0;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
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
        capture="environment"
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
      <div className="relative z-10 px-4 pt-12 pb-4 flex items-center gap-3">
        <button 
          onClick={() => setScreen('swipe')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all duration-300 hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display text-foreground">My Account</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm shadow-soft mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Profile</h3>
            <button
              onClick={() => editingProfile ? handleCancelProfileEdit() : setEditingProfile(true)}
              className="text-xs text-accent font-medium"
            >
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Photos (1-3) - Tap to add from camera or gallery
                </label>
                <div className="flex gap-3">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden bg-secondary shadow-soft"
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
                          className="w-full h-full flex flex-col items-center justify-center gap-1 transition-smooth hover:bg-secondary/70"
                        >
                          {index === 0 ? (
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="text-[10px] text-muted-foreground">Add</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Name & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-10 rounded-xl bg-secondary border-0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Age</label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    className="h-10 rounded-xl bg-secondary border-0"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell fellow travelers about yourself..."
                  className="w-full h-20 p-3 rounded-xl bg-secondary border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Travel vibes */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Travel vibes (select up to 4)
                </label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => (
                    <button
                      key={vibe}
                      onClick={() => toggleVibe(vibe)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${
                        selectedVibes.includes(vibe)
                          ? 'gradient-accent text-accent-foreground shadow-soft'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                className="w-full"
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
                    <img
                      src={userProfile.photos[0]}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg text-foreground">
                    {userProfile.name || 'Traveler'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {user?.phone || user?.email || 'No contact info'}
                  </p>
                  {userProfile.age && (
                    <p className="text-xs text-muted-foreground mt-1">{userProfile.age} years old</p>
                  )}
                </div>
              </div>

              {userProfile.bio && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                  {userProfile.bio}
                </p>
              )}

              {userProfile.travelVibes && userProfile.travelVibes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Travel Vibes</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.travelVibes.map((vibe) => (
                      <span
                        key={vibe}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"
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
            <h3 className="text-sm font-medium text-foreground">Current Trip</h3>
            <button
              onClick={() => setEditingTravel(!editingTravel)}
              className="text-xs text-accent font-medium"
            >
              {editingTravel ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingTravel ? (
            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm shadow-soft space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where are you going?"
                    className="h-12 pl-10 rounded-xl bg-secondary border-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl bg-secondary border-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 pl-10 rounded-xl bg-secondary border-0"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleSaveTravel}
                disabled={!destination || !startDate || !endDate}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm shadow-soft">
              {travelDetails ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{travelDetails.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {travelDetails.startDate} → {travelDetails.endDate}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trip planned yet
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-foreground mb-3">Settings</h3>
          <div className="rounded-2xl bg-card/80 backdrop-blur-sm shadow-soft overflow-hidden">
            <button
              onClick={() => setScreen('travel')}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-smooth"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm text-foreground">Plan New Trip</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="h-px bg-border mx-4" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-smooth"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground">Sign Out</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="h-px bg-border mx-4" />

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-smooth"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-sm text-destructive">Delete Account</span>
              </div>
              <ChevronRight className="w-5 h-5 text-destructive/50" />
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
