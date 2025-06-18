import type { TimeSlot, TimeSlotConflict } from '../types/time-slots';

/**
 * Проверяет, пересекаются ли два временных интервала
 */
export const doTimeSlotsOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const startTime1 = new Date(`1970-01-01T${start1}:00`);
  const endTime1 = new Date(`1970-01-01T${end1}:00`);
  const startTime2 = new Date(`1970-01-01T${start2}:00`);
  const endTime2 = new Date(`1970-01-01T${end2}:00`);

  // Проверяем пересечение интервалов
  return startTime1 < endTime2 && startTime2 < endTime1;
};

/**
 * Находит конфликтующие временные слоты
 */
export const findConflictingSlots = (
  existingSlots: TimeSlot[],
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  excludeSlotId?: string
): TimeSlot[] => {
  return existingSlots.filter(slot => {
    // Исключаем слот, если это обновление существующего события
    if (excludeSlotId && slot.slot_details.event_id === excludeSlotId) {
      return false;
    }

    // Проверяем только слоты на ту же дату
    if (slot.date !== newDate) {
      return false;
    }

    // Проверяем пересечение времени
    return doTimeSlotsOverlap(
      slot.start_time,
      slot.end_time,
      newStartTime,
      newEndTime
    );
  });
};

/**
 * Создает полное datetime из даты и времени
 */
export const createFullDateTime = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};

/**
 * Форматирует временной слот для отображения
 */
export const formatTimeSlotForDisplay = (slot: TimeSlot): string => {
  const date = new Date(slot.date).toLocaleDateString('ru-RU');
  return `${date} ${slot.start_time} - ${slot.end_time}`;
};

/**
 * Проверяет корректность времени
 */
export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Проверяет, что время окончания позже времени начала
 */
export const validateTimeOrder = (startTime: string, endTime: string): boolean => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  return start < end;
};

/**
 * Создает детали слота для события
 */
export const createEventSlotDetails = (eventData: {
  id: string;
  title: string;
  event_type: string;
  location: string;
}): object => {
  return {
    event_id: eventData.id,
    event_title: eventData.title,
    event_type: eventData.event_type,
    location: eventData.location,
    reserved_by: 'event_system',
    created_via: 'event_form',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Генерирует сообщение о конфликте
 */
export const generateConflictMessage = (conflicts: TimeSlot[]): string => {
  if (conflicts.length === 0) {
    return 'Временной слот доступен';
  }

  if (conflicts.length === 1) {
    const conflict = conflicts[0];
    const eventTitle = conflict.slot_details.event_title || 'Неизвестное событие';
    return `Время занято событием "${eventTitle}" (${conflict.start_time} - ${conflict.end_time})`;
  }

  return `Время пересекается с ${conflicts.length} существующими событиями. Выберите другое время.`;
};

/**
 * Проверяет, является ли дата в прошлом
 */
export const isDateInPast = (date: string): boolean => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
};

/**
 * Получает временные слоты для определенного диапазона дат
 */
export const filterSlotsByDateRange = (
  slots: TimeSlot[],
  startDate: string,
  endDate: string
): TimeSlot[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return slots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= start && slotDate <= end;
  });
};