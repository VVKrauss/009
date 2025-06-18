import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
}

interface UseSpeakersReturn {
  speakers: Speaker[];
  loading: boolean;
  error: string | null;
  fetchSpeakers: () => Promise<void>;
  getSpeakerById: (id: string) => Speaker | undefined;
  getSpeakersByIds: (ids: string[]) => Speaker[];
}

export const useSpeakers = (): UseSpeakersReturn => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('speakers')
        .select('*')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setSpeakers(data || []);
    } catch (err) {
      console.error('Error fetching speakers:', err);
      setError('Ошибка при загрузке спикеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const getSpeakerById = (id: string): Speaker | undefined => {
    return speakers.find(speaker => speaker.id === id);
  };

  const getSpeakersByIds = (ids: string[]): Speaker[] => {
    return speakers.filter(speaker => ids.includes(speaker.id));
  };

  return {
    speakers,
    loading,
    error,
    fetchSpeakers,
    getSpeakerById,
    getSpeakersByIds,
  };
};