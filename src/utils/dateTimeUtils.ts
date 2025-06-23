import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Define Belgrade timezone constant
export const BELGRADE_TIMEZONE = 'Europe/Belgrade';

/**
 * Formats a timestamp string to HH:MM format
 * @param timeString The timestamp string to format
 * @param timezone Optional timezone (defaults to Belgrade)
 * @returns Formatted time string
 */
export const formatTimeFromTimestamp = (timeString?: string, timezone: string = BELGRADE_TIMEZONE): string => {
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
      return formatInTimeZone(date, timezone, 'HH:mm');
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
 * @param timezone Optional timezone (defaults to Belgrade)
 * @returns Formatted time range string
 */
export const formatTimeRange = (startTime?: string, endTime?: string, timezone: string = BELGRADE_TIMEZONE): string => {
  const start = formatTimeFromTimestamp(startTime, timezone);
  const end = formatTimeFromTimestamp(endTime, timezone);
  
  if (!start && !end) return '';
  if (start && !end) return start;
  if (!start && end) return end;
  
  return `${start} - ${end}`;
};

/**
 * Formats a date in Russian locale
 * @param dateString ISO date string
 * @param formatStr Format string for date-fns
 * @param timezone Optional timezone (defaults to Belgrade)
 * @returns Formatted date string
 */
export const formatRussianDate = (dateString: string, formatStr = 'd MMMM yyyy', timezone: string = BELGRADE_TIMEZONE): string => {
  try {
    const date = parseISO(dateString);
    const zonedDate = utcToZonedTime(date, timezone);
    return format(zonedDate, formatStr, { locale: ru });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Checks if an event date is in the past
 * @param eventDate Event date string
 * @param timezone Optional timezone (defaults to Belgrade)
 * @returns Boolean indicating if the event is in the past
 */
export const isPastEvent = (eventDate: string, timezone: string = BELGRADE_TIMEZONE): boolean => {
  try {
    const eventDateTime = parseISO(eventDate);
    const zonedEventDate = utcToZonedTime(eventDateTime, timezone);
    const now = new Date();
    const zonedNow = utcToZonedTime(now, timezone);
    return zonedEventDate < zonedNow;
  } catch (e) {
    console.error('Error checking event date:', e);
    return false;
  }
};

/**
 * Converts a local time to Belgrade timezone
 * @param date Date object or ISO string
 * @returns Date object in Belgrade timezone
 */
export const convertToBedradeTimezone = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return utcToZonedTime(dateObj, BELGRADE_TIMEZONE);
};

/**
 * Converts a Belgrade timezone time to UTC
 * @param date Date object or ISO string
 * @returns Date object in UTC
 */
export const convertFromBelgradeToUTC = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return zonedTimeToUtc(dateObj, BELGRADE_TIMEZONE);
};

/**
 * Creates a date object with Belgrade timezone
 * @param year Year
 * @param month Month (0-11)
 * @param day Day
 * @param hours Hours
 * @param minutes Minutes
 * @returns Date object in Belgrade timezone
 */
export const createBelgradeDate = (
  year: number,
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0
): Date => {
  const date = new Date(year, month, day, hours, minutes);
  return utcToZonedTime(date, BELGRADE_TIMEZONE);
};

/**
 * Parses a time string (HH:MM) and combines it with a date in Belgrade timezone
 * @param timeString Time string in HH:MM format
 * @param dateString Date string in ISO format
 * @returns Combined date and time in Belgrade timezone
 */
export const parseTimeWithBelgradeTimezone = (timeString: string, dateString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = parseISO(dateString);
  
  // Create a new date with the specified hours and minutes
  const combinedDate = new Date(date);
  combinedDate.setHours(hours, minutes, 0, 0);
  
  // Convert to Belgrade timezone
  return utcToZonedTime(combinedDate, BELGRADE_TIMEZONE);
};

/**
 * Validates if a time string is in valid HH:MM format
 * @param timeString Time string to validate
 * @returns Boolean indicating if the time string is valid
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Formats a date for database storage in ISO format
 * @param date Date object or ISO string
 * @param time Time string in HH:MM format
 * @returns ISO string in UTC for database storage
 */
export const formatDateTimeForDatabase = (date: Date | string, time: string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const [hours, minutes] = time.split(':').map(Number);
  
  // Set the time on the date object
  const combinedDate = new Date(dateObj);
  combinedDate.setHours(hours, minutes, 0, 0);
  
  // Convert from Belgrade to UTC for storage
  const utcDate = zonedTimeToUtc(combinedDate, BELGRADE_TIMEZONE);
  return utcDate.toISOString();
};