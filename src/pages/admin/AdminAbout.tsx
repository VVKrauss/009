import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { Plus, X, ArrowUp, ArrowDown, Edit, Trash2, Image as ImageIcon, Save, Eye, Home, Clock, Users } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">О проекте</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>

        <div className="space-y-8">
          {/* Project Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Информация о проекте</h2>
            <textarea
              value={aboutData.project_info}
              onChange={(e) => setAboutData(prev => ({ ...prev, project_info: e.target.value }))}
              className="w-full min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Введите информацию о проекте..."
            />
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Команда проекта</h2>
              <button
                onClick={addTeamMember}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {aboutData.team_members.map((member, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => {
                        const newTeamMembers = [...aboutData.team_members];
                        newTeamMembers[index].name = e.target.value;
                        setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                      }}
                      className="form-input"
                      placeholder="Имя"
                    />
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => {
                        const newTeamMembers = [...aboutData.team_members];
                        newTeamMembers[index].role = e.target.value;
                        setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                      }}
                      className="form-input"
                      placeholder="Должность"
                    />
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={member.photo}
                        onChange={(e) => {
                          const newTeamMembers = [...aboutData.team_members];
                          newTeamMembers[index].photo = e.target.value;
                          setAboutData(prev => ({ ...prev, team_members: newTeamMembers }));
                        }}
                        className="form-input flex-grow"
                        placeholder="URL фотографии"
                      />
                      <button
                        type="button"
                        onClick={() => triggerFileInput('team', index)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        title="Загрузить изображение"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {member.photo && (
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Предпросмотр:</div>
                        <img 
                          src={member.photo} 
                          alt={`Preview ${member.name}`} 
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contributors */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Контрибьюторы</h2>
              <button
                onClick={addContributor}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aboutData.contributors.map((contributor, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-grow space-y-4">
                    <input
                      type="text"
                      value={contributor.name}
                      onChange={(e) => {
                        const newContributors = [...aboutData.contributors];
                        newContributors[index].name = e.target.value;
                        setAboutData(prev => ({ ...prev, contributors: newContributors }));
                      }}
                      className="form-input"
                      placeholder="Имя"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={contributor.photo}
                        onChange={(e) => {
                          const newContributors = [...aboutData.contributors];
                          newContributors[index].photo = e.target.value;
                          setAboutData(prev => ({ ...prev, contributors: newContributors }));
                        }}
                        className="form-input flex-grow"
                        placeholder="URL фотографии"
                      />
                      <button
                        type="button"
                        onClick={() => triggerFileInput('contributor', index)}
                        className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        title="Загрузить изображение"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {contributor.photo && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Предпросмотр:</div>
                        <img 
                          src={contributor.photo} 
                          alt={`Preview ${contributor.name}`} 
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeContributor(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Support Platforms */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Платформы поддержки</h2>
              <button
                onClick={addSupportPlatform}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {aboutData.support_platforms.map((platform, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={platform.platform}
                      onChange={(e) => {
                        const newPlatforms = [...aboutData.support_platforms];
                        newPlatforms[index].platform = e.target.value;
                        setAboutData(prev => ({ ...prev, support_platforms: newPlatforms }));
                      }}
                      className="form-input"
                      placeholder="Название платформы"
                    />
                    <input
                      type="url"
                      value={platform.url}
                      onChange={(e) => {
                        const newPlatforms = [...aboutData.support_platforms];
                        newPlatforms[index].url = e.target.value;
                        setAboutData(prev => ({ ...prev, support_platforms: newPlatforms }));
                      }}
                      className="form-input"
                      placeholder="URL"
                    />
                  </div>
                  <button
                    onClick={() => removeSupportPlatform(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Контактная информация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={aboutData.contact_info.email}
                  onChange={(e) => setAboutData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, email: e.target.value }
                  }))}
                  className="form-input"
                  placeholder="contact@example.com"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
                <input
                  type="tel"
                  value={aboutData.contact_info.phone}
                  onChange={(e) => setAboutData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, phone: e.target.value }
                  }))}
                  className="form-input"
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Адрес</label>
                <input
                  type="text"
                  value={aboutData.contact_info.address}
                  onChange={(e) => setAboutData(prev => ({
                    ...prev,
                    contact_info: { ...prev.contact_info, address: e.target.value }
                  }))}
                  className="form-input"
                  placeholder="Город, улица, дом"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAbout;