import { FIELD_LIMITS, VALIDATION_MESSAGES } from '../constants/event-form';
import type { Event, ValidationResult } from '../types/event';

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateTitle = (title: string): ValidationResult => {
  if (!title?.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.TITLE_REQUIRED };
  }
  
  if (title.length > FIELD_LIMITS.TITLE_MAX_LENGTH) {
    const excess = title.length - FIELD_LIMITS.TITLE_MAX_LENGTH;
    return { isValid: false, message: VALIDATION_MESSAGES.TITLE_TOO_LONG(excess) };
  }
  
  return { isValid: true, message: '' };
};

export const validateDescription = (description: string): ValidationResult => {
  if (!description?.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.DESCRIPTION_REQUIRED };
  }
  
  if (description.length > FIELD_LIMITS.DESC_MAX_LENGTH) {
    const excess = description.length - FIELD_LIMITS.DESC_MAX_LENGTH;
    return { isValid: false, message: VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG(excess) };
  }
  
  return { isValid: true, message: '' };
};

export const validateShortDescription = (shortDescription: string): ValidationResult => {
  if ((shortDescription?.length || 0) > FIELD_LIMITS.SHORT_DESC_MAX_LENGTH) {
    const excess = (shortDescription?.length || 0) - FIELD_LIMITS.SHORT_DESC_MAX_LENGTH;
    return { isValid: false, message: VALIDATION_MESSAGES.SHORT_DESC_TOO_LONG(excess) };
  }
  
  return { isValid: true, message: '' };
};

export const validateDateTime = (eventData: Partial<Event>): ValidationResult => {
  const { date, start_time, end_time } = eventData;
  
  if (!date || !start_time || !end_time) {
    return { isValid: false, message: VALIDATION_MESSAGES.DATETIME_REQUIRED };
  }
  
  const startDateTime = new Date(`${date}T${start_time}`);
  const endDateTime = new Date(`${date}T${end_time}`);
  
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    return { isValid: false, message: VALIDATION_MESSAGES.DATETIME_INVALID };
  }
  
  if (startDateTime >= endDateTime) {
    return { isValid: false, message: VALIDATION_MESSAGES.END_TIME_INVALID };
  }
  
  return { isValid: true, message: '' };
};

export const validateLocation = (location: string): ValidationResult => {
  if (!location?.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.LOCATION_REQUIRED };
  }
  
  return { isValid: true, message: '' };
};

export const validatePaymentLink = (paymentLink: string, paymentType: string): ValidationResult => {
  if (paymentType === 'cost' && paymentLink && !isValidUrl(paymentLink)) {
    return { isValid: false, message: VALIDATION_MESSAGES.PAYMENT_LINK_INVALID };
  }
  
  return { isValid: true, message: '' };
};

export const validateVideoUrl = (videoUrl: string): ValidationResult => {
  if (videoUrl && !isValidUrl(videoUrl)) {
    return { isValid: false, message: VALIDATION_MESSAGES.VIDEO_URL_INVALID };
  }
  
  return { isValid: true, message: '' };
};

export const validatePhotoGallery = (photoGallery: string): ValidationResult => {
  if (photoGallery && !isValidUrl(photoGallery)) {
    return { isValid: false, message: VALIDATION_MESSAGES.PHOTO_GALLERY_INVALID };
  }
  
  return { isValid: true, message: '' };
};

export const validateEventForm = async (
  eventData: Partial<Event>,
  checkTimeSlotAvailability?: (date: string, startTime: string, endTime: string, excludeEventId?: string) => Promise<ValidationResult>
): Promise<ValidationResult> => {
  // Validate title
  const titleValidation = validateTitle(eventData.title || '');
  if (!titleValidation.isValid) return titleValidation;
  
  // Validate description
  const descValidation = validateDescription(eventData.description || '');
  if (!descValidation.isValid) return descValidation;
  
  // Validate short description
  const shortDescValidation = validateShortDescription(eventData.short_description || '');
  if (!shortDescValidation.isValid) return shortDescValidation;
  
  // Validate date and time
  const dateTimeValidation = validateDateTime(eventData);
  if (!dateTimeValidation.isValid) return dateTimeValidation;
  
  // Validate location
  const locationValidation = validateLocation(eventData.location || '');
  if (!locationValidation.isValid) return locationValidation;
  
  // Validate payment link
  const paymentValidation = validatePaymentLink(
    eventData.payment_link || '', 
    eventData.payment_type || ''
  );
  if (!paymentValidation.isValid) return paymentValidation;
  
  // Validate video URL
  const videoValidation = validateVideoUrl(eventData.video_url || '');
  if (!videoValidation.isValid) return videoValidation;
  
  // Validate photo gallery
  const photoValidation = validatePhotoGallery(eventData.photo_gallery || '');
  if (!photoValidation.isValid) return photoValidation;
  
  // Validate time slot availability
  if (checkTimeSlotAvailability && eventData.date && eventData.start_time && eventData.end_time) {
    const timeSlotValidation = await checkTimeSlotAvailability(
      eventData.date,
      eventData.start_time,
      eventData.end_time,
      eventData.id
    );
    if (!timeSlotValidation.isValid) return timeSlotValidation;
  }
  
  return { isValid: true, message: '' };
};

export const validateProgramItem = (item: {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}): ValidationResult => {
  if (!item.title) {
    return { isValid: false, message: VALIDATION_MESSAGES.PROGRAM_TITLE_REQUIRED };
  }
  
  if (!item.description) {
    return { isValid: false, message: VALIDATION_MESSAGES.PROGRAM_DESCRIPTION_REQUIRED };
  }
  
  if (!item.start_time || !item.end_time) {
    return { isValid: false, message: VALIDATION_MESSAGES.PROGRAM_TIME_REQUIRED };
  }
  
  return { isValid: true, message: '' };
};