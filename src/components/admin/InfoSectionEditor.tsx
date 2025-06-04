import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Edit, Save, X, Upload, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import imageCompression from 'browser-image-compression';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type InfoSectionData = {
  title: string;
  description: string;
  image: string;
  enabled: boolean;
  order: number;
};

type InfoSectionEditorProps = {
  siteSettingsId: string;
  initialData: InfoSectionData;
  onUpdate: (data: InfoSectionData) => void;
};

const InfoSectionEditor = ({ siteSettingsId, initialData, onUpdate }: InfoSectionEditorProps) => {
  const [data, setData] = useState<InfoSectionData>(initialData);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!data.title.trim()) {
      toast.error('Введите заголовок');
      return;
    }

    if (!data.description.trim()) {
      toast.error('Введите описание');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('site_settings')
        .update({
          info_section: data
        })
        .eq('id', siteSettingsId);

      if (error) throw error;

      onUpdate(data);
      toast.success('Изменения сохранены');
    } catch (error) {
      console.error('Error saving info section:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 2000,
        useWebWorker: true
      });

      setImageFile(compressedFile);
      setShowCropper(true);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Ошибка при обработке изображения');
    }
  };

  const handleCrop = async () => {
    if (!cropper || !imageFile) return;

    try {
      setLoading(true);

      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1000,
        height: 800
      });

      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob) => resolve(blob), 'image/jpeg', 0.9);
      });

      const fileName = `info_section_${Date.now()}.jpg`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
      
      setData(prev => ({
        ...prev,
        image: imageUrl
      }));

      setShowCropper(false);
      setImageFile(null);
      toast.success('Изображение обновлено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка при загрузке изображения');
    } finally {
      setLoading(false);
    }
  };

  if (previewMode) {
    return (
      <div className="relative">
        <button
          onClick={() => setPreviewMode(false)}
          className="absolute top-4 right-4 p-2 bg-white dark:bg-dark-800 rounded-full shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>
        
        <section className="section bg-white dark:bg-dark-900">
          <div className="container grid-layout items-center">
            <div className="text-content">
              <h2 className="mb-6">{data.title}</h2>
              <div 
                className="text-lg space-y-4"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </div>
            <div className="image-content mt-8 md:mt-0">
              <img 
                src={data.image} 
                alt={data.title} 
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Инфо на главной странице</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(true)}
            className="btn-outline flex items-center gap-2"
          >
            <Eye className="h-5 w-5" />
            Предпросмотр
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Сохранить
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => setData({ ...data, enabled: e.target.checked })}
            className="form-checkbox"
          />
          <span>Показывать блок на главной странице</span>
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="title" className="block font-medium mb-2">
          Заголовок
        </label>
        <input
          type="text"
          id="title"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="block font-medium mb-2">
          Описание
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          rows={6}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="block font-medium mb-2">
          Изображение
        </label>
        
        {showCropper && imageFile ? (
          <div className="space-y-4">
            <Cropper
              src={URL.createObjectURL(imageFile)}
              style={{ height: 400, width: '100%' }}
              aspectRatio={5/4}
              guides={true}
              onInitialized={instance => setCropper(instance)}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCropper(false);
                  setImageFile(null);
                }}
                className="btn-outline"
              >
                Отмена
              </button>
              <button
                onClick={handleCrop}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Сохранение...' : 'Обрезать и сохранить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={data.image}
              alt="Info section"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white dark:bg-dark-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="order" className="block font-medium mb-2">
          Порядок отображения
        </label>
        <input
          type="number"
          id="order"
          value={data.order}
          onChange={(e) => setData({ ...data, order: parseInt(e.target.value) })}
          min="1"
          className="form-input w-24"
        />
      </div>
    </div>
  );
};

export default InfoSectionEditor;