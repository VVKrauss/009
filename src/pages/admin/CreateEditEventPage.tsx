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
import EventSpeakersSection from '../../components/admin/EventSpeakersSection';
import EventFestivalProgramSection from '../../components/admin/EventFestivalProgramSection';

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
  google_calendar_event_id?: string;
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
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  
  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      toast.error('Ошибка при загрузке спикеров');
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

  const createOrUpdateGoogleCalendarEvent = async (eventData: EventData, isNew: boolean): Promise<string | null> => {
    try {
      // Get access token from Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        console.warn('No Google access token found, skipping calendar sync');
        return null;
      }

      // Prepare event data for Google Calendar
      const calendarEvent = {
        summary: eventData.title,
        description: eventData.description || eventData.short_description,
        location: eventData.location,
        start: {
          dateTime: `${eventData.date}T${eventData.start_time}:00`,
          timeZone: BELGRADE_TIMEZONE
        },
        end: {
          dateTime: `${eventData.date}T${eventData.end_time}:00`,
          timeZone: BELGRADE_TIMEZONE
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        }
      };

      let response;
      const calendarId = 'primary'; // Use primary calendar

      if (isNew || !eventData.google_calendar_event_id) {
        // Create new event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(calendarEvent)
          }
        );
      } else {
        // Update existing event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventData.google_calendar_event_id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(calendarEvent)
          }
        );
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('Google Calendar API error:', error);
        
        // If it's an auth error, just warn but don't fail the save
        if (response.status === 401 || response.status === 403) {
          toast.warning('Не удалось синхронизировать с Google Calendar. Проверьте права доступа.');
          return null;
        }
        
        throw new Error(error.error?.message || 'Failed to sync with Google Calendar');
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      toast.warning('Не удалось синхронизировать с Google Calendar, но мероприятие сохранено');
      return null;
    }
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
      
      // First, try to create/update Google Calendar event
      const googleCalendarEventId = await createOrUpdateGoogleCalendarEvent(eventData, isNew);
      
      // Format times for database storage
      const formattedData = {
        ...eventData,
        start_time: formatDateTimeForDatabase(new Date(eventData.date), eventData.start_time),
        end_time: formatDateTimeForDatabase(new Date(eventData.date), eventData.end_time),
        google_calendar_event_id: googleCalendarEventId || eventData.google_calendar_event_id
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
        
        // Handle specific pg_net extension error - show warning but continue
        if (errorData.code === 'PG_NET_EXTENSION_MISSING') {
          console.warn('pg_net extension missing - notifications disabled');
          toast.success(
            isNew ? 'Мероприятие успешно создано' : 'Мероприятие успешно обновлено',
            {
              duration: 4000,
            }
          );
          toast('⚠️ Уведомления отключены: для их работы необходимо включить расширение pg_net в настройках Supabase', {
            duration: 6000,
            style: {
              background: '#f59e0b',
              color: 'white',
            },
          });
          navigate('/admin/events');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to save event');
      }

      toast.success(isNew ? 'Мероприятие успешно создано' : 'Мероприятие успешно обновлено');
      
      if (googleCalendarEventId) {
        toast.success('Событие синхронизировано с Google Calendar', {
          icon: '📅',
          duration: 3000,
        });
      }
      
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

  const handleSpeakerToggle = (speakerId: string) => {
    setEventData(prev => {
      const speakerIds = prev.speakers || [];
      
      if (speakerIds.includes(speakerId)) {
        return {
          ...prev,
          speakers: speakerIds.filter(id => id !== speakerId)
        };
      } else {
        return {
          ...prev,
          speakers: [...speakerIds, speakerId]
        };
      }
    });
  };

  const handleHideSpeakersGalleryChange = (hide: boolean) => {
    setEventData(prev => ({
      ...prev,
      hide_speakers_gallery: hide
    }));
  };

  const handleFestivalProgramChange = (program: FestivalProgramItem[]) => {
    setEventData(prev => ({
      ...prev,
      festival_program: program
    }));
  };

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
          <EventSpeakersSection 
            selectedSpeakerIds={eventData.speakers}
            hideSpeakersGallery={eventData.hide_speakers_gallery || false}
            onSpeakerToggle={handleSpeakerToggle}
            onHideGalleryChange={handleHideSpeakersGalleryChange}
          />

          {/* Программа фестиваля */}
          {eventData.event_type === 'Festival' && (
            <EventFestivalProgramSection 
              eventType={eventData.event_type}
              festivalProgram={eventData.festival_program}
              allSpeakers={speakers}
              onFestivalProgramChange={handleFestivalProgramChange}
            />
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