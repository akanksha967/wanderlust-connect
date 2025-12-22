import { useState, useCallback, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoogleMapsDestinationPickerProps {
  apiKey: string;
  value: string;
  onChange: (destination: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
}

const libraries: ("places")[] = ["places"];

const GoogleMapsDestinationPicker = ({ 
  apiKey, 
  value, 
  onChange,
  onLocationSelect 
}: GoogleMapsDestinationPickerProps) => {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Initialize autocomplete service as soon as API is loaded
  const initializeServices = useCallback(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Call initialization when loaded
  if (isLoaded && !autocompleteService.current) {
    initializeServices();
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: inputValue,
          types: ['(cities)'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.structured_formatting.main_text);
    setShowPredictions(false);
    setPredictions([]);
    
    // Just notify with the name, no need for coordinates since we're not showing the map
    onLocationSelect?.({
      lat: 0,
      lng: 0,
      name: prediction.structured_formatting.main_text,
    });
  };

  if (loadError) {
    return (
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search destination..."
          className="h-14 pl-12 rounded-2xl bg-card/80 backdrop-blur-sm border-0 shadow-soft text-base"
        />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        <Input
          disabled
          placeholder="Loading maps..."
          className="h-14 pl-12 rounded-2xl bg-card/80 backdrop-blur-sm border-0 shadow-soft text-base"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setShowPredictions(true)}
        onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
        placeholder="Search destination..."
        className="h-14 pl-12 rounded-2xl bg-card/80 backdrop-blur-sm border-0 shadow-soft text-base"
      />
      
      {showPredictions && predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg border border-border overflow-hidden z-50 max-h-64 overflow-y-auto"
          style={{ backgroundColor: 'hsl(var(--card))' }}
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionSelect(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center gap-3 border-b border-border/50 last:border-b-0"
              style={{ backgroundColor: 'hsl(var(--card))' }}
            >
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default GoogleMapsDestinationPicker;