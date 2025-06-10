import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, ChevronDown, Loader2, Star, TrendingUp, Award } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Подключение к Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EventCard = ({ event, isPast = false }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type) => {
    const types = {
      conference: 'Конференция',
      workshop: 'Мастер-класс',
      meetup: 'Встреча',
      seminar: 'Семинар',
      webinar: 'Вебинар',
      training: 'Тренинг'
    };
    return types[type] || type;
  };

  const getEventTypeIcon = (type) => {
    switch(type) {
      case 'conference': return <Award className="w-4 h-4" />;
      case 'workshop': return <Star className="w-4 h-4" />;
      case 'meetup': return <Users className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const registrations = event.registrations || {};
  const currentRegs = parseInt(registrations.current || '0');
  const maxRegs = registrations.max_regs || 0;
  const fillPercentage = maxRegs > 0 ? (currentRegs / maxRegs) * 100 : 0;

  const getStatusColor = () => {
    if (fillPercentage >= 90) return 'text-error-500';
    if (fillPercentage >= 70) return 'text-warning-500';
    return 'text-success-500';
  };

  return (
    <div className="group relative bg-white dark:bg-dark-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600">
      {/* Градиентная полоска сверху */}
      <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium font-heading">
                {getEventTypeIcon(event.event_type)}
                {getEventTypeLabel(event.event_type)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-heading group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {event.title}
            </h3>
          </div>
          <div className="text-right ml-4">
            {event.price > 0 ? (
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-heading">
                  {event.price?.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {event.currency}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-success-600 dark:text-success-400 font-heading">
                Бесплатно
              </span>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {event.description.length > 120 
              ? `${event.description.substring(0, 120)}...` 
              : event.description}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-medium">{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
              <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-medium">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>

          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-3">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-medium">
              <span className={getStatusColor()}>{currentRegs}</span> из {maxRegs} участников
            </span>
          </div>

          {!isPast && maxRegs > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Заполненность</span>
                <span className={`${getStatusColor()} font-bold`}>{Math.round(fillPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${
                    fillPercentage >= 90 ? 'bg-gradient-to-r from-error-400 to-error-600' :
                    fillPercentage >= 70 ? 'bg-gradient-to-r from-warning-400 to-warning-600' :
                    'bg-gradient-to-r from-success-400 to-success-600'
                  }`}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {event.speakers && event.speakers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 font-heading">Спикеры:</p>
            <div className="flex flex-wrap gap-2">
              {event.speakers.map((speaker, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <Star className="w-3 h-3 mr-1" />
                  {speaker.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {isPast && (
          <div className="mt-4">
            <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              Завершено
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <div className="absolute inset-0 w-8 h-8 border-2 border-primary-200 dark:border-primary-800 rounded-full"></div>
    </div>
    <span className="ml-3 text-gray-600 dark:text-gray-300 font-medium">Загрузка мероприятий...</span>
  </div>
);

const EventsStatistics = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState({
    nearest: [],
    upcoming: [],
    past: []
  });
  const [loading, setLoading] = useState({
    nearest: false,
    upcoming: false,
    past: false
  });
  const [loadingMore, setLoadingMore] = useState({
    upcoming: false,
    past: false
  });
  const [pagination, setPagination] = useState({
    upcoming: { offset: 0, hasMore: true },
    past: { offset: 0, hasMore: true }
  });

  // Функция для загрузки данных из Supabase
  const loadEventsFromSupabase = async (type, offset = 0, limit = 10) => {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('events')
        .select('*');

      if (type === 'nearest') {
        // Ближайшее мероприятие (в течение 7 дней)
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query
          .gte('start_time', now)
          .lte('start_time', nextWeek)
          .eq('status', 'active')
          .order('start_time', { ascending: true })
          .limit(1);
      } else if (type === 'upcoming') {
        // Предстоящие мероприятия
        query = query
          .gte('start_time', now)
          .eq('status', 'active')
          .order('start_time', { ascending: true })
          .range(offset, offset + limit - 1);
      } else if (type === 'past') {
        // Прошедшие мероприятия
        query = query
          .or(`start_time.lt.${now},status.eq.past`)
          .order('start_time', { ascending: false })
          .range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return { data: [], hasMore: false };
      }

      return {
        data: data || [],
        hasMore: data && data.length === limit
      };
    } catch (error) {
      console.error('Error loading events:', error);
      return { data: [], hasMore: false };
    }
  };

  // Загрузка начальных данных
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading({ nearest: true, upcoming: true, past: true });
      
      try {
        const [nearestResult, upcomingResult, pastResult] = await Promise.all([
          loadEventsFromSupabase('nearest'),
          loadEventsFromSupabase('upcoming', 0, 10),
          loadEventsFromSupabase('past', 0, 10)
        ]);

        setEvents({
          nearest: nearestResult.data,
          upcoming: upcomingResult.data,
          past: pastResult.data
        });

        setPagination({
          upcoming: { offset: 10, hasMore: upcomingResult.hasMore },
          past: { offset: 10, hasMore: pastResult.hasMore }
        });
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading({ nearest: false, upcoming: false, past: false });
      }
    };

    loadInitialData();
  }, []);

  // Загрузка дополнительных данных
  const loadMore = async (type) => {
    if (!pagination[type].hasMore) return;

    setLoadingMore(prev => ({ ...prev, [type]: true }));

    try {
      const result = await loadEventsFromSupabase(type, pagination[type].offset, 10);
      
      setEvents(prev => ({
        ...prev,
        [type]: [...prev[type], ...result.data]
      }));

      setPagination(prev => ({
        ...prev,
        [type]: {
          offset: prev[type].offset + 10,
          hasMore: result.hasMore
        }
      }));
    } catch (error) {
      console.error(`Error loading more ${type} events:`, error);
    } finally {
      setLoadingMore(prev => ({ ...prev, [type]: false }));
    }
  };

  const tabs = [
    { id: 'nearest', label: 'Ближайшее', count: events.nearest.length, icon: Clock },
    { id: 'upcoming', label: 'Предстоящие', count: events.upcoming.length, icon: Calendar },
    { id: 'past', label: 'Прошедшие', count: events.past.length, icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-4 font-heading">
            Статистика мероприятий
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Управляйте своими мероприятиями и отслеживайте их эффективность
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-dark-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 font-heading ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-3 px-2 py-1 text-sm rounded-full font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Контент вкладок */}
        <div className="space-y-8">
          {activeTab === 'nearest' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-heading flex items-center">
                <Clock className="w-6 h-6 mr-3 text-primary-500" />
                Ближайшее мероприятие
              </h2>
              {loading.nearest ? (
                <LoadingSpinner />
              ) : events.nearest.length > 0 ? (
                <div className="max-w-2xl mx-auto">
                  {events.nearest.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-heading">
                    Нет ближайших мероприятий
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Запланируйте новое мероприятие или проверьте позже
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-heading flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-primary-500" />
                Предстоящие мероприятия
              </h2>
              {loading.upcoming ? (
                <LoadingSpinner />
              ) : events.upcoming.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {events.upcoming.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                  {pagination.upcoming.hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadMore('upcoming')}
                        disabled={loadingMore.upcoming}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-heading"
                      >
                        {loadingMore.upcoming ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5 mr-2" />
                            Показать еще 10 мероприятий
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-heading">
                    Нет предстоящих мероприятий
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Создайте новое мероприятие, чтобы начать привлекать участников
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-heading flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-primary-500" />
                Прошедшие мероприятия
              </h2>
              {loading.past ? (
                <LoadingSpinner />
              ) : events.past.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {events.past.map((event) => (
                      <EventCard key={event.id} event={event} isPast={true} />
                    ))}
                  </div>
                  {pagination.past.hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadMore('past')}
                        disabled={loadingMore.past}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-heading"
                      >
                        {loadingMore.past ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-5 h-5 mr-2" />
                            Показать еще 10 мероприятий
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-heading">
                    Нет прошедших мероприятий
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Здесь появится история ваших завершенных мероприятий
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsStatistics;