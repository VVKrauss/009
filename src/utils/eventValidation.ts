import { isValidUrl } from '../pages/admin/utils';
import { isValidTimeFormat } from './dateTimeUtils';

// Event form validation constants
export const TITLE_MAX_LENGTH = 70;
export const SHORT_DESC_MAX_LENGTH = 150;
export const DESC_MAX_LENGTH = 800;

// Event types
export const eventTypes = [
  'Lecture',
  'Workshop',
  'Movie Discussion',
  'Conversation Club',
  'Festival',
  'Stand-up',
  'Concert',
  'Excursion',
  'Discussion',
  'Swap',
  'Quiz'
];

// Payment types
export const paymentTypes = ['cost', 'free', 'donation'];

// Languages
export const languages = ['Русский', 'Английский', 'Сербский'];

// Age categories
export const ageCategories = ['0+', '12+', '18+'];

// Currencies
export const currencies = ['RSD', 'EUR', 'RUB'];

// Statuses
export const statuses = ['draft', 'active', 'past'];

/**
 * Validates the event form data
 * @param eventData The event data to validate
 * @returns Object with validation result and errors
 */
export const validateForm = (eventData: any) => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!eventData.title) {
    errors.title = 'Название обязательно';
  } else if (eventData.title.length > TITLE_MAX_LENGTH) {
    errors.title = `Название не должно превышать ${TITLE_MAX_LENGTH} символов`;
  }

  if (!eventData.date) {
    errors.date = 'Дата обязательна';
  }

  if (!eventData.start_time) {
    errors.start_time = 'Время начала обязательно';
  } else if (!isValidTimeFormat(eventData.start_time)) {
    errors.start_time = 'Неверный формат времени (HH:MM)';
  }

  if (!eventData.end_time) {
    errors.end_time = 'Время окончания обязательно';
  } else if (!isValidTimeFormat(eventData.end_time)) {
    errors.end_time = 'Неверный формат времени (HH:MM)';
  }

  if (eventData.start_time && eventData.end_time) {
    const [startHour, startMinute] = eventData.start_time.split(':').map(Number);
    const [endHour, endMinute] = eventData.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes <= startMinutes) {
      errors.end_time = 'Время окончания должно быть позже времени начала';
    }
  }

  if (!eventData.location) {
    errors.location = 'Место проведения обязательно';
  }

  if (!eventData.event_type) {
    errors.event_type = 'Тип мероприятия обязателен';
  }

  if (!eventData.age_category) {
    errors.age_category = 'Возрастная категория обязательна';
  }

  if (!eventData.payment_type) {
    errors.payment_type = 'Тип оплаты обязателен';
  }

  if (eventData.payment_type === 'cost' && (eventData.price === undefined || eventData.price === null)) {
    errors.price = 'Цена обязательна для платных мероприятий';
  }

  if (eventData.payment_type === 'cost' && !eventData.currency) {
    errors.currency = 'Валюта обязательна для платных мероприятий';
  }

  if (eventData.payment_link && !isValidUrl(eventData.payment_link)) {
    errors.payment_link = 'Неверный формат ссылки';
  }

  if (eventData.video_url && !isValidUrl(eventData.video_url)) {
    errors.video_url = 'Неверный формат ссылки';
  }

  if (eventData.short_description && eventData.short_description.length > SHORT_DESC_MAX_LENGTH) {
    errors.short_description = `Краткое описание не должно превышать ${SHORT_DESC_MAX_LENGTH} символов`;
  }

  if (eventData.description && eventData.description.length > DESC_MAX_LENGTH) {
    errors.description = `Описание не должно превышать ${DESC_MAX_LENGTH} символов`;
  }

  if (!eventData.languages || eventData.languages.length === 0) {
    errors.languages = 'Выберите хотя бы один язык';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};