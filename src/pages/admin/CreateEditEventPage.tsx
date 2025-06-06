import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Upload, Trash2, User, Search, X, Check, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY 
);

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
}

interface FestivalProgramItem {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
}

type Event = {
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
  currency: string;
  status: string;
  max_registrations: number | null;
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
};

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

const TITLE_MAX_LENGTH = 50;
const SHORT_DESC_MAX_LENGTH = 150;
const DESC_MAX_LENGTH = 800;

const CreateEditEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropper, setCropper] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [speakerSearchQuery, setSpeakerSearchQuery] = useState('');
  const [usePaymentWidget, setUsePaymentWidget] = useState(false);

  // Festival program states
  const [editingProgramIndex, setEditingProgramIndex] = useState<number | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [currentProgramItem, setCurrentProgramItem] = useState<FestivalProgramItem>({
    title: '',
    description: '',
    image_url: '',
    start_time: '',
    end_time: '',
    lecturer_id: ''
  });
  const [programImageFile, setProgramImageFile] = useState<File | null>(null);
  const [programCropper, setProgramCropper] = useState<any>(null);
  const [showProgramCropper, setShowProgramCropper] = useState(false);
  const [programPreviewUrl, setProgramPreviewUrl] = useState<string | null>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Event>({
    id: crypto.randomUUID(),
    title: '',
    short_description: '',
    description: '',
    event_type: eventTypes[0],
    bg_image: null,
    original_bg_image: null,
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    location: 'Science Hub',
    age_category: ageCategories[0],
    price: null,
    currency: currencies[0],
    status: 'draft',
    max_registrations: 40,
    payment_type: paymentTypes[0],
    languages: [languages[0]],
    speakers: [],
    hide_speakers_gallery: true,
    couple_discount: '',
    child_half_price: false,
    payment_link: '',
    payment_widget_id: '',
    widget_chooser: false,
    video_url: '',
    photo_gallery: '',
    festival_program: []
  });

  const selectedSpeakersData = speakers.filter(speaker => 
    selectedSpeakers.includes(speaker.id)
  );

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const updateTimeSlots = async (eventData: Event) => {
    try {
      const startDateTime = new Date(`${eventData.date}T${eventData.start_time}:00`);
      const endDateTime = new Date(`${eventData.date}T${eventData.end_time}:00`);

      // Check if slot already exists
      const { data: existingSlot, error: slotError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('slot_details->>event_id', eventData.id)
        .single();

      if (slotError && slotError.code !== 'PGRST116') { // PGRST116 - no rows found
        throw slotError;
      }

      const slotData = {
        date: eventData.date,
        start_time: startDateTime.toTimeString().slice(0, 8),
        end_time: endDateTime.toTimeString().slice(0, 8),
        slot_details: {
          event_id: eventData.id,
          event_title: eventData.title,
          event_type: eventData.event_type,
          location: eventData.location,
          max_registrations: eventData.max_registrations,
          current_registrations: 0,
          speakers: eventData.speakers || []
        }
      };

      if (existingSlot) {
        // Update existing slot
        const { error: updateError } = await supabase
          .from('time_slots_table')
          .update(slotData)
          .eq('id', existingSlot.id);

        if (updateError) throw updateError;
        toast.info('Временной слот обновлен');
      } else {
        // Create new slot
        const { error: insertError } = await supabase
          .from('time_slots_table')
          .insert(slotData);

        if (insertError) throw insertError;
        toast.info('Создан новый временной слот');
      }
    } catch (error) {
      console.error('Error updating time slots:', error);
      toast.error('Ошибка при обновлении временных слотов');
      throw error;
    }
  };

  useEffect(() => {
    const initializeEvent = async () => {
      if (id && id !== 'new') {
        await fetchEvent();
      }
    };

    initializeEvent();
    fetchSpeakers();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        const startTime = data.start_time ? new Date(data.start_time).toTimeString().slice(0, 5) : '';
        const endTime = data.end_time ? new Date(data.end_time).toTimeString().slice(0, 5) : '';

        setFormData({
          ...data,
          short_description: data.short_description || '',
          start_time: startTime,
          end_time: endTime,
          festival_program: data.festival_program || [],
          payment_widget_id: data.payment_widget_id || '',
          widget_chooser: data.widget_chooser || false
        });
        
        setSelectedSpeakers(data.speakers || []);
        setUsePaymentWidget(data.widget_chooser || false);
        
        if (data.bg_image) {
          setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${data.bg_image}`);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Ошибка при загрузке мероприятия');
      navigate('/admin/events');
    }
  };

  const fetchSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakersError('Failed to load speakers');
      toast.error('Ошибка при загрузке спикеров');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id || id === 'new') return;
    
    if (!window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      return;
    }

    const toastId = toast.loading('Удаление мероприятия...');
    
    try {
      setLoading(true);
      
      // Delete time slot first
      const { error: slotError } = await supabase
        .from('time_slots_table')
        .delete()
        .eq('slot_details->>event_id', id);

      if (slotError) throw slotError;
      toast.update(toastId, { render: 'Временной слот удален', type: 'info', isLoading: false, autoClose: 3000 });

      // Delete program images
      if (formData.festival_program && formData.festival_program.length > 0) {
        const imagesToDelete = formData.festival_program
          .map(item => item.image_url)
          .filter(url => url) as string[];
        
        if (imagesToDelete.length > 0) {
          await supabase.storage
            .from('images')
            .remove(imagesToDelete);
          toast.update(toastId, { render: 'Изображения программы удалены', type: 'info', isLoading: false, autoClose: 3000 });
        }
      }

      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete event images
      if (formData.bg_image) {
        await supabase.storage
          .from('images')
          .remove([formData.bg_image]);
      }
      if (formData.original_bg_image) {
        await supabase.storage
          .from('images')
          .remove([formData.original_bg_image]);
      }

      toast.update(toastId, { 
        render: 'Мероприятие успешно удалено', 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });
      navigate('/admin/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.update(toastId, { 
        render: 'Ошибка при удалении мероприятия', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Введите название мероприятия');
      return false;
    }
    
    if (formData.title.length > TITLE_MAX_LENGTH) {
      toast.error(`Название слишком длинное. Уменьшите на ${formData.title.length - TITLE_MAX_LENGTH} символов`);
      return false;
    }
  
    if (!formData.description.trim()) {
      toast.error('Введите описание мероприятия');
      return false;
    }
  
    if (formData.description.length > DESC_MAX_LENGTH) {
      toast.error(`Описание слишком длинное. Уменьшите на ${formData.description.length - DESC_MAX_LENGTH} символов`);
      return false;
    }
  
    if (formData.short_description.length > SHORT_DESC_MAX_LENGTH) {
      toast.error(`Короткое описание слишком длинное. Уменьшите на ${formData.short_description.length - SHORT_DESC_MAX_LENGTH} символов`);
      return false;
    }
    if (!formData.date) {
      toast.error('Выберите дату мероприятия');
      return false;
    }
    if (!formData.start_time || !formData.end_time) {
      toast.error('Укажите время начала и окончания');
      return false;
    }
    if (!formData.location.trim()) {
      toast.error('Укажите место проведения');
      return false;
    }

    if (formData.payment_type === 'cost') {
      if (formData.payment_link && !isValidUrl(formData.payment_link)) {
        toast.error('Неверный формат ссылки для оплаты');
        return false;
      }
    }

    if (formData.video_url && !isValidUrl(formData.video_url)) {
      toast.error('Неверный формат ссылки на видео');
      return false;
    }
    if (formData.photo_gallery && !isValidUrl(formData.photo_gallery)) {
      toast.error('Неверный формат ссылки на фотогалерею');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const toastId = toast.loading(id === 'new' ? 'Создание мероприятия...' : 'Обновление мероприятия...');
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.end_time}:00`);

      // Convert program item times to ISO format
      const festivalProgram = formData.festival_program?.map(item => ({
        ...item,
        start_time: new Date(item.start_time).toISOString(),
        end_time: new Date(item.end_time).toISOString()
      })) || [];

      const dataToSave = {
        ...formData,
        speakers: selectedSpeakers,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        festival_program: festivalProgram,
        widget_chooser: usePaymentWidget,
        payment_link: formData.payment_link,
        payment_widget_id: formData.payment_widget_id
      };

      // Save event
      const { error } = await supabase
        .from('events')
        .upsert(dataToSave);

      if (error) throw error;

      // Update time slots
      await updateTimeSlots(dataToSave);

      toast.update(toastId, { 
        render: id === 'new' ? 'Мероприятие создано' : 'Мероприятие обновлено', 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.update(toastId, { 
        render: 'Ошибка при сохранении мероприятия', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    } finally {
      setLoading(false);
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
      const croppedCanvas = cropper.getCroppedCanvas({
        width: 1200,
        height: 400
      });

      if (!croppedCanvas) {
        throw new Error('Cropping failed');
      }

      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg'
      });

      const timestamp = Date.now();
      const fileExt = 'jpg';
      
      const originalPath = `events/original_${timestamp}.${fileExt}`;
      const croppedPath = `events/cropped_${timestamp}.${fileExt}`;

      const { error: originalError } = await supabase.storage
        .from('images')
        .upload(originalPath, imageFile);

      if (originalError) throw originalError;

      const { error: croppedError } = await supabase.storage
        .from('images')
        .upload(croppedPath, croppedFile);

      if (croppedError) throw croppedError;

      if (formData.bg_image) {
        await supabase.storage
          .from('images')
          .remove([formData.bg_image]);
      }
      if (formData.original_bg_image) {
        await supabase.storage
          .from('images')
          .remove([formData.original_bg_image]);
      }

      setFormData(prev => ({
        ...prev,
        original_bg_image: originalPath,
        bg_image: croppedPath
      }));

      setPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${croppedPath}`);
      setShowCropper(false);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Ошибка при загрузке изображений');
    }
  };

  const handleProgramImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const compressedFile = await imageCompression(file, {
        maxWidthOrHeight: 2000,
        useWebWorker: true
      });
  
      setProgramImageFile(compressedFile);
      setShowProgramCropper(true);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Ошибка при обработке изображения');
    }
  };

  const handleProgramCrop = async () => {
    if (!programCropper || !programImageFile) return;

    try {
      const croppedCanvas = programCropper.getCroppedCanvas({
        width: 400,
        height: 500,
        minWidth: 400,
        minHeight: 500,
        maxWidth: 400,
        maxHeight: 500
      });

      if (!croppedCanvas) {
        throw new Error('Cropping failed');
      }

      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      const croppedFile = new File([croppedBlob], programImageFile.name, {
        type: 'image/jpeg'
      });

      const timestamp = Date.now();
      const fileExt = 'jpg';
      const path = `festival_program/program_${timestamp}.${fileExt}`;

      const { error } = await supabase.storage
        .from('images')
        .upload(path, croppedFile);

      if (error) throw error;

      if (currentProgramItem.image_url) {
        await supabase.storage
          .from('images')
          .remove([currentProgramItem.image_url]);
      }

      setCurrentProgramItem(prev => ({
        ...prev,
        image_url: path
      }));

      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${path}`);
      setShowProgramCropper(false);
      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading program image:', error);
      toast.error('Ошибка при загрузке изображения программы');
    }
  };

  const handleAddProgramItem = () => {
    if (!currentProgramItem.title) {
      toast.error('Введите название пункта программы');
      return;
    }
    if (!currentProgramItem.description) {
      toast.error('Введите описание пункта программы');
      return;
    }
    if (!currentProgramItem.start_time || !currentProgramItem.end_time) {
      toast.error('Укажите время начала и окончания');
      return;
    }

    setFormData(prev => {
      const program = prev.festival_program || [];
      const newProgram = [...program];
      
      if (editingProgramIndex !== null) {
        newProgram[editingProgramIndex] = currentProgramItem;
      } else {
        newProgram.push(currentProgramItem);
      }

      // Add speaker to main speakers list if not already present
      if (currentProgramItem.lecturer_id && !selectedSpeakers.includes(currentProgramItem.lecturer_id)) {
        setSelectedSpeakers(prev => [...prev, currentProgramItem.lecturer_id]);
      }

      return {
        ...prev,
        festival_program: newProgram
      };
    });

    // Reset form
    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setProgramPreviewUrl(null);
    setEditingProgramIndex(null);
    setShowProgramForm(false);
    if (programFileInputRef.current) {
      programFileInputRef.current.value = '';
    }
  };

  const handleEditProgramItem = (index: number) => {
    const program = formData.festival_program || [];
    setCurrentProgramItem(program[index]);
    if (program[index].image_url) {
      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${program[index].image_url}`);
    }
    setEditingProgramIndex(index);
    setShowProgramForm(true);
  };

  const handleDeleteProgramItem = async (index: number) => {
    const program = formData.festival_program || [];
    const itemToDelete = program[index];
    
    if (!confirm('Вы уверены, что хотите удалить этот пункт программы?')) {
      return;
    }

    try {
      // Delete image from storage if exists
      if (itemToDelete.image_url) {
        await supabase.storage
          .from('images')
          .remove([itemToDelete.image_url]);
      }

      setFormData(prev => {
        const newProgram = [...(prev.festival_program || [])];
        newProgram.splice(index, 1);
        return {
          ...prev,
          festival_program: newProgram
        };
      });

      toast.success('Пункт программы удалён');
    } catch (error) {
      console.error('Error deleting program item:', error);
      toast.error('Ошибка при удалении пункта программы');
    }
  };

  const toggleSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => {
      if (prev.includes(speakerId)) {
        return prev.filter(id => id !== speakerId);
      }
      return [...prev, speakerId];
    });
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const filteredSpeakers = speakers.filter(speaker => {
    const searchLower = speakerSearchQuery.toLowerCase();
    return (
      speaker.name.toLowerCase().includes(searchLower) ||
      speaker.field_of_expertise.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-semibold">
            {id === 'new' ? 'Создание мероприятия' : 'Редактирование мероприятия'}
          </h2>
        </div>
        {id && id !== 'new' && (
          <button
            onClick={handleDeleteEvent}
            className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            disabled={loading}
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
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      bg_image: null,
                      original_bg_image: null
                    }));
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
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
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                value={formData.max_registrations || ''}
                onChange={(e) => setFormData({ ...formData, max_registrations: parseInt(e.target.value) || null })}
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
                value={formData.age_category}
                onChange={(e) => setFormData({ ...formData, age_category: e.target.value })}
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
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
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
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || null })}
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
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                  value={formData.couple_discount || ''}
                  onChange={(e) => setFormData({ ...formData, couple_discount: e.target.value })}
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

              <div className="form-group">
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
                      value={formData.payment_link || ''}
                      onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
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
                      value={formData.payment_widget_id || ''}
                      onChange={(e) => setFormData({ ...formData, payment_widget_id: e.target.value })}
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
                value={formData.video_url || ''}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="form-input"
                placeholder="https://"
              />
            </div>

            <div className="form-group">
              <label htmlFor="photo_gallery" className="block font-medium mb-2">
                Ссылка на фотогалерею
              </label>
              <input
                type="url"
                id="photo_gallery"
                value={formData.photo_gallery || ''}
                onChange={(e) => setFormData({ ...formData, photo_gallery: e.target.value })}
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
                        {speaker.photos?.[0]?.url ? (
                          <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                            <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
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

                {speakersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : speakersError ? (
                  <div className="text-center py-4 text-red-600">
                    {speakersError}
                  </div>
                ) : filteredSpeakers.length === 0 ? (
                  <div className="text-center py-4 text-dark-500">
                    {speakerSearchQuery ? 'Спикеры не найдены' : 'Нет доступных спикеров'}
                  </div>
                ) : (
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
                            {speaker.photos?.[0]?.url ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[0].url}`}
                                alt={speaker.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-dark-600">
                                <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
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
                )}
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
                    setCurrentProgramItem({
                      title: '',
                      description: '',
                      image_url: '',
                      start_time: '',
                      end_time: '',
                      lecturer_id: ''
                    });
                    setProgramPreviewUrl(null);
                    setEditingProgramIndex(null);
                    setShowProgramForm(true);
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Добавить пункт программы
                </button>
              </div>

              {/* Current program items list */}
              <div className="space-y-4 mb-6">
                {(formData.festival_program || []).map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-dark-400">{item.description}</p>
                      <div className="text-xs mt-2">
                        <span>{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span> - </span>
                        <span>{new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProgramItem(index)}
                        className="p-1 text-gray-500 hover:text-primary-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
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
              {showProgramForm && (
                <div className="border rounded-lg p-6 space-y-4">
                  <h4 className="font-medium">
                    {editingProgramIndex !== null ? 'Редактирование пункта программы' : 'Добавление пункта программы'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Название</label>
                      <input
                        type="text"
                        value={currentProgramItem.title}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, title: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Спикер</label>
                      <select
                        value={currentProgramItem.lecturer_id}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, lecturer_id: e.target.value})}
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
                      value={currentProgramItem.description}
                      onChange={(e) => setCurrentProgramItem({...currentProgramItem, description: e.target.value})}
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block font-medium mb-2">Время начала</label>
                      <input
                        type="datetime-local"
                        value={currentProgramItem.start_time}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, start_time: e.target.value})}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="block font-medium mb-2">Время окончания</label>
                      <input
                        type="datetime-local"
                        value={currentProgramItem.end_time}
                        onChange={(e) => setCurrentProgramItem({...currentProgramItem, end_time: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block font-medium mb-2">Изображение</label>

                    {showProgramCropper && programImageFile ? (
                      <div className="space-y-4">
                        <div className="relative" style={{ height: '70vh', width: '100%' }}>
                          <Cropper
                            src={URL.createObjectURL(programImageFile)}
                            style={{ height: '100%', width: '100%' }}
                            aspectRatio={4/5}
                            viewMode={1}
                            autoCropArea={0.8}
                            movable={true}
                            zoomable={true}
                            cropBoxMovable={true}
                            cropBoxResizable={true}
                            guides={true}
                            minContainerWidth={300}
                            minContainerHeight={375}
                            onInitialized={(instance) => {
                              setProgramCropper(instance);
                              instance.crop();
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button
                            type="button"
                            onClick={() => setShowProgramCropper(false)}
                            className="btn-outline"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={handleProgramCrop}
                            className="btn-primary"
                          >
                            Обрезать и сохранить
                          </button>
                        </div>
                      </div>
                    ) : programPreviewUrl ? (
                      <div className="relative">
                        <img
                          src={programPreviewUrl}
                          alt="Preview"
                          className="w-full max-w-[400px] aspect-[4/5] object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentProgramItem({...currentProgramItem, image_url: ''});
                            setProgramPreviewUrl(null);
                            if (programFileInputRef.current) {
                              programFileInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 text-center">
                        <input
                          ref={programFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProgramImageSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => programFileInputRef.current?.click()}
                          className="btn-outline inline-flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Загрузить изображение
                        </button>
                        <p className="mt-2 text-xs text-dark-500">
                          Рекомендуемый размер: изображение в пропорции 4:5 (например, 400×500px)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProgramForm(false)}
                      className="btn-outline mr-4"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProgramItem}
                      className="btn-primary"
                    >
                      {editingProgramIndex !== null ? 'Обновить пункт' : 'Добавить пункт'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-dark-700">
            {id && id !== 'new' && (
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                disabled={loading}
              >
                <Trash2 className="h-5 w-5" />
                Удалить мероприятие
              </button>
            )}
            <div className="flex gap-4 ml-auto">
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
                {loading ? 'Сохранение...' : 'Сохранить'} 
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditEventPage;