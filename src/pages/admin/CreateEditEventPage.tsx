import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  X, 
  Upload, 
  User, 
  Search, 
  Check, 
  Loader2
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Event, eventTypes, paymentTypes, languages, ageCategories, currencies, statuses } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
}

interface FestivalProgramItem {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
}

const TITLE_MAX_LENGTH = 70;
const SHORT_DESC_MAX_LENGTH = 180;
const DESC_MAX_LENGTH = 900;

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');
  
  // Image handling states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Festival program states
  const [editingProgramIndex, setEditingProgramIndex] = useState<number | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [currentProgramItem, setCurrentProgramItem] = useState<FestivalProgramItem>({
    title: '',
    description: '',
    image_url: '',
    start_time: '',
    end_time: '',
    lecturer_id: ''
  });
  const [programImageFile, setProgramImageFile] = useState<File | null>(null);
  const [programCropper, setProgramCropper] = useState<any>(null);
  const [showProgramCropper, setShowProgramCropper] = useState(false);
  const [programPreviewUrl, setProgramPreviewUrl] = useState<string | null>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [usePaymentWidget, setUsePaymentWidget] = useState(false);

  const [eventData, setEventData] = useState<Partial<Event>>({
    id: id || crypto.randomUUID(),
    title: '',
    short_description: '',
    description: '',
    event_type: 'Lecture',
    bg_image: null,
    original_bg_image: null,
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    location: 'Science Hub',
    age_category: '0+',
    price: 0,
    currency: 'RSD',
    status: 'draft',
    max_registrations: 40,
    payment_type: 'cost',
    languages: ['Русский'],
    speakers: [],
    hide_speakers_gallery: true,
    couple_discount: '',
    child_half_price: false,
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    video_url: '',
    photo_gallery: '',
    festival_program: []
  });

  const selectedSpeakersData = speakers.filter(speaker => 
    selectedSpeakers.includes(speaker.id)
  );

  const filteredSpeakers = speakers.filter(speaker => {
    const searchLower = speakerSearchQuery.toLowerCase();
    return (
      speaker.name.toLowerCase().includes(searchLower) ||
      speaker.field_of_expertise.toLowerCase().includes(searchLower)
    );
  });

  // Helper functions
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createTimestamp = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return null;
    return `${dateStr}T${timeStr}:00.000Z`;
  };

  const parseTimestamp = (timestamp: string) => {
    if (!timestamp) return { date: '', time: '' };
    
    const date = new Date(timestamp);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5)
    };
  };

  const validateDateTime = (eventData: any) => {
    const { date, start_time, end_time } = eventData;
    
    if (!date || !start_time || !end_time) {
      return { isValid: false, message: 'Заполните дату и время' };
    }
    
    const startDateTime = new Date(`${date}T${start_time}`);
    const endDateTime = new Date(`${date}T${end_time}`);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { isValid: false, message: 'Неверный формат даты или времени' };
    }
    
    if (startDateTime >= endDateTime) {
      return { isValid: false, message: 'Время окончания должно быть позже времени начала' };
    }
    
    return { isValid: true, message: '' };
  };

  const parseEventTimes = (eventData: any) => {
    const startParsed = parseTimestamp(eventData.start_time);
    const endParsed = parseTimestamp(eventData.end_time);
    
    return {
      ...eventData,
      date: startParsed.date || new Date().toISOString().split('T')[0],
      start_time: startParsed.time || '',
      end_time: endParsed.time || '',
    };
  };

  const handleFieldChange = (field: string, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };


  useEffect(() => {
    const initializeEvent = async () => {
      if (id && id !== 'new') {
        setIsEditMode(true);
        await fetchEvent();
      }
    };

    initializeEvent();
    fetchSpeakers();
  }, [id]);

  const fetchSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakersError('Failed to load speakers');
      toast.error('Ошибка при загрузке спикеров');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        const eventDataFormatted = {
          ...parseEventTimes(data),
          short_description: data.short_description || '',
          festival_program: data.festival_program || [],
          payment_widget_id: data.payment_widget_id || '',
          widget_chooser: data.widget_chooser || false
        };
        
        setEventData(eventDataFormatted);
        setSelectedSpeakers(data.speakers || []);
        setUsePaymentWidget(data.widget_chooser || false);
        
        if (data.bg_image) {
          setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${data.bg_image}`);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!eventData.title?.trim()) {
      toast.error('Введите название мероприятия');
      return false;
    }
    
    if (eventData.title.length > TITLE_MAX_LENGTH) {
      toast.error(`Название слишком длинное. Уменьшите на ${eventData.title.length - TITLE_MAX_LENGTH} символов`);
      return false;
    }
  
    if (!eventData.description?.trim()) {
      toast.error('Введите описание мероприятия');
      return false;
    }
  
    if (eventData.description.length > DESC_MAX_LENGTH) {
      toast.error(`Описание слишком длинное. Уменьшите на ${eventData.description.length - DESC_MAX_LENGTH} символов`);
      return false;
    }
  
    if ((eventData.short_description?.length || 0) > SHORT_DESC_MAX_LENGTH) {
      toast.error(`Короткое описание слишком длинное. Уменьшите на ${(eventData.short_description?.length || 0) - SHORT_DESC_MAX_LENGTH} символов`);
      return false;
    }

    const timeValidation = validateDateTime(eventData);
    if (!timeValidation.isValid) {
      toast.error(timeValidation.message);
      return false;
    }

    if (!eventData.location?.trim()) {
      toast.error('Укажите место проведения');
      return false;
    }

    if (eventData.payment_type === 'cost') {
      if (eventData.payment_link && !isValidUrl(eventData.payment_link)) {
        toast.error('Неверный формат ссылки для оплаты');
        return false;
      }
    }

    if (eventData.video_url && !isValidUrl(eventData.video_url)) {
      toast.error('Неверный формат ссылки на видео');
      return false;
    }

    if (eventData.photo_gallery && !isValidUrl(eventData.photo_gallery)) {
      toast.error('Неверный формат ссылки на фотогалерею');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Upload image if selected
      let imagePaths = null;
      if (imageFile) {
        imagePaths = await uploadImage();
        if (imagePaths) {
          setEventData(prev => ({
            ...prev,
            bg_image: imagePaths.croppedPath,
            original_bg_image: imagePaths.originalPath
          }));
        }
      }

      // Prepare data for saving
      const dataToSave = {
        ...eventData,
        speakers: selectedSpeakers,
        widget_chooser: usePaymentWidget,
        bg_image: imagePaths ? imagePaths.croppedPath : eventData.bg_image,
        original_bg_image: imagePaths ? imagePaths.originalPath : eventData.original_bg_image,
        start_time: createTimestamp(eventData.date!, eventData.start_time!),
        end_time: createTimestamp(eventData.date!, eventData.end_time!),
        festival_program: (eventData.festival_program?.length || 0) > 0 ? eventData.festival_program : null
      };

      console.log('Attempting to save eventData:', dataToSave);

      // Use the Edge Function to save the event
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            eventData: dataToSave,
            isNew: !isEditMode
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      const result = await response.json();
      console.log('Save event response:', result);

      toast.success(isEditMode ? 'Мероприятие обновлено' : 'Мероприятие создано');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Ошибка при сохранении: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const timestamp = Date.now();
      const fileExt = imageFile.name.split('.').pop();
      
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile);

      if (originalError) throw originalError;

      const { error: croppedError } = await supabase.storage
        .from('images')
        .upload(croppedPath, imageFile);

      if (croppedError) throw croppedError;

      return { originalPath, croppedPath };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
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
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400
      });

      if (!croppedCanvas) {
        throw new Error('Cropping failed');
      }

      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg'
      });

      const timestamp = Date.now();
      const fileExt = 'jpg';
      
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile);

      if (originalError) throw originalError;

      const { error: croppedError } = await supabase.storage
        .from('images')
        .upload(croppedPath, croppedFile);

      if (croppedError) throw croppedError;

      if (eventData.bg_image) {
        await supabase.storage
          .from('images')
          .remove([eventData.bg_image]);
      }
      if (eventData.original_bg_image) {
        await supabase.storage
          .from('images')
          .remove([eventData.original_bg_image]);
      }

      setEventData(prev => ({
        ...prev,
        original_bg_image: originalPath,
        bg_image: croppedPath
      }));

      setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${croppedPath}`);
      setShowCropper(false);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Ошибка при загрузке изображений');
    }
  };

  const handleProgramImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 2000,
        useWebWorker: true
      });
  
      setProgramImageFile(compressedFile);
      setShowProgramCropper(true);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Ошибка при обработке изображения');
    }
  };

  const handleProgramCrop = async () => {
    if (!programCropper || !programImageFile) return;

    try {
      const croppedCanvas = programCropper.getCroppedCanvas({
        width: 400,
        height: 500,
        minWidth: 400,
        minHeight: 500,
        maxWidth: 400,
        maxHeight: 500
      });

      if (!croppedCanvas) {
        throw new Error('Cropping failed');
      }

      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const croppedFile = new File([croppedBlob], programImageFile.name, {
        type: 'image/jpeg'
      });

      const timestamp = Date.now();
      const fileExt = 'jpg';
      const path = `festival_program/program_${timestamp}.${fileExt}`;

      const { error } = await supabase.storage
        .from('images')
        .upload(path, croppedFile);

      if (error) throw error;

      if (currentProgramItem.image_url) {
        await supabase.storage
          .from('images')
          .remove([currentProgramItem.image_url]);
      }

      setCurrentProgramItem(prev => ({
        ...prev,
        image_url: path
      }));

      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${path}`);
      setShowProgramCropper(false);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading program image:', error);
      toast.error('Ошибка при загрузке изображения программы');
    }
  };

  const handleAddProgramItem = () => {
    if (!currentProgramItem.title) {
      toast.error('Введите название пункта программы');
      return;
    }
    if (!currentProgramItem.description) {
      toast.error('Введите описание пункта программы');
      return;
    }
    if (!currentProgramItem.start_time || !currentProgramItem.end_time) {
      toast.error('Укажите время начала и окончания');
      return;
    }

    setEventData(prev => {
      const program = prev.festival_program || [];
      const newProgram = [...program];
      
      if (editingProgramIndex !== null) {
        newProgram[editingProgramIndex] = currentProgramItem;
        toast.success('Пункт программы обновлен');
      } else {
        newProgram.push(currentProgramItem);
        toast.success('Пункт программы добавлен');
      }

      // Add speaker to main speakers list if not already present
      if (currentProgramItem.lecturer_id && !selectedSpeakers.includes(currentProgramItem.lecturer_id)) {
        setSelectedSpeakers(prev => [...prev, currentProgramItem.lecturer_id]);
        toast.info('Спикер добавлен в мероприятие');
      }

      return {
        ...prev,
        festival_program: newProgram
      };
    });

    // Reset form
    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setProgramPreviewUrl(null);
    setEditingProgramIndex(null);
    setShowProgramForm(false);
    if (programFileInputRef.current) {
      programFileInputRef.current.value = '';
    }
  };

  const handleEditProgramItem = (index: number) => {
    const program = eventData.festival_program || [];
    setCurrentProgramItem(program[index]);
    if (program[index].image_url) {
      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${program[index].image_url}`);
    }
    setEditingProgramIndex(index);
    setShowProgramForm(true);
    toast.info('Редактирование пункта программы');
  };

  const handleDeleteProgramItem = async (index: number) => {
    const program = eventData.festival_program || [];
    const itemToDelete = program[index];
    
    if (!window.confirm('Вы уверены, что хотите удалить этот пункт программы?')) {
      return;
    }

    const toastId = toast.loading('Удаление пункта программы...');
    
    try {
      // Delete image from storage if exists
      if (itemToDelete.image_url) {
        await supabase.storage
          .from('images')
          .remove([itemToDelete.image_url]);
        toast.update(toastId, { render: 'Изображение удалено', type: 'info', isLoading: false, autoClose: 3000 });
      }

      setEventData(prev => {
        const newProgram = [...(prev.festival_program || [])];
        newProgram.splice(index, 1);
        return {
          ...prev,
          festival_program: newProgram
        };
      });

      toast.update(toastId, { 
        render: 'Пункт программы удалён', 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });
    } catch (error) {
      console.error('Error deleting program item:', error);
      toast.update(toastId, { 
        render: 'Ошибка при удалении пункта программы', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

  const toggleSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => {
      const newSelection = prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId];
      
      setEventData(prevData => ({ ...prevData, speakers: newSelection }));
      return newSelection;
    });
  };

  const toggleLanguage = (lang: string) => {
    setEventData(prev => ({
      ...prev,
      languages: prev.languages?.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...(prev.languages || []), lang]
    }));
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-semibold">
            {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Сохранить
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image upload section */}
          <div className="form-group">
            <label className="block font-medium mb-2">Изображение</label>
            {showCropper && imageFile ? (
              <div className="space-y-4">
                <Cropper
                  src={URL.createObjectURL(imageFile)}
                  style={{ height: 400, width: '100%' }}
                  aspectRatio={3}
                  guides={true}
                  onInitialized={instance => setCropper(instance)}
                />
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCropper(false)}
                    className="btn-outline"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleCrop}
                    className="btn-primary"
                  >
                    Обрезать и сохранить
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
                <button
                  type="button"
                  onClick={() => {
                    setEventData(prev => ({
                      ...prev,
                      bg_image: null,
                      original_bg_image: null
                    }));
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Загрузить изображение
                </button>
                <p className="mt-2 text-sm text-dark-500">
                  Рекомендуемый размер: 1200x400px
                </p>
              </div>
            )}
          </div>

          {/* Basic information */}
          <div className="form-group">
            <label htmlFor="title" className="block font-medium mb-2">
              Название ({(eventData.title?.length || 0)}/{TITLE_MAX_LENGTH})
            </label>
            <input
              type="text"
              id="title"
              value={eventData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="form-input"
              maxLength={TITLE_MAX_LENGTH}
            />
            {(eventData.title?.length || 0) >= TITLE_MAX_LENGTH && (
              <p className="text-sm text-red-600 mt-1">
                Максимальная длина достигнута
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="short_description" className="block font-medium mb-2">
              Короткое описание ({(eventData.short_description?.length || 0)}/{SHORT_DESC_MAX_LENGTH})
              <span className="text-sm text-gray-500 ml-2">(необязательное)</span>
            </label>
            <textarea
              id="short_description"
              value={eventData.short_description || ''}
              onChange={(e) => handleFieldChange('short_description', e.target.value)}
              className="form-input"
              rows={2}
              maxLength={SHORT_DESC_MAX_LENGTH}
            />
            {(eventData.short_description?.length || 0) >= SHORT_DESC_MAX_LENGTH && (
              <p className="text-sm text-red-600 mt-1">
                Максимальная длина достигнута
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="block font-medium mb-2">
              Описание ({(eventData.description?.length || 0)}/{DESC_MAX_LENGTH})
            </label>
            <textarea
              id="description"
              value={eventData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="form-input"
              rows={4}
              maxLength={DESC_MAX_LENGTH}
            />
            {(eventData.description?.length || 0) >= DESC_MAX_LENGTH && (
              <p className="text-sm text-red-600 mt-1">
                Максимальная длина достигнута
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="event_type" className="block font-medium mb-2">
              Тип мероприятия
            </label>
            <select
              id="event_type"
              value={eventData.event_type || ''}
              onChange={(e) => handleFieldChange('event_type', e.target.value)}
              className="form-input"
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="date" className="block font-medium mb-2">
                Дата
              </label>
              <input
                type="date"
                id="date"
                value={eventData.date || ''}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="start_time" className="block font-medium mb-2">
                Время начала
              </label>
              <input
                type="time"
                id="start_time"
                value={eventData.start_time || ''}
                onChange={(e) => handleFieldChange('start_time', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time" className="block font-medium mb-2">
                Время окончания
              </label>
              <input
                type="time"
                id="end_time"
                value={eventData.end_time || ''}
                onChange={(e) => handleFieldChange('end_time', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Location and capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="location" className="block font-medium mb-2">
                Место проведения
              </label>
              <input
                type="text"
                id="location"
                value={eventData.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_registrations" className="block font-medium mb-2">
                Максимум участников
              </label>
              <input
                type="number"
                id="max_registrations"
                value={eventData.max_registrations || ''}
                onChange={(e) => handleFieldChange('max_registrations', parseInt(e.target.value) || null)}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          {/* Categories and languages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="age_category" className="block font-medium mb-2">
                Возрастная категория
              </label>
              <select
                id="age_category"
                value={eventData.age_category || ''}
                onChange={(e) => handleFieldChange('age_category', e.target.value)}
                className="form-input"
              >
                {ageCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block font-medium mb-2">
                Языки
              </label>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (eventData.languages || []).includes(lang)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="block font-medium mb-2">
                Статус
              </label>
              <select
                id="status"
                value={eventData.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="form-input"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="payment_type" className="block font-medium mb-2">
                Тип оплаты
              </label>
              <select
                id="payment_type"
                value={eventData.payment_type || ''}
                onChange={(e) => handleFieldChange('payment_type', e.target.value)}
                className="form-input"
              >
                {paymentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {eventData.payment_type === 'cost' && (
              <>
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-2">
                    Стоимость
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={eventData.price || ''}
                    onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || null)}
                    className="form-input"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-2">
                    Валюта
                  </label>
                  <select
                    id="currency"
                    value={eventData.currency || ''}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="form-input"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Additional payment options */}
          {eventData.payment_type === 'cost' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="couple_discount" className="block font-medium mb-2">
                  Скидка для пар
                </label>
                <input
                  type="text"
                  id="couple_discount"
                  value={eventData.couple_discount || ''}
                  onChange={(e) => handleFieldChange('couple_discount', e.target.value)}
                  className="form-input"
                  placeholder="Укажите условия скидки для пар"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center justify-between">
                  <span className="font-medium">Детям 50% скидка</span>
                  <button
                    type="button"
                    onClick={() => setEventData(prev => ({ ...prev, child_half_price: !prev.child_half_price }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      eventData.child_half_price ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        eventData.child_half_price ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div className="form-group col-span-2">
                <label className="flex items-center justify-between mb-2">
                  <span className="font-medium">Использовать виджет оплаты</span>
                  <button
                    type="button"
                    onClick={() => setUsePaymentWidget(!usePaymentWidget)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      usePaymentWidget ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        usePaymentWidget ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Тумблер только сохраняет предпочтение, оба поля будут сохранены
                </p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="payment_link" className="block font-medium mb-2">
                      Ссылка для оплаты
                    </label>
                    <input
                      type="url"
                      id="payment_link"
                      value={eventData.payment_link || ''}
                      onChange={(e) => handleFieldChange('payment_link', e.target.value)}
                      className="form-input"
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label htmlFor="payment_widget_id" className="block font-medium mb-2">
                      Код виджета оплаты
                    </label>
                    <textarea
                      id="payment_widget_id"
                      value={eventData.payment_widget_id || ''}
                      onChange={(e) => handleFieldChange('payment_widget_id', e.target.value)}
                      className="form-input h-32"
                      placeholder='<a href="#" data-oblak-widget data-event-id="ID">Buy ticket</a>'
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Вставьте полный HTML-код виджета
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="video_url" className="block font-medium mb-2">
                Ссылка на видео
              </label>
              <input
                type="url"
                id="video_url"
                value={eventData.video_url || ''}
                onChange={(e) => handleFieldChange('video_url', e.target.value)}
                className="form-input"
                placeholder="https://"
              />
            </div>

            <div className="form-group">
              <label htmlFor="photo_gallery" className="block font-medium mb-2">
                Ссылка на фотогалерею
              </label>
              <input
                type="url"
                id="photo_gallery"
                value={eventData.photo_gallery || ''}
                onChange={(e) => handleFieldChange('photo_gallery', e.target.value)}
                className="form-input"
                placeholder="https://"
              />
            </div>
          </div>

          {/* Speakers section */}
          <div className="form-group">
            <div className="flex justify-between items-center mb-4">
              <label className="block font-medium">Спикеры</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Скрыть галерею</span>
                <button
                  type="button"
                  onClick={() => setEventData(prev => ({ ...prev, hide_speakers_gallery: !prev.hide_speakers_gallery }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    eventData.hide_speakers_gallery ? 'bg-gray-200 dark:bg-dark-600' : 'bg-primary-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      eventData.hide_speakers_gallery ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
                <span className="text-sm">Показать галерею</span>
              </div>
            </div>

            {/* Selected speakers list */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Выбранные спикеры:</label>
              {selectedSpeakersData.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSpeakersData.map(speaker => (
                    <div 
                      key={speaker.id}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full text-sm"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        {speaker.photos?.[0]?.url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                            <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="truncate max-w-[100px]">{speaker.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSpeaker(speaker.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-dark-400">Спикеры не выбраны</p>
              )}
            </div>

            {!eventData.hide_speakers_gallery && (
              <>
                {/* Search input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по имени или специализации..."
                    value={speakerSearchQuery}
                    onChange={(e) => setSpeakerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                  />
                </div>

                {speakersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : speakersError ? (
                  <div className="text-center py-4 text-red-600">
                    {speakersError}
                  </div>
                ) : filteredSpeakers.length === 0 ? (
                  <div className="text-center py-4 text-dark-500">
                    {speakerSearchQuery ? 'Спикеры не найдены' : 'Нет доступных спикеров'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredSpeakers.map(speaker => {
                      const isSelected = selectedSpeakers.includes(speaker.id);
                      return (
                        <div
                          key={speaker.id}
                          onClick={() => toggleSpeaker(speaker.id)}
                          className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-500'
                          }`}
                        >
                          <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                            {speaker.photos?.[0]?.url ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                                alt={speaker.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                                <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 bg-primary-600 rounded-full p-0.5">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[100px]">{speaker.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-dark-400 truncate max-w-[100px]">
                              {speaker.field_of_expertise}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Festival program section */}
          {eventData.event_type === 'Festival' && (
            <div className="form-group">
              <div className="flex justify-between items-center mb-4">
                <label className="block font-medium">Программа фестиваля</label>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProgramItem({
                      title: '',
                      description: '',
                      image_url: '',
                      start_time: '',
                      end_time: '',
                      lecturer_id: ''
                    });
                    setProgramPreviewUrl(null);
                    setEditingProgramIndex(null);
                    setShowProgramForm(true);
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Добавить пункт программы
                </button>
              </div>

              {/* Current program items list */}
              <div className="space-y-4 mb-6">
                {(eventData.festival_program || []).map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-dark-400">{item.description}</p>
                      <div className="text-xs mt-2">
                        <span>{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span> - </span>
                        <span>{new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProgramItem(index)}
                        className="p-1 text-gray-500 hover:text-primary-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProgramItem(index)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Program item form */}
              {showProgramForm && (
                <div className="border rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {editingProgramIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Название</label>
                      <input
                        type="text"
                        value={currentProgramItem.title}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, title: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Спикер</label>
                      <select
                        value={currentProgramItem.lecturer_id}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, lecturer_id: e.target.value})}
                        className="form-input"
                      >
                        <option value="">Выберите спикера</option>
                        {speakers.map(speaker => (
                          <option key={speaker.id} value={speaker.id}>
                            {speaker.name} ({speaker.field_of_expertise})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block font-medium mb-2">Описание</label>
                    <textarea
                      value={currentProgramItem.description}
                      onChange={(e) => setCurrentProgramItem({...currentProgramItem, description: e.target.value})}
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Время начала</label>
                      <input
                        type="datetime-local"
                        value={currentProgramItem.start_time}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, start_time: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Время окончания</label>
                      <input
                        type="datetime-local"
                        value={currentProgramItem.end_time}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, end_time: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block font-medium mb-2">Изображение</label>

                    {showProgramCropper && programImageFile ? (
                      <div className="space-y-4">
                        <div className="relative" style={{ height: '70vh', width: '100%' }}>
                          <Cropper
                            src={URL.createObjectURL(programImageFile)}
                            style={{ height: '100%', width: '100%' }}
                            aspectRatio={4/5}
                            viewMode={1}
                            autoCropArea={0.8}
                            movable={true}
                            zoomable={true}
                            cropBoxMovable={true}
                            cropBoxResizable={true}
                            guides={true}
                            minContainerWidth={300}
                            minContainerHeight={375}
                            onInitialized={(instance) => {
                              setProgramCropper(instance);
                              instance.crop();
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button
                            type="button"
                            onClick={() => setShowProgramCropper(false)}
                            className="btn-outline"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={handleProgramCrop}
                            className="btn-primary"
                          >
                            Обрезать и сохранить
                          </button>
                        </div>
                      </div>
                    ) : programPreviewUrl ? (
                      <div className="relative">
                        <img
                          src={programPreviewUrl}
                          alt="Preview"
                          className="w-full max-w-[400px] aspect-[4/5] object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentProgramItem({...currentProgramItem, image_url: ''});
                            setProgramPreviewUrl(null);
                            if (programFileInputRef.current) {
                              programFileInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 text-center">
                        <input
                          ref={programFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProgramImageSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => programFileInputRef.current?.click()}
                          className="btn-outline inline-flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Загрузить изображение
                        </button>
                        <p className="mt-2 text-xs text-dark-500">
                          Рекомендуемый размер: изображение в пропорции 4:5 (например, 400×500px)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProgramForm(false)}
                      className="btn-outline mr-4"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProgramItem}
                      className="btn-primary"
                    >
                      {editingProgramIndex !== null ? 'Обновить пункт' : 'Добавить пункт'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form actions */}
          <div className="flex justify-end gap-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="btn-outline"
            >
              Отмена
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditEventPage;