import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import ImageUploadAndCrop from '../shared/ImageUploadAndCrop';
import { getSupabaseImageUrl } from '../../utils/imageUtils';

interface EventImageSectionProps {
  bgImage: string | null;
  originalBgImage: string | null;
  onImageUpdate: (croppedPath: string, originalPath: string) => void;
  onImageRemove: () => void;
}

const EventImageSection = ({
  bgImage,
  originalBgImage,
  onImageUpdate,
  onImageRemove
}: EventImageSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = (croppedPath: string, originalPath: string) => {
    onImageUpdate(croppedPath, originalPath);
    setIsUploading(false);
  };

  const previewUrl = bgImage 
    ? getSupabaseImageUrl(bgImage)
    : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Изображение мероприятия</h3>
      
      <ImageUploadAndCrop
        aspectRatio={3}
        targetWidth={1200}
        targetHeight={400}
        storagePathPrefix="events/"
        initialImageUrl={previewUrl}
        onUploadSuccess={handleUploadSuccess}
        onRemoveImage={onImageRemove}
        recommendedText="Рекомендуемый размер: 1200x400px"
        buttonText="Загрузить изображение"
      />
      
      {isUploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Загрузка изображения...</p>
        </div>
      )}
      
      {!bgImage && (
        <div className="text-center py-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-dashed border-gray-300 dark:border-dark-600">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Изображение не выбрано</p>
          <p className="text-xs text-gray-400 mt-1">Рекомендуемый размер: 1200x400px</p>
        </div>
      )}
    </div>
  );
};

export default EventImageSection;