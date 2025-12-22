import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { ArrowLeft, Camera, MapPin, Calendar, LogOut, Trash2, ChevronRight, Edit2 } from 'lucide-react';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';
import { useAuth } from '@/hooks/useAuth';

const AccountScreen = () => {
  const { setScreen, userProfile, travelDetails, setTravelDetails } = useAppStore();
  const { signOut, user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTravel, setEditingTravel] = useState(false);
  const [destination, setDestination] = useState(travelDetails?.destination || '');
  const [startDate, setStartDate] = useState(travelDetails?.startDate || '');
  const [endDate, setEndDate] = useState(travelDetails?.endDate || '');

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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button 
          onClick={() => setScreen('swipe')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all duration-300 hover:bg-secondary/70"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-display text-foreground">My Account</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card shadow-soft mb-6"
        >
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
            <button 
              onClick={() => setScreen('profile')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-smooth hover:bg-secondary/70"
            >
              <Edit2 className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {userProfile.travelVibes && userProfile.travelVibes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
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
            <div className="p-4 rounded-2xl bg-card shadow-soft space-y-4">
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
            <div className="p-4 rounded-2xl bg-card shadow-soft">
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
          <div className="rounded-2xl bg-card shadow-soft overflow-hidden">
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
                  <LogOut className="w-5 h-5 text-foreground" />
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
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </div>

      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={handleAccountDeleted}
      />
    </div>
  );
};

export default AccountScreen;
