import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, ChevronDown, Loader2, Star, TrendingUp, Award, X, BarChart3, PieChart, Target, Eye, Activity, Zap } from 'lucide-react';

// Мокап данных для демонстрации
const mockSupabase = {
  from: () => ({
    select: () => ({
      gte: () => ({ lte: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: mockEvents.slice(0, 1), error: null }) }) }) }) }),
      eq: () => ({ order: () => ({ range: () => ({ data: mockEvents, error: null }) }) }),
      or: () => ({ order: () => ({ range: () => ({ data: mockEvents.slice(0, 5), error: null }) }) })
    })
  })
};

const mockEvents = [
  {
    id: 1,
    title: "React Conference 2025",
    description: "Крупнейшая конференция по React разработке с участием ведущих экспертов отрасли",
    event_type: "conference",
    date: "2025-06-20",
    start_time: "2025-06-20T09:00:00Z",
    end_time: "2025-06-20T18:00:00Z",
    price: 15000,
    currency: "RUB",
    status: "active",
    registrations: {
      current: 847,
      max_regs: 1000,
      vip: 50,
      regular: 797,
      waiting_list: 23,
      demographics: {
        age_groups: {
          "18-25": 245,
          "26-35": 402,
          "36-45": 156,
          "46+": 44
        },
        experience: {
          junior: 234,
          middle: 445,
          senior: 168
        },
        companies: {
          "Яндекс": 45,
          "Сбер": 38,
          "VK": 31,
          "Тинькофф": 27,
          "Другие": 706
        }
      }
    },
    speakers: ["speaker1", "speaker2"]
  },
  {
    id: 2,
    title: "AI Workshop",
    description: "Практический мастер-класс по машинному обучению",
    event_type: "workshop",
    date: "2025-06-15",
    start_time: "2025-06-15T10:00:00Z",
    end_time: "2025-06-15T16:00:00Z",
    price: 0,
    currency: "RUB",
    status: "active",
    registrations: {
      current: 34,
      max_regs: 50,
      regular: 34,
      waiting_list: 5,
      demographics: {
        age_groups: {
          "18-25": 12,
          "26-35": 15,
          "36-45": 5,
          "46+": 2
        },
        experience: {
          junior: 18,
          middle: 12,
          senior: 4
        }
      }
    },
    speakers: ["speaker1"]
  }
];

const getSupabaseImageUrl = (url) => url;

const RegistrationModal = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  const registrations = event.registrations || {};
  const demographics = registrations.demographics || {};
  const fillPercentage = registrations.max_regs > 0 ? (registrations.current / registrations.max_regs) * 100 : 0;

  const getStatusColor = () => {
    if (fillPercentage >= 90) return 'text-red-500';
    if (fillPercentage >= 70) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getProgressBarGradient = () => {
    if (fillPercentage >= 90) return 'bg-gradient-to-r from-red-400 to-red-600';
    if (fillPercentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-blue-400 to-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
              <p className="text-blue-100">Детальная статистика регистраций</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Всего регистраций</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{registrations.current || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Свободно мест</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(registrations.max_regs || 0) - (registrations.current || 0)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Заполненность</p>
                  <p className={`text-2xl font-bold ${getStatusColor()}`}>{Math.round(fillPercentage)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Лист ожидания</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{registrations.waiting_list || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Progress Bar with Animation */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Прогресс регистрации</h3>
              <span className={`font-bold ${getStatusColor()}`}>{registrations.current}/{registrations.max_regs}</span>
            </div>
            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarGradient()}`}
                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Registration Types */}
          {(registrations.vip || registrations.regular) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Типы билетов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.vip && (
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">VIP билеты</p>
                        <p className="text-2xl font-bold">{registrations.vip}</p>
                      </div>
                      <Star className="w-8 h-8" />
                    </div>
                  </div>
                )}
                
                {registrations.regular && (
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Обычные билеты</p>
                        <p className="text-2xl font-bold">{registrations.regular}</p>
                      </div>
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Demographics */}
          {demographics.age_groups && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Возрастная демография</h3>
              <div className="space-y-3">
                {Object.entries(demographics.age_groups).map(([age, count]) => {
                  const percentage = (count / registrations.current) * 100;
                  return (
                    <div key={age} className="flex items-center">
                      <div className="w-16 text-sm text-gray-600 dark:text-gray-400">{age}</div>
                      <div className="flex-1 mx-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience Level */}
          {demographics.experience && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Уровень опыта</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(demographics.experience).map(([level, count]) => {
                  const percentage = (count / registrations.current) * 100;
                  const colors = {
                    junior: 'from-green-400 to-green-600',
                    middle: 'from-blue-400 to-blue-600', 
                    senior: 'from-purple-400 to-purple-600'
                  };
                  return (
                    <div key={level} className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${colors[level]} flex items-center justify-center text-white font-bold text-lg`}>
                        {count}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{level}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Companies */}
          {demographics.companies && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Топ компании</h3>
              <div className="space-y-3">
                {Object.entries(demographics.companies).slice(0, 5).map(([company, count]) => {
                  const percentage = (count / registrations.current) * 100;
                  return (
                    <div key={company} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{company}</p>
                        <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventCard = ({ event, isPast = false, onStatsClick }) => {
  if (!event) return null;

  const [speakers, setSpeakers] = useState([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);

  useEffect(() => {
    const loadSpeakers = async () => {
      if (!event.speakers || !Array.isArray(event.speakers) || event.speakers.length === 0) {
        return;
      }

      setLoadingSpeakers(true);
      try {
        // Мокап данных спикеров
        const mockSpeakersData = [
          { id: 'speaker1', name: 'Анна Смирнова', photos: [{ url: 'avatar1.jpg', isMain: true }] },
          { id: 'speaker2', name: 'Иван Петров', photos: [{ url: 'avatar2.jpg', isMain: true }] }
        ];
        setSpeakers(mockSpeakersData.filter(s => event.speakers.includes(s.id)));
      } catch (error) {
        console.error('Error loading speakers:', error);
      } finally {
        setLoadingSpeakers(false);
      }
    };

    loadSpeakers();
  }, [event.speakers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Дата не указана';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Некорректная дата';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      return new Date(timeStr).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '--:--';
    }
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
  const currentRegs = parseInt(registrations.current || '0') || 0;
  const maxRegs = registrations.max_regs || 0;
  const fillPercentage = maxRegs > 0 ? (currentRegs / maxRegs) * 100 : 0;

  const getStatusColor = () => {
    if (fillPercentage >= 90) return 'text-red-500';
    if (fillPercentage >= 70) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getProgressBarGradient = () => {
    if (fillPercentage >= 90) return 'bg-gradient-to-r from-red-400 to-red-600';
    if (fillPercentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-blue-400 to-blue-600';
  };

  const getSpeakerPhoto = (speaker) => {
    if (!speaker.photos || !Array.isArray(speaker.photos) || speaker.photos.length === 0) {
      return null;
    }
    
    const mainPhoto = speaker.photos.find(photo => photo.isMain) || speaker.photos[0];
    
    if (!mainPhoto || !mainPhoto.url) {
      return null;
    }
    
    return getSupabaseImageUrl(mainPhoto.url);
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
      <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                {getEventTypeIcon(event.event_type)}
                {getEventTypeLabel(event.event_type)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.title || 'Без названия'}
            </h3>
          </div>
          <div className="text-right ml-4">
            {(event.price || 0) > 0 ? (
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(event.price || 0).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {event.currency || 'RUB'}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                Бесплатно
              </span>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 dark:text-gray-300">Обзор ваших мероприятий за выбранный период</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Период:</span>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalUpcoming}</p>
              <p className="text-sm text-blue-500 dark:text-blue-300">мероприятий</p>
            </div>
          </div>
          <h3 className="font-semibold text-blue-700 dark:text-blue-300">Предстоящие события</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">В ближайшие {dateRange} дней</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalRegistrations}</p>
              <p className="text-sm text-green-500 dark:text-green-300">регистраций</p>
            </div>
          </div>
          <h3 className="font-semibold text-green-700 dark:text-green-300">Всего участников</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">Зарегистрировано</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgFillRate.toFixed(1)}%</p>
              <p className="text-sm text-purple-500 dark:text-purple-300">заполненность</p>
            </div>
          </div>
          <h3 className="font-semibold text-purple-700 dark:text-purple-300">Средняя загрузка</h3>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">По всем событиям</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">+23%</p>
              <p className="text-sm text-orange-500 dark:text-orange-300">рост</p>
            </div>
          </div>
          <h3 className="font-semibold text-orange-700 dark:text-orange-300">Динамика</h3>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">К прошлому периоду</p>
        </div>
      </div>

      {/* Nearest Event Card */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Ближайшее мероприятие
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{upcomingEvents[0].title}</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{upcomingEvents[0].description}</p>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(upcomingEvents[0].start_time).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{new Date(upcomingEvents[0].start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Регистраций</span>
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {upcomingEvents[0].registrations?.current || 0}/{upcomingEvents[0].registrations?.max_regs || 0}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(
                        ((upcomingEvents[0].registrations?.current || 0) / (upcomingEvents[0].registrations?.max_regs || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
              </div>
              {upcomingEvents[0].registrations?.waiting_list > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">Лист ожидания</span>
                    <span className="text-xl font-bold text-orange-700 dark:text-orange-300">
                      {upcomingEvents[0].registrations.waiting_list}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-blue-500" />
          Краткий обзор событий
        </h3>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const fillRate = event.registrations?.max_regs > 0 
              ? (event.registrations.current / event.registrations.max_regs) * 100 
              : 0;
            return (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.start_time).toLocaleDateString('ru-RU')} • {event.registrations?.current || 0} участников
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-bold ${fillRate >= 90 ? 'text-red-500' : fillRate >= 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {fillRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">заполнено</p>
                  </div>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        fillRate >= 90 ? 'bg-red-500' : fillRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(fillRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Events Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Сводка по прошедшим мероприятиям
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{pastStats.totalEvents}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Всего событий</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{pastStats.totalParticipants?.toLocaleString()}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Участников</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{pastStats.avgFillRate}%</div>
            <div className="text-sm text-green-600 dark:text-green-400">Средняя загрузка</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">⭐</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Топ событие:<br/>{pastStats.topEvent}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventsStatistics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleStatsClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  // Функция для загрузки данных из Supabase (мокап)
  const loadEventsFromSupabase = async (type, offset = 0, limit = 10) => {
    try {
      const now = new Date().toISOString();
      
      // Имитация API вызова
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (type === 'nearest') {
        return { data: mockEvents.slice(0, 1), hasMore: false };
      } else if (type === 'upcoming') {
        return { data: mockEvents, hasMore: false };
      } else if (type === 'past') {
        return { data: mockEvents.slice(0, 5), hasMore: false };
      }

      return { data: [], hasMore: false };
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
    { id: 'dashboard', label: 'Дашборд', count: null, icon: Activity },
    { id: 'nearest', label: 'Ближайшее', count: events.nearest.length, icon: Clock },
    { id: 'upcoming', label: 'Предстоящие', count: events.upcoming.length, icon: Calendar },
    { id: 'past', label: 'Прошедшие', count: events.past.length, icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
            Статистика мероприятий
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Управляйте своими мероприятиями и отслеживайте их эффективность
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`ml-3 px-2 py-1 text-sm rounded-full font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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
          {activeTab === 'dashboard' && <Dashboard />}

          {activeTab === 'nearest' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-blue-500" />
                Ближайшее мероприятие
              </h2>
              {loading.nearest ? (
                <LoadingSpinner />
              ) : events.nearest.length > 0 ? (
                <div className="max-w-2xl mx-auto">
                  {events.nearest.map((event) => (
                    <EventCard key={event.id} event={event} onStatsClick={handleStatsClick} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-blue-500" />
                Предстоящие мероприятия
              </h2>
              {loading.upcoming ? (
                <LoadingSpinner />
              ) : events.upcoming.length > 0 ? (
                <div className="space-y-8">
                  <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {events.upcoming.map((event) => (
                      <EventCard key={event.id} event={event} onStatsClick={handleStatsClick} />
                    ))}
                  </div>
                  {pagination.upcoming.hasMore && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadMore('upcoming')}
                        disabled={loadingMore.upcoming}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-blue-500" />
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
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
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

        {/* Modal для детальной статистики */}
        <RegistrationModal 
          event={selectedEvent}
          isOpen={showModal}
          onClose={closeModal}
        />
      </div>
    </div>
  );
};

export default EventsStatistics;600 dark:text-gray-300 mb-6 leading-relaxed">
            {event.description.length > 120 
              ? `${event.description.substring(0, 120)}...` 
              : event.description}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">{formatDate(event.date || event.start_time)}</span>
          </div>

          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>

          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">
              <span className={getStatusColor()}>{currentRegs}</span> из {maxRegs} участников
            </span>
          </div>

          {!isPast && maxRegs > 0 && (
            <div className="mt-6">
              <div 
                className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => onStatsClick && onStatsClick(event)}
              >
                <span className="flex items-center gap-2">
                  Заполненность 
                  <Eye className="w-4 h-4 opacity-60" />
                </span>
                <span className={`${getStatusColor()} font-bold`}>{Math.round(fillPercentage)}%</span>
              </div>
              <div 
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden cursor-pointer hover:h-4 transition-all duration-200"
                onClick={() => onStatsClick && onStatsClick(event)}
              >
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarGradient()} hover:shadow-lg`}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {(speakers.length > 0 || loadingSpeakers) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Спикеры:</p>
            {loadingSpeakers ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Загрузка спикеров...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {speakers.map((speaker) => {
                  const photoUrl = getSpeakerPhoto(speaker);
                  return (
                    <div 
                      key={speaker.id}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-full text-sm font-medium"
                    >
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={speaker.name}
                          className="w-6 h-6 rounded-full object-cover border-2 border-blue-200 dark:border-blue-600"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-blue-200 dark:bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      <span>{speaker.name || 'Без имени'}</span>
                    </div>
                  );
                })}
              </div>
            )}
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
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full"></div>
    </div>
    <span className="ml-3 text-gray-600 dark:text-gray-300 font-medium">Загрузка мероприятий...</span>
  </div>
);

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(7); // дней вперед
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastStats, setPastStats] = useState({});

  useEffect(() => {
    // Загрузка данных для дашборда
    setUpcomingEvents(mockEvents);
    setPastStats({
      totalEvents: 24,
      totalParticipants: 3420,
      avgFillRate: 87.3,
      topEvent: "React Conference 2024"
    });
  }, [dateRange]);

  const totalUpcoming = upcomingEvents.length;
  const totalRegistrations = upcomingEvents.reduce((sum, event) => sum + (event.registrations?.current || 0), 0);
  const avgFillRate = upcomingEvents.length > 0 
    ? upcomingEvents.reduce((sum, event) => {
        const fill = event.registrations?.max_regs > 0 
          ? (event.registrations.current / event.registrations.max_regs) * 100 
          : 0;
        return sum + fill;
      }, 0) / upcomingEvents.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-blue-500" />
            Дашборд мероприятий
          </h2>
          <p className="text-gray-