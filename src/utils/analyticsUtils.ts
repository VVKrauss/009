import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

// Types
export interface VisitorData {
  date: string;
  visitors: number;
  uniqueVisitors: number;
}

export interface RegistrationData {
  date: string;
  registrations: number;
  revenue: number;
}

export interface PageVisit {
  page: string;
  visits: number;
  avgTimeSpent: number;
}

export interface EventRegistration {
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

export interface PagePopularity {
  name: string;
  value: number;
}

export type DateRange = '7days' | '30days' | '90days' | 'custom';
export type ExportFormat = 'csv' | 'xlsx';
export type ExportType = 'all' | 'visitors' | 'registrations';

// Track page view
export const trackPageView = async (path: string, isAdmin: boolean = false) => {
  try {
    const sessionId = getOrCreateSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    // Use the Edge Function to track page view
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-page-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        path,
        user_id: user?.id || null,
        session_id: sessionId,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        is_admin: isAdmin
      })
    });

    if (!response.ok) {
      throw new Error(`Error tracking page view: ${response.statusText}`);
    }
    
    console.log('Page view tracked:', path);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Update time spent on page
export const updateTimeSpent = async (sessionId: string, path: string, timeSpent: number) => {
  try {
    // Use the Edge Function to update time spent
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-time-spent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        path,
        time_spent: timeSpent
      })
    });

    if (!response.ok) {
      throw new Error(`Error updating time spent: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating time spent:', error);
  }
};

// Get or create session ID
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Fetch visitor data from Supabase
export const fetchVisitorData = async (startDate: string, endDate: string): Promise<VisitorData[]> => {
  try {
    const { data, error } = await supabase.rpc(
      'get_page_view_stats',
      {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        exclude_admin: true
      }
    );
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    return [];
  }
};

// Fetch page popularity data
export const fetchPagePopularity = async (startDate: string, endDate: string): Promise<PageVisit[]> => {
  try {
    const { data, error } = await supabase.rpc(
      'get_page_popularity',
      {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        exclude_admin: true
      }
    );
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching page popularity:', error);
    return [];
  }
};

// Fetch registration data from Supabase
export const fetchRegistrationData = async (startDate: string, endDate: string): Promise<RegistrationData[]> => {
  try {
    // Get all events with registrations
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, registrations_list, date, price, currency')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (eventsError) throw eventsError;
    
    // Process registration data by date
    const registrationsByDate = new Map<string, { registrations: number; revenue: number }>();
    
    events?.forEach(event => {
      const date = event.date;
      const registrations = event.registrations_list || [];
      
      registrations.forEach((reg: any) => {
        if (reg.status) {
          const regDate = reg.created_at ? reg.created_at.split('T')[0] : date;
          const totalTickets = (reg.adult_tickets || 0) + (reg.child_tickets || 0);
          const revenue = reg.total_amount || 0;
          
          if (!registrationsByDate.has(regDate)) {
            registrationsByDate.set(regDate, { registrations: 0, revenue: 0 });
          }
          
          const current = registrationsByDate.get(regDate)!;
          registrationsByDate.set(regDate, {
            registrations: current.registrations + totalTickets,
            revenue: current.revenue + revenue
          });
        }
      });
    });
    
    // Convert to array and sort by date
    const result: RegistrationData[] = Array.from(registrationsByDate.entries())
      .map(([date, data]) => ({
        date,
        registrations: data.registrations,
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error('Error fetching registration data:', error);
    return [];
  }
};

// Fetch event registrations from Supabase
export const fetchEventRegistrations = async (): Promise<EventRegistration[]> => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, registrations_list, max_registrations, payment_link_clicks, price, currency')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return (events || []).map(event => {
      const registrations = event.registrations_list || [];
      const adultRegistrations = registrations.reduce((sum: number, reg: any) => 
        sum + (reg.status ? (reg.adult_tickets || 0) : 0), 0);
      const childRegistrations = registrations.reduce((sum: number, reg: any) => 
        sum + (reg.status ? (reg.child_tickets || 0) : 0), 0);
      const totalRegistrations = adultRegistrations + childRegistrations;
      const revenue = registrations.reduce((sum: number, reg: any) => 
        sum + (reg.status ? (reg.total_amount || 0) : 0), 0);
      const paymentLinkClicks = event.payment_link_clicks || 0;
      const conversionRate = paymentLinkClicks > 0 
        ? (totalRegistrations / paymentLinkClicks) * 100 
        : 0;
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        adultRegistrations,
        childRegistrations,
        totalRegistrations,
        maxCapacity: event.max_registrations || 100,
        paymentLinkClicks,
        conversionRate,
        revenue
      };
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return [];
  }
};

// Export analytics data
export const exportAnalyticsData = async (
  format: ExportFormat,
  type: ExportType,
  startDate: string,
  endDate: string
): Promise<Blob> => {
  try {
    // Fetch data based on type
    let data: any = {};
    
    if (type === 'all' || type === 'visitors') {
      data.visitors = await fetchVisitorData(startDate, endDate);
      data.pageVisits = await fetchPagePopularity(startDate, endDate);
    }
    
    if (type === 'all' || type === 'registrations') {
      data.registrations = await fetchRegistrationData(startDate, endDate);
      data.events = await fetchEventRegistrations();
    }
    
    // Convert to CSV or XLSX
    if (format === 'csv') {
      return generateCSV(data, type);
    } else {
      return generateXLSX(data, type);
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

// Generate CSV file
const generateCSV = (data: any, type: ExportType): Blob => {
  let csvContent = '';
  
  if (type === 'all' || type === 'visitors') {
    csvContent += 'Данные о посещениях\n';
    csvContent += 'Дата,Посещения,Уникальные посетители\n';
    
    data.visitors.forEach((visit: VisitorData) => {
      csvContent += `${visit.date},${visit.visitors},${visit.uniqueVisitors}\n`;
    });
    
    csvContent += '\n';
    
    csvContent += 'Популярность страниц\n';
    csvContent += 'Страница,Посещения,Среднее время (сек)\n';
    
    data.pageVisits.forEach((page: PageVisit) => {
      csvContent += `${page.page},${page.visits},${page.avgTimeSpent}\n`;
    });
    
    csvContent += '\n';
  }
  
  if (type === 'all' || type === 'registrations') {
    csvContent += 'Данные о регистрациях\n';
    csvContent += 'Дата,Регистрации,Выручка\n';
    
    data.registrations.forEach((reg: RegistrationData) => {
      csvContent += `${reg.date},${reg.registrations},${reg.revenue}\n`;
    });
    
    csvContent += '\n';
    
    csvContent += 'Регистрации по мероприятиям\n';
    csvContent += 'Мероприятие,Взрослые,Дети,Всего,Максимум,Заполнено (%),Конверсия (%),Выручка\n';
    
    data.events.forEach((event: EventRegistration) => {
      csvContent += `"${event.eventTitle}",${event.adultRegistrations},${event.childRegistrations},${event.totalRegistrations},${event.maxCapacity},${Math.round((event.totalRegistrations / event.maxCapacity) * 100)},${event.conversionRate.toFixed(1)},${event.revenue}\n`;
    });
  }
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

// Generate XLSX file (mock implementation)
const generateXLSX = (data: any, type: ExportType): Blob => {
  // In a real implementation, this would use a library like xlsx
  // For now, we'll just return the same CSV data with a different MIME type
  return generateCSV(data, type);
};