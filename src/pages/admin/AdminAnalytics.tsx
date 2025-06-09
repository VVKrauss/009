import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText,
  CalendarCheck,
  CalendarClock,
  Building,
  ArrowRight
} from 'lucide-react';
import { format, subDays, parseISO, addDays, isAfter, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Import analytics utilities and components
import { 
  fetchVisitorData, 
  fetchRegistrationData, 
  fetchEventRegistrations, 
  fetchPagePopularity,
  fetchRentalBookings,
  exportAnalyticsData,
  VisitorData,
  RegistrationData,
  PageVisit,
  EventRegistration,
  PagePopularity,
  RentalBooking,
  DateRange
} from '../../utils/analyticsUtils';

import AnalyticsDateRangePicker from '../../components/admin/AnalyticsDateRangePicker';
import AnalyticsExportModal from '../../components/admin/AnalyticsExportModal';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import AnalyticsVisitorChart from '../../components/admin/AnalyticsVisitorChart';
import AnalyticsRegistrationChart from '../../components/admin/AnalyticsRegistrationChart';
import AnalyticsPageVisitsTable from '../../components/admin/AnalyticsPageVisitsTable';
import AnalyticsEventTable from '../../components/admin/AnalyticsEventTable';
import AnalyticsRevenueForecast from '../../components/admin/AnalyticsRevenueForecast';
import AnalyticsCapacityChart from '../../components/admin/AnalyticsCapacityChart';
import AnalyticsConversionFunnel from '../../components/admin/AnalyticsConversionFunnel';
import AnalyticsPagePopularityChart from '../../components/admin/AnalyticsPagePopularityChart';
import AnalyticsRentalBookingsChart from '../../components/admin/AnalyticsRentalBookingsChart';
import AnalyticsEventDetailedStats from '../../components/admin/AnalyticsEventDetailedStats';

// Main component
const AdminAnalytics = () => {
  // State
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'visitors' | 'upcoming' | 'past' | 'nearest' | 'rental'>('visitors');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Data state
  const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
  const [registrationData, setRegistrationData] = useState<RegistrationData[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [pagePopularity, setPagePopularity] = useState<PagePopularity[]>([]);
  const [rentalBookings, setRentalBookings] = useState<RentalBooking[]>([]);
  
  // Refs
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effects
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh
    refreshTimerRef.current = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [dateRange, customStartDate, customEndDate]);
  
  // Get date range
  const getDateRange = () => {
    const end = new Date();
    let start;
    
    switch (dateRange) {
      case '7days':
        start = subDays(end, 7);
        break;
      case '30days':
        start = subDays(end, 30);
        break;
      case '90days':
        start = subDays(end, 90);
        break;
      case 'custom':
        start = new Date(customStartDate);
        return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
      default:
        start = subDays(end, 30);
    }
    
    return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
  };
  
  // Fetch data based on date range
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const { start, end } = getDateRange();
      
      // Fetch visitor data
      const visitors = await fetchVisitorData(start, end);
      setVisitorData(visitors);
      
      // Fetch page popularity
      const pages = await fetchPagePopularity(start, end);
      setPageVisits(pages);
      
      // Convert to pie chart data
      const totalVisits = pages.reduce((sum, page) => sum + page.visits, 0);
      const popularityData = pages.slice(0, 6).map(page => ({
        name: page.page.replace(/^\//, '').replace(/\/$/, '') || 'Главная',
        value: Math.round((page.visits / totalVisits) * 100)
      }));
      setPagePopularity(popularityData);
      
      // Fetch registration data
      const registrations = await fetchRegistrationData(start, end);
      setRegistrationData(registrations);
      
      // Fetch event registrations
      const events = await fetchEventRegistrations();
      setEventRegistrations(events);
      
      // Fetch rental bookings
      const bookings = await fetchRentalBookings(start, end);
      setRentalBookings(bookings);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Ошибка при загрузке данных аналитики');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: { type: DateRange; startDate?: string; endDate?: string }) => {
    setDateRange(range.type);
    
    if (range.type === 'custom' && range.startDate && range.endDate) {
      setCustomStartDate(range.startDate);
      setCustomEndDate(range.endDate);
    }
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx', type: 'all' | 'visitors' | 'registrations' | 'rental', dateRange: { startDate: string; endDate: string }) => {
    try {
      toast.loading('Подготовка данных для экспорта...');
      
      const blob = await exportAnalyticsData(
        format, 
        type, 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.dismiss();
      toast.success(`Данные успешно экспортированы в формате ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.dismiss();
      toast.error('Ошибка при экспорте данных');
    }
  };
  
  // Calculate totals
  const totalVisitors = visitorData.reduce((sum, day) => sum + day.visitors, 0);
  const totalUniqueVisitors = visitorData.reduce((sum, day) => sum + day.uniqueVisitors, 0);
  const totalRegistrations = registrationData.reduce((sum, day) => sum + day.registrations, 0);
  const totalRevenue = registrationData.reduce((sum, day) => sum + day.revenue, 0);
  
  // Calculate averages
  const avgDailyVisitors = Math.round(totalVisitors / (visitorData.length || 1));
  const avgTimeOnSite = Math.round(pageVisits.reduce((sum, page) => sum + page.avgTimeSpent, 0) / (pageVisits.length || 1));
  
  // Format date for display
  const formatDateRange = () => {
    switch (dateRange) {
      case '7days':
        return 'Последние 7 дней';
      case '30days':
        return 'Последние 30 дней';
      case '90days':
        return 'Последние 90 дней';
      case 'custom':
        return `${format(parseISO(customStartDate), 'dd.MM.yyyy')} - ${format(parseISO(customEndDate), 'dd.MM.yyyy')}`;
    }
  };
  
  // Separate events into past, upcoming, and nearest
  const today = new Date();
  
  const pastEvents = eventRegistrations.filter(event => {
    const eventDate = new Date(event.eventDate);
    return isBefore(eventDate, today);
  });
  
  const upcomingEvents = eventRegistrations.filter(event => {
    const eventDate = new Date(event.eventDate);
    return isAfter(eventDate, today);
  }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  
  const nearestEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  
  // Calculate rental statistics
  const totalRentalBookings = rentalBookings.length;
  const totalRentalHours = rentalBookings.reduce((sum, booking) => sum + booking.durationHours, 0);
  const totalRentalRevenue = rentalBookings.reduce((sum, booking) => sum + booking.revenue, 0);
  const avgBookingDuration = totalRentalHours / (totalRentalBookings || 1);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Аналитика</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Последнее обновление: {format(lastUpdated, 'dd.MM.yyyy HH:mm')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Date range selector */}
          <AnalyticsDateRangePicker 
            onChange={handleDateRangeChange}
            initialRange={dateRange}
          />
          
          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Обновление...' : 'Обновить'}</span>
          </button>
          
          {/* Export button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'visitors' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Посещаемость</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'upcoming' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              <span>Предстоящие мероприятия</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'past' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Прошедшие мероприятия</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('nearest')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'nearest' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Ближайшее мероприятие</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rental')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'rental' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Аренда помещений</span>
            </div>
          </button>
        </nav>
      </div>
      
      {/* Visitor Analytics */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Всего посещений"
              value={totalVisitors.toLocaleString()}
              icon={<Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
              change={{
                value: Math.round(totalVisitors * 0.12).toLocaleString(),
                percentage: 12,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Уникальных посетителей"
              value={totalUniqueVisitors.toLocaleString()}
              icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
              change={{
                value: Math.round(totalUniqueVisitors * 0.08).toLocaleString(),
                percentage: 8,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Среднее время на сайте"
              value={`${Math.floor(avgTimeOnSite / 60)}:${(avgTimeOnSite % 60).toString().padStart(2, '0')}`}
              icon={<Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
              change={{
                value: `${Math.round(avgTimeOnSite * 0.05)} сек`,
                percentage: 5,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Посетителей в день"
              value={avgDailyVisitors.toLocaleString()}
              icon={<TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
              change={{
                value: Math.round(avgDailyVisitors * 0.1).toLocaleString(),
                percentage: 10,
                isPositive: true
              }}
            />
          </div>
          
          {/* Visitor trend chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика посещений</h3>
            <AnalyticsVisitorChart data={visitorData} height={320} />
          </div>
          
          {/* Page visits and popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Посещаемость страниц</h3>
              <AnalyticsPageVisitsTable pageVisits={pageVisits} />
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Популярность страниц</h3>
              <div className="h-64">
                <AnalyticsPagePopularityChart data={pagePopularity} height={250} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upcoming Events Analytics */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Предстоящих мероприятий"
              value={upcomingEvents.length.toString()}
              icon={<Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
            />
            
            <AnalyticsCard
              title="Всего регистраций"
              value={upcomingEvents.reduce((sum, event) => sum + event.totalRegistrations, 0).toLocaleString()}
              icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            />
            
            <AnalyticsCard
              title="Средняя заполняемость"
              value={`${Math.round(upcomingEvents.reduce((sum, event) => 
                sum + (event.totalRegistrations / event.maxCapacity) * 100, 0) / (upcomingEvents.length || 1))}%`}
              icon={<TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
            />
            
            <AnalyticsCard
              title="Ожидаемая выручка"
              value={`${upcomingEvents.reduce((sum, event) => sum + event.revenue, 0).toLocaleString()} ₽`}
              icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
            />
          </div>
          
          {/* Upcoming events table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Предстоящие мероприятия</h3>
              <Link 
                to="/admin/events/new" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <span>Создать мероприятие</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <AnalyticsEventTable events={upcomingEvents} />
          </div>
          
          {/* Capacity chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Заполняемость мероприятий</h3>
            <AnalyticsCapacityChart events={upcomingEvents} height={350} />
          </div>
          
          {/* Revenue forecast */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Прогноз выручки</h3>
            <AnalyticsRevenueForecast events={upcomingEvents} height={300} />
          </div>
        </div>
      )}
      
      {/* Past Events Analytics */}
      {activeTab === 'past' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Прошедших мероприятий"
              value={pastEvents.length.toString()}
              icon={<Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
            />
            
            <AnalyticsCard
              title="Всего участников"
              value={pastEvents.reduce((sum, event) => sum + event.totalRegistrations, 0).toLocaleString()}
              icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            />
            
            <AnalyticsCard
              title="Средняя заполняемость"
              value={`${Math.round(pastEvents.reduce((sum, event) => 
                sum + (event.totalRegistrations / event.maxCapacity) * 100, 0) / (pastEvents.length || 1))}%`}
              icon={<TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
            />
            
            <AnalyticsCard
              title="Общая выручка"
              value={`${pastEvents.reduce((sum, event) => sum + event.revenue, 0).toLocaleString()} ₽`}
              icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
            />
          </div>
          
          {/* Past events table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Прошедшие мероприятия</h3>
            <AnalyticsEventTable events={pastEvents} />
          </div>
          
          {/* Conversion funnel */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Воронка конверсии</h3>
            <AnalyticsConversionFunnel events={pastEvents} height={250} />
          </div>
          
          {/* Registration trend chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика регистраций и выручки</h3>
            <AnalyticsRegistrationChart data={registrationData} height={320} />
          </div>
        </div>
      )}
      
      {/* Nearest Event Analytics */}
      {activeTab === 'nearest' && (
        <div className="space-y-6">
          {nearestEvent ? (
            <>
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{nearestEvent.eventTitle}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {format(new Date(nearestEvent.eventDate), 'dd MMMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <Link 
                    to={`/admin/events/${nearestEvent.eventId}/edit`}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                  >
                    Редактировать мероприятие
                  </Link>
                </div>
                
                <AnalyticsEventDetailedStats event={nearestEvent} />
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Нет предстоящих мероприятий</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Создайте новое мероприятие, чтобы увидеть подробную аналитику
              </p>
              <Link 
                to="/admin/events/new"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors inline-flex items-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Создать мероприятие</span>
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Rental Analytics */}
      {activeTab === 'rental' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Всего бронирований"
              value={totalRentalBookings.toString()}
              icon={<Building className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
              change={{
                value: Math.round(totalRentalBookings * 0.15).toString(),
                percentage: 15,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Общая выручка"
              value={`${totalRentalRevenue.toLocaleString()} ₽`}
              icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
              change={{
                value: `${Math.round(totalRentalRevenue * 0.12).toLocaleString()} ₽`,
                percentage: 12,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Общее время аренды"
              value={`${Math.floor(totalRentalHours)} ч.`}
              icon={<Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
              change={{
                value: `${Math.round(totalRentalHours * 0.08)} ч.`,
                percentage: 8,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Средняя длительность"
              value={`${avgBookingDuration.toFixed(1)} ч.`}
              icon={<Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
              change={{
                value: `${(avgBookingDuration * 0.05).toFixed(1)} ч.`,
                percentage: 5,
                isPositive: true
              }}
            />
          </div>
          
          {/* Rental bookings chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика бронирований</h3>
            <AnalyticsRentalBookingsChart bookings={rentalBookings} height={320} />
          </div>
          
          {/* Rental bookings by day of week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Бронирования по дням недели</h3>
              <div className="h-64">
                <AnalyticsRentalBookingsChart 
                  bookings={rentalBookings} 
                  height={250} 
                  groupBy="dayOfWeek" 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Бронирования по времени суток</h3>
              <div className="h-64">
                <AnalyticsRentalBookingsChart 
                  bookings={rentalBookings} 
                  height={250} 
                  groupBy="timeOfDay" 
                />
              </div>
            </div>
          </div>
          
          {/* Rental bookings table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Последние бронирования</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Время</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Длительность</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Стоимость</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                  {rentalBookings.slice(0, 10).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {format(new Date(booking.date), 'dd.MM.yyyy', { locale: ru })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {booking.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {booking.durationHours.toFixed(1)} ч.
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {booking.revenue.toLocaleString()} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      <AnalyticsExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        defaultDateRange={{
          startDate: customStartDate,
          endDate: customEndDate
        }}
      />
    </div>
  );
};

export default AdminAnalytics;