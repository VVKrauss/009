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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type AboutData = {
  id?: number;
  project_info: string;
  team_members: Array<{
    name: string;
    role: string;
    photo: string;
  }>;
  contributors: Array<{
    name: string;
    photo: string;
  }>;
  support_platforms: Array<{
    url: string;
    platform: string;
  }>;
  contact_info: {
    email: string;
    phone: string;
    address: string;
  };
};

const defaultAboutData: AboutData = {
  project_info: '',
  team_members: [],
  contributors: [],
  support_platforms: [],
  contact_info: {
    email: '',
    phone: '',
    address: ''
  }
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <div className="absolute inset-0 w-8 h-8 border-2 border-primary-200 dark:border-primary-800 rounded-full"></div>
    </div>
    <span className="ml-3 text-gray-600 dark:text-gray-300 font-medium">Загрузка данных...</span>
  </div>
);

const AdminAbout = () => {
  const [aboutData, setAboutData] = useState<AboutData>(defaultAboutData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ type: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('about_table')
        .select('*')
        .eq('id', 7)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Если записи нет, создаем новую с id = 7
          const { data: newData, error: insertError } = await supabase
            .from('about_table')
            .insert([{ ...defaultAboutData, id: 7 }])
            .select()
            .single();

          if (insertError) throw insertError;
          
          setAboutData(newData || { ...defaultAboutData, id: 7 });
        } else {
          throw error;
        }
      } else if (data) {
        setAboutData(data);
      }
    } catch (err) {
      console.error('Error fetching about data:', err);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Всегда обновляем запись с id = 7
      const { error } = await supabase
        .from('about_table')
        .upsert({ ...aboutData, id: 7 });

      if (error) throw error;

      toast.success('Данные успешно сохранены');
    } catch (err) {
      console.error('Error saving about data:', err);
      toast.error('Ошибка при сохранении данных');
    } finally {
      setSaving(false);
    }
  };

  const triggerFileInput = (type: 'team' | 'contributor', index: number) => {
    setUploading({ type, index });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !uploading) return;

    const file = e.target.files[0];
    const { type, index } = uploading;

    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${fileExt}`;
      const filePath = `about/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(filePath);

      if (type === 'team') {
        const newTeamMembers = [...aboutData.team_members];
        newTeamMembers[index].photo = publicUrl;
        setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
      } else if (type === 'contributor') {
        const newContributors = [...aboutData.contributors];
        newContributors[index].photo = publicUrl;
        setAboutData(prev => ({ ...prev, contributors: newContributors }));
      }

      toast.success('Изображение успешно загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка при загрузке изображения');
    } finally {
      setUploading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addTeamMember = () => {
    setAboutData(prev => ({
      ...prev,
      team_members: [
        ...prev.team_members,
        { name: '', role: '', photo: '' }
      ]
    }));
  };

  const addContributor = () => {
    setAboutData(prev => ({
      ...prev,
      contributors: [
        ...prev.contributors,
        { name: '', photo: '' }
      ]
    }));
  };

  const addSupportPlatform = () => {
    setAboutData(prev => ({
      ...prev,
      support_platforms: [
        ...prev.support_platforms,
        { platform: '', url: '' }
      ]
    }));
  };

  const removeTeamMember = (index: number) => {
    setAboutData(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index)
    }));
  };

  const removeContributor = (index: number) => {
    setAboutData(prev => ({
      ...prev,
      contributors: prev.contributors.filter((_, i) => i !== index)
    }));
  };

  const removeSupportPlatform = (index: number) => {
    setAboutData(prev => ({
      ...prev,
      support_platforms: prev.support_platforms.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800 py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800 py-8 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-4 font-heading">
            О проекте
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Управляйте информацией о проекте, команде и контактах
          </p>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-heading"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>

        <div className="space-y-8">
          {/* Project Info */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl mr-4">
                <Info className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Информация о проекте</h2>
                <p className="text-gray-500 dark:text-gray-400">Основное описание вашего проекта</p>
              </div>
            </div>
            <textarea
              value={aboutData.project_info}
              onChange={(e) => setAboutData(prev => ({ ...prev, project_info: e.target.value }))}
              className="w-full min-h-[200px] p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200 resize-none"
              placeholder="Расскажите о вашем проекте, его целях и задачах..."
            />
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl mr-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Команда проекта</h2>
                  <p className="text-gray-500 dark:text-gray-400">Участники основной команды</p>
                </div>
              </div>
              <button
                onClick={addTeamMember}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-heading"
              >
                <Plus className="w-5 h-5" />
                Добавить участника
              </button>
            </div>
            
            <div className="space-y-6">
              {aboutData.team_members.map((member, index) => (
                <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Имя</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const newTeamMembers = [...aboutData.team_members];
                            newTeamMembers[index].name = e.target.value;
                            setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                          }}
                          className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                          placeholder="Введите имя"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Должность</label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => {
                            const newTeamMembers = [...aboutData.team_members];
                            newTeamMembers[index].role = e.target.value;
                            setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                          }}
                          className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                          placeholder="Введите должность"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Фотография</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={member.photo}
                            onChange={(e) => {
                              const newTeamMembers = [...aboutData.team_members];
                              newTeamMembers[index].photo = e.target.value;
                              setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                            }}
                            className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                            placeholder="URL фотографии"
                          />
                          <button
                            type="button"
                            onClick={() => triggerFileInput('team', index)}
                            className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                            title="Загрузить изображение"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {member.photo && (
                        <div>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Предпросмотр:</div>
                          <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden">
                            <img 
                              src={member.photo} 
                              alt={`Preview ${member.name}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {aboutData.team_members.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Команда пуста</h3>
                  <p className="text-gray-500 dark:text-gray-400">Добавьте участников команды</p>
                </div>
              )}
            </div>
          </div>

          {/* Contributors */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl mr-4">
                  <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Контрибьюторы</h2>
                  <p className="text-gray-500 dark:text-gray-400">Люди, внесшие вклад в проект</p>
                </div>
              </div>
              <button
                onClick={addContributor}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-heading"
              >
                <Plus className="w-5 h-5" />
                Добавить контрибьютора
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aboutData.contributors.map((contributor, index) => (
                <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => removeContributor(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Имя</label>
                      <input
                        type="text"
                        value={contributor.name}
                        onChange={(e) => {
                          const newContributors = [...aboutData.contributors];
                          newContributors[index].name = e.target.value;
                          setAboutData(prev => ({ ...prev, contributors: newContributors }));
                        }}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        placeholder="Введите имя"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Фотография</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={contributor.photo}
                          onChange={(e) => {
                            const newContributors = [...aboutData.contributors];
                            newContributors[index].photo = e.target.value;
                            setAboutData(prev => ({ ...prev, contributors: newContributors }));
                          }}
                          className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                          placeholder="URL фотографии"
                        />
                        <button
                          type="button"
                          onClick={() => triggerFileInput('contributor', index)}
                          className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all duration-200"
                          title="Загрузить изображение"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {contributor.photo && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Предпросмотр:</div>
                        <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl overflow-hidden">
                          <img 
                            src={contributor.photo} 
                            alt={`Preview ${contributor.name}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {aboutData.contributors.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Нет контрибьюторов</h3>
                <p className="text-gray-500 dark:text-gray-400">Добавьте людей, внесших вклад в проект</p>
              </div>
            )}
          </div>

          {/* Support Platforms */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl mr-4">
                  <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">Платформы поддержки</h2>
                  <p className="text-gray-500 dark:text-gray-400">Способы поддержать проект</p>
                </div>
              </div>
              <button
                onClick={addSupportPlatform}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-heading"
              >
                <Plus className="w-5 h-5" />
                Добавить платформу
              </button>
            </div>
            
            <div className="space-y-4">
              {aboutData.support_platforms.map((platform, index) => (
                <div key={index} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => removeSupportPlatform(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Название платформы</label>
                      <input
                        type="text"
                        value={platform.platform}
                        onChange={(e) => {
                          const newPlatforms = [...aboutData.support_platforms];
                          newPlatforms[index].platform = e.target.value;
                          setAboutData(prev => ({ ...prev, support_platforms: newPlatforms }));
                        }}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        placeholder="Patreon, Ko-fi, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL</label>
                      <input
                        type="url"
                        value={platform.url}
                        onChange={(e) => {
                          const newPlatforms = [...aboutData.support_platforms];
                          newPlatforms[index].url = e.target.value;
                          setAboutData(prev => ({ ...prev, support_platforms: newPlatforms }));
                        }}
                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all duration-200"
                        placeholder="https://..."
                      />