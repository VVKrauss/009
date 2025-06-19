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
  DollarSign, 
  Tag, 
  Globe, 
  Search,
  Upload,
  Image as ImageIcon,
  Check,
  Edit,
  Trash,
  ChevronUp,
  ChevronDown,
  Info,
  User
} from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { formatInTimeZone } from 'date-fns-tz';
import { BELGRADE_TIMEZONE, formatDateTimeForDatabase, isValidTimeFormat } from '../../utils/dateTimeUtils';
import { isValidUrl } from './utils';
import { 
  eventTypes, 
  paymentTypes, 
  languages, 
  ageCategories, 
  currencies, 
  statuses,
  TITLE_MAX_LENGTH,
  SHORT_DESC_MAX_LENGTH,
  DESC_MAX_LENGTH
} from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Speaker = {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
};

type FestivalProgramItem = {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
};

type EventData = {
  id: string;
  title: string;
  short_description: string;
  description: string;
  event_type: string;
  bg_image: string | null;
  original_bg_image: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_category: string;
  price: number | null;
  price_comment: string;
  currency: string;
  status: string;
  payment_type: string;
  languages: string[];
  speakers: string[];
  hide_speakers_gallery?: boolean;
  couple_discount?: string;
  child_half_price?: boolean;
  payment_link?: string;
  payment_widget_id?: string;
  widget_chooser?: boolean;
  video_url?: string;
  photo_gallery?: string;
  festival_program?: FestivalProgramItem[];
  registrations?: {
    max_regs: number | null;
    current: number;
    current_adults: number;
    current_children: number;
    reg_list: any[];
  };
  registration_enabled?: boolean;
  registration_limit_per_user?: number;
};

const defaultEventData: EventData = {
  id: crypto.randomUUID(),
  title: '',
  short_description: '',
  description: '',
  event_type: eventTypes[0],
  bg_image: null,
  original_bg_image: null,
  date: new Date().toISOString().split('T')[0],
  start_time: '18:00',
  end_time: '20:00',
  location: 'Science Hub',
  age_category: ageCategories[0],
  price: 1200,
  price_comment: '',
  currency: currencies[0],
  status: 'draft',
  payment_type: 'cost',
  languages: [languages[0]],
  speakers: [],
  hide_speakers_gallery: true,
  couple_discount: '20',
  child_half_price: true,
  registrations: {
    max_regs: 40,
    current: 0,
    current_adults: 0,
    current_children: 0,
    reg_list: []
  },
  registration_enabled: true,
  registration_limit_per_user: 5
};



