import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';

const mockData = [
  { date: '2024-01', visitors: 1200, events: 8, bookings: 45 },
  { date: '2024-02', visitors: 1800, events: 12, bookings: 62 },
  { date: '2024-03', visitors: 2400, events: 15, bookings: 78 },
  { date: '2024-04', visitors: 3100, events: 18, bookings: 95 },
];

const AdminAnalytics = () => {
  const [period] = useState('monthly');

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Статистика посещений</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Всего посетителей
          </h3>
          <p className="text-3xl font-semibold">8,500</p>
          <p className="text-sm text-green-600">+12.5% с прошлого месяца</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Проведено мероприятий
          </h3>
          <p className="text-3xl font-semibold">53</p>
          <p className="text-sm text-green-600">+8.2% с прошлого месяца</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Бронирований
          </h3>
          <p className="text-3xl font-semibold">280</p>
          <p className="text-sm text-green-600">+15.3% с прошлого месяца</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-6">Динамика показателей</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                stroke="#0ea5e9" 
                name="Посетители"
              />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#8b5cf6" 
                name="Мероприятия"
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#10b981" 
                name="Бронирования"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;