import { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Speaker = {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
};

interface EventSpeakersSectionProps {
  selectedSpeakerIds: string[];
  hideSpeakersGallery: boolean;
  onSpeakerToggle: (speakerId: string) => void;
  onHideGalleryChange: (hide: boolean) => void;
}

const EventSpeakersSection = ({
  selectedSpeakerIds,
  hideSpeakersGallery,
  onSpeakerToggle,
  onHideGalleryChange
}: EventSpeakersSectionProps) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');

  useEffect(() => {
    fetchSpeakers();
  }, []);

  useEffect(() => {
    // Update selected speakers when selectedSpeakerIds or speakers list changes
    if (selectedSpeakerIds && selectedSpeakerIds.length > 0 && speakers.length > 0) {
      const selected = speakers.filter(speaker => 
        selectedSpeakerIds.includes(speaker.id)
      );
      setSelectedSpeakers(selected);
    } else {
      setSelectedSpeakers([]);
    }
  }, [selectedSpeakerIds, speakers]);

  const fetchSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      setSpeakersError(null);
      
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
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

  const toggleSpeaker = (speaker: Speaker) => {
    onSpeakerToggle(speaker.id);
  };

  const filteredSpeakers = speakers.filter(speaker => 
    speaker.name.toLowerCase().includes(speakerSearchQuery.toLowerCase()) ||
    speaker.field_of_expertise.toLowerCase().includes(speakerSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl mr-4">
            <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Спикеры</h2>
            <p className="text-gray-500 dark:text-gray-400">Выберите спикеров мероприятия</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={hideSpeakersGallery}
                onChange={(e) => onHideGalleryChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                hideSpeakersGallery ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                  hideSpeakersGallery ? 'translate-x-6' : 'translate-x-1'
                } mt-1`}></div>
              </div>
            </div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Скрыть галерею спикеров</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск спикеров..."
            value={speakerSearchQuery}
            onChange={(e) => setSpeakerSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        
        {!hideSpeakersGallery && (
          <>
            {speakersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Загрузка спикеров...</p>
              </div>
            ) : speakersError ? (
              <div className="text-center py-8 text-red-500">
                {speakersError}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filteredSpeakers.map(speaker => (
                    <div
                      key={speaker.id}
                      onClick={() => toggleSpeaker(speaker)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSpeakerIds.includes(speaker.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-2 flex-shrink-0">
                          {speaker.photos?.[0]?.url ? (
                            <img
                              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                              alt={speaker.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{speaker.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{speaker.field_of_expertise}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedSpeakers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Выбранные спикеры:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpeakers.map(speaker => (
                        <div
                          key={speaker.id}
                          className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1.5 rounded-full"
                        >
                          <span className="text-sm">{speaker.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSpeaker(speaker);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventSpeakersSection;