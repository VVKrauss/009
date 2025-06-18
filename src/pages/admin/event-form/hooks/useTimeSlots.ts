import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  findConflictingSlots,
  createFullDateTime,
  generateConflictMessage,
  validateTimeFormat,
  validateTimeOrder,
  createEventSlotDetails
} from '../utils/time-slots';
import type { 
  TimeSlot, 
  CreateTimeSlotRequest, 
  TimeSlotValidationResult, 
  UseTimeSlotsReturn 
} from '../types/time-slots';

export const useTimeSlots = (): UseTimeSlotsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Проверяет доступность временного слота
   */
  const checkTimeSlotAvailability = async (
    date: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): Promise<TimeSlotValidationResult> => {
    try {
      setLoading(true);
      setError(null);

      // Валидация входных данных
      if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
        return {
          isValid: false,
          message: 'Неверный формат времени. Используйте формат ЧЧ:ММ',
        };
      }

      if (!validateTimeOrder(startTime, endTime)) {
        return {
          isValid: false,
          message: 'Время окончания должно быть позже времени начала',
        };
      }

      // Получаем существующие слоты на эту дату
      const { data: existingSlots, error: fetchError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('date', date);

      if (fetchError) {
        throw fetchError;
      }

      // Находим конфликтующие слоты
      const conflicts = findConflictingSlots(
        existingSlots || [],
        date,
        startTime,
        endTime,
        excludeEventId
      );

      const hasConflicts = conflicts.length > 0;
      const message = generateConflictMessage(conflicts);

      return {
        isValid: !hasConflicts,
        message,
        conflicts: hasConflicts ? conflicts : undefined,
      };
    } catch (err) {
      console.error('Error checking time slot availability:', err);
      const errorMessage = 'Ошибка при проверке доступности времени';
      setError(errorMessage);
      return {
        isValid: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Создает новый временной слот
   */
  const createTimeSlot = async (slotData: CreateTimeSlotRequest): Promise<TimeSlot | null> => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем доступность перед созданием
      const availability = await checkTimeSlotAvailability(
        slotData.date,
        slotData.start_time,
        slotData.end_time
      );

      if (!availability.isValid) {
        toast.error(availability.message);
        return null;
      }

      // Создаем полные datetime для start_at и end_at
      const startAt = createFullDateTime(slotData.date, slotData.start_time);
      const endAt = createFullDateTime(slotData.date, slotData.end_time);

      const { data, error: insertError } = await supabase
        .from('time_slots_table')
        .insert([
          {
            date: slotData.date,
            start_time: slotData.start_time,
            end_time: slotData.end_time,
            slot_details: slotData.slot_details,
            start_at: startAt,
            end_at: endAt,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      toast.success('Временной слот создан');
      return data;
    } catch (err) {
      console.error('Error creating time slot:', err);
      const errorMessage = 'Ошибка при создании временного слота';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновляет существующий временной слот
   */
  const updateTimeSlot = async (
    slotId: string,
    slotData: Partial<CreateTimeSlotRequest>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Если обновляется время, проверяем доступность
      if (slotData.date && slotData.start_time && slotData.end_time) {
        const availability = await checkTimeSlotAvailability(
          slotData.date,
          slotData.start_time,
          slotData.end_time,
          slotId
        );

        if (!availability.isValid) {
          toast.error(availability.message);
          return false;
        }
      }

      const updateData: any = { ...slotData };

      // Обновляем полные datetime если изменилось время
      if (slotData.date && slotData.start_time) {
        updateData.start_at = createFullDateTime(slotData.date, slotData.start_time);
      }
      if (slotData.date && slotData.end_time) {
        updateData.end_at = createFullDateTime(slotData.date, slotData.end_time);
      }

      const { error: updateError } = await supabase
        .from('time_slots_table')
        .update(updateData)
        .eq('id', slotId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Временной слот обновлен');
      return true;
    } catch (err) {
      console.error('Error updating time slot:', err);
      const errorMessage = 'Ошибка при обновлении временного слота';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаляет временной слот
   */
  const deleteTimeSlot = async (slotId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('time_slots_table')
        .delete()
        .eq('id', slotId);

      if (deleteError) {
        throw deleteError;
      }

      toast.success('Временной слот удален');
      return true;
    } catch (err) {
      console.error('Error deleting time slot:', err);
      const errorMessage = 'Ошибка при удалении временного слота';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Получает временные слоты для определенной даты
   */
  const getTimeSlotsForDate = async (date: string): Promise<TimeSlot[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('time_slots_table')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching time slots for date:', err);
      setError('Ошибка при загрузке временных слотов');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Получает временные слоты для диапазона дат
   */
  const getTimeSlotsForDateRange = async (
    startDate: string,
    endDate: string
  ): Promise<TimeSlot[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('time_slots_table')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching time slots for date range:', err);
      setError('Ошибка при загрузке временных слотов');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Создает временной слот для события
   */
  const createEventTimeSlot = async (eventData: {
    id: string;
    title: string;
    event_type: string;
    location: string;
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<TimeSlot | null> => {
    const slotDetails = createEventSlotDetails({
      id: eventData.id,
      title: eventData.title,
      event_type: eventData.event_type,
      location: eventData.location,
    });

    return await createTimeSlot({
      date: eventData.date,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      slot_details: slotDetails,
    });
  };

  /**
   * Удаляет временной слот по ID события
   */
  const deleteEventTimeSlot = async (eventId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('time_slots_table')
        .delete()
        .eq('slot_details->event_id', eventId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      console.error('Error deleting event time slot:', err);
      setError('Ошибка при удалении временного слота события');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkTimeSlotAvailability,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getTimeSlotsForDate,
    getTimeSlotsForDateRange,
    createEventTimeSlot,
    deleteEventTimeSlot,
    loading,
    error,
  };
};