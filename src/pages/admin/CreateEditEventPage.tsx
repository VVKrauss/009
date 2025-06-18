import { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Star,
  Camera,
  Play,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle,
  Settings,
  Image as ImageIcon,
  Video,
  CreditCard,
  UserCheck
} from 'lucide-react';

// Mock data - replace with your actual imports
const eventTypes = ['Lecture', 'Workshop', 'Festival', 'Conference'];
const paymentTypes = ['free', 'cost', 'donation'];
const languages = ['Русский', 'English', 'Српски'];
const ageCategories = ['0+', '12+', '16+', '18+'];
const currencies = ['RSD', 'EUR', 'USD'];
const statuses = ['draft', 'active', 'past'];

const CreateEditEventPage = () => {
  const [eventData, setEventData] = useState({
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
    video_url: '',
    registrations: {
      max_regs: null,
      current: 0,
      current_adults: 0,
      current_children: 0,
      reg_list: []
    },
    registration_enabled: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const handleInputChange = (e) => {
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Мероприятие сохранено!');
    setSaving(false);
  };

  // Enhanced form components
  const FormSection = ({ title, icon: Icon, children, className = "", gradient = "from-purple-500 to-pink-500" }) => (
    <div className={`group bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:border-white/40 transition-all duration-500 ${className}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  const AnimatedInput = ({ 
    label, 
    name,
    value, 
    onChange, 
    type = "text", 
    placeholder, 
    required = false, 
    icon: Icon,
    error,
    hint,
    maxLength,
    ...props 
  }) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
        {required && <span className="text-red-500 text-lg">*</span>}
        {maxLength && value && (
          <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <div className="relative group">
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-4 py-4 bg-white/60 border-2 rounded-xl transition-all duration-300 placeholder-gray-400 focus:outline-none focus:ring-0 group-hover:bg-white/80 ${
            error 
              ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
              : 'border-gray-200 focus:border-purple-400 focus:bg-white'
          }`}
          {...props}
        />
        {!error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-2 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-gray-500 text-sm">{hint}</p>
      )}
    </div>
  );

  const AnimatedTextarea = ({ 
    label, 
    name,
    value, 
    onChange, 
    placeholder, 
    rows = 4, 
    icon: Icon,
    error,
    hint,
    maxLength 
  }) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
        {maxLength && value && (
          <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <div className="relative group">
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={`w-full px-4 py-4 bg-white/60 border-2 rounded-xl transition-all duration-300 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none group-hover:bg-white/80 ${
            error 
              ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
              : 'border-gray-200 focus:border-purple-400 focus:bg-white'
          }`}
        />
        {!error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-2 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-gray-500 text-sm">{hint}</p>
      )}
    </div>
  );

  const AnimatedSelect = ({ 
    label, 
    name,
    value, 
    onChange, 
    options, 
    icon: Icon,
    error,
    required = false,
    placeholder = "Выберите опцию"
  }) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
        {required && <span className="text-red-500 text-lg">*</span>}
      </label>
      <div className="relative group">
        <select
          name={name}
          value={value || ''}
          onChange={onChange}
          className={`w-full px-4 py-4 bg-white/60 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 appearance-none cursor-pointer group-hover:bg-white/80 ${
            error 
              ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
              : 'border-gray-200 focus:border-purple-400 focus:bg-white'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option} value={option}>
              {option === 'active' ? 'Активное' : 
               option === 'draft' ? 'Черновик' : 
               option === 'past' ? 'Прошедшее' : option}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-2 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );

  const ToggleSwitch = ({ label, name, checked, onChange, description }) => (
    <div className="flex items-center justify-between p-6 bg-white/30 rounded-2xl border border-white/40 hover:bg-white/40 transition-all duration-300 group">
      <div>
        <h4 className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">{label}</h4>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange({ target: { name, checked: !checked } })}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg ${
          checked 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-200' 
            : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
        {checked && (
          <CheckCircle className="absolute right-1 h-4 w-4 text-white" />
        )}
      </button>
    </div>
  );

  const GlassButton = ({ children, onClick, variant = "primary", disabled = false, type = "button", className = "" }) => {
    const variants = {
      primary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-200",
      secondary: "bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 border border-white/40 hover:border-white/60",
      danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-200"
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${variants[variant]} ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'transform hover:scale-105 active:scale-95 hover:shadow-xl'
        } ${className}`}
      >
        {children}
      </button>
    );
  };

  const LanguageSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Globe className="h-4 w-4 text-gray-500" />
        Языки мероприятия
        <span className="text-red-500 text-lg">*</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {languages.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => {
              if (eventData.languages.includes(lang)) {
                handleMultiSelectChange('languages', eventData.languages.filter(l => l !== lang));
              } else {
                handleMultiSelectChange('languages', [...eventData.languages, lang]);
              }
            }}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
              eventData.languages.includes(lang)
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg scale-105'
                : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white/80 hover:border-purple-300 hover:scale-105'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      {formErrors.languages && (
        <p className="text-red-500 text-sm flex items-center gap-2 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          {formErrors.languages}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <GlassButton variant="secondary" onClick={() => alert('Назад')}>
              <ArrowLeft className="h-5 w-5" />
            </GlassButton>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {isEditMode ? 'Редактирование мероприятия' : 'Создание мероприятия'}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Заполните информацию о вашем мероприятии</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <GlassButton variant="secondary">
              <Star className="h-5 w-5" />
              Черновик
            </GlassButton>
            <GlassButton 
              onClick={handleSubmit} 
              disabled={saving}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  Сохранить
                </>
              )}
            </GlassButton>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <FormSection title="Основная информация" icon={Sparkles} gradient="from-blue-500 to-purple-500">
            <div className="space-y-8">
              <AnimatedInput
                label="Название мероприятия"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                placeholder="Введите название..."
                required
                icon={Sparkles}
                error={formErrors.title}
              />

              <AnimatedInput
                label="Краткое описание"
                name="short_description"
                value={eventData.short_description}
                onChange={handleInputChange}
                placeholder="Краткое описание для списка мероприятий..."
                icon={Star}
                error={formErrors.short_description}
                hint="Максимум 150 символов"
                maxLength={150}
              />

              <AnimatedTextarea
                label="Полное описание"
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                placeholder="Подробное описание мероприятия..."
                rows={6}
                error={formErrors.description}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatedInput
                  label="Дата"
                  name="date"
                  type="date"
                  value={eventData.date}
                  onChange={handleInputChange}
                  required
                  icon={Calendar}
                  error={formErrors.date}
                />
                <AnimatedInput
                  label="Время начала"
                  name="start_time"
                  type="time"
                  value={eventData.start_time}
                  onChange={handleInputChange}
                  required
                  icon={Clock}
                  error={formErrors.start_time}
                />
                <AnimatedInput
                  label="Время окончания"
                  name="end_time"
                  type="time"
                  value={eventData.end_time}
                  onChange={handleInputChange}
                  required
                  icon={Clock}
                  error={formErrors.end_time}
                />
              </div>

              <AnimatedInput
                label="Место проведения"
                name="location"
                value={eventData.location}
                onChange={handleInputChange}
                placeholder="Адрес или название места..."
                required
                icon={MapPin}
                error={formErrors.location}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatedSelect
                  label="Тип мероприятия"
                  name="event_type"
                  value={eventData.event_type}
                  onChange={handleInputChange}
                  options={eventTypes}
                  required
                  icon={Star}
                  error={formErrors.event_type}
                />
                <AnimatedSelect
                  label="Возрастная категория"
                  name="age_category"
                  value={eventData.age_category}
                  onChange={handleInputChange}
                  options={ageCategories}
                  required
                  icon={Users}
                  error={formErrors.age_category}
                />
                <AnimatedSelect
                  label="Статус"
                  name="status"
                  value={eventData.status}
                  onChange={handleInputChange}
                  options={statuses}
                  required
                  icon={CheckCircle}
                />
              </div>

              <LanguageSelector />
            </div>
          </FormSection>

          {/* Payment Information */}
          <FormSection title="Информация об оплате" icon={DollarSign} gradient="from-green-500 to-emerald-500">
            <div className="space-y-8">
              <AnimatedSelect
                label="Тип оплаты"
                name="payment_type"
                value={eventData.payment_type}
                onChange={handleInputChange}
                options={paymentTypes}
                required
                icon={CreditCard}
                error={formErrors.payment_type}
              />

              {eventData.payment_type === 'cost' && (
                <div className="space-y-6 p-6 bg-green-50/50 rounded-xl border-2 border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatedInput
                      label="Цена"
                      name="price"
                      type="number"
                      value={eventData.price !== null ? eventData.price : ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      icon={DollarSign}
                      error={formErrors.price}
                    />
                    <AnimatedSelect
                      label="Валюта"
                      name="currency"
                      value={eventData.currency}
                      onChange={handleInputChange}
                      options={currencies}
                      required
                      icon={DollarSign}
                      error={formErrors.currency}
                    />
                  </div>

                  <AnimatedInput
                    label="Комментарий к цене"
                    name="price_comment"
                    value={eventData.price_comment}
                    onChange={handleInputChange}
                    placeholder="Например: Скидка для студентов"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatedInput
                      label="Скидка для пар (%)"
                      name="couple_discount"
                      value={eventData.couple_discount}
                      onChange={handleInputChange}
                      placeholder="Например: 20"
                    />
                    <ToggleSwitch
                      label="Детский билет за полцены"
                      name="child_half_price"
                      checked={eventData.child_half_price}
                      onChange={handleCheckboxChange}
                    />
                  </div>

                  <AnimatedInput
                    label="Ссылка на оплату"
                    name="payment_link"
                    type="url"
                    value={eventData.payment_link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    error={formErrors.payment_link}
                  />

                  <ToggleSwitch
                    label="Использовать виджет оплаты"
                    name="widget_chooser"
                    checked={eventData.widget_chooser}
                    onChange={handleCheckboxChange}
                  />

                  {eventData.widget_chooser && (
                    <AnimatedInput
                      label="ID виджета оплаты"
                      name="payment_widget_id"
                      value={eventData.payment_widget_id}
                      onChange={handleInputChange}
                      placeholder="Например: Yi0idjZg"
                    />
                  )}
                </div>
              )}
            </div>
          </FormSection>

          {/* Registration Settings */}
          <FormSection title="Настройки регистрации" icon={UserCheck} gradient="from-indigo-500 to-purple-500">
            <div className="space-y-6">
              <AnimatedInput
                label="Максимальное количество участников"
                name="max_registrations"
                type="number"
                value={eventData.registrations.max_regs !== null ? eventData.registrations.max_regs : ''}
                onChange={handleInputChange}
                min="0"
                placeholder="Без ограничений"
                hint="Оставьте пустым, если нет ограничений"
                icon={Users}
              />

              <ToggleSwitch
                label="Разрешить регистрацию"
                name="registration_enabled"
                checked={eventData.registration_enabled !== false}
                onChange={handleCheckboxChange}
                description="Посетители смогут регистрироваться на мероприятие"
              />
            </div>
          </FormSection>

          {/* Image Upload Section */}
          <FormSection title="Изображение мероприятия" icon={Camera} gradient="from-pink-500 to-rose-500">
            <div className="border-2 border-dashed border-purple-300 rounded-2xl p-16 text-center bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group cursor-pointer">
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Camera className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-700">Загрузить изображение</p>
                  <p className="text-gray-500 mt-2">Перетащите файл или нажмите для выбора</p>
                  <p className="text-sm text-gray-400 mt-3">Рекомендуемый размер: 1200×400px</p>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Speakers Section */}
          <FormSection title="Спикеры" icon={Users} gradient="from-violet-500 to-purple-500">
            <div className="space-y-6">
              <ToggleSwitch
                label="Скрыть галерею спикеров"
                name="hide_speakers_gallery"
                checked={eventData.hide_speakers_gallery}
                onChange={handleCheckboxChange}
                description="Спикеры не будут отображаться на странице мероприятия"
              />
              
              <div className="p-6 bg-purple-50/50 rounded-xl border-2 border-purple-200">
                <p className="text-purple-700 font-medium">Раздел спикеров будет добавлен отдельным компонентом</p>
              </div>
            </div>
          </FormSection>

          {/* Festival Program (only for Festival event type) */}
          {eventData.event_type === 'Festival' && (
            <FormSection title="Программа фестиваля" icon={Calendar} gradient="from-orange-500 to-red-500">
              <div className="p-6 bg-orange-50/50 rounded-xl border-2 border-orange-200">
                <p className="text-orange-700 font-medium">Раздел программы фестиваля будет добавлен отдельным компонентом</p>
              </div>
            </FormSection>
          )}

          {/* Additional Information */}
          <FormSection title="Дополнительная информация" icon={Video} gradient="from-cyan-500 to-blue-500">
            <AnimatedInput
              label="Ссылка на видео"
              name="video_url"
              type="url"
              value={eventData.video_url || ''}
              onChange={handleInputChange}
              placeholder="https://youtube.com/..."
              icon={Play}
              error={formErrors.video_url}
              hint="Ссылка на YouTube, Vimeo или другой видеосервис"
            />
          </FormSection>

          {/* Action Buttons */}
          <div className="flex justify-end gap-6 pb-12">
            <GlassButton 
              variant="secondary" 
              onClick={() => alert('Отмена')}
              className="min-w-[120px]"
            >
              <ArrowLeft className="h-5 w-5" />
              Отмена
            </GlassButton>
            
            <GlassButton 
              type="submit"
              disabled={saving}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  Сохранить
                </>
              )}
            </GlassButton>
          </div>
        </form>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        .active\\:scale-95:active {
          transform: scale(0.95);
        }
        
        .scale-105 {
          transform: scale(1.05);
        }
      `}</style>