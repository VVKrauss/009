import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Star, StarOff, Expand, X, Upload, Crop } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import imageCompression from 'browser-image-compression';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Photo = {
  url: string;
  isMain?: boolean;
};

type SpeakerPhotoGalleryProps = {
  speakerId: string;
  photos: Photo[];
  onPhotosUpdate: (photos: Photo[]) => void;
  onImageSelect?: (url: string | null) => void;
};

const SpeakerPhotoGallery = ({ 
  speakerId, 
  photos = [], 
  onPhotosUpdate,
  onImageSelect 
}: SpeakerPhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const [selectedPhotoForCrop, setSelectedPhotoForCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSetMainPhoto = async (photoUrl: string) => {
    setLoading(true);
    try {
      const updatedPhotos = (Array.isArray(photos) ? photos : []).map(photo => ({
        ...photo,
        isMain: photo.url === photoUrl
      }));

      const { error } = await supabase
        .from('speakers')
        .update({ photos: updatedPhotos })
        .eq('id', speakerId);

      if (error) throw error;

      onPhotosUpdate(updatedPhotos);
      toast.success('Основная фотография обновлена');
    } catch (error) {
      console.error('Error updating main photo:', error);
      toast.error('Ошибка при обновлении фотографии');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 2000,
        useWebWorker: true
      });

      setImageFile(compressedFile);
      setCropperVisible(true);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Ошибка при обработке изображения');
    }
  };

  const handleCrop = async (existingPhotoUrl?: string) => {
    if (!cropper || (!imageFile && !existingPhotoUrl)) return;

    try {
      setUploading(true);

      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800
      });

      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob) => resolve(blob), 'image/jpeg', 0.9);
      });

      // Create file from blob
      const fileName = `${speakerId}/${Date.now()}.jpg`;

      // Upload the cropped file
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(`speakers/${fileName}`, croppedBlob);

      if (uploadError) throw uploadError;

      // Update photos array
      const currentPhotos = Array.isArray(photos) ? photos : [];
      let updatedPhotos: Photo[];

      if (existingPhotoUrl) {
        // Replace existing photo
        updatedPhotos = currentPhotos.map(photo => 
          photo.url === existingPhotoUrl 
            ? { ...photo, url: `speakers/${fileName}` }
            : photo
        );

        // Delete old photo from storage
        await supabase.storage
          .from('images')
          .remove([existingPhotoUrl]);
      } else {
        // Add new photo
        const newPhoto = { url: `speakers/${fileName}` };
        updatedPhotos = currentPhotos.length === 0 
          ? [{ ...newPhoto, isMain: true }]
          : [...currentPhotos, newPhoto];
      }

      const { error: updateError } = await supabase
        .from('speakers')
        .update({ photos: updatedPhotos })
        .eq('id', speakerId);

      if (updateError) throw updateError;

      onPhotosUpdate(updatedPhotos);
      
      // Update preview URL if needed
      const previewUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/speakers/${fileName}`;
      if (onImageSelect && existingPhotoUrl === photos.find(p => p.isMain)?.url) {
        onImageSelect(previewUrl);
      }

      toast.success('Фотография успешно обновлена');
      setCropperVisible(false);
      setImageFile(null);
      setSelectedPhotoForCrop(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error handling crop:', error);
      toast.error('Ошибка при обработке фотографии');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту фотографию?')) return;

    setLoading(true);
    try {
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([photoUrl]);

      if (deleteError) throw deleteError;

      // Update the photos array
      const currentPhotos = Array.isArray(photos) ? photos : [];
      const updatedPhotos = currentPhotos.filter(p => p.url !== photoUrl);
      if (updatedPhotos.length > 0 && currentPhotos.find(p => p.url === photoUrl)?.isMain) {
        updatedPhotos[0].isMain = true;
      }

      const { error: updateError } = await supabase
        .from('speakers')
        .update({ photos: updatedPhotos })
        .eq('id', speakerId);

      if (updateError) throw updateError;

      onPhotosUpdate(updatedPhotos);
      if (onImageSelect && currentPhotos.find(p => p.url === photoUrl)?.isMain) {
        onImageSelect(null);
      }
      toast.success('Фотография удалена');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Ошибка при удалении фотографии');
    } finally {
      setLoading(false);
    }
  };

  const safePhotos = Array.isArray(photos) ? photos : [];

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {safePhotos.map((photo, index) => (
          <div 
            key={index} 
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
              photo.isMain ? 'border-primary-600' : 'border-transparent'
            }`}
          >
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${photo.url}`}
              alt={`Фото ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/300?text=Error+loading+image';
              }}
            />
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => handleSetMainPhoto(photo.url)}
                disabled={loading || photo.isMain}
                className={`p-2 rounded-full ${
                  photo.isMain 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-900'
                }`}
                title={photo.isMain ? 'Основная фотография' : 'Сделать основной'}
              >
                {photo.isMain ? <Star className="h-5 w-5" /> : <StarOff className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => {
                  setSelectedPhotoForCrop(photo.url);
                  setCropperVisible(true);
                }}
                className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-900"
                title="Кадрировать"
              >
                <Crop className="h-5 w-5" />
              </button>

              <button
                onClick={() => setSelectedPhoto(photo.url)}
                className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-900"
                title="Просмотреть"
              >
                <Expand className="h-5 w-5" />
              </button>

              {!photo.isMain && (
                <button
                  onClick={() => handleDeletePhoto(photo.url)}
                  className="p-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white"
                  title="Удалить"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {photo.isMain && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                Основная
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-outline cursor-pointer inline-flex items-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? 'Загрузка...' : 'Загрузить фото'}
        </button>
      </div>

      {/* Cropper Modal */}
      {cropperVisible && (imageFile || selectedPhotoForCrop) && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Обрезать фотографию</h3>
              <button
                onClick={() => {
                  setCropperVisible(false);
                  setImageFile(null);
                  setSelectedPhotoForCrop(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Cropper
              src={imageFile ? URL.createObjectURL(imageFile) : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${selectedPhotoForCrop}`}
              style={{ height: 400, width: '100%' }}
              aspectRatio={1}
              guides={true}
              viewMode={1}
              dragMode="move"
              scalable={true}
              cropBoxMovable={true}
              cropBoxResizable={true}
              onInitialized={instance => setCropper(instance)}
            />

            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setCropperVisible(false);
                  setImageFile(null);
                  setSelectedPhotoForCrop(null);
                }}
                className="btn-outline"
                disabled={uploading}
              >
                Отмена
              </button>
              <button
                onClick={() => handleCrop(selectedPhotoForCrop || undefined)}
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size photo modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${selectedPhoto}`}
            alt="Полный размер"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default SpeakerPhotoGallery;