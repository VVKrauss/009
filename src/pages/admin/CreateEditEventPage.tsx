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
  Sparkles,
  ArrowLeft,
  Star,
  Play,
  CreditCard,
  UserCheck,
  Settings,
  ChevronDown,
  Edit,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Mock constants - replace with your actual imports
const eventTypes = ['Lecture', 'Workshop', 'Festival', 'Conference'];
const paymentTypes = ['free', 'cost', 'donation'];
const languages = ['Русский', 'English', 'Српски'];
const ageCategories = ['0+', '12+', '16+', '18+'];
const currencies = ['RSD', 'EUR', 'USD'];
const statuses = ['draft', 'active', 'past'];

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
    { id: '1', name: 'Анна Иванова', photos: [] },
    { id: '2', name: 'Михаил Петров', photos: [] },
    { id: '3', name: 'Елена Сидорова', photos: [] }
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
    setFestivalProgram(prev => prev.filter((_, i) => i !== index));
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
               option === 'past' ? 'Прошедшее' :
               option === 'free' ? 'Бесплатно' :
               option === 'donation' ? 'Донейшн' :
               option === 'cost' ? 'Платно' : option}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
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

  const RadioGroup = ({ label, name, options, value, onChange, icon: Icon }) => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                value === option.value 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-gray-300 group-hover:border-purple-400'
              }`}>
                {value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white m-1.5" />
                )}
              </div>
            </div>
            <span className={`text-sm font-medium transition-colors ${
              value === option.value ? 'text-purple-700' : 'text-gray-700 group-hover:text-purple-600'
            }`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const CheckboxGroup = ({ label, options, value, onChange, icon: Icon }) => (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleMultiSelectChange('languages', option)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
              (value || []).includes(option)
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg scale-105'
                : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white/80 hover:border-purple-300 hover:scale-105'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const SpeakerCard = ({ speaker, isSelected, onToggle }) => (
    <div
      onClick={() => onToggle(speaker.id)}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group overflow-hidden ${
        isSelected
          ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105'
          : 'border-gray-200 bg-white/50 hover:border-purple-300 hover:shadow-md hover:scale-102'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg">
          <Users className="w-6 h-6" />
          {isSelected && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 truncate">{speaker.name}</h4>
        </div>

        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
          isSelected 
            ? 'border-purple-500 bg-purple-500' 
            : 'border-gray-300 group-hover:border-purple-400'
        }`}>
          {isSelected && <Check className="w-4 h-4 text-white m-0.5" />}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

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
                value={formData.title}
                onChange={handleChange}
                placeholder="Введите название..."
                required
                icon={Sparkles}
                error={errors.title}
              />

              <AnimatedTextarea
                label="Краткое описание"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                placeholder="Краткое описание для карточки мероприятия..."
                rows={2}
                icon={FileText}
                hint="Отображается в списке мероприятий"
              />

              <AnimatedTextarea
                label="Полное описание"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Подробное описание мероприятия..."
                rows={6}
                icon={FileText}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedSelect
                  label="Тип мероприятия"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  options={eventTypes}
                  icon={Tag}
                />
                
                <AnimatedSelect
                  label="Возрастная категория"
                  name="age_category"
                  value={formData.age_category}
                  onChange={handleChange}
                  options={ageCategories}
                  icon={Users}
                />
              </div>

              <CheckboxGroup
                label="Языки мероприятия"
                options={languages}
                value={formData.languages}
                onChange={() => {}}
                icon={Globe}
              />
            </div>
          </FormSection>

          {/* Image Upload Section */}
          <FormSection title="Изображение мероприятия" icon={Camera} gradient="from-pink-500 to-rose-500">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center gap-4">
                  <GlassButton 
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                    Изменить
                  </GlassButton>
                  <GlassButton 
                    variant="danger"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="h-5 w-5" />
                    Удалить
                  </GlassButton>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-purple-300 rounded-2xl p-16 text-center bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
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
            )}
          </FormSection>

          {/* Date and Time */}
          <FormSection title="Дата и время" icon={Calendar} gradient="from-emerald-500 to-teal-500">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatedInput
                  label="Дата"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  icon={Calendar}
                  error={errors.date}
                />
                <AnimatedInput
                  label="Время начала"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  icon={Clock}
                  error={errors.start_time}
                />
                <AnimatedInput
                  label="Время окончания"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  icon={Clock}
                  error={errors.end_time}
                />
              </div>

              <AnimatedInput
                label="Место проведения"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Адрес или название места..."
                required
                icon={MapPin}
                error={errors.location}
              />
            </div>
          </FormSection>

          {/* Payment Information */}
          <FormSection title="Информация о стоимости" icon={DollarSign} gradient="from-green-500 to-emerald-500">
            <div className="space-y-8">
              <RadioGroup
                label="Тип оплаты"
                name="payment_type"
                options={[
                  { value: 'free', label: 'Бесплатно' },
                  { value: 'donation', label: 'Донейшн' },
                  { value: 'cost', label: 'Платно' }
                ]}
                value={formData.payment_type}
                onChange={handleChange}
                icon={CreditCard}
              />

              {formData.payment_type === 'cost' && (
                <div className="space-y-6 p-6 bg-green-50/50 rounded-xl border-2 border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatedInput
                      label="Стоимость"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      required
                      icon={DollarSign}
                      error={errors.price}
                    />
                    <AnimatedSelect
                      label="Валюта"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      options={currencies}
                      icon={DollarSign}
                    />
                  </div>

                  <AnimatedInput
                    label="Ссылка на оплату"
                    name="payment_link"
                    type="url"
                    value={formData.payment_link}
                    onChange={handleChange}
                    placeholder="https://..."
                    icon={LinkIcon}
                    error={errors.payment_link}
                  />

                  <AnimatedInput
                    label="ID виджета оплаты"
                    name="payment_widget_id"
                    value={formData.payment_widget_id}
                    onChange={handleChange}
                    placeholder="ID виджета (если используется)"
                    icon={CreditCard}
                  />

                  <ToggleSwitch
                    label="Использовать виджет вместо ссылки"
                    name="widget_chooser"
                    checked={formData.widget_chooser}
                    onChange={handleCheckboxChange}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatedInput
                      label="Скидка для пар (%)"
                      name="couple_discount"
                      type="number"
                      value={formData.couple_discount}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      placeholder="Например: 20"
                      icon={Users}
                    />
                    <ToggleSwitch
                      label="Детский билет за полцены"
                      name="child_half_price"
                      checked={formData.child_half_price}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Speakers Section */}
          <FormSection title="Спикеры" icon={Users} gradient="from-violet-500 to-purple-500">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {speakers.map(speaker => (
                  <SpeakerCard
                    key={speaker.id}
                    speaker={speaker}
                    isSelected={selectedSpeakers.includes(speaker.id)}
                    onToggle={handleSpeakerSelect}
                  />
                ))}
              </div>

              <ToggleSwitch
                label="Скрыть галерею спикеров"
                name="hide_speakers_gallery"
                checked={formData.hide_speakers_gallery}
                onChange={handleCheckboxChange}
                description="Спикеры не будут отображаться на странице мероприятия"
              />
            </div>
          </FormSection>

          {/* Festival Program (only for Festival event type) */}
          {formData.event_type === 'Festival' && (
            <FormSection title="Программа фестиваля" icon={Calendar} gradient="from-orange-500 to-red-500">
              <div className="space-y-8">
                {festivalProgram.length > 0 ? (
                  <div className="space-y-4">
                    {festivalProgram.map((item, index) => (
                      <div key={index} className="border-2 border-orange-200 rounded-2xl p-6 bg-orange-50/30">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
                            <div className="text-sm text-orange-600 mt-2 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {item.start_time} - {item.end_time}
                            </div>
                            {item.description && (
                              <p className="text-gray-600 mt-2">{item.description}</p>
                            )}
                            {item.lecturer_id && (
                              <div className="text-sm text-purple-600 mt-2 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Спикер: {speakers.find(s => s.id === item.lecturer_id)?.name || 'Неизвестный спикер'}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditProgramItem(index)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProgramItem(index)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-orange-300 rounded-2xl bg-orange-50/30">
                    <Calendar className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                    <p className="text-orange-600 font-medium">Нет добавленных пунктов программы</p>
                    <p className="text-orange-500 text-sm mt-1">Добавьте пункты программы для фестиваля</p>
                  </div>
                )}

                {showFestivalProgramForm ? (
                  <div className="border-2 border-orange-200 rounded-2xl p-6 bg-orange-50/30">
                    <h3 className="font-semibold text-lg mb-6 text-orange-800">
                      {editingProgramItemIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                    </h3>
                    
                    <div className="space-y-6">
                      <AnimatedInput
                        label="Название"
                        name="title"
                        value={programItemForm.title}
                        onChange={handleProgramItemChange}
                        placeholder="Название пункта программы"
                        required
                        icon={Tag}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatedInput
                          label="Время начала"
                          name="start_time"
                          type="time"
                          value={programItemForm.start_time}
                          onChange={handleProgramItemChange}
                          required
                          icon={Clock}
                        />
                        <AnimatedInput
                          label="Время окончания"
                          name="end_time"
                          type="time"
                          value={programItemForm.end_time}
                          onChange={handleProgramItemChange}
                          required
                          icon={Clock}
                        />
                      </div>

                      <AnimatedTextarea
                        label="Описание"
                        name="description"
                        value={programItemForm.description}
                        onChange={handleProgramItemChange}
                        placeholder="Описание пункта программы"
                        rows={3}
                        icon={FileText}
                      />

                      <AnimatedSelect
                        label="Спикер"
                        name="lecturer_id"
                        value={programItemForm.lecturer_id}
                        onChange={handleProgramItemChange}
                        options={speakers.map(s => ({ value: s.id, label: s.name }))}
                        placeholder="Выберите спикера"
                        icon={Users}
                      />

                      <div className="flex justify-end gap-4">
                        <GlassButton
                          variant="secondary"
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
                        >
                          <X className="h-5 w-5" />
                          Отмена
                        </GlassButton>
                        <GlassButton onClick={handleAddProgramItem}>
                          <Check className="h-5 w-5" />
                          {editingProgramItemIndex !== null ? 'Сохранить' : 'Добавить'}
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFestivalProgramForm(true)}
                    className="w-full py-6 border-2 border-dashed border-orange-300 rounded-2xl hover:bg-orange-50/50 transition-all duration-300 flex items-center justify-center gap-3 text-orange-600 font-semibold group"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6" />
                    </div>
                    Добавить пункт программы
                  </button>
                )}
              </div>
            </FormSection>
          )}

          {/* Advanced Settings */}
          <FormSection title="Дополнительные настройки" icon={Settings} gradient="from-indigo-500 to-purple-500">
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-200">
                <h4 className="font-semibold text-indigo-800">Показать расширенные настройки</h4>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className={`transform transition-transform duration-300 ${showAdvancedSettings ? 'rotate-180' : ''}`}
                >
                  <ChevronDown className="h-6 w-6 text-indigo-600" />
                </button>
              </div>

              {showAdvancedSettings && (
                <div className="space-y-8 p-6 bg-indigo-50/30 rounded-xl border border-indigo-200">
                  <AnimatedSelect
                    label="Статус мероприятия"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={statuses}
                    icon={CheckCircle}
                  />

                  <AnimatedInput
                    label="Максимальное количество участников"
                    name="max_registrations"
                    type="number"
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
                    min="0"
                    placeholder="Без ограничений"
                    icon={Users}
                    hint="Оставьте пустым для неограниченного количества"
                  />

                  <AnimatedInput
                    label="Ссылка на видео"
                    name="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                    icon={Video}
                    error={errors.video_url}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatedInput
                      label="Дедлайн регистрации"
                      name="registration_deadline"
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={handleChange}
                      icon={Calendar}
                    />

                    <AnimatedInput
                      label="Лимит регистраций на пользователя"
                      name="registration_limit_per_user"
                      type="number"
                      value={formData.registration_limit_per_user}
                      onChange={handleChange}
                      min="1"
                      icon={UserCheck}
                    />
                  </div>

                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Включить регистрацию"
                      name="registration_enabled"
                      checked={formData.registration_enabled}
                      onChange={handleCheckboxChange}
                      description="Посетители смогут регистрироваться на мероприятие"
                    />
                  </div>
                </div>
              )}
            </div>
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
      `}</style>
    </div>
  );
};

export default CreateEditEventPage;