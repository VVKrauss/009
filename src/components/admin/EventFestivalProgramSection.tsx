import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, X, Save, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { getSupabaseImageUrl } from '../../utils/imageUtils';
import { formatTimeFromTimestamp } from '../../utils/dateTimeUtils';

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
}

interface ProgramItem {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
}

interface EventFestivalProgramSectionProps {
  programItems: ProgramItem[];
  speakers: Speaker[];
  onProgramUpdate: (programItems: ProgramItem[]) => void;
}

const EventFestivalProgramSection = ({
  programItems = [],
  speakers = [],
  onProgramUpdate
}: EventFestivalProgramSectionProps) => {
  const [editingProgramIndex, setEditingProgramIndex] = useState<number | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [currentProgramItem, setCurrentProgramItem] = useState<ProgramItem>({
    title: '',
    description: '',
    image_url: '',
    start_time: '',
    end_time: '',
    lecturer_id: ''
  });
  
  // Image cropping states
  const [programImageFile, setProgramImageFile] = useState<File | null>(null);
  const [programCropper, setProgramCropper] = useState<Cropper | null>(null);
  const [showProgramCropper, setShowProgramCropper] = useState(false);
  const [programPreviewUrl, setProgramPreviewUrl] = useState<string | null>(null);
  const programFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProgramItem = () => {
    setEditingProgramIndex(null);
    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setShowProgramForm(true);
    setProgramPreviewUrl(null);
  };

  const handleEditProgramItem = (index: number) => {
    setEditingProgramIndex(index);
    setCurrentProgramItem(programItems[index]);
    setShowProgramForm(true);
    
    if (programItems[index].image_url) {
      setProgramPreviewUrl(getSupabaseImageUrl(programItems[index].image_url));
    } else {
      setProgramPreviewUrl(null);
    }
  };

  const handleDeleteProgramItem = (index: number) => {
    const updatedProgram = [...programItems];
    updatedProgram.splice(index, 1);
    onProgramUpdate(updatedProgram);
  };

  const handleProgramImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgramImageFile(file);
    setShowProgramCropper(true);
  };

  const handleProgramCrop = async () => {
    if (!programCropper || !programImageFile) return;

    try {
      const croppedCanvas = programCropper.getCroppedCanvas({
        width: 800,
        height: 400
      });

      if (!croppedCanvas) {
        throw new Error('Cropping failed');
      }

      const blob = await new Promise<Blob>((resolve) => {
        croppedCanvas.toBlob((b) => {
          if (b) resolve(b);
          else throw new Error('Failed to create blob');
        }, 'image/jpeg', 0.9);
      });

      const timestamp = Date.now();
      const fileExt = 'jpg';
      const filePath = `program-images/${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      setCurrentProgramItem({
        ...currentProgramItem,
        image_url: filePath
      });

      setProgramPreviewUrl(URL.createObjectURL(blob));
      setShowProgramCropper(false);
      setProgramImageFile(null);
    } catch (error) {
      console.error('Error uploading program image:', error);
      alert('Ошибка при загрузке изображения');
    }
  };

  const handleSaveProgramItem = () => {
    if (!currentProgramItem.title || !currentProgramItem.start_time || !currentProgramItem.end_time) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }

    const updatedProgram = [...programItems];
    
    if (editingProgramIndex !== null) {
      updatedProgram[editingProgramIndex] = currentProgramItem;
    } else {
      updatedProgram.push(currentProgramItem);
    }
    
    onProgramUpdate(updatedProgram);
    setShowProgramForm(false);
    setEditingProgramIndex(null);
    setCurrentProgramItem({
      title: '',
      description: '',
      image_url: '',
      start_time: '',
      end_time: '',
      lecturer_id: ''
    });
    setProgramPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Программа фестиваля</h3>
        <button
          type="button"
          onClick={handleAddProgramItem}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Добавить пункт программы
        </button>
      </div>

      {/* Program Items List */}
      {programItems.length > 0 ? (
        <div className="space-y-4">
          {programItems.map((item, index) => (
            <div 
              key={index}
              className="p-4 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {item.image_url && (
                  <div className="md:w-1/4">
                    <img
                      src={getSupabaseImageUrl(item.image_url)}
                      alt={item.title}
                      className="w-full h-auto rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x150?text=Image+Error';
                      }}
                    />
                  </div>
                )}
                
                <div className={`${item.image_url ? 'md:w-3/4' : 'w-full'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold">{item.title}</h4>
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
                        onClick={() => handleDeleteProgramItem(index)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTimeFromTimestamp(item.start_time)} - {formatTimeFromTimestamp(item.end_time)}
                      </span>
                    </div>
                    
                    {item.lecturer_id && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {speakers.find(s => s.id === item.lecturer_id)?.name || 'Неизвестный спикер'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                    {item.description || 'Нет описания'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-dark-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Нет пунктов программы. Добавьте первый пункт, нажав кнопку выше.
          </p>
        </div>
      )}

      {/* Program Item Form */}
      {showProgramForm && (
        <div className="p-6 border border-gray-200 dark:border-dark-600 rounded-lg bg-gray-50 dark:bg-dark-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">
              {editingProgramIndex !== null ? 'Редактировать пункт программы' : 'Добавить пункт программы'}
            </h4>
            <button
              type="button"
              onClick={() => setShowProgramForm(false)}
              className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="program-title" className="block font-medium mb-1">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="program-title"
                value={currentProgramItem.title}
                onChange={(e) => setCurrentProgramItem({
                  ...currentProgramItem,
                  title: e.target.value
                })}
                className="form-input"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="program-start-time" className="block font-medium mb-1">
                  Время начала <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="program-start-time"
                  value={currentProgramItem.start_time}
                  onChange={(e) => setCurrentProgramItem({
                    ...currentProgramItem,
                    start_time: e.target.value
                  })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="program-end-time" className="block font-medium mb-1">
                  Время окончания <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="program-end-time"
                  value={currentProgramItem.end_time}
                  onChange={(e) => setCurrentProgramItem({
                    ...currentProgramItem,
                    end_time: e.target.value
                  })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="program-description" className="block font-medium mb-1">
                Описание
              </label>
              <textarea
                id="program-description"
                value={currentProgramItem.description}
                onChange={(e) => setCurrentProgramItem({
                  ...currentProgramItem,
                  description: e.target.value
                })}
                rows={3}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="program-lecturer" className="block font-medium mb-1">
                Спикер
              </label>
              <select
                id="program-lecturer"
                value={currentProgramItem.lecturer_id}
                onChange={(e) => setCurrentProgramItem({
                  ...currentProgramItem,
                  lecturer_id: e.target.value
                })}
                className="form-input"
              >
                <option value="">Выберите спикера</option>
                {speakers.map(speaker => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.name} - {speaker.field_of_expertise}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block font-medium mb-1">
                Изображение
              </label>
              
              {showProgramCropper && programImageFile ? (
                <div className="space-y-4">
                  <Cropper
                    src={URL.createObjectURL(programImageFile)}
                    style={{ height: 400, width: '100%' }}
                    aspectRatio={2}
                    guides={true}
                    viewMode={1}
                    dragMode="move"
                    scalable={true}
                    cropBoxMovable={true}
                    cropBoxResizable={true}
                    onInitialized={(instance) => setProgramCropper(instance)}
                    className="max-w-full"
                  />
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProgramCropper(false);
                        setProgramImageFile(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleProgramCrop}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
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
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentProgramItem({
                        ...currentProgramItem,
                        image_url: ''
                      });
                      setProgramPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={programFileInputRef}
                    onChange={handleProgramImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => programFileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                  >
                    Выбрать изображение
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowProgramForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveProgramItem}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFestivalProgramSection;