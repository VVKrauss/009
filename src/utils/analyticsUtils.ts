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

// Fetch visitor data from Supabase
export const fetchVisitorData = async (startDate: string, endDate: string): Promise<VisitorData[]> => {
  try {
    // In a real implementation, this would fetch data from Supabase
    // For now, we'll return mock data
    return generateMockVisitorData(startDate, endDate);
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    throw error;
  }
};

// Fetch registration data from Supabase
export const fetchRegistrationData = async (startDate: string, endDate: string): Promise<RegistrationData[]> => {
  try {
    // In a real implementation, this would fetch data from Supabase
    // For now, we'll return mock data
    return generateMockRegistrationData(startDate, endDate);
  } catch (error) {
    console.error('Error fetching registration data:', error);
    throw error;
  }
};

// Fetch event registrations from Supabase
export const fetchEventRegistrations = async (): Promise<EventRegistration[]> => {
  try {
    // In a real implementation, this would fetch data from Supabase
    // For now, we'll return mock data
    return generateMockEventRegistrations();
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    throw error;
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

// Mock data generators
export const generateMockVisitorData = (startDate: string, endDate: string): VisitorData[] => {
  const data: VisitorData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  while (current <= end) {
    const baseVisitors = Math.floor(Math.random() * 100) + 50;
    data.push({
      date: format(current, 'yyyy-MM-dd'),
      visitors: baseVisitors,
      uniqueVisitors: Math.floor(baseVisitors * 0.7)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
};

export const generateMockRegistrationData = (startDate: string, endDate: string): RegistrationData[] => {
  const data: RegistrationData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  while (current <= end) {
    const registrations = Math.floor(Math.random() * 20);
    data.push({
      date: format(current, 'yyyy-MM-dd'),
      registrations,
      revenue: registrations * (Math.floor(Math.random() * 500) + 500)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
};

export const generateMockEventRegistrations = (): EventRegistration[] => {
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