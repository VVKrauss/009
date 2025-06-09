import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  Filter,
  ChevronDown,
  Check
} from 'lucide-react';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// Types
type DateRange = '7days' | '30days' | '90days' | 'custom';
type ExportFormat = 'csv' | 'xlsx';
type ExportType = 'all' | 'visitors' | 'registrations';

interface PageVisit {
  page: string;
  visits: number;
  avgTimeSpent: number;
}

interface EventRegistration {
  eventId: string;
  eventTitle: string;
  adultRegistrations: number;
  childRegistrations: number;
  totalRegistrations: number;
  maxCapacity: number;
  paymentLinkClicks: number;
  conversionRate: number;
  revenue: number;
}

interface VisitorData {
  date: string;
  visitors: number;
  uniqueVisitors: number;
}

interface RegistrationData {
  date: string;
  registrations: number;
  revenue: number;
}

interface PagePopularity {
  name: string;
  value: number;
}

// Mock data generators
const generateMockVisitorData = (days: number): VisitorData[] => {
  const data: VisitorData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const baseVisitors = Math.floor(Math.random() * 100) + 50;
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      visitors: baseVisitors,
      uniqueVisitors: Math.floor(baseVisitors * 0.7)
    });
  }
  
  return data;
};

const generateMockRegistrationData = (days: number): RegistrationData[] => {
  const data: RegistrationData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const registrations = Math.floor(Math.random() * 20);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      registrations,
      revenue: registrations * (Math.floor(Math.random() * 500) + 500)
    });
  }
  
  return data;
};

const generateMockPageVisits = (): PageVisit[] => {
  return [
    { page: 'Главная', visits: 1245, avgTimeSpent: 120 },
    { page: 'Мероприятия', visits: 986, avgTimeSpent: 180 },
    { page: 'Спикеры', visits: 754, avgTimeSpent: 90 },
    { page: 'Аренда', visits: 432, avgTimeSpent: 150 },
    { page: 'Коворкинг', visits: 321, avgTimeSpent: 135 },
    { page: 'О нас', visits: 289, avgTimeSpent: 75 }
  ];
};

const generateMockEventRegistrations = (): EventRegistration[] => {
  return [
    { 
      eventId: '1', 
      eventTitle: 'Научный фестиваль', 
      adultRegistrations: 87, 
      childRegistrations: 32, 
      totalRegistrations: 119, 
      maxCapacity: 150, 
      paymentLinkClicks: 210, 
      conversionRate: 56.7,
      revenue: 59500
    },
    { 
      eventId: '2', 
      eventTitle: 'Лекция по астрофизике', 
      adultRegistrations: 45, 
      childRegistrations: 0, 
      totalRegistrations: 45, 
      maxCapacity: 50, 
      paymentLinkClicks: 78, 
      conversionRate: 57.7,
      revenue: 22500
    },
    { 
      eventId: '3', 
      eventTitle: 'Мастер-класс по робототехнике', 
      adultRegistrations: 28, 
      childRegistrations: 15, 
      totalRegistrations: 43, 
      maxCapacity: 60, 
      paymentLinkClicks: 95, 
      conversionRate: 45.3,
      revenue: 21500
    },
    { 
      eventId: '4', 
      eventTitle: 'Дискуссия о климатических изменениях', 
      adultRegistrations: 32, 
      childRegistrations: 0, 
      totalRegistrations: 32, 
      maxCapacity: 40, 
      paymentLinkClicks: 67, 
      conversionRate: 47.8,
      revenue: 16000
    },
    { 
      eventId: '5', 
      eventTitle: 'Научный квиз', 
      adultRegistrations: 56, 
      childRegistrations: 12, 
      totalRegistrations: 68, 
      maxCapacity: 80, 
      paymentLinkClicks: 112, 
      conversionRate: 60.7,
      revenue: 34000
    }
  ];
};

