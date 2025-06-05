import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Save, X, Upload, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type HeaderStyle = 'centered' | 'slideshow';
type Slide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
};

type HeaderData = {
  style: HeaderStyle;
  centered: {
    title: string;
    subtitle: string;
    logoLight: string;
    logoDark: string;
    logoSize: number;
  };
  slideshow: {
    slides: Slide[];
    settings: {
      autoplaySpeed: number;
      transition: 'fade' | 'slide';
    };
  };
};

const defaultHeaderData: HeaderData = {
  style: 'centered',
  centered: {
    title: 'ScienceHub',
    subtitle: 'Место для научного сообщества',
    logoLight: 'https://jfvinriqydjtwsmayxix.supabase.co/storage/v1/object/public/images/logo/logo_science_hub%20no_title.png',
    logoDark: 'https://jfvinriqydjtwsmayxix.supabase.co/storage/v1/object/public/images/logo/logo_white_science_hub%20no_title.png',
    logoSize: 150
  },
  slideshow: {
    slides: [],
    settings: {
      autoplaySpeed: 5000,
      transition: 'fade'
    }
  }
};

const AdminHomeHeader = () => {
  const [siteSettingsId, setSiteSettingsId] = useState<string | null>(null);
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchHeaderData();
  }, []);

  const fetchHeaderData = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, header_settings')
        .single();

      if (error) throw error;

      setSiteSettingsId(data.id);
      if (data.header_settings) {
        setHeaderData({
          ...defaultHeaderData,
          ...data.header_settings,
          centered: {
            ...defaultHeaderData.centered,
            ...data.header_settings.centered
          },
          slideshow: {
            ...defaultHeaderData.slideshow,
            ...data.header_settings.slideshow,
            settings: {
              ...defaultHeaderData.slideshow.settings,
              ...data.header_settings.slideshow?.settings
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching header data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!siteSettingsId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('site_settings')
        .update({
          header_settings: headerData
        })
        .eq('id', siteSettingsId);

      if (error) throw error;

      toast.success('Изменения сохранены');
    } catch (error) {
      console.error('Error saving header data:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 50 && value <= 300) {
      setHeaderData(prev => ({
        ...prev,
        centered: {
          ...prev.centered,
          logoSize: value
        }
      }));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Настройки главной страницы</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-outline flex items-center gap-2"
          >
            <Eye className="h-5 w-5" />
            Предпросмотр
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-6">Стиль шапки</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={() => setHeaderData(prev => ({ ...prev, style: 'centered' }))}
              className={`p-4 border-2 rounded-lg flex-1 ${
                headerData.style === 'centered'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-dark-700'
              }`}
            >
              <h4 className="font-medium mb-2">Центрированный</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Логотип и текст по центру
              </p>
            </button>
            
            <button
              onClick={() => setHeaderData(prev => ({ ...prev, style: 'slideshow' }))}
              className={`p-4 border-2 rounded-lg flex-1 ${
                headerData.style === 'slideshow'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-dark-700'
              }`}
            >
              <h4 className="font-medium mb-2">Слайдшоу</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Слайдер с изображениями
              </p>
            </button>
          </div>

          {headerData.style === 'centered' && (
            <div className="space-y-6 border-t border-gray-200 dark:border-dark-700 pt-6">
              <h4 className="font-medium mb-4">Настройки центрированного стиля</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Заголовок
                  </label>
                  <input
                    type="text"
                    value={headerData.centered.title}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      centered: { ...prev.centered, title: e.target.value }
                    }))}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Подзаголовок
                  </label>
                  <input
                    type="text"
                    value={headerData.centered.subtitle}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      centered: { ...prev.centered, subtitle: e.target.value }
                    }))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Светлый логотип
                  </label>
                  <input
                    type="text"
                    value={headerData.centered.logoLight}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      centered: { ...prev.centered, logoLight: e.target.value }
                    }))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Тёмный логотип
                  </label>
                  <input
                    type="text"
                    value={headerData.centered.logoDark}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      centered: { ...prev.centered, logoDark: e.target.value }
                    }))}
                    className="form-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Размер логотипа (50-300px)
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={headerData.centered.logoSize}
                      onChange={handleLogoSizeChange}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="50"
                      max="300"
                      value={headerData.centered.logoSize}
                      onChange={handleLogoSizeChange}
                      className="form-input w-24"
                    />
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Предпросмотр размера:</p>
                    <div className="flex justify-center items-center bg-white dark:bg-dark-800 rounded-lg p-4" style={{ height: `${headerData.centered.logoSize}px` }}>
                      <img
                        src={headerData.centered.logoLight}
                        alt="Logo preview"
                        className="h-full w-auto object-contain dark:hidden"
                        style={{ maxWidth: `${headerData.centered.logoSize}px` }}
                      />
                      <img
                        src={headerData.centered.logoDark}
                        alt="Logo preview"
                        className="h-full w-auto object-contain hidden dark:block"
                        style={{ maxWidth: `${headerData.centered.logoSize}px` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {headerData.style === 'slideshow' && (
            <div className="space-y-6 border-t border-gray-200 dark:border-dark-700 pt-6">
              <h4 className="font-medium mb-4">Настройки слайдшоу</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Скорость автопрокрутки (мс)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={headerData.slideshow.settings.autoplaySpeed}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      slideshow: {
                        ...prev.slideshow,
                        settings: {
                          ...prev.slideshow.settings,
                          autoplaySpeed: parseInt(e.target.value)
                        }
                      }
                    }))}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Тип перехода
                  </label>
                  <select
                    value={headerData.slideshow.settings.transition}
                    onChange={(e) => setHeaderData(prev => ({
                      ...prev,
                      slideshow: {
                        ...prev.slideshow,
                        settings: {
                          ...prev.slideshow.settings,
                          transition: e.target.value as 'fade' | 'slide'
                        }
                      }
                    }))}
                    className="form-input"
                  >
                    <option value="fade">Затухание</option>
                    <option value="slide">Слайд</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Слайды</h5>
                  <button
                    onClick={() => setHeaderData(prev => ({
                      ...prev,
                      slideshow: {
                        ...prev.slideshow,
                        slides: [
                          ...prev.slideshow.slides,
                          {
                            id: crypto.randomUUID(),
                            image: '',
                            title: '',
                            subtitle: ''
                          }
                        ]
                      }
                    }))}
                    className="btn-outline"
                  >
                    Добавить слайд
                  </button>
                </div>

                <div className="space-y-4">
                  {headerData.slideshow.slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="border border-gray-200 dark:border-dark-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h6 className="font-medium">Слайд {index + 1}</h6>
                        <button
                          onClick={() => setHeaderData(prev => ({
                            ...prev,
                            slideshow: {
                              ...prev.slideshow,
                              slides: prev.slideshow.slides.filter(s => s.id !== slide.id)
                            }
                          }))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Изображение
                          </label>
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => setHeaderData(prev => ({
                              ...prev,
                              slideshow: {
                                ...prev.slideshow,
                                slides: prev.slideshow.slides.map(s =>
                                  s.id === slide.id
                                    ? { ...s, image: e.target.value }
                                    : s
                                )
                              }
                            }))}
                            className="form-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Заголовок
                          </label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => setHeaderData(prev => ({
                              ...prev,
                              slideshow: {
                                ...prev.slideshow,
                                slides: prev.slideshow.slides.map(s =>
                                  s.id === slide.id
                                    ? { ...s, title: e.target.value }
                                    : s
                                )
                              }
                            }))}
                            className="form-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Подзаголовок
                          </label>
                          <input
                            type="text"
                            value={slide.subtitle}
                            onChange={(e) => setHeaderData(prev => ({
                              ...prev,
                              slideshow: {
                                ...prev.slideshow,
                                slides: prev.slideshow.slides.map(s =>
                                  s.id === slide.id
                                    ? { ...s, subtitle: e.target.value }
                                    : s
                                )
                              }
                            }))}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomeHeader;