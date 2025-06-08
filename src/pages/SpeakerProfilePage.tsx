import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Mail, Globe, MapPin, Link2, Calendar, Clock, Globe2 } from 'lucide-react';
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
  blog_visibility?: boolean;
  blogs?: string | Array<{ url: string; platform: string }>;
}

interface Event {
  id: string;
  title: string;
  description: string;
  short_description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  languages: string[];
  speakers: { id: string; name: string }[];
  bg_image: string | null;
  status: 'active' | 'draft' | 'past';
}

const SpeakerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const photoRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchSpeakerEvents = async () => {
      if (!speaker) return;
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            short_description,
            date,
            start_time,
            end_time,
            location,
            event_type,
            languages,
            speakers,
            bg_image,
            status
          `)
          .or(`speakers.cs.["${speaker.id}"],speakers.cs.{"id":"${speaker.id}"}`);

        if (error) throw error;

        const now = new Date();
        const upcoming: Event[] = [];
        const past: Event[] = [];

        data?.forEach(event => {
          const eventDate = new Date(event.date);
          event.status === 'past' || eventDate < now 
            ? past.push(event) 
            : upcoming.push(event);
        });

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Не удалось загрузить мероприятия спикера');
      } finally {
        setEventsLoading(false);
      }
    };

    if (speaker) {
      fetchSpeakerEvents();
    }
  }, [speaker]);

  useEffect(() => {
    if (!loading && photoRef.current) {
      photoRef.current.focus();
    }
  }, [loading]);

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

  const parseBlogs = (blogs: string | Array<{ url: string; platform: string }>) => {
    try {
      if (typeof blogs === 'string') {
        return JSON.parse(blogs) as Array<{ url: string; platform: string }>;
      }
      return blogs;
    } catch (error) {
      console.error('Error parsing blogs:', error);
      return null;
    }
  };

  const renderDescription = (description: string) => {
    if (!description) {
      return <p className="text-gray-500 dark:text-gray-400">Описание спикера отсутствует</p>;
    }

    const withLinks = description.replace(
      /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1(?:[^>]*?)>(.*?)<\/a>/g,
      (match, quote, url, text) => {
        return `@@@LINK_START@@@${url}@@@TEXT_START@@@${text}@@@LINK_END@@@`;
      }
    );

    const parts = withLinks.split(/@@@LINK_START@@@|@@@TEXT_START@@@|@@@LINK_END@@@/);
    
    return (
      <div className="text-dark-600 dark:text-dark-300">
        {parts.map((part, index) => {
          if (index % 4 === 0) {
            return <span key={index}>{part}</span>;
          } else if (index % 4 === 1) {
            const url = part;
            const text = parts[index + 1];
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:opacity-80 underline"
              >
                {text}
              </a>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEventDescription = (event: Event) => {
    if (event.short_description) return event.short_description;
    if (event.description) {
      return event.description.length > 200 
        ? `${event.description.substring(0, 200)}...` 
        : event.description;
    }
    return 'Описание мероприятия отсутствует';
  };

  const renderEventCard = (event: Event) => {
    const eventDate = new Date(event.date);
    const isPast = event.status === 'past' || eventDate < new Date();
    
    return (
      <div 
        key={event.id}
        className="relative border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[200px]"
      >
        {event.bg_image && (
          <div className="absolute inset-0 z-0">
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/events/${event.bg_image}`}
              alt={event.title}
              className="w-full h-full object-cover opacity-20 dark:opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-white/70 dark:from-dark-900/90 dark:to-dark-900/70"></div>
          </div>
        )}
        
        <div className="relative z-10 p-4 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
              {event.title}
            </h3>
            {isPast && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-300">
                Прошедшее
              </span>
            )}
          </div>
          
          <p className="text-dark-600 dark:text-dark-300 mb-3 flex-grow">
            {getEventDescription(event)}
          </p>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center text-dark-500 dark:text-dark-400">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </div>
            {event.location && (
              <div className="flex items-center text-dark-500 dark:text-dark-400">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                {event.location}
              </div>
            )}
            {event.languages && event.languages.length > 0 && (
              <div className="flex items-center text-dark-500 dark:text-dark-400">
                <Globe2 className="h-4 w-4 mr-2 flex-shrink-0" />
                {event.languages.join(', ')}
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700 flex justify-end">
            <a
              href={`/events/${event.id}`}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Подробнее →
            </a>
          </div>
        </div>
      </div>
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

  const parsedBlogs = speaker.blog_visibility ? parseBlogs(speaker.blogs || '[]') : null;
  const hasBlogs = parsedBlogs && parsedBlogs.length > 0;

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

          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="flex flex-col md:flex-row">
              <div 
                ref={photoRef}
                tabIndex={-1}
                className="w-full md:w-1/3 lg:w-1/4 p-6 outline-none"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-700 shadow-md">
                  {speaker.photos.length > 0 ? (
                    <>
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${speaker.photos[currentSlide].url}`}
                        alt={speaker.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
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

                <div className="mb-6">
                  {renderDescription(speaker.description)}
                </div>

                {hasBlogs && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-dark-800 dark:text-white">
                      Блоги и социальные сети
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {parsedBlogs.map((blog, index) => (
                        <a
                          key={index}
                          href={blog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors text-dark-700 dark:text-dark-200"
                        >
                          <Link2 className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{blog.platform}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Ближайшие мероприятия</h2>
              {eventsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map(renderEventCard)}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Нет запланированных мероприятий
                </p>
              )}
            </div>

            {pastEvents.length > 0 && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Прошедшие мероприятия</h2>
                <div className="space-y-4">
                  {pastEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {Array.isArray(speaker.past_events) && speaker.past_events.length > 0 && (
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">История выступлений</h2>
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