const generateMockPagePopularity = (): PagePopularity[] => {
  return [
    { name: 'Главная', value: 35 },
    { name: 'Мероприятия', value: 25 },
    { name: 'Спикеры', value: 15 },
    { name: 'Аренда', value: 10 },
    { name: 'Коворкинг', value: 10 },
    { name: 'О нас', value: 5 }
  ];
};

// Main component
const AdminAnalytics = () => {
  // State
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'visitors' | 'registrations'>('visitors');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportType, setExportType] = useState<ExportType>('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Data state
  const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
  const [registrationData, setRegistrationData] = useState<RegistrationData[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [pagePopularity, setPagePopularity] = useState<PagePopularity[]>([]);
  
  // Refs
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
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
  }, [dateRange, customStartDate, customEndDate]);
  
  // Fetch data based on date range
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would fetch data from Supabase
      // For now, we'll use mock data
      let days = 30;
      
      switch (dateRange) {
        case '7days':
          days = 7;
          break;
        case '30days':
          days = 30;
          break;
        case '90days':
          days = 90;
          break;
        case 'custom':
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          break;
      }
      
      setVisitorData(generateMockVisitorData(days));
      setRegistrationData(generateMockRegistrationData(days));
      setPageVisits(generateMockPageVisits());
      setEventRegistrations(generateMockEventRegistrations());
      setPagePopularity(generateMockPagePopularity());
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Ошибка при загрузке данных аналитики');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate totals
  const totalVisitors = visitorData.reduce((sum, day) => sum + day.visitors, 0);
  const totalUniqueVisitors = visitorData.reduce((sum, day) => sum + day.uniqueVisitors, 0);
  const totalRegistrations = registrationData.reduce((sum, day) => sum + day.registrations, 0);
  const totalRevenue = registrationData.reduce((sum, day) => sum + day.revenue, 0);
  
  // Calculate averages
  const avgDailyVisitors = Math.round(totalVisitors / visitorData.length);
  const avgTimeOnSite = Math.round(pageVisits.reduce((sum, page) => sum + page.avgTimeSpent, 0) / pageVisits.length);
  
  // Handle export
  const handleExport = (format: ExportFormat, type: ExportType) => {
    setExportFormat(format);
    setExportType(type);
    
    // In a real implementation, this would generate and download a file
    toast.success(`Экспорт данных в формате ${format.toUpperCase()} начат`);
    
    // Simulate download delay
    setTimeout(() => {
      toast.success(`Данные успешно экспортированы в формате ${format.toUpperCase()}`);
    }, 1500);
    
    setShowExportDropdown(false);
  };
  
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
          <div className="relative">
            <button
              onClick={() => setShowDateRangeDropdown(!showDateRangeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-md"
            >
              <Calendar className="h-5 w-5 text-gray-500" />
              <span>{formatDateRange()}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDateRangeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDateRangeDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setDateRange('7days');
                      setShowDateRangeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md ${dateRange === '7days' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-dark-700'}`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">Последние 7 дней</span>
                      {dateRange === '7days' && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setDateRange('30days');
                      setShowDateRangeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md ${dateRange === '30days' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-dark-700'}`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">Последние 30 дней</span>
                      {dateRange === '30days' && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setDateRange('90days');
                      setShowDateRangeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md ${dateRange === '90days' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-dark-700'}`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow">Последние 90 дней</span>
                      {dateRange === '90days' && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-dark-700 my-2 pt-2">
                    <div className={`px-3 py-2 rounded-md ${dateRange === 'custom' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                      <div className="flex items-center mb-2">
                        <span className="flex-grow font-medium">Произвольный период</span>
                        {dateRange === 'custom' && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Начало</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded dark:bg-dark-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Конец</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded dark:bg-dark-700"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setDateRange('custom');
                          setShowDateRangeDropdown(false);
                        }}
                        className="w-full mt-2 px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
                      >
                        Применить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-md hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Обновление...' : 'Обновить'}</span>
          </button>
          
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Экспорт</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-md shadow-lg z-10">
                <div className="p-3 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="font-medium text-sm">Формат экспорта</h3>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`px-3 py-1 text-sm rounded ${exportFormat === 'csv' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'}`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => setExportFormat('xlsx')}
                      className={`px-3 py-1 text-sm rounded ${exportFormat === 'xlsx' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'}`}
                    >
                      Excel
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2">Экспортировать данные</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExport(exportFormat, 'all')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
                    >
                      Полный отчет
                    </button>
                    <button
                      onClick={() => handleExport(exportFormat, 'visitors')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
                    >
                      Только посещения
                    </button>
                    <button
                      onClick={() => handleExport(exportFormat, 'registrations')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
                    >
                      Только регистрации
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего посещений</p>
                  <h3 className="text-3xl font-semibold mt-1">{totalVisitors.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(totalVisitors * 0.12).toLocaleString()} (12%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Уникальных посетителей</p>
                  <h3 className="text-3xl font-semibold mt-1">{totalUniqueVisitors.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(totalUniqueVisitors * 0.08).toLocaleString()} (8%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Среднее время на сайте</p>
                  <h3 className="text-3xl font-semibold mt-1">{Math.floor(avgTimeOnSite / 60)}:{(avgTimeOnSite % 60).toString().padStart(2, '0')}</h3>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(avgTimeOnSite * 0.05)} сек (5%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Посетителей в день</p>
                  <h3 className="text-3xl font-semibold mt-1">{avgDailyVisitors.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(avgDailyVisitors * 0.1).toLocaleString()} (10%) с прошлого периода
              </div>
            </div>
          </div>
          
          {/* Visitor trend chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика посещений</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={visitorData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUniqueVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      return format(parseISO(date), 'dd.MM');
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), '']}
                    labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy', { locale: ru })}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    name="Все посещения"
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    name="Уникальные посетители"
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorUniqueVisitors)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Page visits and popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-6">Посещаемость страниц</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Страница</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Посещения</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Среднее время</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                    {pageVisits.map((page, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{page.page}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{page.visits.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {Math.floor(page.avgTimeSpent / 60)}:{(page.avgTimeSpent % 60).toString().padStart(2, '0')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего регистраций</p>
                  <h3 className="text-3xl font-semibold mt-1">{totalRegistrations.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(totalRegistrations * 0.15).toLocaleString()} (15%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Общая выручка</p>
                  <h3 className="text-3xl font-semibold mt-1">{totalRevenue.toLocaleString()} ₽</h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round(totalRevenue * 0.18).toLocaleString()} ₽ (18%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Средний чек</p>
                  <h3 className="text-3xl font-semibold mt-1">
                    {totalRegistrations > 0 
                      ? Math.round(totalRevenue / totalRegistrations).toLocaleString() 
                      : 0} ₽
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +{Math.round((totalRevenue / totalRegistrations) * 0.05).toLocaleString()} ₽ (5%) с прошлого периода
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Конверсия</p>
                  <h3 className="text-3xl font-semibold mt-1">
                    {Math.round(
                      (eventRegistrations.reduce((sum, event) => sum + event.totalRegistrations, 0) / 
                      eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks, 0)) * 100
                    )}%
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                +3% с прошлого периода
              </div>
            </div>
          </div>
          
          {/* Registration trend chart */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Динамика регистраций и выручки</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={registrationData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      return format(parseISO(date), 'dd.MM');
                    }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'registrations') return [value.toLocaleString(), 'Регистрации'];
                      if (name === 'revenue') return [`${value.toLocaleString()} ₽`, 'Выручка'];
                      return [value, name];
                    }}
                    labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy', { locale: ru })}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="registrations" 
                    name="Регистрации"
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Выручка"
                    stroke="#82ca9d" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Event registrations */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Регистрации по мероприятиям</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Мероприятие</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Взрослые</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Дети</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Всего</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Заполнено</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Конверсия</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Выручка</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
                  {eventRegistrations.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{event.eventTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.adultRegistrations}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.childRegistrations}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.totalRegistrations}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className="mr-2">{Math.round((event.totalRegistrations / event.maxCapacity) * 100)}%</span>
                          <div className="w-24 bg-gray-200 dark:bg-dark-700 rounded-full h-2.5">
                            <div 
                              className="bg-primary-600 h-2.5 rounded-full" 
                              style={{ width: `${(event.totalRegistrations / event.maxCapacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.conversionRate.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{event.revenue.toLocaleString()} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Revenue projections */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Прогноз выручки</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-medium mb-4">Потенциальная выручка по заполняемости</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '25%', value: Math.round(eventRegistrations.reduce((sum, event) => sum + (event.revenue / (event.totalRegistrations / event.maxCapacity) * 0.25), 0)) },
                        { name: '50%', value: Math.round(eventRegistrations.reduce((sum, event) => sum + (event.revenue / (event.totalRegistrations / event.maxCapacity) * 0.5), 0)) },
                        { name: '75%', value: Math.round(eventRegistrations.reduce((sum, event) => sum + (event.revenue / (event.totalRegistrations / event.maxCapacity) * 0.75), 0)) },
                        { name: '100%', value: Math.round(eventRegistrations.reduce((sum, event) => sum + (event.revenue / (event.totalRegistrations / event.maxCapacity) * 1), 0)) },
                        { name: 'Текущая', value: eventRegistrations.reduce((sum, event) => sum + event.revenue, 0) }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value.toLocaleString()} ₽`, 'Выручка']} />
                      <Bar dataKey="value" name="Выручка" fill="#8884d8">
                        {[
                          { name: '25%', fill: '#8884d8' },
                          { name: '50%', fill: '#82ca9d' },
                          { name: '75%', fill: '#ffc658' },
                          { name: '100%', fill: '#ff8042' },
                          { name: 'Текущая', fill: '#0088FE' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h4 className="text-base font-medium mb-4">Заполняемость мероприятий</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={eventRegistrations.map(event => ({
                        name: event.eventTitle.length > 15 ? `${event.eventTitle.substring(0, 15)}...` : event.eventTitle,
                        current: Math.round((event.totalRegistrations / event.maxCapacity) * 100),
                        remaining: 100 - Math.round((event.totalRegistrations / event.maxCapacity) * 100)
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="current" name="Заполнено" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="remaining" name="Свободно" stackId="a" fill="#d3d3d3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conversion funnel */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-6">Воронка конверсии</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { 
                      name: 'Просмотры', 
                      value: eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks * 3, 0)
                    },
                    { 
                      name: 'Клики по оплате', 
                      value: eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks, 0)
                    },
                    { 
                      name: 'Регистрации', 
                      value: eventRegistrations.reduce((sum, event) => sum + event.totalRegistrations, 0)
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Количество']} />
                  <Bar dataKey="value" name="Количество" fill="#8884d8">
                    <Cell fill="#8884d8" />
                    <Cell fill="#82ca9d" />
                    <Cell fill="#ffc658" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h4 className="font-medium text-center mb-2">Просмотры → Клики</h4>
                <p className="text-2xl text-center font-semibold">
                  {Math.round(
                    (eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks, 0) / 
                    eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks * 3, 0)) * 100
                  )}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h4 className="font-medium text-center mb-2">Клики → Регистрации</h4>
                <p className="text-2xl text-center font-semibold">
                  {Math.round(
                    (eventRegistrations.reduce((sum, event) => sum + event.totalRegistrations, 0) / 
                    eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks, 0)) * 100
                  )}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <h4 className="font-medium text-center mb-2">Просмотры → Регистрации</h4>
                <p className="text-2xl text-center font-semibold">
                  {Math.round(
                    (eventRegistrations.reduce((sum, event) => sum + event.totalRegistrations, 0) / 
                    eventRegistrations.reduce((sum, event) => sum + event.paymentLinkClicks * 3, 0)) * 100
                  )}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;