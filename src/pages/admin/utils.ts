// 2. Создаем файл utils.ts
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidTime = (time: string) => {
  if (!time) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const formatTimeForDatabase = (time: string | null | undefined) => {
  if (!time) return null;
  
  // If already in HH:MM:SS format
  if (time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)) {
    return time;
  }
  
  // If in HH:MM format
  if (time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    return `${time}:00`;
  }
  
  // If it's not in a valid format
  return null;
};

export const createTimestamp = (date: string, time: string | null | undefined) => {
  if (!date || !time) return null;
  
  try {
    // Ensure time is in valid format
    const formattedTime = formatTimeForDatabase(time);
    if (!formattedTime) return null;
    
    // Create a valid date string
    const dateTimeStr = `${date}T${formattedTime}`;
    const timestamp = new Date(dateTimeStr);
    
    // Check if the date is valid before calling toISOString()
    if (isNaN(timestamp.getTime())) {
      return null;
    }
    
    return timestamp.toISOString();
  } catch (error) {
    console.error('Error creating timestamp:', error);
    return null;
  }
};