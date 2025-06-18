// Utility functions for admin pages

/**
 * Validates if a URL is properly formatted
 * @param url URL string to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a date and time combination is valid
 * @param date Date string
 * @param time Time string
 * @returns Boolean indicating if the date and time are valid
 */
export const validateDateTime = (date: string, time: string): boolean => {
  if (!date || !time) return false;
  
  // Check time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) return false;
  
  // Check if date is valid
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Parses event times from form data
 * @param date Date string
 * @param startTime Start time string
 * @param endTime End time string
 * @returns Object with parsed start_time and end_time
 */
export const parseEventTimes = (date: string, startTime: string, endTime: string) => {
  if (!date || !startTime || !endTime) {
    return { start_time: null, end_time: null };
  }

  try {
    const dateObj = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date(dateObj);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(dateObj);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    return {
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString()
    };
  } catch (error) {
    console.error('Error parsing event times:', error);
    return { start_time: null, end_time: null };
  }
};