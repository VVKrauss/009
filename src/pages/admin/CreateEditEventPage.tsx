import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Globe, 
  Tag, 
  CreditCard,
  Upload,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Speaker = {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
};

type FestivalProgramItem = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  lecturer_id?: string;
};

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showFestivalProgram, setShowFestivalProgram] = useState(false);
  const [programItems, setProgramItems] = useState<FestivalProgramItem[]>([]);
  const [newProgramItem, setNewProgramItem] = useState<Omit<FestivalProgramItem, 'id'>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    event_type: 'lecture',
    bg_image: '',
    original_bg_image: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '18:00',
    end_time: '20:00',
    start_at: '',
    end_at: '',
    location: '',
    age_category: '18+',
    price: 0,
    price_comment: '',
    currency: 'RSD',
    status: 'draft',
    max_registrations: 0,
    payment_type: 'free',
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    languages: ['Русский'],
    speakers: [] as string[],
    couple_discount: '',
    child_half_price: false,
    hide_speakers_gallery: true,
    registration_enabled: true,
    registration_deadline: '',
    registration_limit_per_user: 5
  });

  useEffect(() => {
    fetchSpeakers();
    if (isEditMode) {
      fetchEventData();
    }
  }, [id]);

  useEffect(() => {
    // Set showFestivalProgram based on event type
    setShowFestivalProgram(formData.event_type === 'Festival');
  }, [formData.event_type]);

  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      toast.error('Ошибка при загрузке спикеров');
    }
  };

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format date and times
      const formattedData = {
        ...data,
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        start_time: data.start_time || '18:00',
        end_time: data.end_time || '20:00',
        languages: data.languages || ['Русский'],
        speakers: data.speakers || [],
        price: data.price || 0,
        max_registrations: data.max_registrations || 0,
        registration_limit_per_user: data.registration_limit_per_user || 5
      };

      setFormData(formattedData);
      
      // Set festival program if available
      if (data.festival_program && Array.isArray(data.festival_program)) {
        setProgramItems(data.festival_program.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID()
        })));
        setShowFestivalProgram(true);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Ошибка при загрузке данных мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (name === 'price' || name === 'max_registrations' || name === 'registration_limit_per_user') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>, language: string) => {
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(lang => lang !== language)
      }));
    }
  };

  const handleSpeakerChange = (e: React.ChangeEvent<HTMLInputElement>, speakerId: string) => {
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        speakers: [...prev.speakers, speakerId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        speakers: prev.speakers.filter(id => id !== speakerId)
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile);
        
      if (uploadError) throw uploadError;
      
      // Save original image path for reference
      setFormData(prev => ({
        ...prev,
        bg_image: filePath,
        original_bg_image: filePath
      }));
      
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка при загрузке изображения');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Введите название мероприятия');
        return;
      }
      
      if (!formData.date) {
        toast.error('Выберите дату мероприятия');
        return;
      }
      
      // Prepare data for submission
      const eventData = {
        ...formData,
        festival_program: showFestivalProgram ? programItems : null
      };
      
      if (isEditMode) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Мероприятие успешно обновлено');
      } else {
        // Create new event with generated ID
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('events')
          .insert([{ ...eventData, id: newId }]);
          
        if (error) throw error;
        
        toast.success('Мероприятие успешно создано');
        navigate(`/admin/events/${newId}/edit`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Ошибка при сохранении мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Введите название мероприятия');
        return;
      }
      
      if (!formData.date) {
        toast.error('Выберите дату мероприятия');
        return;
      }
      
      // Prepare data for submission with active status
      const eventData = {
        ...formData,
        status: 'active',
        festival_program: showFestivalProgram ? programItems : null
      };
      
      if (isEditMode) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Мероприятие опубликовано');
      } else {
        // Create new event with generated ID
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('events')
          .insert([{ ...eventData, id: newId }]);
          
        if (error) throw error;
        
        toast.success('Мероприятие опубликовано');
        navigate(`/admin/events/${newId}/edit`);
      }
    } catch (error) {
      console.error('Error publishing event:', error);
      toast.error('Ошибка при публикации мероприятия');
    } finally {
      setLoading(false);
    }
  };

  // Festival program handlers
  const handleAddProgramItem = () => {
    if (!newProgramItem.title || !newProgramItem.start_time || !newProgramItem.end_time) {
      toast.error('Заполните обязательные поля программы');
      return;
    }
    
    const newItem: FestivalProgramItem = {
      ...newProgramItem,
      id: crypto.randomUUID()
    };
    
    setProgramItems(prev => [...prev, newItem]);
    setNewProgramItem({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
    });
  };
  
  const handleRemoveProgramItem = (id: string) => {
    setProgramItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleProgramItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: string) => {
    setNewProgramItem(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };
  
  const handleUpdateProgramItem = (id: string, field: string, value: string) => {
    setProgramItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
          </h1>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-outline"
          >
            <Save className="h-5 w-5 mr-2" />
            Сохранить черновик
          </button>
          
          <button
            onClick={handlePublish}
            disabled={loading}
            className="btn-primary"
          >
            Опубликовать
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Info Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Основная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block font-medium mb-2">
                Название мероприятия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="short_description" className="block font-medium mb-2">
                Краткое описание
              </label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={formData.short_description || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                placeholder="Краткое описание для слайдера на главной странице"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block font-medium mb-2">
                Полное описание <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="event_type" className="block font-medium mb-2">
                Тип мероприятия
              </label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              >
                <option value="lecture">Лекция</option>
                <option value="workshop">Мастер-класс</option>
                <option value="movie discussion">Обсуждение фильма</option>
                <option value="conversation club">Разговорный клуб</option>
                <option value="Festival">Фестиваль</option>
                <option value="stand-up">Стендап</option>
                <option value="concert">Концерт</option>
                <option value="excursion">Экскурсия</option>
                <option value="discussion">Дискуссия</option>
                <option value="swap">Обмен</option>
                <option value="quiz">Викторина</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="age_category" className="block font-medium mb-2">
                Возрастная категория
              </label>
              <select
                id="age_category"
                name="age_category"
                value={formData.age_category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              >
                <option value="0+">0+</option>
                <option value="6+">6+</option>
                <option value="12+">12+</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </div>
            
            <div>
              <label className="block font-medium mb-2">
                Языки
              </label>
              <div className="space-y-2">
                {['Русский', 'Английский', 'Сербский'].map(language => (
                  <label key={language} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={(e) => handleLanguageChange(e, language)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="location" className="block font-medium mb-2">
                Место проведения
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                placeholder="Адрес или название места"
              />
            </div>
          </div>
        </div>
        
        {/* Date and Time Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Дата и время</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="date" className="block font-medium mb-2">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="start_time" className="block font-medium mb-2">
                Время начала
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="end_time" className="block font-medium mb-2">
                Время окончания
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="start_at" className="block font-medium mb-2">
                Начало (текстом)
              </label>
              <input
                type="text"
                id="start_at"
                name="start_at"
                value={formData.start_at || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                placeholder="Например: 18:00"
              />
            </div>
            
            <div>
              <label htmlFor="end_at" className="block font-medium mb-2">
                Окончание (текстом)
              </label>
              <input
                type="text"
                id="end_at"
                name="end_at"
                value={formData.end_at || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                placeholder="Например: 20:00"
              />
            </div>
          </div>
        </div>
        
        {/* Image Upload Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Изображение</h2>
          
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-700"
            >
              <Upload className="h-5 w-5" />
              {uploading ? 'Загрузка...' : 'Загрузить изображение'}
            </button>
            
            {formData.bg_image && (
              <div className="relative mt-4">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${formData.bg_image}`}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bg_image: '' }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Price and Registration Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Цена и регистрация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="payment_type" className="block font-medium mb-2">
                Тип оплаты
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              >
                <option value="free">Бесплатно</option>
                <option value="donation">Донейшн</option>
                <option value="fixed">Фиксированная цена</option>
                <option value="widget">Платежный виджет</option>
              </select>
            </div>
            
            {formData.payment_type === 'fixed' && (
              <>
                <div>
                  <label htmlFor="price" className="block font-medium mb-2">
                    Цена
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    min="0"
                  />
                </div>
                
                <div>
                  <label htmlFor="currency" className="block font-medium mb-2">
                    Валюта
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                  >
                    <option value="RSD">RSD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="price_comment" className="block font-medium mb-2">
                    Комментарий к цене
                  </label>
                  <input
                    type="text"
                    id="price_comment"
                    name="price_comment"
                    value={formData.price_comment || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    placeholder="Например: Студентам скидка 50%"
                  />
                </div>
                
                <div>
                  <label htmlFor="payment_link" className="block font-medium mb-2">
                    Ссылка на оплату
                  </label>
                  <input
                    type="url"
                    id="payment_link"
                    name="payment_link"
                    value={formData.payment_link || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="couple_discount"
                      checked={!!formData.couple_discount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        couple_discount: e.target.checked ? '10' : ''
                      }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Скидка для пар</span>
                  </label>
                  
                  {!!formData.couple_discount && (
                    <input
                      type="text"
                      name="couple_discount"
                      value={formData.couple_discount}
                      onChange={handleInputChange}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-dark-600 rounded-md"
                      placeholder="%"
                    />
                  )}
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="child_half_price"
                      checked={formData.child_half_price}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Детский билет за полцены</span>
                  </label>
                </div>
              </>
            )}
            
            {formData.payment_type === 'widget' && (
              <div className="md:col-span-2">
                <label htmlFor="payment_widget_id" className="block font-medium mb-2">
                  ID платежного виджета
                </label>
                <textarea
                  id="payment_widget_id"
                  name="payment_widget_id"
                  value={formData.payment_widget_id || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                  placeholder="<script>...</script>"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="max_registrations" className="block font-medium mb-2">
                Максимальное количество участников
              </label>
              <input
                type="number"
                id="max_registrations"
                name="max_registrations"
                value={formData.max_registrations}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                min="0"
                placeholder="0 = без ограничений"
              />
            </div>
            
            <div>
              <label htmlFor="registration_limit_per_user" className="block font-medium mb-2">
                Максимум билетов на одного человека
              </label>
              <input
                type="number"
                id="registration_limit_per_user"
                name="registration_limit_per_user"
                value={formData.registration_limit_per_user}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                min="1"
              />
            </div>
            
            <div>
              <label htmlFor="registration_deadline" className="block font-medium mb-2">
                Дедлайн регистрации
              </label>
              <input
                type="datetime-local"
                id="registration_deadline"
                name="registration_deadline"
                value={formData.registration_deadline || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="registration_enabled"
                  checked={formData.registration_enabled}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Включить регистрацию</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Speakers Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Спикеры</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hide_speakers_gallery"
                checked={formData.hide_speakers_gallery}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Скрыть галерею спикеров</span>
            </label>
          </div>
          
          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {speakers.map(speaker => (
                <label key={speaker.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.speakers.includes(speaker.id)}
                    onChange={(e) => handleSpeakerChange(e, speaker.id)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {speaker.photos?.[0]?.url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/100?text=No+image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{speaker.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{speaker.field_of_expertise}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              Нет доступных спикеров. <a href="/admin/speakers" className="text-primary-600 hover:underline">Добавить спикера</a>
            </div>
          )}
        </div>
        
        {/* Festival Program Section */}
        {showFestivalProgram && (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Программа фестиваля</h2>
            
            <div className="space-y-6">
              {/* Add new program item */}
              <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                <h3 className="font-medium mb-4">Добавить пункт программы</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Название</label>
                    <input
                      type="text"
                      value={newProgramItem.title}
                      onChange={(e) => handleProgramItemChange(e, 'title')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                      placeholder="Название мероприятия"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Описание</label>
                    <textarea
                      value={newProgramItem.description}
                      onChange={(e) => handleProgramItemChange(e, 'description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                      placeholder="Описание мероприятия"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Время начала</label>
                    <input
                      type="time"
                      value={newProgramItem.start_time}
                      onChange={(e) => handleProgramItemChange(e, 'start_time')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Время окончания</label>
                    <input
                      type="time"
                      value={newProgramItem.end_time}
                      onChange={(e) => handleProgramItemChange(e, 'end_time')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Спикер</label>
                    <select
                      value={newProgramItem.lecturer_id || ''}
                      onChange={(e) => handleProgramItemChange(e, 'lecturer_id')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md"
                    >
                      <option value="">Выберите спикера</option>
                      {speakers.map(speaker => (
                        <option key={speaker.id} value={speaker.id}>
                          {speaker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddProgramItem}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Добавить
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Program items list */}
              {programItems.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Программа мероприятия</h3>
                  
                  {programItems
                    .sort((a, b) => {
                      if (a.start_time < b.start_time) return -1;
                      if (a.start_time > b.start_time) return 1;
                      return 0;
                    })
                    .map((item, index) => (
                      <div 
                        key={item.id} 
                        className="border border-gray-200 dark:border-dark-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-500">
                                {item.start_time} - {item.end_time}
                              </span>
                            </div>
                            
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateProgramItem(item.id, 'title', e.target.value)}
                              className="w-full font-medium text-lg mb-2 border-none focus:ring-0 p-0 bg-transparent"
                            />
                            
                            <textarea
                              value={item.description}
                              onChange={(e) => handleUpdateProgramItem(item.id, 'description', e.target.value)}
                              rows={2}
                              className="w-full text-sm text-gray-600 dark:text-gray-300 border-none focus:ring-0 p-0 bg-transparent"
                            />
                            
                            {item.lecturer_id && (
                              <div className="mt-2">
                                <select
                                  value={item.lecturer_id}
                                  onChange={(e) => handleUpdateProgramItem(item.id, 'lecturer_id', e.target.value)}
                                  className="text-sm px-2 py-1 border border-gray-300 dark:border-dark-600 rounded-md"
                                >
                                  <option value="">Без спикера</option>
                                  {speakers.map(speaker => (
                                    <option key={speaker.id} value={speaker.id}>
                                      {speaker.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveProgramItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Программа пуста. Добавьте пункты программы выше.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Status Section */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Статус</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Текущий статус:</span>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                formData.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : formData.status === 'past'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {formData.status === 'active' 
                  ? 'Активно' 
                  : formData.status === 'past'
                    ? 'Прошло'
                    : 'Черновик'
                }
              </span>
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                Черновик
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: 'active' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                Активно
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status: 'past' }))}
                className={`px-4 py-2 rounded-md ${
                  formData.status === 'past'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                Прошло
              </button>
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-6 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700"
          >
            Отмена
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;