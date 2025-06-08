import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Upload, Trash2, User, Search, X, Check, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

// Types and constants moved to separate files
import { 
  Speaker, 
  FestivalProgramItem, 
  Event,
  eventTypes,
  paymentTypes,
  languages,
  ageCategories,
  currencies,
  statuses,
  TITLE_MAX_LENGTH,
  SHORT_DESC_MAX_LENGTH,
  DESC_MAX_LENGTH
} from './eventConstants';
import { 
  isValidUrl, 
  isValidTime, 
  formatTimeForDatabase 
} from './eventUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CreateEditEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State management
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
    start_time: '10:00',
    end_time: '12:00',
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

  // Memoized derived data
  const selectedSpeakersData = useCallback(() => {
    return speakers.filter(speaker => selectedSpeakers.includes(speaker.id));
  }, [speakers, selectedSpeakers]);

  // Data fetching
  const fetchEvent = useCallback(async () => {
    if (!id || id === 'new') return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        let startTime = '10:00';
        let endTime = '12:00';

        if (data.start_time) {
          try {
            const startDate = new Date(data.start_time);
            if (!isNaN(startDate.getTime())) {
              startTime = startDate.toTimeString().slice(0, 5);
            }
          } catch (e) {
            console.warn('Invalid start_time format:', data.start_time);
          }
        }

        if (data.end_time) {
          try {
            const endDate = new Date(data.end_time);
            if (!isNaN(endDate.getTime())) {
              endTime = endDate.toTimeString().slice(0, 5);
            }
          } catch (e) {
            console.warn('Invalid end_time format:', data.end_time);
          }
        }

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
  }, [id, navigate]);

  const fetchSpeakers = useCallback(async () => {
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
  }, []);

  // Event handlers
  const handleDeleteEvent = useCallback(async () => {
    if (!id || id === 'new') return;
    
    if (!window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      return;
    }

    const toastId = toast.loading('Удаление мероприятия...');
    
    try {
      setLoading(true);
      
      const { data: existingSlots, error: slotSelectError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('slot_details->>event_id', id);

      if (slotSelectError) throw slotSelectError;

      if (existingSlots && existingSlots.length > 0) {
        const { error: slotError } = await supabase
          .from('time_slots_table')
          .delete()
          .eq('slot_details->>event_id', id);

        if (slotError) throw slotError;
        toast.update(toastId, { render: 'Временной слот удален', type: 'info', isLoading: false, autoClose: 3000 });
      }

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

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
  }, [id, formData, navigate]);

  const updateTimeSlots = useCallback(async (eventData: Event) => {
    try {
      const formattedStartTime = formatTimeForDatabase(eventData.start_time);
      const formattedEndTime = formatTimeForDatabase(eventData.end_time);

      if (!formattedStartTime || !formattedEndTime) {
        throw new Error('Invalid time format');
      }

      const startDateTime = new Date(`${eventData.date}T${formattedStartTime}`);
      const endDateTime = new Date(`${eventData.date}T${formattedEndTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date/time values');
      }

      const { data: existingSlots, error: slotError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('slot_details->>event_id', eventData.id);

      if (slotError) {
        throw slotError;
      }

      const existingSlot = existingSlots && existingSlots.length > 0 ? existingSlots[0] : null;

      const slotData = {
        date: eventData.date,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
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
        const { error: updateError } = await supabase
          .from('time_slots_table')
          .update(slotData)
          .eq('id', existingSlot.id);

        if (updateError) throw updateError;
        toast.info('Временной слот обновлен');
      } else {
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
  }, []);

  const validateForm = useCallback(() => {
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

    if (!isValidTime(formData.start_time)) {
      toast.error('Неверный формат времени начала');
      return false;
    }
    if (!isValidTime(formData.end_time)) {
      toast.error('Неверный формат времени окончания');
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
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const toastId = toast.loading(id === 'new' ? 'Создание мероприятия...' : 'Обновление мероприятия...');
    setLoading(true);

    try {
      const formattedStartTime = formatTimeForDatabase(formData.start_time);
      const formattedEndTime = formatTimeForDatabase(formData.end_time);

      if (!formattedStartTime || !formattedEndTime) {
        throw new Error('Invalid time format');
      }

      const startDateTime = new Date(`${formData.date}T${formattedStartTime}`);
      const endDateTime = new Date(`${formData.date}T${formattedEndTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date/time combination');
      }

      const festivalProgram = formData.festival_program?.map(item => {
        try {
          const startTime = new Date(item.start_time);
          const endTime = new Date(item.end_time);
          
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new Error('Invalid program item time');
          }
          
          return {
            ...item,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          };
        } catch (error) {
          console.error('Error processing program item:', item, error);
          throw new Error('Invalid program item time format');
        }
      }) || [];

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

      const { error } = await supabase
        .from('events')
        .upsert(dataToSave);

      if (error) throw error;

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
  }, [formData, id, navigate, selectedSpeakers, updateTimeSlots, usePaymentWidget, validateForm]);

  // Image handlers
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleCrop = useCallback(async () => {
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
  }, [cropper, formData.bg_image, formData.original_bg_image, imageFile]);

  // Festival program handlers
  const handleProgramImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleProgramCrop = useCallback(async () => {
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
  }, [currentProgramItem.image_url, programCropper, programImageFile]);

  const handleAddProgramItem = useCallback(() => {
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
        toast.success('Пункт программы обновлен');
      } else {
        newProgram.push(currentProgramItem);
        toast.success('Пункт программы добавлен');
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
  }, [currentProgramItem, editingProgramIndex]);

  const handleEditProgramItem = useCallback((index: number) => {
    const program = formData.festival_program || [];
    setCurrentProgramItem(program[index]);
    if (program[index].image_url) {
      setProgramPreviewUrl(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${program[index].image_url}`);
    }
    setEditingProgramIndex(index);
    setShowProgramForm(true);
    toast.info('Редактирование пункта программы');
  }, [formData.festival_program]);

  const handleDeleteProgramItem = useCallback(async (index: number) => {
    const program = formData.festival_program || [];
    const itemToDelete = program[index];
    
    if (!window.confirm('Вы уверены, что хотите удалить этот пункт программы?')) {
      return;
    }

    const toastId = toast.loading('Удаление пункта программы...');
    
    try {
      if (itemToDelete.image_url) {
        await supabase.storage
          .from('images')
          .remove([itemToDelete.image_url]);
        toast.update(toastId, { render: 'Изображение удалено', type: 'info', isLoading: false, autoClose: 3000 });
      }

      setFormData(prev => {
        const newProgram = [...(prev.festival_program || [])];
        newProgram.splice(index, 1);
        return {
          ...prev,
          festival_program: newProgram
        };
      });

      toast.update(toastId, { 
        render: 'Пункт программы удалён', 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });
    } catch (error) {
      console.error('Error deleting program item:', error);
      toast.update(toastId, { 
        render: 'Ошибка при удалении пункта программы', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  }, [formData.festival_program]);

  // UI helpers
  const toggleSpeaker = useCallback((speakerId: string) => {
    setSelectedSpeakers(prev => {
      if (prev.includes(speakerId)) {
        return prev.filter(id => id !== speakerId);
      }
      return [...prev, speakerId];
    });
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  }, []);

  const filteredSpeakers = useCallback(() => {
    return speakers.filter(speaker => {
      const searchLower = speakerSearchQuery.toLowerCase();
      return (
        speaker.name.toLowerCase().includes(searchLower) ||
        speaker.field_of_expertise.toLowerCase().includes(searchLower)
      );
    });
  }, [speakerSearchQuery, speakers]);

  // Effects
  useEffect(() => {
    const initializeEvent = async () => {
      if (id && id !== 'new') {
        await fetchEvent();
      }
    };

    initializeEvent();
    fetchSpeakers();
  }, [id, fetchEvent, fetchSpeakers]);

  // Render
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
          
          {/* ... остальная часть формы остается без изменений ... */}
          
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