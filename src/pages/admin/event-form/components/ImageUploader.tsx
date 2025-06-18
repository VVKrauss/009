import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface ImageUploaderProps {
  onUploadComplete: (file: File) => Promise<void>;
  previewUrl?: string | null;
  onRemove: () => void;
  aspectRatio?: number;
  recommendedText?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  previewUrl,
  onRemove,
  aspectRatio = 3/1,
  recommendedText = "Рекомендуемый размер: 1200x400px",
  className = '',
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setShowCropper(true);
  };

  const handleCrop = async () => {
    if (!cropper || !imageFile) return;

    try {
      setUploading(true);
      
      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((b) => {
          if (b) resolve(b);
          else throw new Error('Failed to create blob');
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const croppedFile = new File([blob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload the file
      await onUploadComplete(croppedFile);
      
      // Reset state
      setShowCropper(false);
      setImageFile(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setUploading(false);
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-uploader ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {showCropper && imageFile ? (
        <div className="space-y-4">
          <Cropper
            src={URL.createObjectURL(imageFile)}
            style={{ height: 400, width: '100%' }}
            aspectRatio={aspectRatio}
            guides={true}
            viewMode={1}
            dragMode="move"
            scalable={true}
            cropBoxMovable={true}
            cropBoxResizable={true}
            onInitialized={(instance) => setCropper(instance)}
            className="max-w-full"
          />
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={cancelCrop}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2 inline-block" />
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 inline-block animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2 inline-block" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      ) : previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
              title="Изменить изображение"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
              title="Удалить изображение"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <ImageIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              Загрузить изображение
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {recommendedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;