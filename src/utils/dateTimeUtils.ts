import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

const BELGRADE_TIMEZONE = "Europe/Belgrade";

/**
 * Formats a timestamp string to HH:MM format
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

  // Try to parse as ISO date
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      // Convert to Belgrade timezone
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
    // Convert to Belgrade timezone
    const belgradeDatetime = utcToZonedTime(date, BELGRADE_TIMEZONE);
    return format(belgradeDatetime, formatStr, { locale: ru });
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
    // Convert to Belgrade timezone
    const belgradeDatetime = utcToZonedTime(eventDateTime, BELGRADE_TIMEZONE);
    const now = utcToZonedTime(new Date(), BELGRADE_TIMEZONE);
    return belgradeDatetime < now;
  } catch (e) {
    console.error('Error checking event date:', e);
    return false;
  }
};

/**
 * Formats a date and time in Belgrade timezone
 * @param dateString ISO date string
 * @param formatStr Format string for date-fns
 * @returns Formatted date and time string in Belgrade timezone
 */
export const formatInBelgradeTimezone = (dateString: string, formatStr = 'yyyy-MM-dd HH:mm:ss'): string => {
  try {
    return formatInTimeZone(new Date(dateString), BELGRADE_TIMEZONE, formatStr, { locale: ru });
  } catch (error) {
    console.error('Error formatting in Belgrade timezone:', error);
    return dateString;
  }
};

/**
 * Converts a local date and time to Belgrade timezone
 * @param date Date object or string
 * @returns Date object in Belgrade timezone
 */
export const toBelgradeTimezone = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return utcToZonedTime(dateObj, BELGRADE_TIMEZONE);
};