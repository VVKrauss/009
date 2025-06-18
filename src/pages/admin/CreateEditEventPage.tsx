import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateTimeForDatabase, isValidTimeFormat } from '../../utils/dateTimeUtils';
import { validateForm, eventTypes, paymentTypes, languages, ageCategories, currencies, statuses } from '../../utils/eventValidation';
import { parseEventTimes } from './utils';
import EventImageSection from '../../components/admin/EventImageSection';
import EventSpeakersSection from '../../components/admin/EventSpeakersSection';
import EventFestivalProgramSection from '../../components/admin/EventFestivalProgramSection';

interface EventData {
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
  payment_link: string;
  payment_widget_id: string;
  widget_chooser: boolean;
  languages: string[];
  speakers: string[];
  hide_speakers_gallery: boolean;
  couple_discount: string;
  child_half_price: boolean;
  festival_program: any[];
  registrations: {
    max_regs: number | null;
    current: number;
    current_adults: number;
    current_children: number;
    reg_list: any[];
  };
}

const defaultEventData: EventData = {
  id: crypto.randomUUID(),
  title: '',
  short_description: '',
  description: '',
  event_type: '',
  bg_image: null,
  original_bg_image: null,
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  age_category: '',
  price: null,
  price_comment: '',
  currency: 'RSD',
  status: 'draft',
  payment_type: 'free',
  payment_link: '',
  payment_widget_id: '',
  widget_chooser: false,
  languages: [],
  speakers: [],
  hide_speakers_gallery: true,
  couple_discount: '',
  child_half_price: false,
  festival_program: [],
  registrations: {
    max_regs: null,
    current: 0,
    current_adults: 0,
    current_children: 0,
    reg_list: []
  }
};

const CreateEditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [eventData, setEventData] = useState<EventData>(defaultEventData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [speakers, setSpeakers] = useState<any[]>([]);

  useEffect(() => {
    if (isEditMode) {
      fetchEventData();
    }
    fetchSpeakers();
  }, [isEditMode, id]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Format times for form inputs
      const formattedData = {
        ...data,
        start_time: data.start_time ? formatTimeFromTimestamp(data.start_time) : '',
        end_time: data.end_time ? formatTimeFromTimestamp(data.end_time) : '',
        speakers: data.speakers || [],
        languages: data.languages || [],
        hide_speakers_gallery: data.hide_speakers_gallery !== false, // default to true if undefined
        festival_program: data.festival_program || [],
        registrations: data.registrations || {
          max_regs: data.max_registrations || null,
          current: data.current_registration_count || 0,
          current_adults: 0,
          current_children: 0,
          reg_list: data.registrations_list || []
        }
      };

      setEventData(formattedData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Ошибка при загрузке данных мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('id, name, field_of_expertise')
        .eq('active', true);

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'price') {
      setEventData(prev => ({
        ...prev,
        price: value ? parseFloat(value) : null
      }));
    } else if (name === 'max_registrations') {
      setEventData(prev => ({
        ...prev,
        registrations: {
          ...prev.registrations,
          max_regs: value ? parseInt(value) : null
        }
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleMultiSelectChange = (name: string, value: string[]) => {
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpdate = (croppedPath: string, originalPath: string) => {
    setEventData(prev => ({
      ...prev,
      bg_image: croppedPath,
      original_bg_image: originalPath
    }));
  };

  const handleImageRemove = () => {
    setEventData(prev => ({
      ...prev,
      bg_image: null,
      original_bg_image: null
    }));
  };

  const handleSpeakersChange = (selectedSpeakers: string[]) => {
    setEventData(prev => ({
      ...prev,
      speakers: selectedSpeakers
    }));
  };

  const handleHideSpeakersGalleryChange = (hide: boolean) => {
    setEventData(prev => ({
      ...prev,
      hide_speakers_gallery: hide
    }));
  };

  const handleProgramUpdate = (programItems: any[]) => {
    setEventData(prev => ({
      ...prev,
      festival_program: programItems
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, errors } = validateForm(eventData);
    
    if (!isValid) {
      setFormErrors(errors);
      
      // Scroll to the first error
      const firstErrorField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    try {
      setSaving(true);
      
      // Format times for database
      const { start_time, end_time } = parseEventTimes(
        eventData.date,
        eventData.start_time,
        eventData.end_time
      );
      
      if (!start_time || !end_time) {
        throw new Error('Invalid date or time format');
      }
      
      // Format program times
      const formattedProgram = eventData.festival_program.map(item => ({
        ...item,
        start_time: formatDateTimeForDatabase(eventData.date, item.start_time),
        end_time: formatDateTimeForDatabase(eventData.date, item.end_time)
      }));
      
      // Prepare data for saving
      const dataToSave = {
        ...eventData,
        start_time,
        end_time,
        festival_program: formattedProgram
      };
      
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
            eventData: dataToSave,
            isNew: !isEditMode
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }
      
      toast.success(`Мероприятие успешно ${isEditMode ? 'обновлено' : 'создано'}`);
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(`Ошибка при ${isEditMode ? 'обновлении' : 'создании'} мероприятия`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-semibold">
            {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
          </h2>
        </div>
        
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Основная информация</h3>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="title" className="block font-medium mb-1">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                className={`form-input ${formErrors.title ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="short_description" className="block font-medium mb-1">
                Краткое описание
              </label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={eventData.short_description}
                onChange={handleInputChange}
                className={`form-input ${formErrors.short_description ? 'border-red-500' : ''}`}
              />
              {formErrors.short_description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.short_description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Краткое описание для списка мероприятий (максимум 150 символов)
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block font-medium mb-1">
                Полное описание
              </label>
              <textarea
                id="description"
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                rows={6}
                className={`form-input ${formErrors.description ? 'border-red-500' : ''}`}
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="date" className="block font-medium mb-1">
                  Дата <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.date ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="start_time" className="block font-medium mb-1">
                  Время начала <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={eventData.start_time}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.start_time ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.start_time && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.start_time}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="end_time" className="block font-medium mb-1">
                  Время окончания <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={eventData.end_time}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.end_time ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.end_time && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.end_time}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="block font-medium mb-1">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={eventData.location}
                onChange={handleInputChange}
                className={`form-input ${formErrors.location ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.location && (
                <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="event_type" className="block font-medium mb-1">
                  Тип мероприятия <span className="text-red-500">*</span>
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={eventData.event_type}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.event_type ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Выберите тип</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.event_type && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.event_type}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="age_category" className="block font-medium mb-1">
                  Возрастная категория <span className="text-red-500">*</span>
                </label>
                <select
                  id="age_category"
                  name="age_category"
                  value={eventData.age_category}
                  onChange={handleInputChange}
                  className={`form-input ${formErrors.age_category ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {ageCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {formErrors.age_category && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.age_category}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status" className="block font-medium mb-1">
                  Статус <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={eventData.status}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'active' ? 'Активное' : status === 'draft' ? 'Черновик' : 'Прошедшее'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="block font-medium mb-2">
                Языки <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {languages.map(lang => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventData.languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleMultiSelectChange('languages', [...eventData.languages, lang]);
                        } else {
                          handleMultiSelectChange('languages', eventData.languages.filter(l => l !== lang));
                        }
                      }}
                      className="form-checkbox"
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
              {formErrors.languages && (
                <p className="text-red-500 text-sm mt-1">{formErrors.languages}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Информация об оплате</h3>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="payment_type" className="block font-medium mb-1">
                Тип оплаты <span className="text-red-500">*</span>
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={eventData.payment_type}
                onChange={handleInputChange}
                className={`form-input ${formErrors.payment_type ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Выберите тип оплаты</option>
                <option value="free">Бесплатно</option>
                <option value="donation">Донейшн</option>
                <option value="cost">Платно</option>
              </select>
              {formErrors.payment_type && (
                <p className="text-red-500 text-sm mt-1">{formErrors.payment_type}</p>
              )}
            </div>

            {eventData.payment_type === 'cost' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-1">
                    Цена <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={eventData.price !== null ? eventData.price : ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`form-input ${formErrors.price ? 'border-red-500' : ''}`}
                    required
                  />
                  {formErrors.price && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="currency" className="block font-medium mb-1">
                    Валюта <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={eventData.currency}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.currency ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">Выберите валюту</option>
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  {formErrors.currency && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.currency}</p>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="price_comment" className="block font-medium mb-1">
                Комментарий к цене
              </label>
              <input
                type="text"
                id="price_comment"
                name="price_comment"
                value={eventData.price_comment}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Например: Скидка для студентов"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="couple_discount" className="block font-medium mb-1">
                  Скидка для пар (%)
                </label>
                <input
                  type="text"
                  id="couple_discount"
                  name="couple_discount"
                  value={eventData.couple_discount}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например: 20"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="child_half_price"
                    checked={eventData.child_half_price}
                    onChange={handleCheckboxChange}
                    className="form-checkbox"
                  />
                  <span>Детский билет за полцены</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="payment_link" className="block font-medium mb-1">
                Ссылка на оплату
              </label>
              <input
                type="url"
                id="payment_link"
                name="payment_link"
                value={eventData.payment_link}
                onChange={handleInputChange}
                className={`form-input ${formErrors.payment_link ? 'border-red-500' : ''}`}
                placeholder="https://..."
              />
              {formErrors.payment_link && (
                <p className="text-red-500 text-sm mt-1">{formErrors.payment_link}</p>
              )}
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="widget_chooser"
                  checked={eventData.widget_chooser}
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
                  value={eventData.payment_widget_id}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Например: Yi0idjZg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Registration Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Настройки регистрации</h3>
          
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="max_registrations" className="block font-medium mb-1">
                Максимальное количество участников
              </label>
              <input
                type="number"
                id="max_registrations"
                name="max_registrations"
                value={eventData.registrations.max_regs !== null ? eventData.registrations.max_regs : ''}
                onChange={handleInputChange}
                min="0"
                className="form-input w-32"
                placeholder="Без ограничений"
              />
              <p className="text-sm text-gray-500 mt-1">
                Оставьте пустым, если нет ограничений
              </p>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="registration_enabled"
                  checked={eventData.registration_enabled !== false}
                  onChange={handleCheckboxChange}
                  className="form-checkbox"
                />
                <span>Разрешить регистрацию</span>
              </label>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="card p-6">
          <EventImageSection
            bgImage={eventData.bg_image}
            originalBgImage={eventData.original_bg_image}
            onImageUpdate={handleImageUpdate}
            onImageRemove={handleImageRemove}
          />
        </div>

        {/* Speakers Section */}
        <div className="card p-6">
          <EventSpeakersSection
            selectedSpeakers={eventData.speakers}
            hideSpeakersGallery={eventData.hide_speakers_gallery}
            onSpeakersChange={handleSpeakersChange}
            onHideSpeakersGalleryChange={handleHideSpeakersGalleryChange}
          />
        </div>

        {/* Festival Program (only for Festival event type) */}
        {eventData.event_type === 'Festival' && (
          <div className="card p-6">
            <EventFestivalProgramSection
              programItems={eventData.festival_program || []}
              speakers={speakers}
              onProgramUpdate={handleProgramUpdate}
            />
          </div>
        )}

        {/* Additional Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium mb-4">Дополнительная информация</h3>
          
          <div className="space-y-4">
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
                className={`form-input ${formErrors.video_url ? 'border-red-500' : ''}`}
                placeholder="https://youtube.com/..."
              />
              {formErrors.video_url && (
                <p className="text-red-500 text-sm mt-1">{formErrors.video_url}</p>
              )}
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

export default CreateEditEventPage;