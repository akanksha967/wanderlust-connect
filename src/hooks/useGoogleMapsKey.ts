import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('google-maps-key');
        
        if (error) {
          throw error;
        }
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error('No API key returned');
        }
      } catch (err: any) {
        console.error('Error fetching Google Maps API key:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};
