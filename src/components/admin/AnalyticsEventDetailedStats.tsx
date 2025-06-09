import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Users, 
  DollarSign, 
  Clock, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  TrendingUp, 
  ArrowRight, 
  ArrowDown 
} from 'lucide-react';

interface EventRegistration {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  adultRegistrations: number;
  childRegistrations: number;
  totalRegistrations: number;
  maxCapacity: number;
  paymentLinkClicks: number;
  conversionRate: number;
  revenue: number;
  registrationDetails: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    adultTickets: number;
    childTickets: number;
    totalAmount: number;
    status: boolean;
    createdAt: string;
  }>;
}

interface AnalyticsEventDetailedStatsProps {
  event: EventRegistration;
}

const AnalyticsEventDetailedStats = ({ event }: AnalyticsEventDetailedStatsProps) => {
  const [showAllRegistrations, setShowAllRegistrations] = useState(false);
  
  // Calculate statistics
  const fillRate = Math.round((event.totalRegistrations / event.maxCapacity) * 100);
  const remainingCapacity = event.maxCapacity - event.totalRegistrations;
  
  // Registration timeline data
  const registrationsByDay = event.registrationDetails.reduce((acc, reg) => {
    const date = reg.createdAt.split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0, revenue: 0 };
    }
    acc[date].count += reg.adultTickets + reg.childTickets;
    acc[date].revenue += reg.totalAmount;
    return acc;
  }, {} as Record<string, { date: string; count: number; revenue: number }>);
  
  const timelineData = Object.values(registrationsByDay).sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate daily stats
  const daysUntilEvent = Math.max(0, Math.round((new Date(event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const registrationsPerDay = daysUntilEvent > 0 ? event.totalRegistrations / daysUntilEvent : event.totalRegistrations;
  const projectedRegistrations = Math.min(event.maxCapacity, Math.round(event.totalRegistrations + (registrationsPerDay * daysUntilEvent)));
  
  return (
    <div className="space-y-8">
      {/* Event details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-medium">Дата и время</h4>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {format(new Date(event.eventDate), 'dd MMMM yyyy', { locale: ru })}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {event.eventTime}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-medium">Место проведения</h4>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {event.eventLocation}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-medium">Финансы</h4>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Выручка: {event.revenue.toLocaleString()} ₽
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Средний чек: {event.totalRegistrations > 0 
              ? Math.round(event.revenue / event.totalRegistrations).toLocaleString() 
              : 0} ₽
          </p>
        </div>
      </div>
      
      {/* Registration stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Всего регистраций</p>
              <h3 className="text-2xl font-semibold mt-1">{event.totalRegistrations}</h3>
            </div>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Взрослых: {event.adultRegistrations}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Детей: {event.childRegistrations}
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Заполняемость</p>
              <h3 className="text-2xl font-semibold mt-1">{fillRate}%</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${fillRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Осталось мест: {remainingCapacity}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Конверсия</p>
              <h3 className="text-2xl font-semibold mt-1">{event.conversionRate.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <ArrowDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Кликов по ссылке: {event.paymentLinkClicks}</p>
            <p>Регистраций: {event.totalRegistrations}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Прогноз</p>
              <h3 className="text-2xl font-semibold mt-1">{projectedRegistrations}</h3>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Дней до мероприятия: {daysUntilEvent}</p>
            <p>Регистраций в день: {registrationsPerDay.toFixed(1)}</p>
          </div>
        </div>
      </div>
      
      {/* Registration timeline */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-6">Динамика регистраций</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex items-end h-64 gap-1">
              {timelineData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary-600 rounded-t transition-all duration-300"
                    style={{ 
                      height: `${(day.count / Math.max(...timelineData.map(d => d.count))) * 200}px`,
                      minHeight: day.count > 0 ? '20px' : '0'
                    }}
                  ></div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 rotate-45 origin-left">
                    {format(new Date(day.date), 'dd.MM')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Registrations list */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Список регистраций</h3>
          <button
            onClick={() => setShowAllRegistrations(!showAllRegistrations)}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {showAllRegistrations ? 'Показать меньше' : 'Показать все'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Контакты</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Билеты</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Дата</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              {(showAllRegistrations ? event.registrationDetails : event.registrationDetails.slice(0, 5)).map((reg, index) => (
                <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-dark-700/50 ${!reg.status ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {reg.fullName}
                    {!reg.status && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Отменена
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{reg.email}</span>
                      </div>
                      {reg.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{reg.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex gap-3">
                      <span>Взрослых: {reg.adultTickets}</span>
                      <span>Детей: {reg.childTickets}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {reg.totalAmount.toLocaleString()} ₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(reg.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {event.registrationDetails.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Нет зарегистрированных участников</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsEventDetailedStats;