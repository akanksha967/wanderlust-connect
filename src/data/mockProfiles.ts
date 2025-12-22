import { UserProfile } from '@/store/useAppStore';

// Random profile photos pool - will be shuffled each time
const malePhotos = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop',
];

const femalePhotos = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop',
];

// Helper to get a random photo with cache busting
const getRandomPhoto = (photos: string[]) => {
  const randomIndex = Math.floor(Math.random() * photos.length);
  const timestamp = Date.now();
  return `${photos[randomIndex]}&t=${timestamp}`;
};

// Generate mock profiles with random photos
export const generateMockProfiles = (): UserProfile[] => [
  {
    id: 'mock-1',
    name: 'Sarah',
    age: 25,
    bio: 'Travel enthusiast looking for adventure buddies! Love hiking, photography, and trying local cuisines around the world.',
    photos: [getRandomPhoto(femalePhotos)],
    travelVibes: ['Adventure', 'Photography', 'Foodie'],
  },
  {
    id: 'mock-2',
    name: 'Emma',
    age: 26,
    bio: 'Digital nomad exploring the world one coffee shop at a time. Love hiking, local food, and spontaneous adventures!',
    photos: [getRandomPhoto(femalePhotos)],
    travelVibes: ['Adventure', 'Foodie', 'Photography'],
  },
  {
    id: 'mock-3',
    name: 'Marcus',
    age: 29,
    bio: 'Software engineer taking a sabbatical. Looking for travel buddies to share experiences and split costs!',
    photos: [getRandomPhoto(malePhotos)],
    travelVibes: ['Culture', 'Budget', 'Nature'],
  },
  {
    id: 'mock-4',
    name: 'Sofia',
    age: 24,
    bio: 'Yoga instructor and sunset chaser. Traveling to find peace, good vibes, and amazing beaches.',
    photos: [getRandomPhoto(femalePhotos)],
    travelVibes: ['Relaxation', 'Nature', 'Adventure'],
  },
  {
    id: 'mock-5',
    name: 'James',
    age: 31,
    bio: 'Travel photographer with a passion for street food and hidden gems. Always looking for the next adventure!',
    photos: [getRandomPhoto(malePhotos)],
    travelVibes: ['Photography', 'Foodie', 'Culture'],
  },
  {
    id: 'mock-6',
    name: 'Lily',
    age: 27,
    bio: 'Adventure seeker and beach lover. Looking for someone to explore hidden gems and create unforgettable memories!',
    photos: [getRandomPhoto(femalePhotos)],
    travelVibes: ['Adventure', 'Beach', 'Culture'],
  },
  {
    id: 'mock-7',
    name: 'Alex',
    age: 28,
    bio: 'Backpacker at heart, always chasing the next sunrise. Love meeting new people and sharing travel stories.',
    photos: [getRandomPhoto(malePhotos)],
    travelVibes: ['Backpacking', 'Nature', 'Photography'],
  },
];

// Static export for backward compatibility - generates fresh profiles each time
export const mockProfiles: UserProfile[] = generateMockProfiles();