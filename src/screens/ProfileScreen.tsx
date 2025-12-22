import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Camera, Plus, X } from 'lucide-react';

const vibeOptions = [
  'Adventure', 'Relaxation', 'Culture', 'Foodie', 'Nature',
  'Nightlife', 'Photography', 'Budget', 'Luxury', 'Solo'
];

const ProfileScreen = () => {
  const { setScreen, setUserProfile } = useAppStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const handleAddPhoto = () => {
    // Simulate photo upload with placeholder
    const placeholders = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
    ];
    if (photos.length < 3) {
      setPhotos([...photos, placeholders[photos.length]]);
    }
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

  const handleContinue = () => {
    setUserProfile({
      name,
      age: parseInt(age),
      bio,
      photos,
      travelVibes: selectedVibes,
    });
    setScreen('travel');
  };

  const isValid = name && age && photos.length > 0 && selectedVibes.length > 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button 
          onClick={() => setScreen('login')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Create Profile</h1>
          <p className="text-xs text-muted-foreground">Step 1 of 2</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Photo upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-3 block">
            Add photos (1-3)
          </label>
          <div className="flex gap-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="relative w-24 h-24 rounded-2xl overflow-hidden bg-secondary shadow-soft"
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
                      className="absolute top-1 right-1 w-6 h-6 bg-foreground/80 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-background" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddPhoto}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 transition-smooth hover:bg-secondary/70"
                  >
                    {index === 0 ? (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                )}
                {index === 0 && photos[index] && (
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-medium rounded-full">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Name & Age */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              First name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-12 rounded-xl bg-secondary border-0 shadow-soft"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Age
            </label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="h-12 rounded-xl bg-secondary border-0 shadow-soft"
            />
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-2 block">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow travelers about yourself..."
            className="w-full h-24 p-3 rounded-xl bg-secondary border-0 shadow-soft resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </motion.div>

        {/* Travel vibes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium text-foreground mb-3 block">
            Travel vibes (select up to 4)
          </label>
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map((vibe) => (
              <button
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
                  selectedVibes.includes(vibe)
                    ? 'gradient-accent text-accent-foreground shadow-soft'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!isValid}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ProfileScreen;
