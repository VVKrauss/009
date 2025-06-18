import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  ArrowLeft,
  Search,
  User,
  ChevronDown,
  Edit
} from 'lucide-react';

// Mock data - replace with your actual imports
const eventTypes = [
  'Lecture',
  'Workshop', 
  'Movie Discussion',
  'Conversation Club',
  'Festival',
  'Stand-up',
  'Concert',
  'Excursion',
  'Discussion',
  'Swap',
  'Quiz'
];
const paymentTypes = ['cost', 'free', 'donation'];
const languages = ['Русский', 'Английский', 'Сербский'];
const ageCategories = ['0+', '12+', '18+'];
const currencies = ['RSD', 'EUR', 'RUB'];
const statuses = ['draft', 'active', 'past'];

const TITLE_MAX_LENGTH = 70;
const SHORT_DESC_MAX_LENGTH = 180;
const DESC_MAX_LENGTH = 800;

const CreateEditEventPage = () => {
  const isEditMode = false; // Replace with actual logic
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    event_type: eventTypes[0],
    bg_image: null,
    original_bg_image: null,
    date: new Date().toISOString().split('T')[0],
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
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    video_url: '',
    couple_discount: '',
    child_half_price: false,
    registration_enabled: true,
    registration_deadline: '',
    registration_limit_per_user: 5,
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
  const [speakers, setSpeakers] = useState([
    { id: '1', name: 'Анна Иванова', field_of_expertise: 'AI & Machine Learning', photos: [] },
    { id: '2', name: 'Михаил Петров', field_of_expertise: 'Web Development', photos: [] },
    { id: '3', name: 'Елена Сидорова', field_of_expertise: 'Data Science', photos: [] }
  ]);
  const [selectedSpeakers, setSelectedSpeakers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [festivalProgram, setFestivalProgram] = useState([]);
  const [showFestivalProgramForm, setShowFestivalProgramForm] = useState(false);
  const [programItemForm, setProgramItemForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    image_url: '',
    lecturer_id: ''
  });
  const [editingProgramItemIndex, setEditingProgramItemIndex] = useState(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');
  const [usePaymentWidget, setUsePaymentWidget] = useState(false);

  // Helper functions
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
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
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  // Handle speaker selection
  const handleSpeakerSelect = (speakerId) => {
    setSelectedSpeakers(prev => 
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCropper(true);
  };

  // Handle image crop
  const handleCrop = () => {
    setShowCropper(false);
    alert('Изображение обрезано и сохранено!');
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({
      ...prev,
      bg_image: null,
      original_bg_image: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle festival program
  const handleProgramItemChange = (e) => {
    const { name, value } = e.target;
    setProgramItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProgramItem = () => {
    if (!programItemForm.title || !programItemForm.start_time || !programItemForm.end_time) {
      alert('Заполните обязательные поля');
      return;
    }

    if (editingProgramItemIndex !== null) {
      const updatedProgram = [...festivalProgram];
      updatedProgram[editingProgramItemIndex] = programItemForm;
      setFestivalProgram(updatedProgram);
    } else {
      setFestivalProgram(prev => [...prev, programItemForm]);
    }

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

  const handleEditProgramItem = (index) => {
    setProgramItemForm(festivalProgram[index]);
    setEditingProgramItemIndex(index);
    setShowFestivalProgramForm(true);
  };

  const handleDeleteProgramItem = (index) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пункт программы?')) {
      return;
    }
    setFestivalProgram(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle functions
  const toggleLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const toggleSpeaker = (speakerId) => {
    setSelectedSpeakers(prev => {
      if (prev.includes(speakerId)) {
        return prev.filter(id => id !== speakerId);
      }
      return [...prev, speakerId];
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Мероприятие сохранено!');
    setSaving(false);
  };

  // Get selected speakers data
  const selectedSpeakersData = speakers.filter(speaker => 
    selectedSpeakers.includes(speaker.id)
  );

  // Filter speakers based on search
  const filteredSpeakers = speakers.filter(speaker => {
    const searchLower = speakerSearchQuery.toLowerCase();
    return (
      speaker.name.toLowerCase().includes(searchLower) ||
      speaker.field_of_expertise.toLowerCase().includes(searchLower)
    );
  });

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => alert('Назад')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-semibold">
            {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
          </h2>
        </div>
        {isEditMode && (
          <button
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
                alert('Мероприятие удалено!');
              }
            }}
            className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            Удалить мероприятие
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image upload section */}
          <div className="form-group">
            <label className="block font-medium mb-2">Изображение</label>
            {showCropper && imageFile ? (
              <div className="space-y-4">
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Здесь будет cropper</p>
                    <p className="text-sm text-gray-400">({imageFile.name})</p>
                  </div>
                </div>
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

          {/* Basic information */}
          <div className="form-group">
            <label htmlFor="title" className="block font-medium mb-2">
              Название ({formData.title.length}/{TITLE_MAX_LENGTH})
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              maxLength={TITLE_MAX_LENGTH}
            />
            {formData.title.length >= TITLE_MAX_LENGTH && (
              <p className="text-sm text-red-600 mt-1">
                Максимальная длина достигнута
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="short_description" className="block font-medium mb-2">
              Короткое описание ({formData.short_description.length}/{SHORT_DESC_MAX_LENGTH})
              <span className="text-sm text-gray-500 ml-2">(необязательное)</span>
            </label>
            <textarea
              id="short_description"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="form-input"
              rows={2}
              maxLength={SHORT_DESC_MAX_LENGTH}
            />
            {formData.short_description.length >= SHORT_DESC_MAX_LENGTH && (
              <p className="text-sm text-red-600 mt-1">
                Максимальная длина достигнута
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="block font-medium mb-2">
              Описание ({formData.description.length}/{DESC_MAX_LENGTH})
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows={4}
              maxLength={DESC_MAX_LENGTH}
            />
            {formData.description.length >= DESC_MAX_LENGTH && (
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
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
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
                name="date"
                value={formData.date}
                onChange={handleChange}
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
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
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
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
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
                name="location"
                value={formData.location}
                onChange={handleChange}
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
                value={formData.registrations?.max_regs || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  setFormData(prev => ({
                    ...prev,
                    registrations: {
                      ...prev.registrations,
                      max_regs: value
                    }
                  }));
                }}
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
                name="age_category"
                value={formData.age_category}
                onChange={handleChange}
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
                      formData.languages.includes(lang)
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
                name="status"
                value={formData.status}
                onChange={handleChange}
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
                name="payment_type"
                value={formData.payment_type}
                onChange={handleChange}
                className="form-input"
              >
                {paymentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {formData.payment_type === 'cost' && (
              <>
                <div className="form-group">
                  <label htmlFor="price" className="block font-medium mb-2">
                    Стоимость
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
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
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
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
          {formData.payment_type === 'cost' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="couple_discount" className="block font-medium mb-2">
                  Скидка для пар
                </label>
                <input
                  type="text"
                  id="couple_discount"
                  name="couple_discount"
                  value={formData.couple_discount || ''}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Укажите условия скидки для пар"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center justify-between">
                  <span className="font-medium">Детям 50% скидка</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, child_half_price: !prev.child_half_price }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      formData.child_half_price ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.child_half_price ? 'translate-x-6' : 'translate-x-1'
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
                      name="payment_link"
                      value={formData.payment_link || ''}
                      onChange={handleChange}
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
                      name="payment_widget_id"
                      value={formData.payment_widget_id || ''}
                      onChange={handleChange}
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
                name="video_url"
                value={formData.video_url || ''}
                onChange={handleChange}
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
                  onClick={() => setFormData(prev => ({ ...prev, hide_speakers_gallery: !prev.hide_speakers_gallery }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formData.hide_speakers_gallery ? 'bg-gray-200 dark:bg-dark-600' : 'bg-primary-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.hide_speakers_gallery ? 'translate-x-1' : 'translate-x-6'
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                          <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </div>
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

            {!formData.hide_speakers_gallery && (
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                            <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </div>
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
              </>
            )}
          </div>

          {/* Festival program section */}
          {formData.event_type === 'Festival' && (
            <div className="form-group">
              <div className="flex justify-between items-center mb-4">
                <label className="block font-medium">Программа фестиваля</label>
                <button
                  type="button"
                  onClick={() => {
                    setProgramItemForm({
                      title: '',
                      description: '',
                      start_time: '',
                      end_time: '',
                      image_url: '',
                      lecturer_id: ''
                    });
                    setEditingProgramItemIndex(null);
                    setShowFestivalProgramForm(true);
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Добавить пункт программы
                </button>
              </div>

              {/* Current program items list */}
              <div className="space-y-4 mb-6">
                {festivalProgram.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-dark-400">{item.description}</p>
                      <div className="text-xs mt-2">
                        <span>{item.start_time}</span>
                        <span> - </span>
                        <span>{item.end_time}</span>
                      </div>
                      {item.lecturer_id && (
                        <div className="text-xs text-primary-600 mt-1">
                          Спикер: {speakers.find(s => s.id === item.lecturer_id)?.name || 'Неизвестный спикер'}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProgramItem(index)}
                        className="p-1 text-gray-500 hover:text-primary-600"
                      >
                        <Edit className="h-5 w-5" />
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
              {showFestivalProgramForm && (
                <div className="border rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {editingProgramItemIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Название</label>
                      <input
                        type="text"
                        name="title"
                        value={programItemForm.title}
                        onChange={handleProgramItemChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Спикер</label>
                      <select
                        name="lecturer_id"
                        value={programItemForm.lecturer_id}
                        onChange={handleProgramItemChange}
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
                      name="description"
                      value={programItemForm.description}
                      onChange={handleProgramItemChange}
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Время начала</label>
                      <input
                        type="time"
                        name="start_time"
                        value={programItemForm.start_time}
                        onChange={handleProgramItemChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Время окончания</label>
                      <input
                        type="time"
                        name="end_time"
                        value={programItemForm.end_time}
                        onChange={handleProgramItemChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFestivalProgramForm(false)}
                      className="btn-outline mr-4"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProgramItem}
                      className="btn-primary"
                    >
                      {editingProgramItemIndex !== null ? 'Обновить пункт' : 'Добавить пункт'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Settings */}
          <div className="form-group">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center justify-between w-full text-left p-4 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
            >
              <h3 className="font-medium">Дополнительные настройки</h3>
              <ChevronDown className={`h-5 w-5 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
            </button>
            
            {showAdvancedSettings && (
              <div className="mt-4 space-y-6 p-4 border border-gray-200 dark:border-dark-600 rounded-lg">
                <div className="form-group">
                  <label htmlFor="registration_deadline" className="block font-medium mb-2">
                    Дедлайн регистрации
                  </label>
                  <input
                    type="datetime-local"
                    id="registration_deadline"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleChange}
                    className="form-input"
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
                    value={formData.registration_limit_per_user}
                    onChange={handleChange}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="registration_enabled"
                      checked={formData.registration_enabled}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700"
                    />
                    <span>Включить регистрацию</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-dark-700">
            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
                    alert('Мероприятие удалено!');
                  }
                }}
                className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Удалить мероприятие
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <button
                type="button"
                onClick={() => alert('Отмена')}
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
                  'Сохранить'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Add CSS classes */}
      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-outline {
          background-color: transparent;
          color: #374151;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-outline:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        @media (prefers-color-scheme: dark) {
          .form-input {
            background-color: #374151;
            border-color: #4b5563;
            color: white;
          }
          
          .btn-outline {
            color: #d1d5db;
            border-color: #4b5563;
          }
          
          .btn-outline:hover {
            background-color: #374151;
            border-color: #6b7280;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateEditEventPage;