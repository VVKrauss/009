import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';

// Import analytics utilities and components
import { 
  fetchVisitorData, 
  fetchRegistrationData, 
  fetchEventRegistrations, 
  fetchPagePopularity,
  exportAnalyticsData,
  VisitorData,
  RegistrationData,
  PageVisit,
  EventRegistration,
  PagePopularity,
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

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Main component
const AdminAnalytics = () => {
  // State
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'visitors' | 'registrations'>('visitors');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Data state
  const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
  const [registrationData, setRegistrationData] = useState<RegistrationData[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [pagePopularity, setPagePopularity] = useState<PagePopularity[]>([]);
  
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
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'visitors' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            Посещаемость
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'registrations' ? 'border-primary-600 text-primary-600' : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-gray-300'}`}
          >
            Регистрации
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pagePopularity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pagePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Доля посещений']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Registration Analytics */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Всего регистраций"
              value={totalRegistrations.toLocaleString()}
              icon={<Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
              change={{
                value: Math.round(totalRegistrations * 0.15).toLocaleString(),
                percentage: 15,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Общая выручка"
              value={`${totalRevenue.toLocaleString()} ₽`}
              icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
              change={{
                value: `${Math.round(totalRevenue * 0.18).toLocaleString()} ₽`,
                percentage: 18,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Средний чек"
              value={`${totalRegistrations > 0 
                ? Math.round(totalRevenue / totalRegistrations).toLocaleString() 
                : 0} ₽`}
              icon={<DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
              change={{
                value: `${Math.round((totalRevenue / totalRegistrations) * 0.05).toLocaleString()} ₽`,
                percentage: 5,
                isPositive: true
              }}
            />
            
            <AnalyticsCard
              title="Конверсия"
              value={`${Math.round(
                (eventRegistrations.reduce((sum, event) => sum + event.totalRegistrations, 0) / 
                Math.max(1, eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks, 0))) * 100
              )}%`}
              icon={<TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
              iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
              change={{
                value: "3%",
                percentage: 3,
                isPositive: true
              }}
            />
          </div>
          
          {/* Registration trend chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика регистраций и выручки</h3>
            <AnalyticsRegistrationChart data={registrationData} height={320} />
          </div>
          
          {/* Event registrations */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Регистрации по мероприятиям</h3>
            <AnalyticsEventTable events={eventRegistrations} />
          </div>
          
          {/* Revenue projections */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Прогноз выручки</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-medium mb-4">Потенциальная выручка по заполняемости</h4>
                <AnalyticsRevenueForecast events={eventRegistrations} height={250} />
              </div>
              
              <div>
                <h4 className="text-base font-medium mb-4">Заполняемость мероприятий</h4>
                <AnalyticsCapacityChart events={eventRegistrations} height={250} />
              </div>
            </div>
          </div>
          
          {/* Conversion funnel */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Воронка конверсии</h3>
            <AnalyticsConversionFunnel events={eventRegistrations} height={250} />
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