import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, ChevronLeft, ChevronRight, Grid, List, Clock, Plus } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, setHours, setMinutes, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  slot_details: {
    type?: 'event' | 'rent';
    title?: string;
    description?: string;
    booked?: boolean;
    user_name?: string;
    user_contact?: string;
  };
}

const AdminCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlotModal, setNewSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [newSlotData, setNewSlotData] = useState<Partial<TimeSlot>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '11:00',
    slot_details: {
      type: 'rent',
      title: '',
      booked: false
    }
  });

  const weekOptions = { 
    locale: ru, 
    weekStartsOn: 1 
  };

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const range = getDateRange();
      
      const { data, error } = await supabase
        .from('time_slots_table')
        .select('*')
        .gte('date', format(range.start, 'yyyy-MM-dd'))
        .lte('date', format(range.end, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      toast.error('Ошибка загрузки слотов');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    switch (viewMode) {
      case 'day': return { start: currentDate, end: currentDate };
      case 'week': return { 
        start: startOfWeek(currentDate, weekOptions), 
        end: endOfWeek(currentDate, weekOptions) 
      };
      case 'month': return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      default: return { start: currentDate, end: currentDate };
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [currentDate, viewMode]);

  const navigate = (direction: 'prev' | 'next') => {
    const navigators = {
      day: addDays,
      week: addWeeks,
      month: addMonths
    };
    setCurrentDate(navigators[viewMode](currentDate, direction === 'prev' ? -1 : 1));
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    const startAt = new Date(`${formattedDate}T${startTime}:00Z`).toISOString();
    const endAt = new Date(`${formattedDate}T${endTime}:00Z`).toISOString();
    
    setNewSlotData({
      date: formattedDate,
      start_time: startTime,
      end_time: endTime,
      start_at: startAt,
      end_at: endAt,
      slot_details: {
        type: 'rent',
        title: '',
        booked: false
      }
    });
    
    setEditingSlot(null);
    setNewSlotModal(true);
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setNewSlotData({
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      start_at: slot.start_at,
      end_at: slot.end_at,
      slot_details: {
        type: slot.slot_details.type,
        title: slot.slot_details.title,
        description: slot.slot_details.description,
        booked: slot.slot_details.booked
      }
    });
    setNewSlotModal(true);
  };

const createOrUpdateTimeSlot = async () => {
  try {
    if (!newSlotData.date || !newSlotData.start_time || !newSlotData.end_time) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const startAt = new Date(`${newSlotData.date}T${newSlotData.start_time}:00Z`).toISOString();
    const endAt = new Date(`${newSlotData.date}T${newSlotData.end_time}:00Z`).toISOString();

    // Проверка на корректность временного интервала
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error('Время окончания должно быть позже времени начала');
      return;
    }

    // Проверка на пересечение временных интервалов
    const { data: overlappingSlots, error: overlapError } = await supabase
      .from('time_slots_table')
      .select('*')
      .or(`and(start_at.lte.${endAt},end_at.gte.${startAt})`)
      .neq('id', editingSlot?.id || ''); // Исключаем текущий слот при редактировании

    if (overlapError) throw overlapError;

    if (overlappingSlots && overlappingSlots.length > 0) {
      // Формируем детальное сообщение о занятых слотах
      const overlappingDetails = overlappingSlots.map(slot => {
        const type = slot.slot_details?.type === 'event' ? 'Мероприятие' : 'Аренда';
        const title = slot.slot_details?.title || 'Без названия';
        const time = `${slot.start_time}-${slot.end_time}`;
        const description = slot.slot_details?.description ? `\nОписание: ${slot.slot_details.description}` : '';
        const clientInfo = slot.slot_details?.user_name ? `\nКлиент: ${slot.slot_details.user_name}` : '';
        
        return `• ${type}: ${title}\n  Время: ${time}${description}${clientInfo}`;
      }).join('\n\n');

      toast.error(
        `Выбранное время пересекается с существующими слотами:\n\n${overlappingDetails}\n\nПожалуйста, выберите другое время.`,
        { duration: 8000 } // Увеличиваем время показа уведомления
      );
      return;
    }

    if (editingSlot) {
      const { data, error } = await supabase
        .from('time_slots_table')
        .update({
          date: newSlotData.date,
          start_time: newSlotData.start_time,
          end_time: newSlotData.end_time,
          start_at: startAt,
          end_at: endAt,
          slot_details: newSlotData.slot_details
        })
        .eq('id', editingSlot.id)
        .select();

      if (error) throw error;
      toast.success('Слот успешно обновлен');
    } else {
      const { data, error } = await supabase
        .from('time_slots_table')
        .insert([{
          date: newSlotData.date,
          start_time: newSlotData.start_time,
          end_time: newSlotData.end_time,
          start_at: startAt,
          end_at: endAt,
          slot_details: {
            ...newSlotData.slot_details,
            type: 'rent'
          }
        }])
        .select();

      if (error) throw error;
      toast.success('Слот успешно создан');
    }
    
    setNewSlotModal(false);
    fetchTimeSlots();
  } catch (err) {
    console.error('Error saving time slot:', err);
    toast.error(editingSlot ? 'Ошибка обновления слота' : 'Ошибка создания слота');
  }
};
  

  
  const deleteTimeSlot = async (id: string, type?: string) => {
    if (type === 'event') {
      toast.error('Мероприятия можно удалять только через страницу управления мероприятиями');
      return;
    }

    if (!window.confirm('Вы точно хотите удалить этот слот?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots_table')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Слот удален');
      fetchTimeSlots();
    } catch (err) {
      console.error('Error deleting time slot:', err);
      toast.error('Ошибка удаления слота');
    }
  };

  const getSlotColorClasses = (type?: string) => {
    switch (type) {
      case 'event': return 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500';
      case 'rent': return 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500';
      default: return 'bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-300';
    }
  };

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    for (let hour = 9; hour < 23; hour++) {
      slots.push({
        time: setMinutes(setHours(date, hour), 0),
        label: `${hour}:00`
      });
    }
    return slots;
  };

  const renderMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, weekOptions);
    const endDate = endOfWeek(monthEnd, weekOptions);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {eachDayOfInterval({
          start: startDate,
          end: addDays(startDate, 6)
        }).map(day => (
          <div key={day.toString()} className="text-center py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {format(day, 'EEEEEE', { locale: ru })}
          </div>
        ))}
        
        {days.map(day => {
          const daySlots = timeSlots.filter(slot => 
            isSameDay(new Date(slot.date), day)
          );

          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div 
              key={day.toString()}
              onClick={() => {
                setCurrentDate(day);
                setViewMode('day');
              }}
              className={`min-h-24 p-1.5 border rounded-md flex flex-col cursor-pointer ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-dark-700 opacity-50' : 
                isDayToday ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600'
              }`}
            >
              <div className={`text-sm font-medium mb-1 self-end px-1 rounded-full ${
                isDayToday ? 'bg-primary text-white px-2' : ''
              }`}>
                {format(day, 'd')}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {daySlots.map(slot => (
                  <div 
                    key={slot.id}
                    data-tooltip-id={`tooltip-${slot.id}`}
                    data-tooltip-content={`${slot.slot_details.title || 'Слот'}\n${slot.start_time}-${slot.end_time}\n${slot.slot_details.description || ''}`}
                    className={`text-xs p-1 rounded cursor-pointer ${getSlotColorClasses(slot.slot_details.type)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (slot.slot_details.type === 'rent') {
                        handleEditSlot(slot);
                      }
                    }}
                  >
                    <div className="truncate">
                      {slot.start_time} - {slot.slot_details.title || 'Слот'}
                    </div>
                    <Tooltip id={`tooltip-${slot.id}`} className="z-50" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekDays = () => {
    const weekStart = startOfWeek(currentDate, weekOptions);
    const days = eachDayOfInterval({ 
      start: weekStart, 
      end: addDays(weekStart, 6) 
    });

    const groupedSlots = timeSlots.reduce((acc, slot) => {
      const date = slot.date;
      const title = slot.slot_details.title || 'Без названия';
      const key = `${date}-${title}`;
      
      if (!acc[key]) {
        acc[key] = {
          ...slot,
          slots: [slot]
        };
      } else {
        acc[key].slots.push(slot);
      }
      
      return acc;
    }, {} as Record<string, { slots: TimeSlot[] } & TimeSlot>);

    return (
      <div className="grid grid-cols-8 gap-1">
        <div className="row-span-25 pt-8 pr-2 text-right text-xs text-gray-500 dark:text-gray-400">
          {generateTimeSlots(currentDate).map((slot, i) => (
            <div key={i} className="h-12 flex items-center justify-end">
              {slot.label}
            </div>
          ))}
        </div>
        
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayGroupedSlots = Object.values(groupedSlots).filter(
            group => group.date === dayKey
          );

          return (
            <div 
              key={day.toString()}
              className={`col-span-1 ${isToday(day) ? 'bg-primary/5' : 'bg-white dark:bg-dark-800'}`}
            >
              <div className={`text-center py-2 border-b ${
                isToday(day) ? 'border-primary' : 'border-gray-200 dark:border-dark-600'
              }`}>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {format(day, 'EEEEEE', { locale: ru })}
                </div>
                <div className={`text-lg font-semibold ${
                  isToday(day) ? 'text-primary' : ''
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="relative">
                {generateTimeSlots(day).map((slot, i) => (
                  <div 
                    key={i} 
                    className="h-12 border-b border-gray-100 dark:border-dark-700 relative hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer"
                    onClick={() => handleTimeSlotClick(day, 9 + i)}
                  ></div>
                ))}

                {dayGroupedSlots.map((group, idx) => {
                  const firstSlot = group.slots[0];
                  const lastSlot = group.slots[group.slots.length - 1];
                  
                  const [startHour, startMin] = firstSlot.start_time.split(':').map(Number);
                  const [endHour, endMin] = lastSlot.end_time.split(':').map(Number);
                  
                  const startMinutes = startHour * 60 + startMin;
                  const endMinutes = endHour * 60 + endMin;
                  const top = (startMinutes - 9 * 60) / ((23 - 9) * 60) * 100;
                  const height = (endMinutes - startMinutes) / ((23 - 9) * 60) * 100;

                  return (
                    <div
                      key={idx}
                      data-tooltip-id={`tooltip-${group.id}`}
                      data-tooltip-content={`
                        ${group.slot_details.title || 'Слот'}\n
                        Время: ${firstSlot.start_time}-${lastSlot.end_time}\n
                        ${group.slot_details.description || ''}\n
                        ${group.slot_details.user_name ? `Клиент: ${group.slot_details.user_name}` : ''}
                      `}
                      className={`absolute left-0 right-0 mx-1 rounded p-1 text-xs overflow-hidden ${getSlotColorClasses(group.slot_details.type)}`}
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        zIndex: 10 + idx
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (group.slot_details.type === 'rent') {
                          handleEditSlot(group);
                        }
                      }}
                    >
                      <div className="font-medium truncate">
                        {firstSlot.start_time} {group.slot_details.title && `- ${group.slot_details.title}`}
                      </div>
                      {group.slot_details.type !== 'event' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTimeSlot(group.id, group.slot_details.type);
                          }}
                          className="absolute bottom-1 right-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Удалить
                        </button>
                      )}
                      <Tooltip 
                        id={`tooltip-${group.id}`} 
                        className="z-50 whitespace-pre-line" 
                        style={{ zIndex: 9999 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    const daySlots = timeSlots.filter(slot => slot.date === dayKey);

    const groupedSlots = daySlots.reduce((acc, slot) => {
      const title = slot.slot_details.title || 'Без названия';
      const key = title;
      
      if (!acc[key]) {
        acc[key] = {
          ...slot,
          slots: [slot]
        };
      } else {
        acc[key].slots.push(slot);
      }
      
      return acc;
    }, {} as Record<string, { slots: TimeSlot[] } & TimeSlot>);

    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <h2 className="text-xl font-semibold p-6 pb-4">
          {format(currentDate, 'EEEE, d MMMM yyyy', { locale: ru })}
        </h2>
        
        <div className="flex">
          <div className="w-16 flex-shrink-0 pr-2 text-right text-xs text-gray-500 dark:text-gray-400 pt-1">
            {generateTimeSlots(currentDate).map((slot, i) => (
              <div key={i} className="h-12 flex items-center justify-end">
                {slot.label}
              </div>
            ))}
          </div>
          
          <div className="flex-1 relative">
            {generateTimeSlots(currentDate).map((slot, i) => (
              <div 
                key={i} 
                className="h-12 border-b border-gray-100 dark:border-dark-700 relative hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer"
                onClick={() => handleTimeSlotClick(currentDate, 9 + i)}
              >
                {isToday(currentDate) && new Date().getHours() === slot.time.getHours() && (
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                    style={{ top: `${(new Date().getMinutes() / 60) * 100}%` }}
                  >
                    <div className="absolute -top-1.5 -left-1 w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                )}
              </div>
            ))}

            {Object.values(groupedSlots).map((group, idx) => {
              const firstSlot = group.slots[0];
              const lastSlot = group.slots[group.slots.length - 1];
              
              const [startHour, startMin] = firstSlot.start_time.split(':').map(Number);
              const [endHour, endMin] = lastSlot.end_time.split(':').map(Number);
              
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              const top = (startMinutes - 9 * 60) / ((23 - 9) * 60) * 100;
              const height = (endMinutes - startMinutes) / ((23 - 9) * 60) * 100;

              return (
                <div
                  key={idx}
                  data-tooltip-id={`tooltip-${group.id}`}
                  data-tooltip-content={`
                    ${group.slot_details.title || 'Слот'}\n
                    Время: ${firstSlot.start_time}-${lastSlot.end_time}\n
                    ${group.slot_details.description || ''}\n
                    ${group.slot_details.user_name ? `Клиент: ${group.slot_details.user_name}` : ''}
                  `}
                  className={`absolute left-2 right-2 rounded p-2 text-sm shadow-sm ${getSlotColorClasses(group.slot_details.type)}`}
                  style={{
                    top: `${top}%`,
                    height: `${height}%`,
                    zIndex: 10 + idx
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (group.slot_details.type === 'rent') {
                      handleEditSlot(group);
                    }
                  }}
                >
                  <div className="font-medium truncate">
                    {firstSlot.start_time} {group.slot_details.title && `- ${group.slot_details.title}`}
                  </div>
                  <div className="text-xs truncate">
                    {group.slot_details.description}
                  </div>
                  {group.slot_details.type !== 'event' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTimeSlot(group.id, group.slot_details.type);
                      }}
                      className="absolute bottom-1 right-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Удалить
                    </button>
                  )}
                  <Tooltip 
                    id={`tooltip-${group.id}`} 
                    className="z-50 whitespace-pre-line" 
                    style={{ zIndex: 9999 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Календарь слотов</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('prev')}
                className="p-2 rounded-md bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-lg font-medium min-w-[200px] text-center text-gray-800 dark:text-gray-200">
                {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: ru })}
                {viewMode === 'week' && `${format(startOfWeek(currentDate, weekOptions), 'd MMM')} - ${format(endOfWeek(currentDate, weekOptions), 'd MMM yyyy')}`}
                {viewMode === 'day' && format(currentDate, 'd MMMM yyyy', { locale: ru })}
              </div>
              
              <button 
                onClick={() => navigate('next')}
                className="p-2 rounded-md bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex rounded-md shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden bg-white dark:bg-dark-700">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-2 text-sm flex items-center gap-1 transition-colors ${
                  viewMode === 'day' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-dark-600'
                }`}
              >
                <Calendar className="w-4 h-4" /> День
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 text-sm flex items-center gap-1 transition-colors ${
                  viewMode === 'week' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-dark-600'
                }`}
              >
                <List className="w-4 h-4" /> Неделя
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm flex items-center gap-1 transition-colors ${
                  viewMode === 'month' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-dark-600'
                }`}
              >
                <Grid className="w-4 h-4" /> Месяц
              </button>
            </div>

            <button
              onClick={() => {
                setEditingSlot(null);
                const currentDateFormatted = format(currentDate, 'yyyy-MM-dd');
                const startAt = new Date(`${currentDateFormatted}T10:00:00Z`).toISOString();
                const endAt = new Date(`${currentDateFormatted}T11:00:00Z`).toISOString();
                
                setNewSlotData({
                  date: currentDateFormatted,
                  start_time: '10:00',
                  end_time: '11:00',
                  start_at: startAt,
                  end_at: endAt,
                  slot_details: {
                    type: 'rent',
                    title: '',
                    booked: false
                  }
                });
                setNewSlotModal(true);
              }}
              className="p-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Создать</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
            {viewMode === 'month' && renderMonthDays()}
            {viewMode === 'week' && renderWeekDays()}
            {viewMode === 'day' && renderDay()}
          </div>
        )}
      </div>

      {newSlotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {editingSlot ? 'Редактировать слот' : 'Создать новый слот'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Дата</label>
                <input
                  type="date"
                  value={newSlotData.date}
                  onChange={(e) => setNewSlotData({...newSlotData, date: e.target.value})}
                  className="w-full p-2 border rounded-md dark:bg-dark-700 border-gray-300 dark:border-dark-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Начало</label>
                  <input
                    type="time"
                    value={newSlotData.start_time}
                    onChange={(e) => setNewSlotData({...newSlotData, start_time: e.target.value})}
                    className="w-full p-2 border rounded-md dark:bg-dark-700 border-gray-300 dark:border-dark-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Конец</label>
                  <input
                    type="time"
                    value={newSlotData.end_time}
                    onChange={(e) => setNewSlotData({...newSlotData, end_time: e.target.value})}
                    className="w-full p-2 border rounded-md dark:bg-dark-700 border-gray-300 dark:border-dark-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Название</label>
                <input
                  type="text"
                  value={newSlotData.slot_details?.title || ''}
                  onChange={(e) => setNewSlotData({
                    ...newSlotData,
                    slot_details: {
                      ...newSlotData.slot_details,
                      title: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded-md dark:bg-dark-700 border-gray-300 dark:border-dark-600"
                  placeholder="Название аренды"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Описание</label>
                <textarea
                  value={newSlotData.slot_details?.description || ''}
                  onChange={(e) => setNewSlotData({
                    ...newSlotData,
                    slot_details: {
                      ...newSlotData.slot_details,
                      description: e.target.value
                    }
                  })}
                  className="w-full p-2 border rounded-md dark:bg-dark-700 border-gray-300 dark:border-dark-600"
                  rows={3}
                  placeholder="Дополнительная информация"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setNewSlotModal(false)}
                className="px-4 py-2 border rounded-md border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createOrUpdateTimeSlot}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingSlot ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarPage;