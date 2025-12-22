import { UserProfile } from '@/store/useAppStore';

export const mockProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Emma',
    age: 26,
    bio: 'Digital nomad exploring the world one coffee shop at a time. Love hiking, local food, and spontaneous adventures!',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
    ],
    travelVibes: ['Adventure', 'Foodie', 'Photography'],
  },
  {
    id: '2',
    name: 'Marcus',
    age: 29,
    bio: 'Software engineer taking a sabbatical. Looking for travel buddies to share experiences and split costs!',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    ],
    travelVibes: ['Culture', 'Budget', 'Nature'],
  },
  {
    id: '3',
    name: 'Sofia',
    age: 24,
    bio: 'Yoga instructor and sunset chaser. Traveling to find peace, good vibes, and amazing beaches.',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    ],
    travelVibes: ['Relaxation', 'Nature', 'Adventure'],
  },
  {
    id: '4',
    name: 'James',
    age: 31,
    bio: 'Travel photographer with a passion for street food and hidden gems. Always looking for the next adventure!',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    ],
    travelVibes: ['Photography', 'Foodie', 'Culture'],
  },
];
