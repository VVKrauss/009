import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { uploadImage, deleteImage, compressImage } from '../utils/image';

interface UseImageUploadReturn {
  uploadEventImage: (file: File) => Promise<{ croppedPath: string; originalPath: string } | null>;
  uploadProgramImage: (file: File) => Promise<string | null>;
  deleteEventImage: (path: string) => Promise<boolean>;
  deleteProgramImage: (path: string) => Promise<boolean>;
  uploading: boolean;
  progress: number;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Загружает изображение события с обрезкой
   */
  const uploadEventImage = async (
    file: File
  ): Promise<{ croppedPath: string; originalPath: string } | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Сжимаем оригинальное изображение
      const compressedOriginal = await compressImage(file, 2000, 2000, 0.9);
      
      // Загружаем оригинальное изображение
      const originalResult = await uploadImage(
        compressedOriginal,
        'events/original',
        (progress) => setProgress(progress / 2) // Первая половина прогресса
      );

      if (!originalResult) {
        throw new Error('Failed to upload original image');
      }

      // Сжимаем и обрезаем изображение для отображения
      const compressedCropped = await compressImage(file, 1200, 800, 0.8);
      
      // Загружаем обрезанное изображение
      const croppedResult = await uploadImage(
        compressedCropped,
        'events/cropped',
        (progress) => setProgress(50 + progress / 2) // Вторая половина прогресса
      );

      if (!croppedResult) {
        throw new Error('Failed to upload cropped image');
      }

      return {
        croppedPath: croppedResult.path,
        originalPath: originalResult.path,
      };
    } catch (error) {
      console.error('Error uploading event image:', error);
      toast.error('Ошибка при загрузке изображения');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * Загружает изображение для программы фестиваля
   */
  const uploadProgramImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Сжимаем изображение
      const compressedFile = await compressImage(file, 800, 600, 0.8);
      
      // Загружаем изображение
      const result = await uploadImage(
        compressedFile,
        'events/program',
        setProgress
      );

      if (!result) {
        throw new Error('Failed to upload program image');
      }

      return result.path;
    } catch (error) {
      console.error('Error uploading program image:', error);
      toast.error('Ошибка при загрузке изображения программы');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * Удаляет изображение события
   */
  const deleteEventImage = async (path: string): Promise<boolean> => {
    try {
      setUploading(true);
      const success = await deleteImage(path);
      
      if (!success) {
        throw new Error('Failed to delete event image');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting event image:', error);
      toast.error('Ошибка при удалении изображения');
      return false;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Удаляет изображение программы
   */
  const deleteProgramImage = async (path: string): Promise<boolean> => {
    return await deleteEventImage(path);
  };

  return {
    uploadEventImage,
    uploadProgramImage,
    deleteEventImage,
    deleteProgramImage,
    uploading,
    progress,
  };
};