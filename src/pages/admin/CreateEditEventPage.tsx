import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Trash2, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Globe, 
  Tag, 
  DollarSign,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Check,
  Info,
  AlertTriangle,
  FileText,
  Video,
  Camera,
  Loader2
} from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { 
  formatTimeFromTimestamp, 
  formatTimeRange, 
  formatRussianDate,
  BELGRADE_TIMEZONE,
  formatDateTimeForDatabase,
  isValidTimeFormat
} from '../../utils/dateTimeUtils';
import { Event, eventTypes, paymentTypes, languages, ageCategories, currencies, statuses } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper function to validate URLs
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    short_description: '',
    description: '',
    event_type: eventTypes[0],
    bg_image: null,
    original_bg_image: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '18:00',
    end_time: '20:00',
    location: '',
    age_category: ageCategories[0],
    price: 0,
    currency: currencies[0],
    status: 'draft',
    payment_type: 'free',
    languages: [languages[0]],
    speakers: [],
    hide_speakers_gallery: true,
    registrations: {
      max_regs: null,
      current: 0,
      current_adults: 0,
      current_children: 0,
      reg_list: []
    }
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string; photos: any[] }>>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [festivalProgram, setFestivalProgram] = useState<any[]>([]);
  const [showFestivalProgramForm, setShowFestivalProgramForm] = useState(false);
  const [programItemForm, setProgramItemForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    image_url: '',
    lecturer_id: ''
  });
  const [editingProgramItemIndex, setEditingProgramItemIndex] = useState<number | null>(null);

  // Fetch speakers on component mount
  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const { data, error } = await supabase
          .from('speakers')
          .select('id, name, photos')
          .eq('active', true);

        if (error) throw error;
        setSpeakers(data || []);
      } catch (error) {
        console.error('Error fetching speakers:', error);
        toast.error('Ошибка при загрузке спикеров');
      }
    };

    fetchSpeakers();
  }, []);

  // Fetch event data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          // Convert timestamps to Belgrade timezone for display
          const eventDate = data.date ? format(utcToZonedTime(new Date(data.date), BELGRADE_TIMEZONE), 'yyyy-MM-dd') : '';
          const startTime = data.start_time ? formatInTimeZone(new Date(data.start_time), BELGRADE_TIMEZONE, 'HH:mm') : '';
          const endTime = data.end_time ? formatInTimeZone(new Date(data.end_time), BELGRADE_TIMEZONE, 'HH:mm') : '';

          // Set preview URL if image exists
          if (data.bg_image) {
            setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${data.bg_image}`);
          }

          // Handle speakers
          if (data.speakers && Array.isArray(data.speakers)) {
            setSelectedSpeakers(data.speakers);
          }

          // Handle festival program
          if (data.festival_program && Array.isArray(data.festival_program)) {
            setFestivalProgram(data.festival_program);
          }

          // Set form data with converted times
          setFormData({
            ...data,
            date: eventDate,
            start_time: startTime,
            end_time: endTime,
            // Ensure registrations has the correct structure
            registrations: data.registrations || {
              max_regs: data.max_registrations || null,
              current: data.current_registration_count || 0,
              current_adults: 0,
              current_children: 0,
              reg_list: data.registrations_list || []
            }
          });
        } catch (error) {
          console.error('Error fetching event:', error);
          toast.error('Ошибка при загрузке мероприятия');
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [id, isEditMode]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle multi-select changes (languages, speakers)
  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof Event] as string[] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  // Handle speaker selection
  const handleSpeakerSelect = (speakerId: string) => {
    setSelectedSpeakers(prev => 
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер 5MB.');
        return;
      }

      setImageFile(file);
      setShowCropper(true);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Ошибка при обработке изображения');
    }
  };

  // Handle image cropping
  const handleCrop = async () => {
    if (!cropper || !imageFile) return;

    try {
      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((b) => {
          if (b) resolve(b);
          else throw new Error('Failed to create blob');
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Generate unique filenames
      const timestamp = Date.now();
      const fileExt = 'jpg';
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      // Upload original image
      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (originalError) throw originalError;

      // Upload cropped image
      const { error: croppedError } = await supabase.storage
        .from('images')
        .upload(croppedPath, croppedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (croppedError) throw croppedError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(croppedPath);

      // Update form data
      setFormData(prev => ({
        ...prev,
        bg_image: croppedPath,
        original_bg_image: originalPath
      }));

      // Update preview URL
      setPreviewUrl(urlData.publicUrl);
      
      // Reset cropper state
      setShowCropper(false);
      setImageFile(null);
      
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка при загрузке изображения');
    }
  };

  // Handle removing the image
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({
      ...prev,
      bg_image: null,
      original_bg_image: null
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.title?.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    if (!formData.date) {
      newErrors.date = 'Дата обязательна';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Время начала обязательно';
    } else if (!isValidTimeFormat(formData.start_time)) {
      newErrors.start_time = 'Неверный формат времени (HH:MM)';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'Время окончания обязательно';
    } else if (!isValidTimeFormat(formData.end_time)) {
      newErrors.end_time = 'Неверный формат времени (HH:MM)';
    }
    
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'Время окончания должно быть позже времени начала';
    }
    
    if (!formData.location?.trim()) {
      newErrors.location = 'Место проведения обязательно';
    }
    
    if (formData.payment_type === 'cost' && (formData.price === undefined || formData.price < 0)) {
      newErrors.price = 'Укажите корректную стоимость';
    }
    
    if (formData.payment_link && !isValidUrl(formData.payment_link)) {
      newErrors.payment_link = 'Неверный формат ссылки';
    }
    
    if (formData.video_url && !isValidUrl(formData.video_url)) {
      newErrors.video_url = 'Неверный формат ссылки';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for saving
      const eventData = { ...formData };
      
      // Convert date and times to UTC for storage
      if (eventData.date && eventData.start_time) {
        eventData.start_time = formatDateTimeForDatabase(eventData.date, eventData.start_time);
      }
      
      if (eventData.date && eventData.end_time) {
        eventData.end_time = formatDateTimeForDatabase(eventData.date, eventData.end_time);
      }
      
      // Set speakers from selected speakers
      eventData.speakers = selectedSpeakers;
      
      // Set festival program if applicable
      if (eventData.event_type === 'Festival' && festivalProgram.length > 0) {
        eventData.festival_program = festivalProgram;
      }
      
      // Call the Edge Function to save the event
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            eventData,
            isNew: !isEditMode
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      toast.success(isEditMode ? 'Мероприятие обновлено' : 'Мероприятие создано');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Ошибка при сохранении мероприятия');
    } finally {
      setSaving(false);
    }
  };

  // Handle festival program item form
  const handleProgramItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProgramItemForm(prev => ({ ...prev, [name]: value }));
  };

  // Add or update festival program item
  const handleAddProgramItem = () => {
    if (!programItemForm.title || !programItemForm.start_time || !programItemForm.end_time) {
      toast.error('Заполните обязательные поля');
      return;
    }

    if (editingProgramItemIndex !== null) {
      // Update existing item
      const updatedProgram = [...festivalProgram];
      updatedProgram[editingProgramItemIndex] = programItemForm;
      setFestivalProgram(updatedProgram);
    } else {
      // Add new item
      setFestivalProgram(prev => [...prev, programItemForm]);
    }

    // Reset form
    setProgramItemForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      image_url: '',
      lecturer_id: ''
    });
    setEditingProgramItemIndex(null);
    setShowFestivalProgramForm(false);
  };

  // Edit festival program item
  const handleEditProgramItem = (index: number) => {
    setProgramItemForm(festivalProgram[index]);
    setEditingProgramItemIndex(index);
    setShowFestivalProgramForm(true);
  };

  // Delete festival program item
  const handleDeleteProgramItem = (index: number) => {
    setFestivalProgram(prev => prev.filter((_, i) => i !== index));
  };

  // Get speaker name by ID
  const getSpeakerName = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker ? speaker.name : 'Неизвестный спикер';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
        </h1>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary-600" />
            Основная информация
          </h2>
          
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="title" className="block font-medium mb-2">
                Название мероприятия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                } dark:bg-dark-800`}
                placeholder="Введите название мероприятия"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="short_description" className="block font-medium mb-2">
                Краткое описание
              </label>
              <textarea
                id="short_description"
                name="short_description"
                value={formData.short_description || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                placeholder="Краткое описание для карточки мероприятия"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block font-medium mb-2">
                Полное описание
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                placeholder="Подробное описание мероприятия"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="event_type" className="block font-medium mb-2">
                  Тип мероприятия
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={formData.event_type || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age_category" className="block font-medium mb-2">
                  Возрастная категория
                </label>
                <select
                  id="age_category"
                  name="age_category"
                  value={formData.age_category || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                >
                  {ageCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="block font-medium mb-2">
                Языки
              </label>
              <div className="flex flex-wrap gap-3">
                {languages.map(lang => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.languages || []).includes(lang)}
                      onChange={() => handleMultiSelectChange('languages', lang)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="block font-medium mb-2">
                Изображение
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              
              {showCropper && imageFile ? (
                <div className="space-y-4">
                  <Cropper
                    src={URL.createObjectURL(imageFile)}
                    style={{ height: 400, width: '100%' }}
                    aspectRatio={3}
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
                      onClick={() => setShowCropper(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <X className="h-5 w-5 mr-2 inline-block" />
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleCrop}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <Check className="h-5 w-5 mr-2 inline-block" />
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
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white/90 hover:bg-white text-dark-800 rounded-full shadow-lg"
                      title="Изменить изображение"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
                      title="Удалить изображение"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-dark-700 rounded-full">
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
                      Рекомендуемый размер: 1200x400px
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Дата и время
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="date" className="block font-medium mb-2">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.date ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                } dark:bg-dark-800`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="start_time" className="block font-medium mb-2">
                Время начала <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                } dark:bg-dark-800`}
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="end_time" className="block font-medium mb-2">
                Время окончания <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.end_time ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                } dark:bg-dark-800`}
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-500">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div className="form-group mt-6">
            <label htmlFor="location" className="block font-medium mb-2">
              Место проведения <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.location ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
              } dark:bg-dark-800`}
              placeholder="Адрес или название места"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            Информация о стоимости
          </h2>
          
          <div className="space-y-6">
            <div className="form-group">
              <label className="block font-medium mb-2">
                Тип оплаты
              </label>
              <div className="flex flex-wrap gap-3">
                {paymentTypes.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_type"
                      value={type}
                      checked={formData.payment_type === type}
                      onChange={handleChange}
                      className="rounded-full border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                    />
                    <span>
                      {type === 'free' ? 'Бесплатно' : 
                       type === 'donation' ? 'Донейшн' : 
                       'Платно'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {formData.payment_type === 'cost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-2">
                    Стоимость <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price || 0}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className={`w-full px-4 py-2 rounded-md border ${
                      errors.price ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                    } dark:bg-dark-800`}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-2">
                    Валюта
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="payment_link" className="block font-medium mb-2">
                Ссылка на оплату
              </label>
              <input
                type="url"
                id="payment_link"
                name="payment_link"
                value={formData.payment_link || ''}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.payment_link ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                } dark:bg-dark-800`}
                placeholder="https://..."
              />
              {errors.payment_link && (
                <p className="mt-1 text-sm text-red-500">{errors.payment_link}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="payment_widget_id" className="block font-medium mb-2">
                ID виджета оплаты
              </label>
              <input
                type="text"
                id="payment_widget_id"
                name="payment_widget_id"
                value={formData.payment_widget_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                placeholder="ID виджета (если используется)"
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="widget_chooser"
                  checked={formData.widget_chooser || false}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                />
                <span>Использовать виджет вместо ссылки</span>
              </label>
            </div>
          </div>
        </div>

        {/* Speakers */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Спикеры
          </h2>
          
          <div className="space-y-6">
            <div className="form-group">
              <label className="block font-medium mb-2">
                Выберите спикеров
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {speakers.map(speaker => (
                  <label key={speaker.id} className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 dark:border-dark-700 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700">
                    <input
                      type="checkbox"
                      checked={selectedSpeakers.includes(speaker.id)}
                      onChange={() => handleSpeakerSelect(speaker.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                    />
                    <div className="flex items-center gap-2">
                      {speaker.photos?.[0]?.url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                          alt={speaker.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-dark-600 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <span>{speaker.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hide_speakers_gallery"
                  checked={formData.hide_speakers_gallery || false}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                />
                <span>Скрыть галерею спикеров на странице мероприятия</span>
              </label>
            </div>
          </div>
        </div>

        {/* Festival Program (only for Festival event type) */}
        {formData.event_type === 'Festival' && (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Программа фестиваля
            </h2>
            
            <div className="space-y-6">
              {festivalProgram.length > 0 ? (
                <div className="space-y-4">
                  {festivalProgram.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.start_time} - {item.end_time}
                          </div>
                          {item.lecturer_id && (
                            <div className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                              Спикер: {getSpeakerName(item.lecturer_id)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProgramItem(index)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProgramItem(index)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Нет добавленных пунктов программы
                  </p>
                </div>
              )}

              {showFestivalProgramForm ? (
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                  <h3 className="font-medium mb-4">
                    {editingProgramItemIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="program_title" className="block font-medium mb-2">
                        Название <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="program_title"
                        name="title"
                        value={programItemForm.title}
                        onChange={handleProgramItemChange}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                        placeholder="Название пункта программы"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="program_start_time" className="block font-medium mb-2">
                          Время начала <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id="program_start_time"
                          name="start_time"
                          value={programItemForm.start_time}
                          onChange={handleProgramItemChange}
                          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="program_end_time" className="block font-medium mb-2">
                          Время окончания <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id="program_end_time"
                          name="end_time"
                          value={programItemForm.end_time}
                          onChange={handleProgramItemChange}
                          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="program_description" className="block font-medium mb-2">
                        Описание
                      </label>
                      <textarea
                        id="program_description"
                        name="description"
                        value={programItemForm.description}
                        onChange={handleProgramItemChange}
                        rows={3}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                        placeholder="Описание пункта программы"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="program_lecturer" className="block font-medium mb-2">
                        Спикер
                      </label>
                      <select
                        id="program_lecturer"
                        name="lecturer_id"
                        value={programItemForm.lecturer_id}
                        onChange={handleProgramItemChange}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                      >
                        <option value="">Выберите спикера</option>
                        {speakers.map(speaker => (
                          <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFestivalProgramForm(false);
                          setEditingProgramItemIndex(null);
                          setProgramItemForm({
                            title: '',
                            description: '',
                            start_time: '',
                            end_time: '',
                            image_url: '',
                            lecturer_id: ''
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProgramItem}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        {editingProgramItemIndex !== null ? 'Сохранить' : 'Добавить'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFestivalProgramForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Добавить пункт программы
                </button>
              )}
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary-600" />
              Дополнительные настройки
            </h2>
            <ChevronDown className={`h-5 w-5 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
          </button>
          
          {showAdvancedSettings && (
            <div className="mt-6 space-y-6">
              <div className="form-group">
                <label htmlFor="status" className="block font-medium mb-2">
                  Статус мероприятия
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'active' ? 'Активное' : 
                       status === 'draft' ? 'Черновик' : 
                       'Прошедшее'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="max_registrations" className="block font-medium mb-2">
                  Максимальное количество участников
                </label>
                <input
                  type="number"
                  id="max_registrations"
                  name="max_registrations"
                  value={formData.registrations?.max_regs || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    setFormData(prev => ({
                      ...prev,
                      registrations: {
                        ...prev.registrations!,
                        max_regs: value
                      }
                    }));
                  }}
                  min="0"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                  placeholder="Оставьте пустым для неограниченного количества"
                />
              </div>

              <div className="form-group">
                <label htmlFor="video_url" className="block font-medium mb-2">
                  Ссылка на видео
                </label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.video_url ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  } dark:bg-dark-800`}
                  placeholder="https://youtube.com/..."
                />
                {errors.video_url && (
                  <p className="mt-1 text-sm text-red-500">{errors.video_url}</p>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="couple_discount"
                    checked={formData.couple_discount !== undefined}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, couple_discount: '10' }));
                      } else {
                        setFormData(prev => {
                          const { couple_discount, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                  />
                  <span>Скидка для пар</span>
                </label>
                
                {formData.couple_discount !== undefined && (
                  <div className="mt-2">
                    <input
                      type="number"
                      name="couple_discount"
                      value={formData.couple_discount || ''}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-24 px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                    />
                    <span className="ml-2">%</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="child_half_price"
                    checked={formData.child_half_price || false}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                  />
                  <span>Детский билет за полцены</span>
                </label>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="registration_enabled"
                    checked={formData.registration_enabled !== false}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                  />
                  <span>Включить регистрацию</span>
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="registration_deadline" className="block font-medium mb-2">
                  Дедлайн регистрации
                </label>
                <input
                  type="datetime-local"
                  id="registration_deadline"
                  name="registration_deadline"
                  value={formData.registration_deadline || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                />
              </div>

              <div className="form-group">
                <label htmlFor="registration_limit_per_user" className="block font-medium mb-2">
                  Лимит регистраций на одного пользователя
                </label>
                <input
                  type="number"
                  id="registration_limit_per_user"
                  name="registration_limit_per_user"
                  value={formData.registration_limit_per_user || 5}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 dark:bg-dark-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
      </form>
    </div>
  );
};

// Additional components
const Settings = ({ className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronDown = ({ className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default CreateEditEventPage;