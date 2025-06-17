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
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Globe, 
  Users, 
  CreditCard, 
  Link, 
  Image as ImageIcon,
  Video,
  FileText,
  Check,
  Info,
  Loader2
} from 'lucide-react';
import { Event, eventTypes, paymentTypes, languages, ageCategories, currencies, statuses } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string; photos: any[] }>>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [eventData, setEventData] = useState<Partial<Event>>({
    title: '',
    short_description: '',
    description: '',
    event_type: 'Lecture',
    bg_image: null,
    original_bg_image: null,
    date: new Date().toISOString().split('T')[0],
    start_time: new Date().toISOString(),
    end_time: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Science Hub',
    age_category: '0+',
    price: 0,
    currency: 'RSD',
    status: 'draft',
    payment_type: 'cost',
    languages: ['Русский'],
    speakers: [],
    hide_speakers_gallery: false,
    couple_discount: '',
    child_half_price: false,
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    video_url: '',
    photo_gallery: '',
    festival_program: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFestivalProgram, setShowFestivalProgram] = useState(false);
  const [festivalProgram, setFestivalProgram] = useState<any[]>([]);
  const [programItemBeingEdited, setProgramItemBeingEdited] = useState<number | null>(null);
  const [newProgramItem, setNewProgramItem] = useState({
    title: '',
    description: '',
    image_url: '',
    start_time: '',
    end_time: '',
    lecturer_id: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSpeakers();
    
    if (id) {
      setIsEditMode(true);
      fetchEvent(id);
    }
  }, [id]);

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

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Format dates and times
      const formattedData = {
        ...data,
        date: data.date || new Date().toISOString().split('T')[0],
        start_time: data.start_time || new Date().toISOString(),
        end_time: data.end_time || new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString()
      };

      setEventData(formattedData);
      setSelectedSpeakers(formattedData.speakers || []);
      
      // Set preview URL if bg_image exists
      if (formattedData.bg_image) {
        setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${formattedData.bg_image}`);
      }
      
      // Set festival program if it exists
      if (formattedData.festival_program && formattedData.festival_program.length > 0) {
        setFestivalProgram(formattedData.festival_program);
        setShowFestivalProgram(true);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEventData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setEventData(prev => ({ ...prev, languages: selectedValues }));
  };

  const handleSpeakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedSpeakers(selectedValues);
    setEventData(prev => ({ ...prev, speakers: selectedValues }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      // Generate unique filenames
      const timestamp = Date.now();
      const fileExt = imageFile.name.split('.').pop();
      
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      // Upload original image
      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile);

      if (originalError) throw originalError;

      // For simplicity, we're using the same image for both original and cropped
      // In a real app, you'd implement proper image cropping
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Validate required fields
      if (!eventData.title) {
        toast.error('Пожалуйста, введите название мероприятия');
        return;
      }
      
      if (!eventData.date) {
        toast.error('Пожалуйста, выберите дату мероприятия');
        return;
      }

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
        bg_image: imagePaths ? imagePaths.croppedPath : eventData.bg_image,
        original_bg_image: imagePaths ? imagePaths.originalPath : eventData.original_bg_image,
        festival_program: festivalProgram.length > 0 ? festivalProgram : null
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

  const handleAddProgramItem = () => {
    if (!newProgramItem.title || !newProgramItem.start_time || !newProgramItem.end_time) {
      toast.error('Пожалуйста, заполните обязательные поля программы');
      return;
    }
    
    if (programItemBeingEdited !== null) {
      // Update existing item
      const updatedProgram = [...festivalProgram];
      updatedProgram[programItemBeingEdited] = newProgramItem;
      setFestivalProgram(updatedProgram);
      setProgramItemBeingEdited(null);
    } else {
      // Add new item
      setFestivalProgram([...festivalProgram, newProgramItem]);
    }
    
    // Reset form
    setNewProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
  };

  const handleEditProgramItem = (index: number) => {
    setProgramItemBeingEdited(index);
    setNewProgramItem(festivalProgram[index]);
  };

  const handleRemoveProgramItem = (index: number) => {
    const updatedProgram = [...festivalProgram];
    updatedProgram.splice(index, 1);
    setFestivalProgram(updatedProgram);
    
    if (programItemBeingEdited === index) {
      setProgramItemBeingEdited(null);
      setNewProgramItem({
        title: '',
        description: '',
        image_url: '',
        start_time: '',
        end_time: '',
        lecturer_id: ''
      });
    }
  };

  const handleProgramItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProgramItem(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Назад к списку мероприятий
        </button>
        
        <h1 className="text-2xl font-semibold">
          {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
        </h1>
        
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary-500" />
            Основная информация
          </h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="title" className="block font-medium mb-1">
                Название мероприятия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={eventData.title || ''}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="short_description" className="block font-medium mb-1">
                Краткое описание
              </label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={eventData.short_description || ''}
                onChange={handleInputChange}
                className="form-input"
              />
              <p className="text-sm text-gray-500 mt-1">
                Краткое описание для списка мероприятий (до 150 символов)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block font-medium mb-1">
                Полное описание
              </label>
              <textarea
                id="description"
                name="description"
                value={eventData.description || ''}
                onChange={handleInputChange}
                rows={6}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="event_type" className="block font-medium mb-1">
                  Тип мероприятия
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={eventData.event_type || ''}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age_category" className="block font-medium mb-1">
                  Возрастная категория
                </label>
                <select
                  id="age_category"
                  name="age_category"
                  value={eventData.age_category || ''}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {ageCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="languages" className="block font-medium mb-1">
                Языки
              </label>
              <select
                id="languages"
                name="languages"
                multiple
                value={eventData.languages || []}
                onChange={handleLanguageChange}
                className="form-input"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Удерживайте Ctrl (Cmd на Mac) для выбора нескольких языков
              </p>
            </div>
          </div>
        </div>

        {/* Date and Location */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-500" />
            Дата и место проведения
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="date" className="block font-medium mb-1">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={eventData.date || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_time" className="block font-medium mb-1">
                  Время начала
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={eventData.start_time ? new Date(eventData.start_time).toTimeString().slice(0, 5) : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const date = new Date(eventData.date || new Date());
                    date.setHours(hours, minutes);
                    setEventData(prev => ({ ...prev, start_time: date.toISOString() }));
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time" className="block font-medium mb-1">
                  Время окончания
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={eventData.end_time ? new Date(eventData.end_time).toTimeString().slice(0, 5) : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const date = new Date(eventData.date || new Date());
                    date.setHours(hours, minutes);
                    setEventData(prev => ({ ...prev, end_time: date.toISOString() }));
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="block font-medium mb-1">
                Место проведения
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={eventData.location || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary-500" />
            Информация об оплате
          </h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="payment_type" className="block font-medium mb-1">
                Тип оплаты
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={eventData.payment_type || 'cost'}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="cost">Платное</option>
                <option value="free">Бесплатное</option>
                <option value="donation">Донейшн</option>
              </select>
            </div>

            {eventData.payment_type === 'cost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-1">
                    Цена
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={eventData.price || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-1">
                    Валюта
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={eventData.currency || 'RSD'}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {eventData.payment_type === 'cost' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="child_half_price"
                      checked={eventData.child_half_price || false}
                      onChange={handleCheckboxChange}
                      className="form-checkbox"
                    />
                    <span>Детский билет за полцены</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="couple_discount" className="block font-medium mb-1">
                    Скидка для пар (%)
                  </label>
                  <input
                    type="text"
                    id="couple_discount"
                    name="couple_discount"
                    value={eventData.couple_discount || ''}
                    onChange={handleInputChange}
                    placeholder="Например: 20"
                    className="form-input w-32"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="payment_link" className="block font-medium mb-1">
                    Ссылка на оплату
                  </label>
                  <input
                    type="url"
                    id="payment_link"
                    name="payment_link"
                    value={eventData.payment_link || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="widget_chooser"
                      checked={eventData.widget_chooser || false}
                      onChange={handleCheckboxChange}
                      className="form-checkbox"
                    />
                    <span>Использовать виджет оплаты</span>
                  </label>
                </div>

                {eventData.widget_chooser && (
                  <div className="form-group">
                    <label htmlFor="payment_widget_id" className="block font-medium mb-1">
                      ID виджета оплаты
                    </label>
                    <input
                      type="text"
                      id="payment_widget_id"
                      name="payment_widget_id"
                      value={eventData.payment_widget_id || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Введите ID виджета"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="max_registrations" className="block font-medium mb-1">
                Максимальное количество участников
              </label>
              <input
                type="number"
                id="max_registrations"
                name="max_registrations"
                value={eventData.max_registrations || ''}
                onChange={handleInputChange}
                min="0"
                className="form-input w-32"
                placeholder="Не ограничено"
              />
              <p className="text-sm text-gray-500 mt-1">
                Оставьте пустым, если количество не ограничено
              </p>
            </div>
          </div>
        </div>

        {/* Speakers */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-500" />
            Спикеры
          </h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="speakers" className="block font-medium mb-1">
                Выберите спикеров
              </label>
              <select
                id="speakers"
                name="speakers"
                multiple
                value={selectedSpeakers}
                onChange={handleSpeakerChange}
                className="form-input"
                size={5}
              >
                {speakers.map(speaker => (
                  <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Удерживайте Ctrl (Cmd на Mac) для выбора нескольких спикеров
              </p>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hide_speakers_gallery"
                  checked={eventData.hide_speakers_gallery || false}
                  onChange={handleCheckboxChange}
                  className="form-checkbox"
                />
                <span>Скрыть галерею спикеров</span>
              </label>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-primary-500" />
            Медиа
          </h2>
          
          <div className="space-y-6">
            <div className="form-group">
              <label className="block font-medium mb-2">
                Изображение мероприятия
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white/90 hover:bg-white text-dark-800 rounded-full shadow-lg"
                      title="Изменить изображение"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImageFile(null);
                        setEventData(prev => ({ ...prev, bg_image: null, original_bg_image: null }));
                      }}
                      className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg"
                      title="Удалить изображение"
                    >
                      <Trash2 className="h-5 w-5" />
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
                      Рекомендуемый размер: 1200x600px
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="video_url" className="block font-medium mb-1">
                Ссылка на видео
              </label>
              <input
                type="url"
                id="video_url"
                name="video_url"
                value={eventData.video_url || ''}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Festival Program */}
        {eventData.event_type === 'Festival' && (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary-500" />
                Программа фестиваля
              </h2>
              
              <button
                type="button"
                onClick={() => setShowFestivalProgram(!showFestivalProgram)}
                className="btn-outline text-sm"
              >
                {showFestivalProgram ? 'Скрыть программу' : 'Добавить программу'}
              </button>
            </div>
            
            {showFestivalProgram && (
              <div className="space-y-6">
                {/* Program items list */}
                {festivalProgram.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium">Добавленные пункты программы:</h3>
                    
                    <div className="space-y-3">
                      {festivalProgram.map((item, index) => (
                        <div 
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                              {item.lecturer_id && (
                                <span className="ml-2">
                                  • Спикер: {speakers.find(s => s.id === item.lecturer_id)?.name || 'Неизвестно'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProgramItem(index)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProgramItem(index)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add/Edit program item form */}
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                  <h3 className="font-medium mb-4">
                    {programItemBeingEdited !== null ? 'Редактировать пункт программы' : 'Добавить пункт программы'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="program_title" className="block font-medium mb-1">
                        Название <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="program_title"
                        name="title"
                        value={newProgramItem.title}
                        onChange={handleProgramItemChange}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="program_start_time" className="block font-medium mb-1">
                          Время начала <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id="program_start_time"
                          name="start_time"
                          value={newProgramItem.start_time}
                          onChange={handleProgramItemChange}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="program_end_time" className="block font-medium mb-1">
                          Время окончания <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id="program_end_time"
                          name="end_time"
                          value={newProgramItem.end_time}
                          onChange={handleProgramItemChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="program_description" className="block font-medium mb-1">
                        Описание
                      </label>
                      <textarea
                        id="program_description"
                        name="description"
                        value={newProgramItem.description}
                        onChange={handleProgramItemChange}
                        rows={3}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="program_lecturer" className="block font-medium mb-1">
                        Спикер
                      </label>
                      <select
                        id="program_lecturer"
                        name="lecturer_id"
                        value={newProgramItem.lecturer_id}
                        onChange={handleProgramItemChange}
                        className="form-input"
                      >
                        <option value="">Выберите спикера</option>
                        {speakers.map(speaker => (
                          <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      {programItemBeingEdited !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setProgramItemBeingEdited(null);
                            setNewProgramItem({
                              title: '',
                              description: '',
                              image_url: '',
                              start_time: '',
                              end_time: '',
                              lecturer_id: ''
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700"
                        >
                          Отмена
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleAddProgramItem}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        {programItemBeingEdited !== null ? 'Сохранить изменения' : 'Добавить в программу'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-primary-500" />
            Статус
          </h2>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="status" className="block font-medium mb-1">
                Статус мероприятия
              </label>
              <select
                id="status"
                name="status"
                value={eventData.status || 'draft'}
                onChange={handleInputChange}
                className="form-input"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'active' ? 'Активное' : status === 'draft' ? 'Черновик' : 'Прошедшее'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
  );
};

export default CreateEditEventPage;