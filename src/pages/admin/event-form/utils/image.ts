import { supabase } from '../../../../lib/supabase';

/**
 * Загружает изображение в Supabase Storage
 */
export const uploadImage = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string } | null> => {
  try {
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${timestamp}.${fileExt}`;

    // Загружаем файл
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percent);
          }
        },
      });

    if (error) throw error;

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Удаляет изображение из Supabase Storage
 */
export const deleteImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Получает публичный URL изображения
 */
export const getImageUrl = (path: string): string => {
  if (!path) return '';
  
  // Если это уже полный URL, возвращаем его
  if (path.startsWith('http')) return path;
  
  // Иначе формируем URL
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);
    
  return data.publicUrl;
};

/**
 * Сжимает изображение перед загрузкой
 */
export const compressImage = async (
  file: File,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Определяем новые размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Создаем canvas для сжатия
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем canvas в Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            // Создаем новый File из Blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Обрезает изображение
 */
export const cropImage = async (
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  fileName: string
): Promise<File> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        
        const file = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        resolve(file);
      },
      'image/jpeg',
      0.9
    );
  });
};