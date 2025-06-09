import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface AnalyticsEventTableProps {
  events: EventRegistration[];
  onSort?: (field: keyof EventRegistration) => void;
  sortField?: keyof EventRegistration;
  sortDirection?: 'asc' | 'desc';
}

const AnalyticsEventTable = ({ 
  events, 
  onSort,
  sortField,
  sortDirection = 'asc'
}: AnalyticsEventTableProps) => {
  const handleSort = (field: keyof EventRegistration) => {
    if (onSort) {
      onSort(field);
    }
  };
  
  const renderSortIcon = (field: keyof EventRegistration) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
        <thead className="bg-gray-50 dark:bg-dark-700">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('eventTitle')}
            >
              <div className="flex items-center">
                <span>Мероприятие</span>
                {renderSortIcon('eventTitle')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('adultRegistrations')}
            >
              <div className="flex items-center">
                <span>Взрослые</span>
                {renderSortIcon('adultRegistrations')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('childRegistrations')}
            >
              <div className="flex items-center">
                <span>Дети</span>
                {renderSortIcon('childRegistrations')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('totalRegistrations')}
            >
              <div className="flex items-center">
                <span>Всего</span>
                {renderSortIcon('totalRegistrations')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('maxCapacity')}
            >
              <div className="flex items-center">
                <span>Заполнено</span>
                {renderSortIcon('maxCapacity')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('conversionRate')}
            >
              <div className="flex items-center">
                <span>Конверсия</span>
                {renderSortIcon('conversionRate')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('revenue')}
            >
              <div className="flex items-center">
                <span>Выручка</span>
                {renderSortIcon('revenue')}
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
          {events.map((event, index) => (
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <Link
                  to={`/admin/events/${event.eventId}/edit`}
                  className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsEventTable;