import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  RefreshCw, 
  Users, 
  Clock, 
  TrendingUp,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  ArrowLeft,
  ArrowRight,
  FileText
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

// Import analytics utilities and components
import { 
  fetchVisitorData, 
  fetchPagePopularity,
  exportAnalyticsData,
  DateRange
} from '../../utils/analyticsUtils';

import { supabase } from '../../lib/supabase';
import AnalyticsDateRangePicker from '../../components/admin/AnalyticsDateRangePicker';
import AnalyticsExportModal from '../../components/admin/AnalyticsExportModal';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import AnalyticsVisitorChart from '../../components/admin/AnalyticsVisitorChart';
import AnalyticsPagePopularityChart from '../../components/admin/AnalyticsPagePopularityChart';

// Types
interface PageVisit {
  page: string;
  title: string;
  visits: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  bounceRate: number;
  lastVisit: string;
}

interface PageVisitRaw {
  page: string;
  visits: number;
  unique_visitors: number;
  avg_time_spent: number;
  bounce_rate: number;
  last_visit: string;
}

interface TrafficByHour {
  hour: number;
  visits: number;
}

interface TrafficByDay {
  day: string;
  visits: number;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      <div className="absolute inset-0 w-8 h-8 border-2 border-primary-200 dark:border-primary-800 rounded-full"></div>
    </div>
    <span className="ml-3 text-gray-600 dark:text-gray-300 font-medium">Загрузка аналитики...</span>
  </div>
);

// Main component
const AdminWebsiteAnalytics = () => {
  // State
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Data state
  const [visitorData, setVisitorData] = useState<any[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [pagePopularity, setPagePopularity] = useState<any[]>([]);
  const [trafficByHour, setTrafficByHour] = useState<TrafficByHour[]>([]);
  const [trafficByDay, setTrafficByDay] = useState<TrafficByDay[]>([]);
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof PageVisit>('visits');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageTypeFilter, setPageTypeFilter] = useState<'all' | 'event' | 'non-event'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = new Date(customStartDate);
        return { 
          start: start.toISOString().split('T')[0], 
          end: end.toISOString().split('T')[0] 
        };
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    };
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
      
      // Convert to pie chart data
      const totalVisits = pages.reduce((sum, page) => sum + page.visits, 0);
      const popularityData = pages.slice(0, 6).map(page => ({
        name: page.page.replace(/^\//, '').replace(/\/$/, '') || 'Главная',
        value: Math.round((page.visits / totalVisits) * 100)
      }));
      setPagePopularity(popularityData);
      
      // Fetch detailed page visits
      const { data: detailedPages, error } = await supabase.rpc(
        'get_detailed_page_stats',
        {
          start_date: new Date(start).toISOString(),
          end_date: new Date(end).toISOString(),
          exclude_admin: true
        }
      );
      
      if (error) throw error;
      
      // Process page visits data
      const processedPages: PageVisit[] = await processPageVisits(detailedPages || []);
      setPageVisits(processedPages);
      
      // Fetch traffic by hour
      const { data: hourlyData, error: hourlyError } = await supabase.rpc(
        'get_traffic_by_hour',
        {
          start_date: new Date(start).toISOString(),
          end_date: new Date(end).toISOString(),
          exclude_admin: true
        }
      );
      
      if (hourlyError) throw hourlyError;
      
      setTrafficByHour(hourlyData || []);
      
      // Fetch traffic by day of week
      const { data: dayData, error: dayError } = await supabase.rpc(
        'get_traffic_by_day',
        {
          start_date: new Date(start).toISOString(),
          end_date: new Date(end).toISOString(),
          exclude_admin: true
        }
      );
      
      if (dayError) throw dayError;
      
      setTrafficByDay(dayData || []);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Ошибка при загрузке данных аналитики');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process page visits data
  const processPageVisits = async (rawData: PageVisitRaw[]): Promise<PageVisit[]> => {
    // Get event titles for event pages
    const eventPaths = rawData
      .filter(item => item.page.startsWith('/events/'))
      .map(item => {
        const match = item.page.match(/^\/events\/([a-zA-Z0-9-]+)$/);
        return match ? match[1] : null;
      })
      .filter(id => id !== null) as string[];
    
    let eventTitles: Record<string, string> = {};
    
    if (eventPaths.length > 0) {
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('id, title')
          .in('id', eventPaths);
        
        if (!error && events) {
          eventTitles = events.reduce((acc, event) => {
            acc[event.id] = event.title;
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (error) {
        console.error('Error fetching event titles:', error);
      }
    }
    
    // Process raw data
    return rawData.map(item => {
      let title = '';
      
      if (item.page === '/' || item.page === '') {
        title = 'Главная страница';
      } else if (item.page.startsWith('/events/')) {
        const eventId = item.page.replace('/events/', '');
        title = eventTitles[eventId] ? `Мероприятие: ${eventTitles[eventId]}` : 'Мероприятие';
      } else if (item.page === '/events') {
        title = 'Список мероприятий';
      } else if (item.page === '/speakers') {
        title = 'Список спикеров';
      } else if (item.page.startsWith('/speakers/')) {
        title = 'Профиль спикера';
      } else if (item.page === '/about') {
        title = 'О нас';
      } else if (item.page === '/rent') {
        title = 'Аренда';
      } else if (item.page === '/coworking') {
        title = 'Коворкинг';
      } else {
        title = item.page.replace(/^\//, '').replace(/\/$/, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
      
      return {
        page: item.page,
        title,
        visits: item.visits,
        uniqueVisitors: item.unique_visitors,
        avgTimeSpent: item.avg_time_spent,
        bounceRate: item.bounce_rate || 0,
        lastVisit: item.last_visit || new Date().toISOString()
      };
    });
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
  const handleExport = async (format: 'csv' | 'xlsx', type: 'all' | 'visitors' | 'registrations', dateRange: { startDate: string; endDate: string }) => {
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
  
  // Calculate averages
  const avgDailyVisitors = Math.round(totalVisitors / (visitorData.length || 1));
  const avgTimeOnSite = Math.round(pageVisits.reduce((sum, page) => sum + page.avgTimeSpent, 0) / (pageVisits.length || 1));
  const avgBounceRate = Math.round(pageVisits.reduce((sum, page) => sum + page.bounceRate, 0) / (pageVisits.length || 1));
  
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
        const startDate = new Date(customStartDate).toLocaleDateString('ru-RU');
        const endDate = new Date(customEndDate).toLocaleDateString('ru-RU');
        return `${startDate} - ${endDate}`;
    }
  };
  
  // Filter and sort page visits
  const filteredPageVisits = pageVisits
    .filter(page => {
      // Apply search filter
      const matchesSearch = 
        page.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply page type filter
      if (pageTypeFilter === 'all') return matchesSearch;
      if (pageTypeFilter === 'event') return matchesSearch && page.page.includes('/events/');
      if (pageTypeFilter === 'non-event') return matchesSearch && !page.page.includes('/events/');
      
      return matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });
  
  // Pagination
  const totalPages = Math.ceil(filteredPageVisits.length / itemsPerPage);
  const paginatedPageVisits = filteredPageVisits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle sort
  const handleSort = (field: keyof PageVisit) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent mb-4 font-heading">
            Посещение сайта
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Детальная статистика посещаемости страниц и поведения пользователей
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
          </p>
        </div>

        {/* Контролы */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Период: {formatDateRange()}
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
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg font-heading"
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Обновление...' : 'Обновить'}</span>
            </button>
            
            {/* Export button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-heading"
            >
              <Download className="h-5 w-5" />
              <span>Экспорт</span>
            </button>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-8">
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
                value={formatTime(avgTimeOnSite)}
                icon={<Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
                iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
                change={{
                  value: `${Math.round(avgTimeOnSite * 0.05)} сек`,
                  percentage: 5,
                  isPositive: true
                }}
              />
              
              <AnalyticsCard
                title="Средний показатель отказов"
                value={`${avgBounceRate}%`}
                icon={<TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
                change={{
                  value: `${Math.round(avgBounceRate * 0.1)}%`,
                  percentage: 10,
                  isPositive: false
                }}
              />
            </div>
            
            {/* Visitor trend chart */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <BarChart3 className="w-6 h-6 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Динамика посещений</h3>
              </div>
              <AnalyticsVisitorChart data={visitorData} height={320} />
            </div>
            
            {/* Traffic patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-primary-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Посещения по часам</h3>
                </div>
                <div className="h-64">
                  <div className="w-full h-full flex items-end">
                    {trafficByHour.map((hour) => (
                      <div key={hour.hour} className="flex-1 flex flex-col items-center group">
                        <div className="w-full px-1">
                          <div 
                            className="w-full bg-primary-500 hover:bg-primary-600 rounded-t transition-all duration-300"
                            style={{ 
                              height: `${Math.max(5, (hour.visits / Math.max(...trafficByHour.map(h => h.visits))) * 200)}px` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {hour.hour}:00
                        </div>
                        <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {hour.visits} посещений
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <Calendar className="w-6 h-6 text-primary-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Посещения по дням недели</h3>
                </div>
                <div className="h-64">
                  <div className="w-full h-full flex items-end">
                    {trafficByDay.map((day) => (
                      <div key={day.day} className="flex-1 flex flex-col items-center group">
                        <div className="w-full px-1">
                          <div 
                            className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-300"
                            style={{ 
                              height: `${Math.max(5, (day.visits / Math.max(...trafficByDay.map(d => d.visits))) * 200)}px` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {day.day.substring(0, 2)}
                        </div>
                        <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {day.visits} посещений
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page popularity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <PieChart className="w-6 h-6 text-primary-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Популярность страниц</h3>
                </div>
                <div className="h-64">
                  <AnalyticsPagePopularityChart data={pagePopularity} height={250} />
                </div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <Activity className="w-6 h-6 text-primary-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Самые посещаемые страницы</h3>
                </div>
                <div className="space-y-4">
                  {pageVisits
                    .sort((a, b) => b.visits - a.visits)
                    .slice(0, 5)
                    .map((page, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{page.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{page.page}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{page.visits.toLocaleString()}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">посещений</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Page visits table */}
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <FileText className="w-6 h-6 text-primary-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Детальная статистика по страницам</h3>
              </div>
              
              {/* Table controls */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по страницам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700"
                  />
                </div>
                
                <div className="flex gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-800"
                    >
                      <Filter className="h-5 w-5" />
                      <span>Тип страницы</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isFilterOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => {
                            setPageTypeFilter('all');
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 ${pageTypeFilter === 'all' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                        >
                          Все страницы
                        </button>
                        <button
                          onClick={() => {
                            setPageTypeFilter('event');
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 ${pageTypeFilter === 'event' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                        >
                          Только мероприятия
                        </button>
                        <button
                          onClick={() => {
                            setPageTypeFilter('non-event');
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 ${pageTypeFilter === 'non-event' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                        >
                          Кроме мероприятий
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-800"
                  >
                    <option value={10}>10 на странице</option>
                    <option value={25}>25 на странице</option>
                    <option value={50}>50 на странице</option>
                    <option value={100}>100 на странице</option>
                  </select>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          <span>Страница</span>
                          {sortField === 'title' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('visits')}
                      >
                        <div className="flex items-center">
                          <span>Посещения</span>
                          {sortField === 'visits' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('uniqueVisitors')}
                      >
                        <div className="flex items-center">
                          <span>Уникальные</span>
                          {sortField === 'uniqueVisitors' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('avgTimeSpent')}
                      >
                        <div className="flex items-center">
                          <span>Среднее время</span>
                          {sortField === 'avgTimeSpent' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('bounceRate')}
                      >
                        <div className="flex items-center">
                          <span>Отказы</span>
                          {sortField === 'bounceRate' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('lastVisit')}
                      >
                        <div className="flex items-center">
                          <span>Последний визит</span>
                          {sortField === 'lastVisit' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" />
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                    {paginatedPageVisits.map((page, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{page.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{page.page}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {page.visits.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {page.uniqueVisitors.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatTime(page.avgTimeSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            page.bounceRate > 70 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : page.bounceRate > 40
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {page.bounceRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(page.lastVisit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Показано {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPageVisits.length)} из {filteredPageVisits.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 dark:border-dark-600 disabled:opacity-50"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md border border-gray-300 dark:border-dark-600 disabled:opacity-50"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
};

export default AdminWebsiteAnalytics;