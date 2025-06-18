import { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getSupabaseImageUrl } from '../../utils/imageUtils';

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
}

interface EventSpeakersSectionProps {
  selectedSpeakers: string[];
  hideSpeakersGallery: boolean;
  onSpeakersChange: (speakers: string[]) => void;
  onHideSpeakersGalleryChange: (hide: boolean) => void;
}

const EventSpeakersSection = ({
  selectedSpeakers,
  hideSpeakersGallery,
  onSpeakersChange,
  onHideSpeakersGalleryChange
}: EventSpeakersSectionProps) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakersError('Ошибка при загрузке спикеров');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const toggleSpeaker = (speakerId: string) => {
    if (selectedSpeakers.includes(speakerId)) {
      onSpeakersChange(selectedSpeakers.filter(id => id !== speakerId));
    } else {
      onSpeakersChange([...selectedSpeakers, speakerId]);
    }
  };

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name.toLowerCase().includes(speakerSearchQuery.toLowerCase()) ||
    speaker.field_of_expertise.toLowerCase().includes(speakerSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Спикеры</h3>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск спикеров..."
          value={speakerSearchQuery}
          onChange={(e) => setSpeakerSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800"
        />
      </div>

      <div className="form-group">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideSpeakersGallery}
            onChange={(e) => onHideSpeakersGalleryChange(e.target.checked)}
            className="form-checkbox"
          />
          <span>Скрыть галерею спикеров на странице мероприятия</span>
        </label>
      </div>

      {speakersLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Загрузка спикеров...</p>
        </div>
      ) : speakersError ? (
        <div className="text-center py-4 text-red-500">{speakersError}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {filteredSpeakers.map(speaker => {
            const isSelected = selectedSpeakers.includes(speaker.id);
            const mainPhoto = speaker.photos?.find(photo => photo.isMain) || speaker.photos?.[0];
            
            return (
              <div
                key={speaker.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
                onClick={() => toggleSpeaker(speaker.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-700 flex-shrink-0">
                    {mainPhoto ? (
                      <img
                        src={getSupabaseImageUrl(mainPhoto.url)}
                        alt={speaker.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/100?text=No+image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h4 className="font-medium">{speaker.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{speaker.field_of_expertise}</p>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-dark-700 text-gray-400'
                  }`}>
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredSpeakers.length === 0 && (
            <div className="col-span-full text-center py-4 text-gray-500">
              {speakerSearchQuery
                ? 'Спикеры не найдены. Попробуйте изменить запрос.'
                : 'Нет доступных спикеров.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSpeakersSection;