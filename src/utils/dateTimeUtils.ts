import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

// Define Belgrade timezone
const BELGRADE_TIMEZONE = 'Europe/Belgrade';

/**
 * Formats a timestamp string to HH:MM format in Belgrade timezone
 * @param timeString The timestamp string to format
 * @returns Formatted time string
 */
export const formatTimeFromTimestamp = (timeString?: string): string => {
  if (!timeString) return '--:--';

  // If time is already in HH:MM format
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

  // If time is in HH:MM:SS format
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.substring(0, 5);
  }

  // Try to parse as ISO date and convert to Belgrade time
  try {
    const date = parseISO(timeString);
    if (!isNaN(date.getTime())) {
      // Convert UTC time to Belgrade time
      const belgradeDatetime = utcToZonedTime(date, BELGRADE_TIMEZONE);
      return format(belgradeDatetime, 'HH:mm', { locale: ru });
    }
  } catch (e) {
    console.error('Error parsing timestamp:', timeString, e);
  }

  // Try to extract time from string
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  return timeString;
};

/**
 * Formats a time range from start and end timestamps
 * @param startTime Start time timestamp
 * @param endTime End time timestamp
 * @returns Formatted time range string
 */
export const formatTimeRange = (startTime?: string, endTime?: string): string => {
  const start = formatTimeFromTimestamp(startTime);
  const end = formatTimeFromTimestamp(endTime);
  
  if (!start && !end) return '';
  if (start && !end) return start;
  if (!start && end) return end;
  
  return `${start} - ${end}`;
};

/**
 * Formats a date in Russian locale
 * @param dateString ISO date string
 * @param formatStr Format string for date-fns
 * @returns Formatted date string
 */
export const formatRussianDate = (dateString: string, formatStr = 'd MMMM yyyy'): string => {
  try {
    const date = parseISO(dateString);
    // Format the date in Belgrade timezone
    return formatInTimeZone(date, BELGRADE_TIMEZONE, formatStr, { locale: ru });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Checks if an event date is in the past
 * @param eventDate Event date string
 * @returns Boolean indicating if the event is in the past
 */
export const isPastEvent = (eventDate: string): boolean => {
  try {
    const eventDateTime = parseISO(eventDate);
    // Compare using Belgrade timezone
    const now = new Date();
    const belgradeNow = utcToZonedTime(now, BELGRADE_TIMEZONE);
    const belgradeEventTime = utcToZonedTime(eventDateTime, BELGRADE_TIMEZONE);
    return belgradeEventTime < belgradeNow;
  } catch (e) {
    console.error('Error checking event date:', e);
    return false;
  }
};

/**
 * Converts a local time string to a Belgrade timezone ISO string
 * @param dateStr Date string in YYYY-MM-DD format
 * @param timeStr Time string in HH:MM format
 * @returns ISO string representing the time in Belgrade timezone
 */
export const createBelgradeTimestamp = (dateStr: string, timeStr: string): string | null => {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Create a date object in the local timezone
    const localDate = new Date(`${dateStr}T${timeStr}:00`);
    
    // Format the date in Belgrade timezone
    return formatInTimeZone(localDate, BELGRADE_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  } catch (error) {
    console.error('Error creating Belgrade timestamp:', error);
    return null;
  }
};

/**
 * Parses a UTC timestamp to Belgrade timezone date and time components
 * @param timestamp UTC timestamp string
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) in Belgrade timezone
 */
export const parseBelgradeTimestamp = (timestamp: string): { date: string; time: string } => {
  if (!timestamp) return { date: '', time: '' };
  
  try {
    const date = parseISO(timestamp);
    const belgradeDate = utcToZonedTime(date, BELGRADE_TIMEZONE);
    
    return {
      date: format(belgradeDate, 'yyyy-MM-dd'),
      time: format(belgradeDate, 'HH:mm')
    };
  } catch (error) {
    console.error('Error parsing Belgrade timestamp:', error);
    return { date: '', time: '' };
  }
};