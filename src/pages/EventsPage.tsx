import { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, List, Calendar, ChevronDown, ArrowUp, ArrowDown, AArrowUp, AArrowDown, Filter, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/layout/Layout';
import EventsList from '../components/events/EventsList';
import EventSlideshow from '../components/events/EventSlideshow';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  formatRussianDate, 
  formatTimeFromTimestamp, 
  formatTimeRange, 
  isPastEvent 
} from '../utils/dateTimeUtils';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type SortOption = 'start-asc' | 'start-desc' | 'title-asc' | 'title-desc';
type ViewMode = 'grid' | 'list';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  bg_image: string;
  // Основные поля времени
  start_at: string;
  end_at: string;
  location: string;
  age_category: string;
  price: number;
  price_comment?: string;
  currency: string;
  status: string;
  payment_type?: string;
  video_url?: string;
  photo_gallery?: { url: string; thumbnail: string }[];
  languages: string[];
}

const EventsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('start-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [events, setEvents] = useState<{ active: Event[]; past: Event[] }>({ active: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleEvents, setVisibleEvents] = useState(10);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  const fetchEventTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('event_type')
        .eq('status', 'active');

      if (error) throw error;

      const uniqueTypes = Array.from(new Set(data.map(item => item.event_type)));
      setEventTypes(uniqueTypes);
    } catch (err) {
      console.error('Error fetching event types:', err);
      toast.error('Не удалось загрузить типы мероприятий');
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Получаем активные события
      let activeQuery = supabase
        .from('events')
        .select('*')
        .eq('status', 'active');

      // Фильтрация по типам событий
      if (selectedEventTypes.length > 0) {
        activeQuery = activeQuery.in('event_type', selectedEventTypes);
      }

      const { data: activeEvents, error: activeError } = await activeQuery;
      if (activeError) throw activeError;

      // Фильтруем активные события - убираем прошедшие
      const currentActiveEvents = (activeEvents || []).filter(event => {
        if (!event.end_at) return true; // Если нет времени окончания, считаем активным
        return !isPastEvent(event.end_at);
      });

      // Сортировка активных событий
      let sortedActiveEvents = [...currentActiveEvents];
      switch (sortBy) {
        case 'start-asc':
          sortedActiveEvents.sort((a, b) => 
            new Date(a.start_at || 0).getTime() - new Date(b.start_at || 0).getTime()
          );
          break;
        case 'start-desc':
          sortedActiveEvents.sort((a, b) => 
            new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime()
          );
          break;
        case 'title-asc':
          sortedActiveEvents.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title-desc':
          sortedActiveEvents.sort((a, b) => b.title.localeCompare(a.title));
          break;
      }

      // Получаем прошедшие события
      const { data: pastEvents, error: pastError } = await supabase
        .from('events')
        .select('*')
        .or('status.eq.past')
        .order('start_at', { ascending: false })
        .limit(6);

      if (pastError) throw pastError;

      // Добавляем активные события которые уже прошли
      const pastActiveEvents = (activeEvents || []).filter(event => 
        event.end_at && isPastEvent(event.end_at)
      );

      // Объединяем и сортируем все прошедшие события
      const allPastEvents = [...(pastEvents || []), ...pastActiveEvents]
        .sort((a, b) => new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime())
        .slice(0, 6); // Берем только последние 6

      setEvents({
        active: sortedActiveEvents,
        past: allPastEvents
      });

    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Не удалось загрузить мероприятия');
      toast.error('Не удалось загрузить мероприятия');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEvents();
  }, [sortBy, selectedEventTypes]);

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSelectedEventTypes([]);
    setSearchQuery('');
  };

  const filteredActiveEvents = useMemo(() => {
    return events.active?.filter(event => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [events.active, searchQuery]);

  const upcomingEvents = useMemo(() => {
    return events.active
      ?.slice()
      .sort((a, b) => new Date(a.start_at || 0).getTime() - new Date(b.start_at || 0).getTime())
      .slice(0, 5);
  }, [events.active]);

  const loadMoreEvents = () => {
    setVisibleEvents(prev => prev + 10);
  };

  const sortOptions = [
    { value: 'start-asc', label: <div className="flex items-center gap-2"><ArrowUp className="h-4 w-4" /> Дата</div> },
    { value: 'start-desc', label: <div className="flex items-center gap-2"><ArrowDown className="h-4 w-4" /> Дата</div> },
    { value: 'title-asc', label: <div className="flex items-center gap-2"><AArrowUp className="h-4 w-4" /> Название</div> },
    { value: 'title-desc', label: <div className="flex items-center gap-2"><AArrowDown className="h-4 w-4" /> Название</div> },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-red-600">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative">
        <EventSlideshow 
          events={upcomingEvents} 
          titleStyle={{ fontSize: '1.25rem' }}
          descriptionStyle={{ fontSize: '0.875rem' }}
          desktopTitleStyle={{ fontSize: '1.75rem' }}
          desktopDescriptionStyle={{ fontSize: '1.125rem' }}
          formatTimeRange={formatTimeRange}
        />
      </div>
      
      <main className="section bg-gray-50 dark:bg-dark-800">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Основной контент - предстоящие мероприятия */}
            <div className="lg:flex-1">
              <div className="mb-6 flex flex-col md:flex-row gap-3 justify-between">
                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Поиск мероприятий..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-dark-300 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-md ${
                        selectedEventTypes.length > 0
                          ? 'bg-primary-100 dark:bg-primary-900 border-primary-500 text-primary-800 dark:text-primary-200'
                          : 'border-dark-300 dark:border-dark-700 bg-white dark:bg-dark-800'
                      }`}
                    >
                      <Filter className="h-5 w-5" />
                      <span>Фильтры</span>
                      {selectedEventTypes.length > 0 && (
                        <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {selectedEventTypes.length}
                        </span>
                      )}
                    </button>

                    {isFilterOpen && (
                      <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-700 rounded-md shadow-lg py-2 z-50">
                        <div className="px-4 py-2 border-b border-dark-200 dark:border-dark-700 flex justify-between items-center">
                          <p className="font-medium">Типы мероприятий</p>
                          <button 
                            onClick={resetFilters}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Сбросить
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {eventTypes.map(type => (
                            <label key={type} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedEventTypes.includes(type)}
                                onChange={() => toggleEventType(type)}
                                className="rounded text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400"
                              />
                              <span className="ml-2">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="flex rounded-md shadow-sm">
                    <button 
                      className={`p-2 border border-dark-300 dark:border-dark-700 rounded-l-md ${
                        viewMode === 'grid' 
                          ? 'bg-primary-600 text-white border-primary-600' 
                          : 'bg-white dark:bg-dark-800'
                      }`}
                      onClick={() => setViewMode('grid')}
                      title="Сетка"
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button 
                      className={`p-2 border border-dark-300 dark:border-dark-700 rounded-r-md ${
                        viewMode === 'list' 
                          ? 'bg-primary-600 text-white border-primary-600' 
                          : 'bg-white dark:bg-dark-800'
                      }`}
                      onClick={() => setViewMode('list')}
                      title="Список"
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="relative" style={{ zIndex: 999 }}>
                    <button 
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="flex items-center gap-2 px-3 py-2 border border-dark-300 dark:border-dark-700 rounded-md bg-white dark:bg-dark-800"
                    >
                      {sortOptions.find(opt => opt.value === sortBy)?.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSortOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-700 rounded-md shadow-lg py-1 z-50">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value as SortOption);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                              sortBy === option.value 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Предстоящие мероприятия</h2>
                {selectedEventTypes.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedEventTypes.map(type => (
                      <span 
                        key={type}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                      >
                        {type}
                        <button 
                          onClick={() => toggleEventType(type)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline ml-2"
                    >
                      Очистить все
                    </button>
                  </div>
                )}
                
                <EventsList 
                  events={filteredActiveEvents.slice(0, visibleEvents)}
                  type="upcoming"
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  formatTimeRange={formatTimeRange}
                />
                
                {filteredActiveEvents.length > visibleEvents && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreEvents}
                      className="px-6 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors dark:bg-primary/20 dark:hover:bg-primary/30"
                    >
                      Показать еще
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Боковая колонка - прошедшие мероприятия */}
            {events.past?.length > 0 && (
              <div className="lg:w-72 xl:w-80">
                <h2 className="text-xl font-semibold mb-3 pb-2 border-b border-dark-200 dark:border-dark-700">
                  Прошедшие мероприятия
                </h2>
                <div className="space-y-3">
                  {events.past.map(event => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div 
                          className="w-14 h-14 bg-cover bg-center rounded"
                          style={{ 
                            backgroundImage: event.bg_image 
                              ? `url(${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${event.bg_image})`
                              : 'url(https://via.placeholder.com/100?text=No+image)'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{event.title}</p>
                        <div className="flex items-center text-xs text-dark-500 dark:text-dark-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{event.start_at ? formatRussianDate(event.start_at) : 'Дата не указана'}</span>
                        </div>
                        {event.start_at && event.end_at && (
                          <div className="flex items-center text-xs text-dark-500 dark:text-dark-400 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTimeRange(event.start_at, event.end_at)}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default EventsPage;