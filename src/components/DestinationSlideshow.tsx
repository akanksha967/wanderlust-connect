import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const destinations = [
  {
    id: 1,
    name: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=500&fit=crop',
    vibe: 'Romantic',
  },
  {
    id: 2,
    name: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=500&fit=crop',
    vibe: 'Adventure',
  },
  {
    id: 3,
    name: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=500&fit=crop',
    vibe: 'Culture',
  },
  {
    id: 4,
    name: 'Machu Picchu, Peru',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=500&fit=crop',
    vibe: 'Explorer',
  },
  {
    id: 5,
    name: 'Maldives',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=500&fit=crop',
    vibe: 'Relaxation',
  },
];

const DestinationSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % destinations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const normalizedDiff = ((diff % destinations.length) + destinations.length) % destinations.length;
    
    if (normalizedDiff === 0) {
      return { x: 0, scale: 1, opacity: 1, zIndex: 3 };
    } else if (normalizedDiff === 1 || normalizedDiff === destinations.length - 1) {
      const direction = normalizedDiff === 1 ? 1 : -1;
      return { x: direction * 60, scale: 0.85, opacity: 0.6, zIndex: 2 };
    } else if (normalizedDiff === 2 || normalizedDiff === destinations.length - 2) {
      const direction = normalizedDiff === 2 ? 1 : -1;
      return { x: direction * 100, scale: 0.7, opacity: 0.3, zIndex: 1 };
    }
    return { x: 0, scale: 0.5, opacity: 0, zIndex: 0 };
  };

  return (
    <div className="relative w-full h-[32vh] max-h-64 min-h-52 flex items-center justify-center overflow-hidden">
      {destinations.map((dest, index) => {
        const style = getCardStyle(index);
        return (
          <motion.div
            key={dest.id}
            animate={style}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute w-[42vw] max-w-40 h-[58vw] max-h-56 rounded-2xl overflow-hidden shadow-elegant"
            style={{ zIndex: style.zIndex }}
          >
            <img
              src={dest.image}
              alt={dest.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-background text-sm font-medium truncate">{dest.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-accent/90 text-accent-foreground text-xs rounded-full">
                {dest.vibe}
              </span>
            </div>
          </motion.div>
        );
      })}
      
    </div>
  );
};

export default DestinationSlideshow;
