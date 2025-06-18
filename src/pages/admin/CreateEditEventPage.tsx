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
  Link2 as LinkIcon,
  Image,
  Upload,
  Check,
  Info,
  AlertTriangle,
  FileText,
  Video,
  Camera,
  Loader2,
  Settings,
  ChevronDown,
  Edit,
  Sparkles
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

// Modern Toggle Component
const Toggle = ({ checked, onChange, disabled = false, label, description }) => (
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out
        ${checked 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
          : 'bg-gray-200 dark:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out
          ${checked ? 'translate-x-6 shadow-lg' : 'translate-x-1 shadow-sm'}
        `}
      />
    </button>
  </div>
);

// Modern Radio Group Component
const RadioGroup = ({ options, value, onChange, name }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {options.map((option) => (
      <label
        key={option.value}
        className={`
          relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105
          ${value === option.value
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/25'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <div className="flex items-center space-x-3">
          <div
            className={`
              flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300
              ${value === option.value
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
          >
            {value === option.value && (
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {option.label}
          </span>
        </div>
      </label>
    ))}
  </div>
);

// Modern Checkbox Group Component
const CheckboxGroup = ({ options, values, onChange, columns = 3 }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-3`}>
    {options.map((option) => (
      <label
        key={option}
        className={`
          flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all duration-300 hover:scale-105
          ${values.includes(option)
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/25'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }
        `}
      >
        <div
          className={`
            flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-300
            ${values.includes(option)
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300 dark:border-gray-600'
            }
          `}
        >
          {values.includes(option) && (
            <Check className="h-3 w-3 text-white animate-in fade-in duration-300" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {option}
        </span>
        <input
          type="checkbox"
          checked={values.includes(option)}
          onChange={() => onChange(option)}
          className="sr-only"
        />
      </label>
    ))}
  </div>
);

// Animated Section Component
const AnimatedSection = ({ title, icon: Icon, children, defaultOpen = true, gradient = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`
      rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-xl
      ${gradient 
        ? 'bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10' 
        : 'bg-white dark:bg-gray-800'
      }
    `}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-lg transition-all duration-300
            ${gradient 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
              : 'bg-blue-100 dark:bg-blue-900/30'
            }
          `}>
            <Icon className={`h-5 w-5 ${gradient ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div className={`
        transition-all duration-500 ease-in-out overflow-hidden
        ${isOpen ? 'max-h-none opacity-100 pb-6' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 space-y-6 animate-in slide-in-from-top duration-500">
          {children}
        </div>
      </div>
    </div>
  );
};

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

  // Handle multi-select changes (languages)
  const handleLanguageChange = (language: string) => {
    setFormData(prev => {
      const currentLanguages = prev.languages || [];
      const newLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter(l => l !== language)
        : [...currentLanguages, language];
      return { ...prev, languages: newLanguages };
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


// Обработка состояния загрузки - показываем красивый индикатор загрузки
  // с градиентным фоном и анимированными спиннерами
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="flex flex-col items-center space-y-4">
          {/* Двойной анимированный спиннер для более эффектного вида */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Загружаем данные...</p>
        </div>
      </div>
    );
  }

  // Конфигурация опций для типа оплаты - используется в RadioGroup компоненте
  // Преобразуем простые строки в объекты с value и label для красивого отображения
  const paymentTypeOptions = [
    { value: 'free', label: 'Бесплатно' },
    { value: 'donation', label: 'Донейшн' }, 
    { value: 'cost', label: 'Платно' }
  ];

// Основная разметка компонента - современный интерфейс с анимациями
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок страницы с анимацией появления и градиентными элементами */}
        <div className="flex justify-between items-center mb-8 animate-in slide-in-from-top duration-700">
          <div className="flex items-center space-x-4">
            {/* Иконка с градиентным фоном и тенью */}
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              {/* Заголовок с градиентным текстом */}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
              </h1>
              {/* Подзаголовок с описанием */}
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode ? 'Измените детали вашего мероприятия' : 'Создайте новое незабываемое мероприятие'}
              </p>
            </div>
          </div>
          {/* Кнопки действий с hover эффектами */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 hover:scale-105 hover:shadow-lg shadow-blue-500/25"
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

        {/* Основная форма с анимацией появления снизу */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom duration-700">
          
          {/* Секция: Основная информация с градиентным фоном */}
          <AnimatedSection title="Основная информация" icon={Info} gradient={true}>
            <div className="space-y-6">
              {/* Поле названия мероприятия с валидацией */}
              <div className="form-group">
                <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Название мероприятия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 
                    ${errors.title 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4 placeholder-gray-400 dark:placeholder-gray-500
                  `}
                  placeholder="Введите название мероприятия"
                />
                {/* Анимированное сообщение об ошибке */}
                {errors.title && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.title}</p>
                )}
              </div>

              {/* Поле краткого описания */}
              <div className="form-group">
                <label htmlFor="short_description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Краткое описание
                </label>
                <textarea
                  id="short_description"
                  name="short_description"
                  value={formData.short_description || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Краткое описание для карточки мероприятия"
                />
              </div>

              {/* Поле полного описания */}
              <div className="form-group">
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Полное описание
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Подробное описание мероприятия"
                />
              </div>

              {/* Сетка для типа мероприятия и возрастной категории */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="event_type" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Тип мероприятия
                  </label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="age_category" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Возрастная категория
                  </label>
                  <select
                    id="age_category"
                    name="age_category"
                    value={formData.age_category || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    {ageCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Выбор языков через современный CheckboxGroup */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Языки
                </label>
                <CheckboxGroup 
                  options={languages}
                  values={formData.languages || []}
                  onChange={handleLanguageChange}
                />
              </div>

              {/* Секция загрузки изображения с предпросмотром и кроппером */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Изображение
                </label>
                {/* Скрытый input для файлов */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Условный рендеринг: кроппер, превью или зона загрузки */}
                {showCropper && imageFile ? (
                  // Интерфейс обрезки изображения с анимацией
                  <div className="space-y-4 animate-in zoom-in duration-500">
                    <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
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
                    </div>
                    
                    {/* Кнопки управления кроппером */}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCropper(false)}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
                      >
                        <X className="h-5 w-5 mr-2 inline-block" />
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleCrop}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
                      >
                        <Check className="h-5 w-5 mr-2 inline-block" />
                        Обрезать и сохранить
                      </button>
                    </div>
                  </div>
                ) : previewUrl ? (
                  // Превью загруженного изображения с кнопками управления
                  <div className="relative group animate-in zoom-in duration-500">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                    {/* Затемнение при наведении */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-2xl"></div>
                    {/* Кнопки управления, появляющиеся при наведении */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg hover:scale-110 transition-all duration-300"
                        title="Изменить изображение"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-all duration-300"
                        title="Удалить изображение"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Зона перетаскивания для загрузки файлов
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl">
                        <Image className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
                      >
                        Загрузить изображение
                      </button>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Рекомендуемый размер: 1200x400px
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>

          {/* Секция: Дата и время */}
          <AnimatedSection title="Дата и время" icon={Calendar}>
            {/* Сетка для полей даты и времени */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label htmlFor="date" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                    ${errors.date 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4
                  `}
                />
                {errors.date && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.date}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Время начала <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                    ${errors.start_time 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4
                  `}
                />
                {errors.start_time && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.start_time}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Время окончания <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                    ${errors.end_time 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4
                  `}
                />
                {errors.end_time && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.end_time}</p>
                )}
              </div>
            </div>

            {/* Поле места проведения */}
            <div className="form-group">
              <label htmlFor="location" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                  ${errors.location 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                  } 
                  dark:bg-gray-800 focus:outline-none focus:ring-4 placeholder-gray-400 dark:placeholder-gray-500
                `}
                placeholder="Адрес или название места"
              />
              {errors.location && (
                <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.location}</p>
              )}
            </div>
          </AnimatedSection>

          {/* Секция: Информация о стоимости */}
          <AnimatedSection title="Информация о стоимости" icon={DollarSign}>
            <div className="space-y-6">
              {/* Выбор типа оплаты через RadioGroup */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Тип оплаты
                </label>
                <RadioGroup 
                  options={paymentTypeOptions}
                  value={formData.payment_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
                  name="payment_type"
                />
              </div>

              {/* Условное отображение полей цены и валюты для платных мероприятий */}
              {formData.payment_type === 'cost' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-500">
                  <div className="form-group">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
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
                      className={`
                        w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                        ${errors.price 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                        } 
                        dark:bg-gray-800 focus:outline-none focus:ring-4
                      `}
                    />
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.price}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Валюта
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      {currencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Поле ссылки на оплату */}
              <div className="form-group">
                <label htmlFor="payment_link" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Ссылка на оплату
                </label>
                <input
                  type="url"
                  id="payment_link"
                  name="payment_link"
                  value={formData.payment_link || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                    ${errors.payment_link 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4 placeholder-gray-400 dark:placeholder-gray-500
                  `}
                  placeholder="https://..."
                />
                {errors.payment_link && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.payment_link}</p>
                )}
              </div>

              {/* Поле ID виджета оплаты */}
              <div className="form-group">
                <label htmlFor="payment_widget_id" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  ID виджета оплаты
                </label>
                <input
                  type="text"
                  id="payment_widget_id"
                  name="payment_widget_id"
                  value={formData.payment_widget_id || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="ID виджета (если используется)"
                />
              </div>

              {/* Тумблер для выбора виджета */}
              <div className="form-group">
                <Toggle
                  checked={formData.widget_chooser || false}
                  onChange={(checked) => setFormData(prev => ({ ...prev, widget_chooser: checked }))}
                  label="Использовать виджет вместо ссылки"
                  description="Включите, если хотите использовать встроенный виджет оплаты"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Секция: Спикеры */}
          <AnimatedSection title="Спикеры" icon={Users}>
            <div className="space-y-6">
              {/* Выбор спикеров из базы данных */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Выберите спикеров
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {speakers.map(speaker => (
                    <label
                      key={speaker.id}
                      className={`
                        flex items-center gap-3 cursor-pointer p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105
                        ${selectedSpeakers.includes(speaker.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/25'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      {/* Кастомный чекбокс */}
                      <div
                        className={`
                          flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-300
                          ${selectedSpeakers.includes(speaker.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }
                        `}
                      >
                        {selectedSpeakers.includes(speaker.id) && (
                          <Check className="h-3 w-3 text-white animate-in fade-in duration-300" />
                        )}
                      </div>
                      {/* Информация о спикере */}
                      <div className="flex items-center gap-3">
                        {speaker.photos?.[0]?.url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                            alt={speaker.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{speaker.name}</span>
                      </div>
                      {/* Скрытый input для accessibility */}
                      <input
                        type="checkbox"
                        checked={selectedSpeakers.includes(speaker.id)}
                        onChange={() => handleSpeakerSelect(speaker.id)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Тумблер для скрытия галереи спикеров */}
              <div className="form-group">
                <Toggle
                  checked={formData.hide_speakers_gallery || false}
                  onChange={(checked) => setFormData(prev => ({ ...prev, hide_speakers_gallery: checked }))}
                  label="Скрыть галерею спикеров"
                  description="Галерея спикеров не будет отображаться на странице мероприятия"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Секция: Программа фестиваля (только для типа "Festival") */}
          {formData.event_type === 'Festival' && (
            <AnimatedSection title="Программа фестиваля" icon={Calendar}>
              <div className="space-y-6">
                {/* Список существующих пунктов программы */}
                {festivalProgram.length > 0 ? (
                  <div className="space-y-4">
                    {festivalProgram.map((item, index) => (
                      <div
                        key={index}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.title}</h3>
                            {/* Время проведения пункта программы */}
                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2">
                              <Clock className="h-4 w-4" />
                              {item.start_time} - {item.end_time}
                            </div>
                            {/* Информация о спикере */}
                            {item.lecturer_id && (
                              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mt-1">
                                <Users className="h-4 w-4" />
                                Спикер: {getSpeakerName(item.lecturer_id)}
                              </div>
                            )}
                            {/* Описание пункта программы */}
                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>
                            )}
                          </div>
                          {/* Кнопки редактирования и удаления */}
                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditProgramItem(index)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-all duration-300 hover:scale-110"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProgramItem(index)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-all duration-300 hover:scale-110"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Пустое состояние для программы фестиваля
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
                        <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        Нет добавленных пунктов программы
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Добавьте первый пункт программы фестиваля
                      </p>
                    </div>
                  </div>
                )}

                {/* Форма добавления/редактирования пункта программы */}
                {showFestivalProgramForm ? (
                  <div className="border-2 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-6 animate-in slide-in-from-bottom duration-500">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-6">
                      {editingProgramItemIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Название пункта программы */}
                      <div className="form-group">
                        <label htmlFor="program_title" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Название <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="program_title"
                          name="title"
                          value={programItemForm.title}
                          onChange={handleProgramItemChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Название пункта программы"
                        />
                      </div>

                      {/* Время начала и окончания пункта программы */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                          <label htmlFor="program_start_time" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Время начала <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            id="program_start_time"
                            name="start_time"
                            value={programItemForm.start_time}
                            onChange={handleProgramItemChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="program_end_time" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Время окончания <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            id="program_end_time"
                            name="end_time"
                            value={programItemForm.end_time}
                            onChange={handleProgramItemChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                          />
                        </div>
                      </div>

                      {/* Описание пункта программы */}
                      <div className="form-group">
                        <label htmlFor="program_description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Описание
                        </label>
                        <textarea
                          id="program_description"
                          name="description"
                          value={programItemForm.description}
                          onChange={handleProgramItemChange}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Описание пункта программы"
                        />
                      </div>

                      {/* Выбор спикера для пункта программы */}
                      <div className="form-group">
                        <label htmlFor="program_lecturer" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Спикер
                        </label>
                        <select
                          id="program_lecturer"
                          name="lecturer_id"
                          value={programItemForm.lecturer_id}
                          onChange={handleProgramItemChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                        >
                          <option value="">Выберите спикера</option>
                          {speakers.map(speaker => (
                            <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Кнопки управления формой программы */}
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
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={handleAddProgramItem}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
                        >
                          {editingProgramItemIndex !== null ? 'Сохранить' : 'Добавить'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Кнопка добавления нового пункта программы
                  <button
                    type="button"
                    onClick={() => setShowFestivalProgramForm(true)}
                    className="w-full py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex items-center justify-center gap-3 group"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-all duration-300">
                      <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Добавить пункт программы
                    </span>
                  </button>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* Секция: Дополнительные настройки (по умолчанию свернута) */}
          <AnimatedSection title="Дополнительные настройки" icon={Settings} defaultOpen={false}>
            <div className="space-y-6">
              {/* Статус мероприятия */}
              <div className="form-group">
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Статус мероприятия
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
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

              {/* Максимальное количество участников */}
              <div className="form-group">
                <label htmlFor="max_registrations" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Оставьте пустым для неограниченного количества"
                />
              </div>

              {/* Ссылка на видео */}
              <div className="form-group">
                <label htmlFor="video_url" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Ссылка на видео
                </label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url || ''}
                  onChange={handleChange}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
                    ${errors.video_url 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400 dark:hover:border-gray-500'
                    } 
                    dark:bg-gray-800 focus:outline-none focus:ring-4 placeholder-gray-400 dark:placeholder-gray-500
                  `}
                  placeholder="https://youtube.com/..."
                />
                {errors.video_url && (
                  <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top duration-300">{errors.video_url}</p>
                )}
              </div>

              {/* Настройки скидок в сетке */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Скидка для пар */}
                <div className="form-group">
                  <Toggle
                    checked={formData.couple_discount !== undefined}
                    onChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({ ...prev, couple_discount: '10' }));
                      } else {
                        setFormData(prev => {
                          const { couple_discount, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    label="Скидка для пар"
                    description="Активировать скидку при покупке двух билетов"
                  />
                  
                  {/* Поле ввода процента скидки (появляется при включении) */}
                  {formData.couple_discount !== undefined && (
                    <div className="mt-4 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          name="couple_discount"
                          value={formData.couple_discount || ''}
                          onChange={handleChange}
                          min="1"
                          max="100"
                          className="w-24 px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Детский билет за полцены */}
                <div className="form-group">
                  <Toggle
                    checked={formData.child_half_price || false}
                    onChange={(checked) => setFormData(prev => ({ ...prev, child_half_price: checked }))}
                    label="Детский билет за полцены"
                    description="Детские билеты будут стоить 50% от основной цены"
                  />
                </div>
              </div>

              {/* Включение регистрации */}
              <div className="form-group">
                <Toggle
                  checked={formData.registration_enabled !== false}
                  onChange={(checked) => setFormData(prev => ({ ...prev, registration_enabled: checked }))}
                  label="Включить регистрацию"
                  description="Пользователи смогут регистрироваться на мероприятие"
                />
              </div>

              {/* Дедлайн регистрации */}
              <div className="form-group">
                <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Дедлайн регистрации
                </label>
                <input
                  type="datetime-local"
                  id="registration_deadline"
                  name="registration_deadline"
                  value={formData.registration_deadline || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>

              {/* Лимит регистраций на пользователя */}
              <div className="form-group">
                <label htmlFor="registration_limit_per_user" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Лимит регистраций на одного пользователя
                </label>
                <input
                  type="number"
                  id="registration_limit_per_user"
                  name="registration_limit_per_user"
                  value={formData.registration_limit_per_user || 5}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Финальные кнопки формы с анимацией появления */}
          <div className="flex justify-end gap-4 pt-8 animate-in slide-in-from-bottom duration-700">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 text-lg font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-3 hover:scale-105 shadow-lg shadow-blue-500/25 text-lg font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  Сохранить мероприятие
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
