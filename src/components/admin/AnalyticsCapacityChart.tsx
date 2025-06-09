import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useTheme } from '@mui/material/styles';

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

interface AnalyticsCapacityChartProps {
  events: EventRegistration[];
  height?: number;
}

const AnalyticsCapacityChart = ({ events, height = 400 }: AnalyticsCapacityChartProps) => {
  const theme = useTheme();
  
  const data = events.map(event => ({
    name: event.eventTitle.length > 15 ? `${event.eventTitle.substring(0, 15)}...` : event.eventTitle,
    fullName: event.eventTitle,
    current: event.totalRegistrations,
    remaining: event.maxCapacity - event.totalRegistrations,
    percentage: Math.round((event.totalRegistrations / event.maxCapacity) * 100),
    maxCapacity: event.maxCapacity
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '4px',
          boxShadow: theme.shadows[1]
        }}>
          <p><strong>{data.fullName}</strong></p>
          <p>Зарегистрировано: {data.current} / {data.maxCapacity}</p>
          <p>Заполнено: {data.percentage}%</p>
          <p>Свободных мест: {data.remaining}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // Увеличил bottom margin для длинных названий
          barGap={0}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            type="category" 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 10)]} // Добавляем 10% сверху
            tickFormatter={(value) => `${value}`}
            label={{ 
              value: 'Количество участников', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => (
              <span style={{ color: theme.palette.text.primary }}>
                {value === 'current' ? 'Зарегистрировано' : 'Свободно'}
              </span>
            )}
          />
          <Bar 
            name="current" 
            dataKey="current" 
            stackId="a" 
            label={{ position: 'top', formatter: (value) => `${value}` }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={theme.palette.success.main} />
            ))}
          </Bar>
          <Bar 
            name="remaining" 
            dataKey="remaining" 
            stackId="a" 
            label={{ 
              position: 'top', 
              formatter: (value, name, props) => {
                const { payload } = props;
                return `${Math.round((payload.current / payload.maxCapacity) * 100)}%`;
              }
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={theme.palette.grey[300]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsCapacityChart;