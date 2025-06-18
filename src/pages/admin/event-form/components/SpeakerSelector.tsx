import React, { useState } from 'react';
import { X, Search, User, Plus } from 'lucide-react';
import { useSpeakers } from '../hooks/useSpeakers';

interface SpeakerSelectorProps {
  selectedSpeakers: string[];
  onChange: (speakers: string[]) => void;
}

export const SpeakerSelector: React.FC<SpeakerSelectorProps> = ({
  selectedSpeakers,
  onChange,
}) => {
  const { speakers, loading } = useSpeakers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRemoveSpeaker = (speakerId: string) => {
    onChange(selectedSpeakers.filter(id => id !== speakerId));
  };

  const handleAddSpeaker = (speakerId: string) => {
    if (!selectedSpeakers.includes(speakerId)) {
      onChange([...selectedSpeakers, speakerId]);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const filteredSpeakers = speakers.filter(speaker => 
    !selectedSpeakers.includes(speaker.id) &&
    (speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     speaker.field_of_expertise.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSpeakersData = speakers.filter(speaker => 
    selectedSpeakers.includes(speaker.id)
  );

  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
        Спикеры
      </label>
      
      {/* Selected speakers */}
      <div className="mb-3 flex flex-wrap gap-2">
        {selectedSpeakersData.map(speaker => (
          <div 
            key={speaker.id}
            className="flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-lg"
          >
            {speaker.photos?.find(p => p.isMain)?.url ? (
              <img 
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos.find(p => p.isMain)?.url}`}
                alt={speaker.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span>{speaker.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveSpeaker(speaker.id)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Speaker search */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Поиск спикеров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            ></div>
            
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Загрузка спикеров...
                </div>
              ) : filteredSpeakers.length > 0 ? (
                filteredSpeakers.map(speaker => (
                  <div
                    key={speaker.id}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                    onClick={() => handleAddSpeaker(speaker.id)}
                  >
                    {speaker.photos?.find(p => p.isMain)?.url ? (
                      <img 
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos.find(p => p.isMain)?.url}`}
                        alt={speaker.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{speaker.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {speaker.field_of_expertise}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto p-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery 
                    ? 'Спикеры не найдены' 
                    : 'Нет доступных спикеров'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpeakerSelector;