import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Globe, 
  Tag, 
  DollarSign, 
  Link, 
  Info, 
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { eventTypes, paymentTypes, languages, ageCategories, currencies, statuses, TITLE_MAX_LENGTH, SHORT_DESC_MAX_LENGTH, DESC_MAX_LENGTH } from './constants';
import EventSpeakersSection from '../../components/admin/EventSpeakersSection';
import EventFestivalProgramSection from '../../components/admin/EventFestivalProgramSection';
import { formatTimeFromTimestamp, formatDateTimeForDatabase } from '../../utils/dateTimeUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [event, setEvent] = useState({
    id: '',
    title: '',
    short_description: '',
    description: '',
    event_type: 'Lecture',
    bg_image: '',
    original_bg_image: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '18:00',
    end_time: '20:00',
    location: '',
    age_category: '0+',
    price: '',
    currency: 'RSD',
    status: 'draft',
    payment_type: 'cost',
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    languages: ['Русский'],
    speakers: [],
    hide_speakers_gallery: true,
    couple_discount: '',
    child_half_price: false,
    festival_program: []
  });

  const [errors, setErrors] = useState({
    title: false,
    date: false,
    start_time: false,
    end_time: false,
    location: false,
    price: false,
    payment_link: false
  });

  useEffect(() => {
    fetchSpeakers();
    
    if (id) {
      fetchEvent(id);
    } else {
      // Generate a new UUID for the event
      setEvent(prev => ({
        ...prev,
        id: crypto.randomUUID()
      }));
    }
  }, [id]);

  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      toast.error('Ошибка при загрузке спикеров');
    }
  };

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Format the data for the form
      setEvent({
        ...data,
        price: data.price !== null ? String(data.price) : '',
        couple_discount: data.couple_discount || '',
        languages: data.languages || ['Русский'],
        speakers: data.speakers || [],
        hide_speakers_gallery: data.hide_speakers_gallery !== false,
        festival_program: data.festival_program || [],
        // Convert timestamps back to time strings for the form
        start_time: formatTimeFromTimestamp(data.start_time),
        end_time: formatTimeFromTimestamp(data.end_time)
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      title: !event.title.trim(),
      date: !event.date,
      start_time: !event.start_time,
      end_time: !event.end_time,
      location: !event.location.trim(),
      price: false,
      payment_link: false
    };

    // Special validation for price and payment link
    if (event.status === 'active' && event.payment_type === 'cost') {
      // For active events with payment type 'cost', either price or payment_link must be provided
      if (!event.price && !event.payment_link) {
        newErrors.price = true;
        newErrors.payment_link = true;
        toast.error('Для активных мероприятий необходимо указать либо цену, либо ссылку на оплату');
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle max length validation
    if (name === 'title' && value.length > TITLE_MAX_LENGTH) return;
    if (name === 'short_description' && value.length > SHORT_DESC_MAX_LENGTH) return;
    if (name === 'description' && value.length > DESC_MAX_LENGTH) return;
    
    setEvent(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (name in errors) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEvent(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setEvent(prev => ({
        ...prev,
        languages: [...prev.languages, value]
      }));
    } else {
      setEvent(prev => ({
        ...prev,
        languages: prev.languages.filter(lang => lang !== value)
      }));
    }
  };

  const handleSpeakerToggle = (speakerId: string) => {
    setEvent(prev => {
      const speakers = [...prev.speakers];
      
      if (speakers.includes(speakerId)) {
        return {
          ...prev,
          speakers: speakers.filter(id => id !== speakerId)
        };
      } else {
        return {
          ...prev,
          speakers: [...speakers, speakerId]
        };
      }
    });
  };

  const handleHideSpeakersGalleryChange = (hide: boolean) => {
    setEvent(prev => ({
      ...prev,
      hide_speakers_gallery: hide
    }));
  };

  const handleFestivalProgramChange = (program: any[]) => {
    setEvent(prev => ({
      ...prev,
      festival_program: program
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `events/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });
      
      if (error) throw error;
      
      // Update the event state with the new image path
      setEvent(prev => ({
        ...prev,
        bg_image: filePath,
        original_bg_image: prev.bg_image || null // Save the original image path
      }));
      
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare the event data with proper timestamp conversion
      const eventData = {
        ...event,
        price: event.price ? parseFloat(event.price) : null,
        couple_discount: event.couple_discount ? parseFloat(event.couple_discount) : null,
        // Convert date and time strings to proper timestamps
        start_time: formatDateTimeForDatabase(parseISO(event.date), event.start_time),
        end_time: formatDateTimeForDatabase(parseISO(event.date), event.end_time)
      };
      
      // Determine if this is a new event or an update
      const isNew = !id;
      
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
            isNew
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        // Check if this is a pg_net extension missing error
        if (result.code === 'PG_NET_EXTENSION_MISSING') {
          console.warn('Database notification extension (pg_net) is not enabled. Notifications will not be sent.');
          // We can continue with the operation as this is just a notification issue
        } else {
          throw new Error(result.error || 'Error saving event');
        }
      }
      
      toast.success(isNew ? 'Мероприятие создано' : 'Мероприятие обновлено');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Ошибка при сохранении мероприятия: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Мероприятие удалено');
      navigate('/admin/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Ошибка при удалении мероприятия');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">
          {id ? 'Редактирование мероприятия' : 'Создание мероприятия'}
        </h1>
        <div className="flex gap-4">
          {id && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Удалить
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
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
                value={event.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                placeholder="Введите название мероприятия"
              />
              <div className="flex justify-between mt-1">
                {errors.title && (
                  <p className="text-red-500 text-sm">Обязательное поле</p>
                )}
                <p className="text-gray-500 text-sm text-right">
                  {event.title.length}/{TITLE_MAX_LENGTH}
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="short_description" className="block font-medium mb-2">
                Краткое описание
              </label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={event.short_description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                placeholder="Краткое описание для списка мероприятий"
              />
              <p className="text-gray-500 text-sm text-right mt-1">
                {event.short_description.length}/{SHORT_DESC_MAX_LENGTH}
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="block font-medium mb-2">
                Полное описание
              </label>
              <textarea
                id="description"
                name="description"
                value={event.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                placeholder="Подробное описание мероприятия"
              />
              <p className="text-gray-500 text-sm text-right mt-1">
                {event.description.length}/{DESC_MAX_LENGTH}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="event_type" className="block font-medium mb-2">
                  Тип мероприятия
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={event.event_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
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
                  value={event.age_category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
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
              <div className="flex flex-wrap gap-4">
                {languages.map(lang => (
                  <label key={lang} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={lang}
                      checked={event.languages.includes(lang)}
                      onChange={handleLanguageChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label className="block font-medium mb-2">
                Статус мероприятия
              </label>
              <div className="flex flex-wrap gap-4">
                {statuses.map(status => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={event.status === status}
                      onChange={handleInputChange}
                      className="rounded-full border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      {status === 'active' ? 'Активное' : 
                       status === 'draft' ? 'Черновик' : 
                       'Прошедшее'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Date and Location */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Дата и место проведения
          </h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label htmlFor="date" className="block font-medium mb-2">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={event.date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.date ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">Обязательное поле</p>
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
                  value={event.start_time}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.start_time ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.start_time && (
                  <p className="text-red-500 text-sm mt-1">Обязательное поле</p>
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
                  value={event.end_time}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.end_time ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                  }`}
                />
                {errors.end_time && (
                  <p className="text-red-500 text-sm mt-1">Обязательное поле</p>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="location" className="block font-medium mb-2">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={event.location}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.location ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                placeholder="Адрес или название места"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">Обязательное поле</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            Информация об оплате
          </h2>
          
          <div className="space-y-6">
            <div className="form-group">
              <label className="block font-medium mb-2">
                Тип оплаты
              </label>
              <div className="flex flex-wrap gap-4">
                {paymentTypes.map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment_type"
                      value={type}
                      checked={event.payment_type === type}
                      onChange={handleInputChange}
                      className="rounded-full border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      {type === 'cost' ? 'Платное' : 
                       type === 'free' ? 'Бесплатное' : 
                       'Донейшн'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {event.payment_type === 'cost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-2">
                    Цена
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={event.price}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-md border ${
                        errors.price ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                      }`}
                      placeholder="Оставьте пустым для оплаты только онлайн"
                      min="0"
                      step="100"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">{event.currency}</span>
                    </div>
                  </div>
                  {errors.price && errors.payment_link && (
                    <p className="text-red-500 text-sm mt-1">Для активных мероприятий необходимо указать либо цену, либо ссылку на оплату</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">Оставьте пустым для оплаты только онлайн</p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-2">
                    Валюта
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={event.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {event.payment_type === 'cost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="couple_discount" className="block font-medium mb-2">
                    Скидка для пар (%)
                  </label>
                  <input
                    type="number"
                    id="couple_discount"
                    name="couple_discount"
                    value={event.couple_discount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                    placeholder="Например: 10"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      name="child_half_price"
                      checked={event.child_half_price}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Детский билет за полцены</span>
                  </label>
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
                value={event.payment_link}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.payment_link ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'
                }`}
                placeholder="https://..."
              />
              {errors.price && errors.payment_link && (
                <p className="text-red-500 text-sm mt-1">Для активных мероприятий необходимо указать либо цену, либо ссылку на оплату</p>
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
                value={event.payment_widget_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600"
                placeholder="ID виджета или HTML-код"
              />
            </div>
            
            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="widget_chooser"
                  checked={event.widget_chooser}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Использовать выбор виджета</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Event Image */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary-600" />
            Изображение мероприятия
          </h2>
          
          <div className="space-y-6">
            {event.bg_image ? (
              <div className="relative">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${event.bg_image}`}
                  alt="Event preview"
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/800x400?text=Image+not+found';
                  }}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
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
                    onClick={() => setEvent(prev => ({ ...prev, bg_image: '' }))}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
                    title="Удалить изображение"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
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
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Загрузка... {uploadProgress}%</span>
                      </div>
                    ) : (
                      <span>Загрузить изображение</span>
                    )}
                  </button>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Рекомендуемый размер: 1200x600px
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Speakers Section */}
        <EventSpeakersSection
          selectedSpeakerIds={event.speakers}
          hideSpeakersGallery={event.hide_speakers_gallery}
          onSpeakerToggle={handleSpeakerToggle}
          onHideGalleryChange={handleHideSpeakersGalleryChange}
          allSpeakers={speakers}
        />
        
        {/* Festival Program Section (only for Festival event type) */}
        <EventFestivalProgramSection
          eventType={event.event_type}
          festivalProgram={event.festival_program}
          allSpeakers={speakers}
          onFestivalProgramChange={handleFestivalProgramChange}
        />
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-6 py-3 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Подтверждение удаления</h3>
            </div>
            <p className="mb-6">
              Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEditEventPage;