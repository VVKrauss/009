import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

const AnalyticsCapacityChart = ({ events, height = 300 }: AnalyticsCapacityChartProps) => {
  const data = events.map(event => ({
    name: event.eventTitle.length > 15 ? `${event.eventTitle.substring(0, 15)}...` : event.eventTitle,
    current: Math.round((event.totalRegistrations / event.maxCapacity) * 100),
    remaining: 100 - Math.round((event.totalRegistrations / event.maxCapacity) * 100)
  }));
  
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
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
  );
};

export default AnalyticsCapacityChart;