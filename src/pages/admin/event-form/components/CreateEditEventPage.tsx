import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Calendar, Clock, MapPin, Users, CreditCard, Tag, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEventForm } from '../hooks/useEventForm';
import { useFestivalProgram } from '../hooks/useFestivalProgram';
import FormField from './FormField';
import ImageUploader from './ImageUploader';
import SpeakerSelector from './SpeakerSelector';
import ProgramItemForm from './ProgramItemForm';
import { InlineTimeSlotValidator } from './TimeSlotValidator';
import { EVENT_TYPES, PAYMENT_TYPES, LANGUAGES, AGE_CATEGORIES, CURRENCIES, STATUSES } from '../constants/event-form';

const CreateEditEventPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    event,
    setEvent,
    loading,
    saving,
    error,
    handleChange,
    handleArrayChange,
    handleCheckboxChange,
    handleNumberChange,
    handleSubmit,
    handleImageUpload,
    removeImage,
    isNew,
    uploadProgress,
    uploading,
  } = useEventForm();

  const {
    programItems,
    setProgramItems,
    currentItem,
    setCurrentItem,
    isEditing,
    addProgramItem,
    updateProgramItem,
    removeProgramItem,
    editProgramItem,
    cancelEdit,
    handleImageUpload: handleProgramImageUpload,
    uploading: programUploading,
    uploadProgress: programUploadProgress,
  } = useFestivalProgram(event.festival_program || []);

  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Обновляем программу фестиваля в основных данных события
  useEffect(() => {
    setEvent(prev => ({
      ...prev,
      festival_program: programItems,
    }));
  }, [programItems]);

  // Обработчик для мультиселекта (языки)
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    
    handleArrayChange('languages', values);
  };

  // Обработчик для добавления программы фестиваля
  const handleAddProgramItem = () => {
    setCurrentItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: '',
    });
    setShowProgramForm(true);
    setEditingItemIndex(null);
  };

  // Обработчик для редактирования программы фестиваля
  const handleEditProgramItem = (index: number) => {
    editProgramItem(index);
    setShowProgramForm(true);
    setEditingItemIndex(index);
  };

  // Обработчик для сохранения программы фестиваля
  const handleSaveProgramItem = (item: any) => {
    if (editingItemIndex !== null) {
      updateProgramItem(editingItemIndex, item);
    } else {
      addProgramItem(item);
    }
    setShowProgramForm(false);
    setEditingItemIndex(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/events')}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Назад к списку мероприятий
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">
          {isNew ? 'Создание нового мероприятия' : 'Редактирование мероприятия'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Название мероприятия"
            name="title"
            value={event.title}
            onChange={handleChange}
            placeholder="Введите название мероприятия"
            required
          />
          
          <FormField
            label="Тип мероприятия"
            name="event_type"
            type="select"
            value={event.event_type}
            onChange={handleChange}
            options={EVENT_TYPES.map(type => ({ value: type, label: type }))}
            required
          />
        </div>
        
        <FormField
          label="Краткое описание"
          name="short_description"
          value={event.short_description}
          onChange={handleChange}
          placeholder="Краткое описание для анонсов (до 150 символов)"
          helpText="Краткое описание будет отображаться в списке мероприятий и анонсах"
        />
        
        <FormField
          label="Полное описание"
          name="description"
          type="textarea"
          value={event.description}
          onChange={handleChange}
          placeholder="Подробное описание мероприятия"
          required
          rows={8}
        />
        
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Изображение
          </label>
          <ImageUploader
            onUploadComplete={handleImageUpload}
            previewUrl={
              event.bg_image
                ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${event.bg_image}`
                : null
            }
            onRemove={removeImage}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField
            label="Дата"
            name="date"
            type="date"
            value={event.date}
            onChange={handleChange}
            required
          />
          
          <FormField
            label="Время начала"
            name="start_time"
            type="time"
            value={event.start_time}
            onChange={handleChange}
            required
          />
          
          <FormField
            label="Время окончания"
            name="end_time"
            type="time"
            value={event.end_time}
            onChange={handleChange}
            required
          />
        </div>
        
        <InlineTimeSlotValidator
          date={event.date}
          startTime={event.start_time}
          endTime={event.end_time}
          eventId={event.id}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
          <FormField
            label="Место проведения"
            name="location"
            value={event.location}
            onChange={handleChange}
            placeholder="Адрес проведения мероприятия"
            required
          />
          
          <FormField
            label="Возрастная категория"
            name="age_category"
            type="select"
            value={event.age_category}
            onChange={handleChange}
            options={AGE_CATEGORIES.map(age => ({ value: age, label: age }))}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Языки
          </label>
          <select
            multiple
            name="languages"
            value={event.languages}
            onChange={handleMultiSelectChange}
            className="w-full p-3 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {LANGUAGES.map(language => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Удерживайте Ctrl (Cmd на Mac) для выбора нескольких языков
          </p>
        </div>
        
        <SpeakerSelector
          selectedSpeakers={event.speakers}
          onChange={(speakers) => handleArrayChange('speakers', speakers)}
        />
        
        <FormField
          label="Скрыть галерею спикеров"
          name="hide_speakers_gallery"
          type="checkbox"
          value={event.hide_speakers_gallery || false}
          onChange={(e) => handleCheckboxChange('hide_speakers_gallery', e.target.checked)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField
            label="Тип оплаты"
            name="payment_type"
            type="select"
            value={event.payment_type}
            onChange={handleChange}
            options={PAYMENT_TYPES.map(type => ({
              value: type,
              label: type === 'free' ? 'Бесплатно' : type === 'donation' ? 'Донейшн' : 'Платно'
            }))}
            required
          />
          
          {event.payment_type === 'cost' && (
            <>
              <FormField
                label="Стоимость"
                name="price"
                type="number"
                value={event.price || 0}
                onChange={handleChange}
                min={0}
                required
              />
              
              <FormField
                label="Валюта"
                name="currency"
                type="select"
                value={event.currency}
                onChange={handleChange}
                options={CURRENCIES.map(currency => ({ value: currency, label: currency }))}
                required
              />
            </>
          )}
        </div>
        
        {event.payment_type === 'cost' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField
              label="Ссылка на оплату"
              name="payment_link"
              value={event.payment_link || ''}
              onChange={handleChange}
              placeholder="https://..."
            />
            
            <FormField
              label="ID платежного виджета"
              name="payment_widget_id"
              value={event.payment_widget_id || ''}
              onChange={handleChange}
              placeholder="ID виджета оплаты"
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Скидка для пар (%)"
            name="couple_discount"
            value={event.couple_discount || ''}
            onChange={handleChange}
            placeholder="Например: 10"
            helpText="Оставьте пустым, если скидки нет"
          />
          
          <FormField
            label="Детский билет за полцены"
            name="child_half_price"
            type="checkbox"
            value={event.child_half_price || false}
            onChange={(e) => handleCheckboxChange('child_half_price', e.target.checked)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Максимальное количество регистраций"
            name="max_registrations"
            type="number"
            value={event.registrations?.max_regs || 0}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setEvent(prev => ({
                ...prev,
                registrations: {
                  ...prev.registrations,
                  max_regs: isNaN(value) || value <= 0 ? null : value
                }
              }));
            }}
            min={0}
            helpText="0 или пусто = без ограничений"
          />
          
          <FormField
            label="Статус мероприятия"
            name="status"
            type="select"
            value={event.status}
            onChange={handleChange}
            options={STATUSES.map(status => ({
              value: status,
              label: status === 'active' ? 'Активно' : status === 'draft' ? 'Черновик' : 'Прошедшее'
            }))}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Ссылка на видео"
            name="video_url"
            value={event.video_url || ''}
            onChange={handleChange}
            placeholder="https://youtube.com/..."
          />
          
          <FormField
            label="Ссылка на фотогалерею"
            name="photo_gallery"
            value={event.photo_gallery || ''}
            onChange={handleChange}
            placeholder="https://photos.google.com/..."
          />
        </div>
      </div>

      {/* Программа фестиваля (только для типа Festival) */}
      {event.event_type === 'Festival' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Программа фестиваля</h2>
            <button
              type="button"
              onClick={handleAddProgramItem}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Добавить пункт программы
            </button>
          </div>
          
          {showProgramForm && (
            <ProgramItemForm
              item={currentItem}
              onSave={handleSaveProgramItem}
              onCancel={() => {
                setShowProgramForm(false);
                cancelEdit();
              }}
              onImageUpload={handleProgramImageUpload}
              uploading={programUploading}
              isEditing={isEditing}
            />
          )}
          
          {programItems.length > 0 ? (
            <div className="space-y-4">
              {programItems.map((item, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      {item.image_url && (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${item.image_url}`}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{item.start_time} - {item.end_time}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProgramItem(index)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProgramItem(index)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Нет программы
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Добавьте пункты программы фестиваля
              </p>
              <button
                type="button"
                onClick={handleAddProgramItem}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Добавить пункт программы
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <button
          type="button"
          onClick={() => navigate('/admin/events')}
          className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Отмена
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
};

export default CreateEditEventPage;