import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Save, 
  Trash2, 
  Upload, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  Users,
  Globe,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import imageCompression from 'browser-image-compression';
import { format, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  Event,
  Speaker,
  FestivalProgramItem,
  eventTypes,
  paymentTypes,
  languages,
  ageCategories,
  currencies,
  statuses,
  TITLE_MAX_LENGTH,
  SHORT_DESC_MAX_LENGTH,
  DESC_MAX_LENGTH
} from "./constants";
import {
  isValidUrl,
  isValidTime,
  formatTimeForDatabase,
  createTimestamp
} from "./utils";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [event, setEvent] = useState<Event>({
    id: '',
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
    price: null,
    currency: currencies[0],
    status: 'draft',
    max_registrations: null,
    payment_type: paymentTypes[0],
    languages: [languages[0]],
    speakers: [],
    hide_speakers_gallery: true
  });
  
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [festivalProgram, setFestivalProgram] = useState<FestivalProgramItem[]>([]);
  const [showProgramItemForm, setShowProgramItemForm] = useState(false);
  const [currentProgramItem, setCurrentProgramItem] = useState<FestivalProgramItem>({
    title: '',
    description: '',
    image_url: '',
    start_time: '',
    end_time: '',
    lecturer_id: ''
  });
  const [editingProgramItemIndex, setEditingProgramItemIndex] = useState<number | null>(null);
  
  useEffect(() => {
    fetchSpeakers();
    if (isEditMode) {
      fetchEvent();
    }
  }, [id]);
  
  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('id, name, field_of_expertise, photos, active')
        .eq('active', true);
      
      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      toast.error('Ошибка при загрузке спикеров');
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
        setEvent(data);
        
        // Set selected date from event date
        if (data.date) {
          setSelectedDate(new Date(data.date));
        }
        
        // Set festival program if exists
        if (data.festival_program && Array.isArray(data.festival_program)) {
          setFestivalProgram(data.festival_program);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEvent(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setEvent(prev => ({
      ...prev,
      languages: checked
        ? [...prev.languages, value]
        : prev.languages.filter(lang => lang !== value)
    }));
  };
  
  const handleSpeakerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setEvent(prev => ({
      ...prev,
      speakers: checked
        ? [...prev.speakers, value]
        : prev.speakers.filter(id => id !== value)
    }));
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setEvent(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
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
      setLoading(true);
      
      // Get cropped canvas
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400
      });
      
      // Convert canvas to blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob | null) => {
          if (!blob) throw new Error('Failed to create blob');
          resolve(blob);
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
      
      // Update event state
      setEvent(prev => ({
        ...prev,
        bg_image: croppedPath,
        original_bg_image: originalPath
      }));
      
      setShowCropper(false);
      setImageFile(null);
      
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Ошибка при загрузке изображений');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    try {
      setLoading(true);
      
      // Delete images from storage if they exist
      if (event.bg_image) {
        await supabase.storage
          .from('images')
          .remove([event.bg_image]);
      }
      
      if (event.original_bg_image) {
        await supabase.storage
          .from('images')
          .remove([event.original_bg_image]);
      }
      
      // Update event state
      setEvent(prev => ({
        ...prev,
        bg_image: null,
        original_bg_image: null
      }));
      
      toast.success('Изображение удалено');
    } catch (error) {
      console.error('Error removing images:', error);
      toast.error('Ошибка при удалении изображений');
    } finally {
      setLoading(false);
    }
  };
  
  const updateTimeSlots = async (eventId: string, date: string, startTime: string, endTime: string) => {
    try {
      // Format times for database
      const formattedStartTime = formatTimeForDatabase(startTime);
      const formattedEndTime = formatTimeForDatabase(endTime);
      
      if (!formattedStartTime || !formattedEndTime) {
        throw new Error('Invalid time format');
      }
      
      // Create timestamps
      const startTimestamp = createTimestamp(date, formattedStartTime);
      const endTimestamp = createTimestamp(date, formattedEndTime);
      
      if (!startTimestamp || !endTimestamp) {
        throw new Error('Invalid time value');
      }
      
      // Check if time slot already exists
      const { data: existingSlots, error: fetchError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('slot_details->event_id', eventId);
      
      if (fetchError) throw fetchError;
      
      // If slots exist, update them
      if (existingSlots && existingSlots.length > 0) {
        const { error: updateError } = await supabase
          .from('time_slots_table')
          .update({
            date: date,
            start_time: formattedStartTime,
            end_time: formattedEndTime
          })
          .eq('slot_details->event_id', eventId);
        
        if (updateError) throw updateError;
      } else {
        // Otherwise, create a new slot
        const { error: insertError } = await supabase
          .from('time_slots_table')
          .insert([{
            date: date,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            slot_details: {
              type: 'event',
              event_id: eventId,
              title: event.title
            }
          }]);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating time slots:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!event.title) {
        toast.error('Введите название мероприятия');
        return;
      }
      
      if (!event.date) {
        toast.error('Выберите дату мероприятия');
        return;
      }
      
      if (!event.start_time || !event.end_time) {
        toast.error('Укажите время начала и окончания');
        return;
      }
      
      if (!isValidTime(event.start_time) || !isValidTime(event.end_time)) {
        toast.error('Неверный формат времени');
        return;
      }
      
      // Prepare data for saving
      const eventData = {
        ...event,
        festival_program: event.event_type === 'Festival' ? festivalProgram : null
      };
      
      let result;
      
      if (isEditMode) {
        // Update existing event
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        
        // Update time slots
        await updateTimeSlots(id!, event.date, event.start_time, event.end_time);
        
        toast.success('Мероприятие обновлено');
      } else {
        // Create new event with generated ID
        const newId = crypto.randomUUID();
        const { data, error } = await supabase
          .from('events')
          .insert([{ ...eventData, id: newId }])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        
        // Create time slots for new event
        await updateTimeSlots(newId, event.date, event.start_time, event.end_time);
        
        toast.success('Мероприятие создано');
        navigate(`/admin/events/${newId}/edit`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Ошибка при сохранении мероприятия: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddProgramItem = () => {
    if (!currentProgramItem.title || !currentProgramItem.start_time || !currentProgramItem.end_time) {
      toast.error('Заполните обязательные поля программы');
      return;
    }
    
    if (editingProgramItemIndex !== null) {
      // Update existing item
      const updatedProgram = [...festivalProgram];
      updatedProgram[editingProgramItemIndex] = currentProgramItem;
      setFestivalProgram(updatedProgram);
    } else {
      // Add new item
      setFestivalProgram([...festivalProgram, currentProgramItem]);
    }
    
    // Reset form
    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setEditingProgramItemIndex(null);
    setShowProgramItemForm(false);
  };
  
  const handleEditProgramItem = (index: number) => {
    setCurrentProgramItem(festivalProgram[index]);
    setEditingProgramItemIndex(index);
    setShowProgramItemForm(true);
  };
  
  const handleRemoveProgramItem = (index: number) => {
    setFestivalProgram(festivalProgram.filter((_, i) => i !== index));
  };
  
  const handleProgramItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProgramItem(prev => ({ ...prev, [name]: value }));
  };
  
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${path}`;
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Основная информация</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group md:col-span-2">
              <label htmlFor="title" className="block font-medium mb-2">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={event.title}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                className="form-input"
                required
              />
              <div className="text-xs text-right mt-1 text-dark-500">
                {event.title.length}/{TITLE_MAX_LENGTH}
              </div>
            </div>
            
            <div className="form-group md:col-span-2">
              <label htmlFor="short_description" className="block font-medium mb-2">
                Краткое описание
              </label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={event.short_description || ''}
                onChange={handleChange}
                maxLength={SHORT_DESC_MAX_LENGTH}
                className="form-input"
              />
              <div className="text-xs text-right mt-1 text-dark-500">
                {(event.short_description || '').length}/{SHORT_DESC_MAX_LENGTH}
              </div>
            </div>
            
            <div className="form-group md:col-span-2">
              <label htmlFor="description" className="block font-medium mb-2">
                Полное описание <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={event.description}
                onChange={handleChange}
                rows={6}
                maxLength={DESC_MAX_LENGTH}
                className="form-input"
                required
              />
              <div className="text-xs text-right mt-1 text-dark-500">
                {event.description.length}/{DESC_MAX_LENGTH}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="event_type" className="block font-medium mb-2">
                Тип мероприятия <span className="text-red-500">*</span>
              </label>
              <select
                id="event_type"
                name="event_type"
                value={event.event_type}
                onChange={handleChange}
                className="form-input"
                required
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status" className="block font-medium mb-2">
                Статус <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={event.status}
                onChange={handleChange}
                className="form-input"
                required
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'active' ? 'Активно' : status === 'draft' ? 'Черновик' : 'Прошедшее'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="age_category" className="block font-medium mb-2">
                Возрастная категория <span className="text-red-500">*</span>
              </label>
              <select
                id="age_category"
                name="age_category"
                value={event.age_category}
                onChange={handleChange}
                className="form-input"
                required
              >
                {ageCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="block font-medium mb-2">
                Языки <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {languages.map(language => (
                  <label key={language} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={language}
                      checked={event.languages.includes(language)}
                      onChange={handleLanguageChange}
                      className="form-checkbox"
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Date and Location */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Дата и место проведения</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block font-medium mb-2">
                Дата <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-dark-500" />
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd.MM.yyyy"
                  locale={ru}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="location" className="block font-medium mb-2">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={event.location}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="start_time" className="block font-medium mb-2">
                Время начала <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={event.start_time}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="end_time" className="block font-medium mb-2">
                Время окончания <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={event.end_time}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Info */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Информация о стоимости</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="payment_type" className="block font-medium mb-2">
                Тип оплаты <span className="text-red-500">*</span>
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={event.payment_type}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="cost">Платное</option>
                <option value="free">Бесплатное</option>
                <option value="donation">Донейшн</option>
              </select>
            </div>
            
            {event.payment_type === 'cost' && (
              <>
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-2">
                    Стоимость <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-dark-500" />
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={event.price === null ? '' : event.price}
                      onChange={handleNumberChange}
                      min="0"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-2">
                    Валюта <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={event.currency}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="couple_discount" className="block font-medium mb-2">
                    Скидка для пар (%)
                  </label>
                  <input
                    type="number"
                    id="couple_discount"
                    name="couple_discount"
                    value={event.couple_discount || ''}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="child_half_price"
                      checked={event.child_half_price || false}
                      onChange={handleCheckboxChange}
                      className="form-checkbox"
                    />
                    <span>Детский билет за полцены</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="payment_link" className="block font-medium mb-2">
                    Ссылка на оплату
                  </label>
                  <div className="flex items-center">
                    <LinkIcon className="h-5 w-5 mr-2 text-dark-500" />
                    <input
                      type="url"
                      id="payment_link"
                      name="payment_link"
                      value={event.payment_link || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="widget_chooser"
                      checked={event.widget_chooser || false}
                      onChange={handleCheckboxChange}
                      className="form-checkbox"
                    />
                    <span>Использовать виджет оплаты</span>
                  </label>
                </div>
                
                {event.widget_chooser && (
                  <div className="form-group md:col-span-2">
                    <label htmlFor="payment_widget_id" className="block font-medium mb-2">
                      ID виджета оплаты
                    </label>
                    <textarea
                      id="payment_widget_id"
                      name="payment_widget_id"
                      value={event.payment_widget_id || ''}
                      onChange={handleChange}
                      className="form-input"
                      rows={3}
                      placeholder="<script src='...'></script>"
                    />
                  </div>
                )}
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="max_registrations" className="block font-medium mb-2">
                Максимальное количество участников
              </label>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="number"
                  id="max_registrations"
                  name="max_registrations"
                  value={event.max_registrations === null ? '' : event.max_registrations}
                  onChange={handleNumberChange}
                  min="0"
                  className="form-input"
                  placeholder="Без ограничений"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Speakers */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Спикеры</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hide_speakers_gallery"
                checked={event.hide_speakers_gallery}
                onChange={handleCheckboxChange}
                className="form-checkbox"
              />
              <span>Скрыть галерею спикеров</span>
            </label>
          </div>
          
          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {speakers.map(speaker => (
                <label key={speaker.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    value={speaker.id}
                    checked={event.speakers.includes(speaker.id)}
                    onChange={handleSpeakerChange}
                    className="form-checkbox mt-1"
                  />
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-700 flex-shrink-0">
                      {speaker.photos?.[0]?.url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{speaker.name}</div>
                      <div className="text-sm text-dark-500 dark:text-dark-400">{speaker.field_of_expertise}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-dark-500">
              Нет доступных спикеров
            </div>
          )}
        </div>
        
        {/* Image Upload */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Изображение мероприятия</h3>
          
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
                  onClick={() => {
                    setShowCropper(false);
                    setImageFile(null);
                  }}
                  className="btn-outline"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleCrop}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Сохранение...' : 'Обрезать и сохранить'}
                </button>
              </div>
            </div>
          ) : event.bg_image ? (
            <div className="relative">
              <img
                src={getImageUrl(event.bg_image)}
                alt="Event"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
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
        
        {/* Festival Program (only for Festival event type) */}
        {event.event_type === 'Festival' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Программа фестиваля</h3>
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
                  setEditingProgramItemIndex(null);
                  setShowProgramItemForm(true);
                }}
                className="btn-outline inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Добавить пункт программы
              </button>
            </div>
            
            {showProgramItemForm && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h4 className="font-medium mb-4">
                  {editingProgramItemIndex !== null ? 'Редактирование пункта программы' : 'Новый пункт программы'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="program-title" className="block font-medium mb-2">
                      Название <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="program-title"
                      name="title"
                      value={currentProgramItem.title}
                      onChange={handleProgramItemChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="program-lecturer" className="block font-medium mb-2">
                      Спикер
                    </label>
                    <select
                      id="program-lecturer"
                      name="lecturer_id"
                      value={currentProgramItem.lecturer_id}
                      onChange={handleProgramItemChange}
                      className="form-input"
                    >
                      <option value="">Выберите спикера</option>
                      {speakers.map(speaker => (
                        <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="program-start-time" className="block font-medium mb-2">
                      Время начала <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="program-start-time"
                      name="start_time"
                      value={currentProgramItem.start_time}
                      onChange={handleProgramItemChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="program-end-time" className="block font-medium mb-2">
                      Время окончания <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="program-end-time"
                      name="end_time"
                      value={currentProgramItem.end_time}
                      onChange={handleProgramItemChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group md:col-span-2">
                    <label htmlFor="program-description" className="block font-medium mb-2">
                      Описание
                    </label>
                    <textarea
                      id="program-description"
                      name="description"
                      value={currentProgramItem.description}
                      onChange={handleProgramItemChange}
                      rows={3}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group md:col-span-2">
                    <label htmlFor="program-image" className="block font-medium mb-2">
                      Ссылка на изображение
                    </label>
                    <input
                      type="text"
                      id="program-image"
                      name="image_url"
                      value={currentProgramItem.image_url}
                      onChange={handleProgramItemChange}
                      className="form-input"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramItemForm(false);
                      setEditingProgramItemIndex(null);
                    }}
                    className="btn-outline"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProgramItem}
                    className="btn-primary"
                  >
                    {editingProgramItemIndex !== null ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}
            
            {festivalProgram.length > 0 ? (
              <div className="space-y-4">
                {festivalProgram.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <div className="text-sm text-dark-500 dark:text-dark-400">
                          {item.start_time} - {item.end_time}
                        </div>
                        {item.lecturer_id && (
                          <div className="text-sm text-primary-600 dark:text-primary-400">
                            Спикер: {speakers.find(s => s.id === item.lecturer_id)?.name || 'Неизвестный спикер'}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditProgramItem(index)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProgramItem(index)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-dark-500">
                Нет добавленных пунктов программы
              </div>
            )}
          </div>
        )}
        
        {/* Additional Media */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Дополнительные медиа</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="video_url" className="block font-medium mb-2">
                Ссылка на видео
              </label>
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={event.video_url || ''}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="photo_gallery" className="block font-medium mb-2">
                Ссылка на фотогалерею
              </label>
              <div className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-dark-500" />
                <input
                  type="url"
                  id="photo_gallery"
                  name="photo_gallery"
                  value={event.photo_gallery || ''}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://photos.app.goo.gl/..."
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;