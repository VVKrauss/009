import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  Eye, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Heart,
  Info,
  Link,
  Loader2
} from 'lucide-react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type PriceItem = {
  id: string;
  name: string;
  price: number;
  duration: string; // 'hour', 'day', 'week', 'month'
  description?: string;
};

type RentInfoSettings = {
  id: number;
  title: string;
  description: string | null;
  photos: string[] | null;
  pricelist: PriceItem[];
  contacts: {
    address: string;
    phone: string;
    email: string;
    map_link: string;
  } | null;
};

const AdminRent = () => {
  const [data, setData] = useState<RentInfoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<RentInfoSettings>>({});
  const [newPriceItem, setNewPriceItem] = useState<Omit<PriceItem, 'id'>>({
    name: '',
    price: 0,
    duration: 'hour',
    description: ''
  });
  
  // Photo management states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const cropperRef = useRef<Cropper>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rent_info_settings')
        .select('*')
        .single();

      if (error) throw error;
      setData(data);
      setEditData(data || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('rent_info_settings')
        .update(editData)
        .eq('id', data?.id);

      if (error) throw error;
      await fetchSettings();
      setIsEditing(false);
      showNotification('success', 'Настройки успешно сохранены');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Ошибка при сохранении');
      showNotification('error', 'Ошибка при сохранении настроек');
    }
  };

  const handleAddPriceItem = () => {
    if (!newPriceItem.name || newPriceItem.price <= 0) return;
    
    const updatedPricelist = [
      ...(editData.pricelist || []),
      {
        ...newPriceItem,
        id: Date.now().toString()
      }
    ];

    setEditData(prev => ({
      ...prev,
      pricelist: updatedPricelist
    }));

    setNewPriceItem({
      name: '',
      price: 0,
      duration: 'hour',
      description: ''
    });
  };

  const handleRemovePriceItem = (id: string) => {
    const updatedPricelist = (editData.pricelist || []).filter(item => item.id !== id);
    setEditData(prev => ({
      ...prev,
      pricelist: updatedPricelist
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleContactsChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setEditData(prev => ({
      ...prev,
      contacts: {
        ...(prev.contacts || {}),
        [field]: e.target.value
      }
    }));
  };

  const handlePriceItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    setNewPriceItem(prev => ({
      ...prev,
      [field]: field === 'price' ? Number(e.target.value) : e.target.value
    }));
  };

  // Photo management functions
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Файл слишком большой. Максимальный размер 5MB.');
        return;
      }
      
      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
      setCroppedImage(croppedCanvas.toDataURL('image/jpeg', 0.8)); // 0.8 quality for JPEG
    }
  };

  const uploadPhoto = async () => {
    if (!croppedImage || !selectedFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Convert data URL to Blob
      const blob = await fetch(croppedImage).then(res => res.blob());
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const filename = `rent_${timestamp}.${fileExt}`;
      const filePath = `rent_photos/${filename}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      // Update photos array
      const updatedPhotos = [...(editData.photos || []), publicUrlData.publicUrl];
      setEditData(prev => ({
        ...prev,
        photos: updatedPhotos
      }));
      
      showNotification('success', 'Фото успешно загружено');
      resetPhotoUpload();
    } catch (err) {
      console.error('Error uploading photo:', err);
      showNotification('error', 'Ошибка при загрузке фото');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      // Extract filename from URL
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const filePath = `rent_photos/${filename}`;
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([filePath]);
      
      if (deleteError) throw deleteError;
      
      // Update photos array
      const updatedPhotos = (editData.photos || []).filter(url => url !== photoUrl);
      setEditData(prev => ({
        ...prev,
        photos: updatedPhotos
      }));
      
      showNotification('success', 'Фото успешно удалено');
    } catch (err) {
      console.error('Error deleting photo:', err);
      showNotification('error', 'Ошибка при удалении фото');
    }
  };

  const resetPhotoUpload = () => {
    setSelectedFile(null);
    setCroppedImage(null);
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 dark:bg-dark-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-yellow-600 dark:text-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          Настройки аренды не найдены. Создайте новую запись.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Управление страницей аренды
        </h2>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            >
              <X size={18} />
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Save size={18} />
              Сохранить
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Edit size={18} />
            Редактировать
          </button>
        )}
      </div>
      
      {/* Main Settings Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Основные настройки</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Заголовок страницы</label>
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => handleChange(e, 'title')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Описание страницы</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => handleChange(e, 'description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
      
      {/* Photo Gallery Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Фотогалерея</h3>
        </div>
        
        <div className="p-6">
          {isEditing && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700/30 rounded-lg border border-gray-200 dark:border-dark-700">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Добавить фото</h4>
              
              {showCropper ? (
                <div className="space-y-4">
                  <div className="h-64 w-full relative">
                    <Cropper
                      src={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                      style={{ height: '100%', width: '100%' }}
                      initialAspectRatio={16 / 9}
                      guides={true}
                      ref={cropperRef}
                      crop={handleCropComplete}
                      viewMode={1}
                      minCropBoxHeight={100}
                      minCropBoxWidth={100}
                      responsive={true}
                      autoCropArea={1}
                      checkOrientation={false}
                    />
                  </div>
                  
                  {croppedImage && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Предпросмотр:</h5>
                      <img 
                        src={croppedImage} 
                        alt="Cropped preview" 
                        className="max-h-40 border border-gray-200 dark:border-dark-700 rounded"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={resetPhotoUpload}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <X size={18} />
                      Отмена
                    </button>
                    <button
                      onClick={uploadPhoto}
                      disabled={isUploading || !croppedImage}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <span>Загрузка... {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Загрузить фото
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-lg">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="p-4 bg-gray-100 dark:bg-dark-700 rounded-full mb-3">
                      <ImageIcon size={24} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        Нажмите для загрузки
                      </span>{' '}
                      или перетащите фото сюда
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      JPG, PNG (максимум 5MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Текущие фото</h4>
            {(editData.photos && editData.photos.length > 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {editData.photos.map((photoUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photoUrl}
                      alt={`Rent photo ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-dark-700"
                    />
                    {isEditing && (
                      <button
                        onClick={() => deletePhoto(photoUrl)}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить фото"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-3 text-gray-300 dark:text-dark-600" />
                <p>Нет загруженных фотографий</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Price List Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Варианты аренды</h3>
        </div>
        
        <div className="p-6">
          {isEditing && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-700/30 rounded-lg border border-gray-200 dark:border-dark-700">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Добавить вариант</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Название</label>
                  <input
                    type="text"
                    value={newPriceItem.name}
                    onChange={(e) => handlePriceItemChange(e, 'name')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
                    placeholder="Например: Стандартный зал"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Цена (₽)</label>
                  <input
                    type="number"
                    value={newPriceItem.price}
                    onChange={(e) => handlePriceItemChange(e, 'price')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Период</label>
                  <select
                    value={newPriceItem.duration}
                    onChange={(e) => handlePriceItemChange(e, 'duration')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
                  >
                    <option value="hour">Почасово</option>
                    <option value="day">Посуточно</option>
                    <option value="week">Понедельно</option>
                    <option value="month">Помесячно</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPriceItem}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    disabled={!newPriceItem.name || newPriceItem.price <= 0}
                  >
                    <Plus size={16} />
                    Добавить
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Описание (необязательно)</label>
                <input
                  type="text"
                  value={newPriceItem.description || ''}
                  onChange={(e) => handlePriceItemChange(e, 'description')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Название</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Цена</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Период</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Описание</th>
                  {isEditing && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                {(editData.pricelist || []).length === 0 ? (
                  <tr>
                    <td colSpan={isEditing ? 5 : 4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Нет вариантов аренды
                    </td>
                  </tr>
                ) : (
                  (editData.pricelist || []).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.price.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{
                          hour: 'Час',
                          day: 'День',
                          week: 'Неделя',
                          month: 'Месяц'
                        }[item.duration]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.description || '-'}
                      </td>
                      {isEditing && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemovePriceItem(item.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-600 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Contacts Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Контактная информация</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Адрес</label>
            <input
              type="text"
              value={editData.contacts?.address || ''}
              onChange={(e) => handleContactsChange(e, 'address')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Телефон</label>
            <input
              type="tel"
              value={editData.contacts?.phone || ''}
              onChange={(e) => handleContactsChange(e, 'phone')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={editData.contacts?.email || ''}
              onChange={(e) => handleContactsChange(e, 'email')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
              placeholder="example@mail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ссылка на карту</label>
            <input
              type="url"
              value={editData.contacts?.map_link || ''}
              onChange={(e) => handleContactsChange(e, 'map_link')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800"
              disabled={!isEditing}
              placeholder="https://yandex.ru/maps/..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRent;