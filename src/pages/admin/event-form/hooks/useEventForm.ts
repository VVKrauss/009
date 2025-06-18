import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { validateEventForm } from '../utils/validation';
import { useImageUpload } from './useImageUpload';
import { useTimeSlots } from './useTimeSlots';
import { DEFAULT_EVENT } from '../constants/event-form';
import type { Event, ValidationResult } from '../types/event';

interface UseEventFormReturn {
  event: Event;
  setEvent: React.Dispatch<React.SetStateAction<Event>>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleArrayChange: (field: keyof Event, value: string[]) => void;
  handleCheckboxChange: (field: keyof Event, checked: boolean) => void;
  handleNumberChange: (field: keyof Event, value: number | null) => void;
  handleSubmit: () => Promise<void>;
  handleImageUpload: (file: File) => Promise<void>;
  removeImage: () => void;
  isNew: boolean;
  uploadProgress: number;
  uploading: boolean;
  validateForm: () => Promise<ValidationResult>;
}

export const useEventForm = (): UseEventFormReturn => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  
  const [event, setEvent] = useState<Event>({
    ...DEFAULT_EVENT,
    id: isNew ? crypto.randomUUID() : id!,
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    uploadEventImage, 
    deleteEventImage, 
    uploading, 
    progress: uploadProgress 
  } = useImageUpload();
  
  const { 
    checkTimeSlotAvailability, 
    createEventTimeSlot, 
    deleteEventTimeSlot 
  } = useTimeSlots();

  // Загрузка данных события при редактировании
  useEffect(() => {
    const fetchEvent = async () => {
      if (isNew) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setEvent(data);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Ошибка при загрузке мероприятия');
        toast.error('Ошибка при загрузке мероприятия');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id, isNew]);

  // Обработчики изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };
  
  const handleArrayChange = (field: keyof Event, value: string[]) => {
    setEvent(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCheckboxChange = (field: keyof Event, checked: boolean) => {
    setEvent(prev => ({ ...prev, [field]: checked }));
  };
  
  const handleNumberChange = (field: keyof Event, value: number | null) => {
    setEvent(prev => ({ ...prev, [field]: value }));
  };

  // Загрузка изображения
  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadEventImage(file);
      
      if (!result) {
        throw new Error('Failed to upload image');
      }
      
      setEvent(prev => ({
        ...prev,
        bg_image: result.croppedPath,
        original_bg_image: result.originalPath,
      }));
      
      toast.success('Изображение успешно загружено');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Ошибка при загрузке изображения');
    }
  };

  // Удаление изображения
  const removeImage = async () => {
    try {
      if (event.bg_image) {
        await deleteEventImage(event.bg_image);
      }
      
      if (event.original_bg_image) {
        await deleteEventImage(event.original_bg_image);
      }
      
      setEvent(prev => ({
        ...prev,
        bg_image: null,
        original_bg_image: null,
      }));
      
      toast.success('Изображение удалено');
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Ошибка при удалении изображения');
    }
  };

  // Валидация формы
  const validateForm = async (): Promise<ValidationResult> => {
    return await validateEventForm(event, checkTimeSlotAvailability);
  };

  // Сохранение события
  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      // Валидация формы
      const validation = await validateForm();
      
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
      
      // Сохранение в базу данных
      const { error: saveError } = isNew
        ? await supabase.from('events').insert([event])
        : await supabase.from('events').update(event).eq('id', event.id);
      
      if (saveError) throw saveError;
      
      // Создание или обновление временного слота
      if (event.status === 'active') {
        // Сначала удаляем существующий слот
        await deleteEventTimeSlot(event.id);
        
        // Затем создаем новый
        await createEventTimeSlot({
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          location: event.location,
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
        });
      }
      
      toast.success(`Мероприятие успешно ${isNew ? 'создано' : 'обновлено'}`);
      navigate('/admin/events');
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error(`Ошибка при ${isNew ? 'создании' : 'обновлении'} мероприятия`);
    } finally {
      setSaving(false);
    }
  };

  return {
    event,
    setEvent,
    loading,
    saving,
    error,
    handleChange,
    handleArrayChange,
    handleCheckboxChange,
    handleNumberChange,
    handleSubmit,
    handleImageUpload,
    removeImage,
    isNew,
    uploadProgress,
    uploading,
    validateForm,
  };
};