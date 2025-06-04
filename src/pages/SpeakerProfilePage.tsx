import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Mail, Globe, MapPin } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  description: string;
  date_of_birth?: string;
  photos: { url: string; isMain?: boolean }[];
  contact_info?: {
    email?: string;
    website?: string;
    location?: string;
  };
  achievements?: string[];
  past_events?: Array<{
    title: string;
    date: string;
  }>;
}

const SpeakerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchSpeaker = async () => {
      try {
        const { data, error } = await supabase
          .from('speakers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const uniquePhotos = data.photos ? 
          data.photos.filter((photo, index, self) => 
            index === self.findIndex((p) => p.url === photo.url)
          ) : [];
        
        setSpeaker({
          ...data,
          photos: uniquePhotos
        });
      } catch (error) {
        console.error('Error fetching speaker:', error);
        toast.error('Не удалось загрузить информацию о спикере');
      } finally {
        setLoading(false);
      }
    };

    fetchSpeaker();
  }, [id]);

  const nextSlide = () => {
    if (!speaker) return;
    setCurrentSlide((prev) => 
      prev === speaker.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (!speaker) return;
    setCurrentSlide((prev) => 
      prev === 0 ? speaker.photos.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!speaker) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-red-600">
          Спикер не найден
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-dark-800 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 transition-colors mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Назад к списку спикеров
          </button>

          {/* Hero Block */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
              {/* Photo Gallery */}
              <div className="w-full md:w-1/3 lg:w-1/4 p-6">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-700 shadow-md">
                  {speaker.photos.length > 0 ? (
                    <>
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[currentSlide].url}`}
                        alt={speaker.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      
                      {/* Navigation Arrows */}
                      {speaker.photos.length > 1 && (
                        <>
                          <button
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full z-10 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full z-10 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <span>Нет фото</span>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {speaker.photos.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {speaker.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`aspect-square overflow-hidden rounded-md transition-all ${
                          index === currentSlide 
                            ? 'ring-2 ring-primary-500' 
                            : 'opacity-80 hover:opacity-100 hover:ring-1 hover:ring-gray-300'
                        }`}
                      >
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${photo.url}`}
                          alt={`Фото ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speaker Info */}
              <div className="w-full md:w-2/3 lg:w-3/4 p-6 md:p-8 flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-dark-800 dark:text-white mb-2">
                  {speaker.name}
                </h1>
                <p className="text-xl text-primary-600 dark:text-primary-400 mb-6">
                  {speaker.field_of_expertise}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  {speaker.contact_info?.email && (
                    <a 
                      href={`mailto:${speaker.contact_info.email}`}
                      className="flex items-center gap-2 text-dark-600 dark:text-dark-300 hover:text-primary-500 transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      <span>{speaker.contact_info.email}</span>
                    </a>
                  )}
                  {speaker.contact_info?.website && (
                    <a 
                      href={speaker.contact_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-dark-600 dark:text-dark-300 hover:text-primary-500 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                      <span>{speaker.contact_info.website}</span>
                    </a>
                  )}
                  {speaker.contact_info?.location && (
                    <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300">
                      <MapPin className="h-5 w-5" />
                      <span>{speaker.contact_info.location}</span>
                    </div>
                  )}
                </div>

                <div className="prose dark:prose-invert max-w-none mb-4">
                  {speaker.description || (
                    <p className="text-gray-500 dark:text-gray-400">
                      Описание спикера отсутствует
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Achievements */}
            {Array.isArray(speaker.achievements) && speaker.achievements.length > 0 && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Достижения</h2>
                <ul className="space-y-3">
                  {speaker.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-500 mr-2 mt-1">•</span>
                      <span className="text-dark-600 dark:text-dark-300">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Past Events */}
            {Array.isArray(speaker.past_events) && speaker.past_events.length > 0 && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Прошедшие мероприятия</h2>
                <div className="space-y-4">
                  {speaker.past_events.map((event, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-dark-700 last:border-0"
                    >
                      <span className="font-medium text-dark-800 dark:text-white">{event.title}</span>
                      <span className="text-dark-500 dark:text-dark-400">{event.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SpeakerProfilePage;