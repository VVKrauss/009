import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, Clock, User } from 'lucide-react';
import FormField from './FormField';
import { useSpeakers } from '../hooks/useSpeakers';
import type { FestivalProgramItem } from '../types/event';

interface ProgramItemFormProps {
  item: FestivalProgramItem | null;
  onSave: (item: FestivalProgramItem) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string | null>;
  uploading: boolean;
  isEditing: boolean;
}

export const ProgramItemForm: React.FC<ProgramItemFormProps> = ({
  item,
  onSave,
  onCancel,
  onImageUpload,
  uploading,
  isEditing,
}) => {
  const { speakers } = useSpeakers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FestivalProgramItem>(
    item || {
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: '',
    }
  );
  
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    time: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (name in errors) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const imagePath = await onImageUpload(file);
      if (imagePath) {
        setFormData(prev => ({ ...prev, image_url: imagePath }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      description: '',
      time: '',
    };
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    
    if (!formData.start_time || !formData.end_time) {
      newErrors.time = 'Время начала и окончания обязательны';
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {isEditing ? 'Редактирование программы' : 'Добавление программы'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField
            label="Название"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Название программы"
            required
            error={errors.title}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Время начала"
              name="start_time"
              type="time"
              value={formData.start_time}
              onChange={handleChange}
              required
              error={errors.time}
            />
            
            <FormField
              label="Время окончания"
              name="end_time"
              type="time"
              value={formData.end_time}
              onChange={handleChange}
              required
              error={errors.time}
            />
          </div>
        </div>
        
        <FormField
          label="Описание"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Описание программы"
          required
          error={errors.description}
          rows={4}
        />
        
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Лектор
          </label>
          <select
            name="lecturer_id"
            value={formData.lecturer_id}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Выберите лектора</option>
            {speakers.map(speaker => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Изображение
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          
          {formData.image_url ? (
            <div className="relative">
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${formData.image_url}`}
                alt="Program"
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                  <span className="text-sm text-gray-500">Загрузка...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Нажмите для загрузки изображения</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? 'Загрузка...' : (isEditing ? 'Обновить' : 'Добавить')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgramItemForm;