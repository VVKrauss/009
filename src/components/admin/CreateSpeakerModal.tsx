import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SpeakerPhotoGallery from './SpeakerPhotoGallery';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CreateSpeakerModal = ({ isOpen, onClose, onSuccess }: CreateSpeakerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; isMain?: boolean }[]>([]);
  const [speakerId] = useState(() => crypto.randomUUID());
  const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: speakerId,
    name: '',
    field_of_expertise: '',
    description: '',
    date_of_birth: '',
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('speakers')
        .insert([{
          ...formData,
          photos,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Спикер успешно создан');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating speaker:', error);
      toast.error('Ошибка при создании спикера');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-dark-800 p-6 pb-0 z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Добавить спикера</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
          <div className="form-group">
            <label className="block font-medium mb-2">Фотографии</label>
            {selectedImageURL && (
              <div className="mb-4">
                <img
                  src={selectedImageURL}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-full mx-auto"
                />
              </div>
            )}
            <SpeakerPhotoGallery
              speakerId={speakerId}
              photos={photos}
              onPhotosUpdate={setPhotos}
              onImageSelect={setSelectedImageURL}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="name" className="block font-medium mb-2">
              Имя
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="field_of_expertise" className="block font-medium mb-2">
              Специализация
            </label>
            <input
              type="text"
              id="field_of_expertise"
              value={formData.field_of_expertise}
              onChange={(e) => setFormData({ ...formData, field_of_expertise: e.target.value })}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="block font-medium mb-2">
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth" className="block font-medium mb-2">
              Дата рождения (необязательно)
            </label>
            <input
              type="date"
              id="date_of_birth"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
            />
          </div>
          
          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="form-checkbox"
              />
              <span className="font-medium">Активный спикер</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type CreateSpeakerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default CreateSpeakerModal;