const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<EventData>(defaultEventData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Speakers states
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');
  
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
  const [programCropper, setProgramCropper] = useState<Cropper | null>(null);
  const [showProgramCropper, setShowProgramCropper] = useState(false);
  const [programPreviewUrl, setProgramPreviewUrl] = useState<string | null>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      setIsNew(false);
      fetchEvent(id);
    } else {
      setIsNew(true);
      setEventData(defaultEventData);
    }
    
    fetchSpeakers();
  }, [id]);

  useEffect(() => {
    // Update selected speakers when eventData.speakers or speakers list changes
    if (eventData.speakers && eventData.speakers.length > 0 && speakers.length > 0) {
      const selected = speakers.filter(speaker => 
        eventData.speakers.includes(speaker.id)
      );
      setSelectedSpeakers(selected);
    } else {
      setSelectedSpeakers([]);
    }
  }, [eventData.speakers, speakers]);

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      // Format times for display in Belgrade timezone
      const formattedData = {
        ...data,
        start_time: data.start_time ? formatInTimeZone(new Date(data.start_time), BELGRADE_TIMEZONE, 'HH:mm') : '18:00',
        end_time: data.end_time ? formatInTimeZone(new Date(data.end_time), BELGRADE_TIMEZONE, 'HH:mm') : '20:00',
      };
      
      setEventData(formattedData);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      setSpeakersError(null);
      
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakersError('Ошибка при загрузке спикеров');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const scrollToFirstError = () => {
    const firstErrorElement = document.querySelector('.border-red-500');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus on the element if it's an input
      if (firstErrorElement instanceof HTMLInputElement || 
          firstErrorElement instanceof HTMLTextAreaElement || 
          firstErrorElement instanceof HTMLSelectElement) {
        setTimeout(() => firstErrorElement.focus(), 300);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!eventData.title.trim()) errors.title = 'Название обязательно';
    if (!eventData.date) errors.date = 'Дата обязательна';
    if (!eventData.start_time) errors.start_time = 'Время начала обязательно';
    if (!eventData.end_time) errors.end_time = 'Время окончания обязательно';
    if (!eventData.location.trim()) errors.location = 'Место проведения обязательно';
    
    // Time validation
    if (eventData.start_time && !isValidTimeFormat(eventData.start_time)) {
      errors.start_time = 'Неверный формат времени (HH:MM)';
    }
    
    if (eventData.end_time && !isValidTimeFormat(eventData.end_time)) {
      errors.end_time = 'Неверный формат времени (HH:MM)';
    }
    
    if (eventData.start_time && eventData.end_time && 
        isValidTimeFormat(eventData.start_time) && 
        isValidTimeFormat(eventData.end_time)) {
      const [startHour, startMinute] = eventData.start_time.split(':').map(Number);
      const [endHour, endMinute] = eventData.end_time.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (endMinutes <= startMinutes) {
        errors.end_time = 'Время окончания должно быть позже времени начала';
      }
    }
    
    // Payment validation
    if (eventData.payment_type === 'cost') {
      if (eventData.price === null || eventData.price <= 0) {
        errors.price = 'Укажите стоимость';
      }
      
      if (!eventData.currency) {
        errors.currency = 'Выберите валюту';
      }
    }
    
    // URL validations
    if (eventData.payment_link && !isValidUrl(eventData.payment_link)) {
      errors.payment_link = 'Неверный формат URL';
    }
    
    if (eventData.video_url && !isValidUrl(eventData.video_url)) {
      errors.video_url = 'Неверный формат URL';
    }
    
    // Length validations
    if (eventData.title.length > TITLE_MAX_LENGTH) {
      errors.title = `Максимальная длина названия ${TITLE_MAX_LENGTH} символов`;
    }
    
    if (eventData.short_description.length > SHORT_DESC_MAX_LENGTH) {
      errors.short_description = `Максимальная длина краткого описания ${SHORT_DESC_MAX_LENGTH} символов`;
    }
    
    if (eventData.description.length > DESC_MAX_LENGTH) {
      errors.description = `Максимальная длина описания ${DESC_MAX_LENGTH} символов`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      
      // Focus on first error if event is active
      if (eventData.status === 'active') {
        setTimeout(scrollToFirstError, 100);
      }
      
      return;
    }
    
    try {
      setSaving(true);
      
      // Format times for database storage
      const formattedData = {
        ...eventData,
        start_time: formatDateTimeForDatabase(new Date(eventData.date), eventData.start_time),
        end_time: formatDateTimeForDatabase(new Date(eventData.date), eventData.end_time),
      };
      
      // Call the Edge Function instead of directly updating the database
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-event`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            eventData: formattedData,
            isNew
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      toast.success(isNew ? 'Мероприятие успешно создано' : 'Мероприятие успешно обновлено');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Ошибка при сохранении мероприятия');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setShowCropper(true);
    }
  };

  const handleCrop = async () => {
    if (!cropper || !imageFile) return;

    try {
      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400
      });

      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg'
      });

      // Generate unique filenames
      const timestamp = Date.now();
      const fileExt = 'jpg';
      
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      // Upload original image
      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile);

      if (originalError) throw originalError;

      // Upload cropped image
      const { error: croppedError } = await supabase.storage
        .from('images')
        .upload(croppedPath, croppedFile);

      if (croppedError) throw croppedError;

      // Update event data
      setEventData(prev => ({
        ...prev,
        bg_image: croppedPath,
        original_bg_image: originalPath
      }));

      setShowCropper(false);
      setImageFile(null);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка при загрузке изображения');
    }
  };

  const handleRemoveImage = async () => {
    try {
      if (eventData.bg_image) {
        const { error } = await supabase.storage
          .from('images')
          .remove([eventData.bg_image]);

        if (error) throw error;
      }

      if (eventData.original_bg_image) {
        const { error } = await supabase.storage
          .from('images')
          .remove([eventData.original_bg_image]);

        if (error) throw error;
      }

      setEventData(prev => ({
        ...prev,
        bg_image: null,
        original_bg_image: null
      }));

      toast.success('Изображение удалено');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Ошибка при удалении изображения');
    }
  };

  const toggleSpeaker = (speaker: Speaker) => {
    setEventData(prev => {
      const speakerIds = prev.speakers || [];
      
      if (speakerIds.includes(speaker.id)) {
        return {
          ...prev,
          speakers: speakerIds.filter(id => id !== speaker.id)
        };
      } else {
        return {
          ...prev,
          speakers: [...speakerIds, speaker.id]
        };
      }
    });
  };

  const handleAddProgramItem = () => {
    if (!currentProgramItem.title || !currentProgramItem.start_time || !currentProgramItem.end_time) {
      toast.error('Заполните обязательные поля программы');
      return;
    }

    setEventData(prev => {
      const updatedProgram = [...(prev.festival_program || [])];
      
      if (editingProgramIndex !== null) {
        updatedProgram[editingProgramIndex] = currentProgramItem;
      } else {
        updatedProgram.push(currentProgramItem);
      }
      
      return {
        ...prev,
        festival_program: updatedProgram
      };
    });

    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setEditingProgramIndex(null);
    setShowProgramForm(false);
    setProgramPreviewUrl(null);
  };

  const handleEditProgramItem = (index: number) => {
    if (!eventData.festival_program) return;
    
    setCurrentProgramItem(eventData.festival_program[index]);
    setEditingProgramIndex(index);
    setShowProgramForm(true);
    
    if (eventData.festival_program[index].image_url) {
      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${eventData.festival_program[index].image_url}`);
    } else {
      setProgramPreviewUrl(null);
    }
  };

  const handleDeleteProgramItem = (index: number) => {
    setEventData(prev => {
      const updatedProgram = [...(prev.festival_program || [])];
      updatedProgram.splice(index, 1);
      
      return {
        ...prev,
        festival_program: updatedProgram
      };
    });
  };

  const handleProgramImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProgramImageFile(file);
      setShowProgramCropper(true);
    }
  };

  const handleProgramCrop = async () => {
    if (!programCropper || !programImageFile) return;

    try {
      // Get cropped canvas
      const croppedCanvas = programCropper.getCroppedCanvas({
        width: 800,
        height: 600
      });

      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const croppedFile = new File([croppedBlob], programImageFile.name, {
        type: 'image/jpeg'
      });

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = 'jpg';
      const filePath = `program-images/${timestamp}.${fileExt}`;

      // Upload cropped image
      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, croppedFile);

      if (error) throw error;

      // Update program item
      setCurrentProgramItem(prev => ({
        ...prev,
        image_url: filePath
      }));

      // Set preview URL
      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`);

      setShowProgramCropper(false);
      setProgramImageFile(null);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading program image:', error);
      toast.error('Ошибка при загрузке изображения');
    }
  };

  const filteredSpeakers = speakers.filter(speaker => 
    speaker.name.toLowerCase().includes(speakerSearchQuery.toLowerCase()) ||
    speaker.field_of_expertise.toLowerCase().includes(speakerSearchQuery.toLowerCase())
  );


return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-4 font-heading">
            {isNew ? 'Создание мероприятия' : 'Редактирование мероприятия'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {isNew 
              ? 'Заполните форму, чтобы создать новое мероприятие' 
              : 'Внесите изменения в существующее мероприятие'}
          </p>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-heading"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Сохранение...' : 'Сохранить мероприятие'}
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl mr-4">
                  <Info className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Основная информация</h2>
                  <p className="text-gray-500 dark:text-gray-400">Заголовок, описание и тип мероприятия</p>
                </div>
              </div>
              {/* Статус мероприятия */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Статус мероприятия <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {statuses.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                        eventData.status === status
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={eventData.status === status}
                        onChange={() => setEventData({...eventData, status: status})}
                        className="sr-only"
                      />
                      <span className="font-medium">
                        {status === 'active' ? 'Активно' : status === 'draft' ? 'Черновик' : 'Прошедшее'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Название мероприятия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData({...eventData, title: e.target.value})}
                  className={`w-full p-4 border-2 ${formErrors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                  placeholder="Введите название мероприятия"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {eventData.title.length}/{TITLE_MAX_LENGTH} символов
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Краткое описание
                </label>
                <textarea
                  value={eventData.short_description}
                  onChange={(e) => setEventData({...eventData, short_description: e.target.value})}
                  rows={2}
                  className={`w-full p-4 border-2 ${formErrors.short_description ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200 resize-none`}
                  placeholder="Краткое описание для списка мероприятий"
                />
                {formErrors.short_description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.short_description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {eventData.short_description.length}/{SHORT_DESC_MAX_LENGTH} символов
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Полное описание
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({...eventData, description: e.target.value})}
                  rows={8}
                  className={`w-full p-4 border-2 ${formErrors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                  placeholder="Подробное описание мероприятия"
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {eventData.description.length}/{DESC_MAX_LENGTH} символов
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Тип мероприятия <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventData.event_type}
                    onChange={(e) => setEventData({...eventData, event_type: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Возрастная категория <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventData.age_category}
                    onChange={(e) => setEventData({...eventData, age_category: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                  >
                    {ageCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Языки <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {languages.map((lang) => (
                    <label key={lang} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={eventData.languages.includes(lang)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEventData({
                              ...eventData,
                              languages: [...eventData.languages, lang]
                            });
                          } else {
                            setEventData({
                              ...eventData,
                              languages: eventData.languages.filter(l => l !== lang)
                            });
                          }
                        }}
                        className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Дата и время */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl mr-4">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Дата и время</h2>
                <p className="text-gray-500 dark:text-gray-400">Когда состоится мероприятие</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => setEventData({...eventData, date: e.target.value})}
                  className={`w-full p-4 border-2 ${formErrors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                />
                {formErrors.date && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.date}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Время начала <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={eventData.start_time}
                  onChange={(e) => setEventData({...eventData, start_time: e.target.value})}
                  className={`w-full p-4 border-2 ${formErrors.start_time ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                />
                {formErrors.start_time && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.start_time}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Время по Белграду
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Время окончания <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={eventData.end_time}
                  onChange={(e) => setEventData({...eventData, end_time: e.target.value})}
                  className={`w-full p-4 border-2 ${formErrors.end_time ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                />
                {formErrors.end_time && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.end_time}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Время по Белграду
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={eventData.location}
                  onChange={(e) => setEventData({...eventData, location: e.target.value})}
                  className={`flex-grow p-4 border-2 ${formErrors.location ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                  placeholder="Адрес или название места"
                />
              </div>
              {formErrors.location && (
                <p className="mt-1 text-sm text-red-500">{formErrors.location}</p>
              )}
            </div>
          </div>

          {/* Изображение */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl mr-4">
                <ImageIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Изображение</h2>
                <p className="text-gray-500 dark:text-gray-400">Загрузите обложку мероприятия</p>
              </div>
            </div>
            
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
                    onClick={() => {
                      setShowCropper(false);
                      setImageFile(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2 inline-block" />
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleCrop}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Check className="h-4 w-4 mr-2 inline-block" />
                    Сохранить
                  </button>
                </div>
              </div>
            ) : eventData.bg_image ? (
              <div className="relative">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${eventData.bg_image}`}
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
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
                    title="Удалить изображение"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
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

          {/* Стоимость и оплата */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl mr-4">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Стоимость и оплата</h2>
                <p className="text-gray-500 dark:text-gray-400">Настройте параметры оплаты</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Тип оплаты <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentTypes.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        eventData.payment_type === type
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_type"
                        value={type}
                        checked={eventData.payment_type === type}
                        onChange={() => setEventData({...eventData, payment_type: type})}
                        className="sr-only"
                      />
                      <span className="font-medium">
                        {type === 'free' ? 'Бесплатно' : type === 'donation' ? 'Донейшн' : 'Платно'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {eventData.payment_type === 'cost' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Стоимость <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={eventData.price || ''}
                      onChange={(e) => setEventData({...eventData, price: e.target.value ? Number(e.target.value) : null})}
                      className={`w-full p-4 border-2 ${formErrors.price ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                      placeholder="Введите стоимость"
                      min="0"
                      step="50"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Валюта <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={eventData.currency}
                      onChange={(e) => setEventData({...eventData, currency: e.target.value})}
                      className={`w-full p-4 border-2 ${formErrors.currency ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                    >
                      {currencies.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                    {formErrors.currency && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.currency}</p>
                    )}
                  </div>
                </div>
              )}
              
              {eventData.payment_type === 'cost' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Комментарий к цене
                  </label>
                  <input
                    type="text"
                    value={eventData.price_comment || ''}
                    onChange={(e) => setEventData({...eventData, price_comment: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                    placeholder="Например: 'Скидка для студентов 50%'"
                  />
                </div>
              )}
              
              {eventData.payment_type === 'cost' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Скидка для пар (%)
                    </label>
                    <input
                      type="text"
                      value={eventData.couple_discount || ''}
                      onChange={(e) => setEventData({...eventData, couple_discount: e.target.value})}
                      className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                      placeholder="Например: 20"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Оставьте пустым, если скидки нет
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={eventData.child_half_price || false}
                          onChange={(e) => setEventData({...eventData, child_half_price: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                          eventData.child_half_price ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            eventData.child_half_price ? 'translate-x-6' : 'translate-x-1'
                          } mt-1`}></div>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700 dark:text-gray-300">Детский билет за полцены</span>
                    </label>
                  </div>
                </div>
              )}
              
              {eventData.payment_type === 'cost' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ссылка на оплату
                  </label>
                  <input
                    type="url"
                    value={eventData.payment_link || ''}
                    onChange={(e) => setEventData({...eventData, payment_link: e.target.value})}
                    className={`w-full p-4 border-2 ${formErrors.payment_link ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                    placeholder="https://example.com/payment"
                  />
                  {formErrors.payment_link && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.payment_link}</p>
                  )}
                </div>
              )}
              
              {eventData.payment_type === 'cost' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    ID платежного виджета
                  </label>
                  <input
                    type="text"
                    value={eventData.payment_widget_id || ''}
                    onChange={(e) => setEventData({...eventData, payment_widget_id: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                    placeholder="ID виджета для встраивания"
                  />
                </div>
              )}
              
              {eventData.payment_type === 'cost' && eventData.payment_link && eventData.payment_widget_id && (
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={eventData.widget_chooser || false}
                        onChange={(e) => setEventData({...eventData, widget_chooser: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                        eventData.widget_chooser ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          eventData.widget_chooser ? 'translate-x-6' : 'translate-x-1'
                        } mt-1`}></div>
                      </div>
                    </div>
                    <span className="ml-3 text-gray-700 dark:text-gray-300">Показывать выбор способа оплаты</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Регистрация */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl mr-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Регистрация</h2>
                <p className="text-gray-500 dark:text-gray-400">Настройте параметры регистрации</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Максимальное количество участников
                </label>
                <input
                  type="number"
                  value={eventData.registrations?.max_regs || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    setEventData({
                      ...eventData,
                      registrations: {
                        ...eventData.registrations!,
                        max_regs: value
                      }
                    });
                  }}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                  placeholder="Оставьте пустым для неограниченной регистрации"
                  min="1"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Оставьте пустым для неограниченной регистрации
                </p>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={eventData.registration_enabled !== false}
                      onChange={(e) => setEventData({...eventData, registration_enabled: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                      eventData.registration_enabled !== false ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                        eventData.registration_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                      } mt-1`}></div>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Разрешить регистрацию</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Максимальное количество билетов на одного человека
                </label>
                <input
                  type="number"
                  value={eventData.registration_limit_per_user || 5}
                  onChange={(e) => setEventData({...eventData, registration_limit_per_user: parseInt(e.target.value)})}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* Спикеры */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl mr-4">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Спикеры</h2>
                  <p className="text-gray-500 dark:text-gray-400">Выберите спикеров мероприятия</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={eventData.hide_speakers_gallery || false}
                      onChange={(e) => setEventData({...eventData, hide_speakers_gallery: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                      eventData.hide_speakers_gallery ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                        eventData.hide_speakers_gallery ? 'translate-x-6' : 'translate-x-1'
                      } mt-1`}></div>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Скрыть галерею спикеров</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск спикеров..."
                  value={speakerSearchQuery}
                  onChange={(e) => setSpeakerSearchQuery(e.target.value)}
                  className="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              {!eventData.hide_speakers_gallery && (
                <>
                  {speakersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Загрузка спикеров...</p>
                    </div>
                  ) : speakersError ? (
                    <div className="text-center py-8 text-red-500">
                      {speakersError}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {filteredSpeakers.map(speaker => (
                          <div
                            key={speaker.id}
                            onClick={() => toggleSpeaker(speaker)}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              eventData.speakers.includes(speaker.id)
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-2 flex-shrink-0">
                                {speaker.photos?.[0]?.url ? (
                                  <img
                                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                                    alt={speaker.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{speaker.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{speaker.field_of_expertise}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedSpeakers.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Выбранные спикеры:</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedSpeakers.map(speaker => (
                              <div
                                key={speaker.id}
                                className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-3 py-1.5 rounded-full"
                              >
                                <span className="text-sm">{speaker.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSpeaker(speaker);
                                  }}
                                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Программа фестиваля */}
          {eventData.event_type === 'Festival' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30 rounded-xl mr-4">
                    <Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Программа фестиваля</h2>
                    <p className="text-gray-500 dark:text-gray-400">Добавьте пункты программы</p>
                  </div>
                </div>
                
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
                    setEditingProgramIndex(null);
                    setShowProgramForm(true);
                    setProgramPreviewUrl(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Добавить пункт
                </button>
              </div>
              
              {showProgramForm ? (
                <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingProgramIndex !== null ? 'Редактирование пункта программы' : 'Новый пункт программы'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Название <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentProgramItem.title}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, title: e.target.value})}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        placeholder="Название пункта программы"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Время начала <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={currentProgramItem.start_time}
                          onChange={(e) => setCurrentProgramItem({...currentProgramItem, start_time: e.target.value})}
                          className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Время окончания <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={currentProgramItem.end_time}
                          onChange={(e) => setCurrentProgramItem({...currentProgramItem, end_time: e.target.value})}
                          className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Описание
                      </label>
                      <textarea
                        value={currentProgramItem.description}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, description: e.target.value})}
                        rows={3}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        placeholder="Описание пункта программы"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Спикер
                      </label>
                      <select
                        value={currentProgramItem.lecturer_id}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, lecturer_id: e.target.value})}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                      >
                        <option value="">Выберите спикера</option>
                        {speakers.map(speaker => (
                          <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Изображение
                      </label>
                      
                      {showProgramCropper && programImageFile ? (
                        <div className="space-y-4">
                          <Cropper
                            src={URL.createObjectURL(programImageFile)}
                            style={{ height: 300, width: '100%' }}
                            aspectRatio={4/3}
                            guides={true}
                            viewMode={1}
                            dragMode="move"
                            scalable={true}
                            cropBoxMovable={true}
                            cropBoxResizable={true}
                            onInitialized={(instance) => setProgramCropper(instance)}
                            className="max-w-full"
                          />
                          
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowProgramCropper(false);
                                setProgramImageFile(null);
                              }}
                              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                            >
                              <X className="h-4 w-4 mr-2 inline-block" />
                              Отмена
                            </button>
                            <button
                              type="button"
                              onClick={handleProgramCrop}
                              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                              <Check className="h-4 w-4 mr-2 inline-block" />
                              Сохранить
                            </button>
                          </div>
                        </div>
                      ) : programPreviewUrl ? (
                        <div className="relative">
                          <img
                            src={programPreviewUrl}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="absolute bottom-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => programFileInputRef.current?.click()}
                              className="p-2 bg-white/90 hover:bg-white text-dark-800 rounded-full shadow-lg"
                              title="Изменить изображение"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentProgramItem({...currentProgramItem, image_url: ''});
                                setProgramPreviewUrl(null);
                              }}
                              className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
                              title="Удалить изображение"
                            >
                              <Trash className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-6 text-center">
                          <input
                            ref={programFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProgramImageSelect}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center">
                            <div className="mb-3 p-2 bg-gray-100 dark:bg-dark-700 rounded-full">
                              <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <button
                              type="button"
                              onClick={() => programFileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors text-sm"
                            >
                              Загрузить изображение
                            </button>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Рекомендуемый размер: 800x600px
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProgramForm(false);
                          setCurrentProgramItem({
                            title: '',
                            description: '',
                            image_url: '',
                            start_time: '',
                            end_time: '',
                            lecturer_id: ''
                          });
                          setProgramPreviewUrl(null);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProgramItem}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        {editingProgramIndex !== null ? 'Сохранить изменения' : 'Добавить пункт'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {eventData.festival_program && eventData.festival_program.length > 0 ? (
                <div className="space-y-4">
                  {eventData.festival_program.map((item, index) => {
                    const speaker = speakers.find(s => s.id === item.lecturer_id);
                    
                    return (
                      <div 
                        key={index}
                        className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 border border-gray-200 dark:border-dark-600"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            {item.image_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${item.image_url}`}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{item.start_time} - {item.end_time}</span>
                                </div>
                                {speaker && (
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{speaker.name}</span>
                                  </div>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProgramItem(index)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProgramItem(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Нет пунктов программы</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Добавьте пункты, чтобы создать программу фестиваля
                  </p>
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
                      setEditingProgramIndex(null);
                      setShowProgramForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Добавить первый пункт
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Дополнительные настройки */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 rounded-xl mr-4">
                <Tag className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Дополнительные настройки</h2>
                <p className="text-gray-500 dark:text-gray-400">Видео и фотогалерея</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ссылка на видео
                </label>
                <input
                  type="url"
                  value={eventData.video_url || ''}
                  onChange={(e) => setEventData({...eventData, video_url: e.target.value})}
                  className={`w-full p-4 border-2 ${formErrors.video_url ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200`}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {formErrors.video_url && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.video_url}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ссылка на фотогалерею
                </label>
                <input
                  type="url"
                  value={eventData.photo_gallery || ''}
                  onChange={(e) => setEventData({...eventData, photo_gallery: e.target.value})}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                  placeholder="https://photos.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-center gap-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-medium"
            >
              <Save className="h-5 w-5 mr-2 inline-block" />
              {saving ? 'Сохранение...' : (isNew ? 'Создать мероприятие' : 'Сохранить изменения')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditEventPage;