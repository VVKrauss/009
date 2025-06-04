import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Search, Edit, Eye, Calendar, Users, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import EventDetailsModal from '../../components/admin/EventDetailsModal';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Event = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  bg_image: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_category: string;
  price: number;
  currency: string;
  status: string;
  max_registrations: number;
  current_registration_count: number;
  payment_type: string;
  languages: string[];
  speakers: string[];
};

type SortOption = 'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'chronological';
type FilterStatus = 'active' | 'draft' | 'past';

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  past: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
};

const formatEventTitle = (title: string) => {
  const maxLength = 50;
  const maxLineLength = 30;
  
  if (title.length <= maxLength) {
    const words = title.split(' ');
    if (words.length <= 2) {
      return {
        line1: words[0] || ' ',
        line2: words[1] || ' '
      };
    }
    
    const middle = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, middle).join(' '),
      line2: words.slice(middle).join(' ')
    };
  }
  
  return {
    line1: title.substring(0, maxLineLength),
    line2: title.substring(maxLineLength, maxLength - 3) + '...'
  };
};

const formatTimeFromTimestamp = (timestamp: string) => {
  return format(parseISO(timestamp), 'HH:mm', { locale: ru });
};

const formatDateWithTime = (date: string, startTime: string, endTime: string) => {
  const dateStr = format(parseISO(date), 'd MMMM yyyy', { locale: ru });
  const startStr = formatTimeFromTimestamp(startTime);
  const endStr = formatTimeFromTimestamp(endTime);
  return `${dateStr} • ${startStr} - ${endStr}`;
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('chronological');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [sortBy, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase.from('events').select('*');

      // Фильтрация по статусу
      if (statusFilter === 'past') {
        const today = new Date().toISOString().split('T')[0];
        query = query
          .or(`status.eq.past,and(status.eq.active,date.lt.${today})`)
          .order('date', { ascending: false });
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Сортировка
      switch (sortBy) {
        case 'chronological':
          if (statusFilter === 'active') {
            const today = new Date().toISOString().split('T')[0];
            query = query
              .gte('date', today)
              .order('date', { ascending: true })
              .order('start_time', { ascending: true });
          }
          break;
        case 'date-asc':
          query = query.order('date', { ascending: true });
          break;
        case 'date-desc':
          query = query.order('date', { ascending: false });
          break;
        case 'title-asc':
          query = query.order('title', { ascending: true });
          break;
        case 'title-desc':
          query = query.order('title', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Дополнительная фильтрация для прошедших мероприятий
      let filteredData = data || [];
      if (statusFilter === 'past') {
        const today = new Date();
        filteredData = filteredData.filter(event => 
          event.status === 'past' || 
          isBefore(parseISO(event.date), today)
        );
      }

      setEvents(filteredData);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Ошибка при загрузке мероприятий');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.length === 0) return;
    
    const count = selectedEvents.length;
    if (!confirm(`Вы уверены, что хотите удалить ${count} ${count === 1 ? 'мероприятие' : 'мероприятия'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .in('id', selectedEvents);

      if (error) throw error;

      toast.success(`Успешно удалено ${count} ${count === 1 ? 'мероприятие' : 'мероприятия'}`);
      setSelectedEvents([]);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast.error('Ошибка при удалении мероприятий');
    }
  };

  const toggleEventSelection = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleAllEvents = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map(event => event.id));
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Управление мероприятиями</h2>
        <Link 
          to="/admin/events/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать мероприятие
        </Link>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск мероприятий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700"
              />
            </div>

            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700"
              >
                <option value="chronological">Хронологически</option>
                <option value="date-desc">Сначала новые</option>
                <option value="date-asc">Сначала старые</option>
                <option value="title-asc">По названию (А-Я)</option>
                <option value="title-desc">По названию (Я-А)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setStatusFilter('active')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${statusFilter === 'active' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
            >
              Активные
            </button>
            <button
              onClick={() => setStatusFilter('past')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${statusFilter === 'past' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
            >
              Прошедшие
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${statusFilter === 'draft' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
            >
              Черновики
            </button>
          </nav>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedEvents.length > 0 && selectedEvents.length === filteredEvents.length}
              onChange={toggleAllEvents}
              onClick={toggleAllEvents}
              className="form-checkbox h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:checked:bg-primary-600"
            />
            <span>Выбрать все</span>
          </label>
          
          {selectedEvents.length > 0 && (
            <>
              <span className="text-dark-500 dark:text-dark-400">
                Выбрано: {selectedEvents.length}
              </span>
              <button
                onClick={handleDeleteSelected}
                className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Удалить выбранные
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-dark-500 dark:text-dark-400">Загрузка мероприятий...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-lg shadow">
          <div className="mb-4">
            <Calendar className="h-12 w-12 text-dark-400 dark:text-dark-500 mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">Мероприятия не найдены</h3>
          <p className="text-dark-500 dark:text-dark-400 mb-6">
            {searchQuery 
              ? 'Попробуйте изменить параметры поиска'
              : 'Создайте первое мероприятие, нажав кнопку "Создать мероприятие"'}
          </p>
          <Link 
            to="/admin/events/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Создать мероприятие
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEvents.map(event => {
            const { line1, line2 } = formatEventTitle(event.title);
            
            return (
              <div 
                key={event.id} 
                className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => {
                  setSelectedEvent(event);
                  setShowDetailsModal(true);
                }}
              >
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.id)}
                    onChange={(e) => e.stopPropagation()}
                    onClick={(e) => toggleEventSelection(event.id, e)}
                    className="form-checkbox h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:checked:bg-primary-600"
                  />
                </div>
                
                <div 
                  className="h-40 bg-cover bg-center relative"
                  style={{ 
                    backgroundImage: event.bg_image 
                      ? `url(${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${event.bg_image})`
                      : 'url(https://via.placeholder.com/800x400?text=No+image)'
                  }}
                >
                <div className="absolute top-3 right-3 flex gap-2">
                  <Link
                    to={`/events/${event.id}`}
                    className="p-2 bg-white/90 hover:bg-white dark:bg-dark-700/90 dark:hover:bg-dark-600 rounded-full shadow-lg flex items-center justify-center"
                    title="Просмотреть страницу"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-4 w-4 text-dark-700 dark:text-dark-300" />
                  </Link>
                  <Link
                    to={`/admin/events/${event.id}/edit`}
                    className="p-2 bg-white/90 hover:bg-white dark:bg-dark-700/90 dark:hover:bg-dark-600 rounded-full shadow-lg flex items-center justify-center"
                    title="Редактировать"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-4 w-4 text-dark-700 dark:text-dark-300" />
                  </Link>
                </div>
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status as keyof typeof statusColors]}`}>
                      {event.status === 'active' ? 'Активно' : event.status === 'draft' ? 'Черновик' : 'Прошло'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="h-[3rem] mb-3 overflow-hidden">
                    <div className="line-clamp-2">
                      <span className="font-semibold text-base">{line1}</span>
                      {line2 && (
                        <>
                          <br />
                          <span className="font-semibold text-base">{line2}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-dark-600 dark:text-dark-300 text-sm">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatDateWithTime(event.date, event.start_time, event.end_time)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-dark-600 dark:text-dark-300 text-sm">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.max_registrations > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-dark-600 dark:text-dark-300">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Регистрации</span>
                          </div>
                          <span className="font-medium">
                            {event.current_registration_count}/{event.max_registrations}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full transition-all"
                            style={{ 
                              width: `${(event.current_registration_count / event.max_registrations) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {event.price !== null && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-dark-700 text-sm">
                      <span className="text-dark-600 dark:text-dark-300">Стоимость:</span>
                      <span className="font-medium">
                        {event.price === 0 
                          ? 'Бесплатно'
                          : `${event.price} ${event.currency}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedEvent && (
        <EventDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default AdminEvents;