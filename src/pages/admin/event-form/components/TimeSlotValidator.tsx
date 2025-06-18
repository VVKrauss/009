import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { formatTimeSlotForDisplay } from '../utils/time-slots';
import type { TimeSlot } from '../types/time-slots';

interface TimeSlotValidatorProps {
  date: string;
  startTime: string;
  endTime: string;
  eventId?: string;
  className?: string;
}

export const TimeSlotValidator: React.FC<TimeSlotValidatorProps> = ({
  date,
  startTime,
  endTime,
  eventId,
  className = '',
}) => {
  const timeSlots = useTimeSlots();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const validateTimeSlot = async () => {
      if (!date || !startTime || !endTime) {
        setValidationResult(null);
        return;
      }

      setChecking(true);
      try {
        const result = await timeSlots.checkTimeSlotAvailability(
          date,
          startTime,
          endTime,
          eventId
        );
        setValidationResult(result);
      } catch (error) {
        console.error('Error validating time slot:', error);
        setValidationResult({
          isValid: false,
          message: 'Ошибка при проверке доступности времени',
        });
      } finally {
        setChecking(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateTimeSlot, 300);
    return () => clearTimeout(timeoutId);
  }, [date, startTime, endTime, eventId]);

  if (!date || !startTime || !endTime) {
    return null;
  }

  if (checking) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-700">Проверка доступности времени...</span>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  return (
    <div className={className}>
      {validationResult.isValid ? (
        <SuccessMessage />
      ) : (
        <ConflictMessage 
          message={validationResult.message}
          conflicts={validationResult.conflicts}
        />
      )}
    </div>
  );
};

const SuccessMessage: React.FC = () => (
  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <span className="text-sm text-green-700">Временной слот доступен</span>
  </div>
);

interface ConflictMessageProps {
  message: string;
  conflicts?: TimeSlot[];
}

const ConflictMessage: React.FC<ConflictMessageProps> = ({ message, conflicts }) => (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <span className="text-sm font-medium text-red-700">Конфликт времени</span>
    </div>
    <p className="text-sm text-red-600 mb-2">{message}</p>
    
    {conflicts && conflicts.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs text-red-500 font-medium">Конфликтующие события:</p>
        {conflicts.map((conflict, index) => (
          <ConflictItem key={conflict.id || index} conflict={conflict} />
        ))}
      </div>
    )}
  </div>
);

interface ConflictItemProps {
  conflict: TimeSlot;
}

const ConflictItem: React.FC<ConflictItemProps> = ({ conflict }) => {
  const eventTitle = conflict.slot_details.event_title || 'Неизвестное событие';
  const eventType = conflict.slot_details.event_type || '';
  const location = conflict.slot_details.location || '';

  return (
    <div className="bg-white border border-red-100 rounded p-2 text-xs">
      <div className="flex items-center gap-1 mb-1">
        <Calendar className="h-3 w-3 text-red-500" />
        <span className="font-medium text-red-700">{eventTitle}</span>
        {eventType && (
          <span className="text-red-500">({eventType})</span>
        )}
      </div>
      
      <div className="flex items-center gap-3 text-red-600">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{conflict.start_time} - {conflict.end_time}</span>
        </div>
        
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для отображения всех занятых слотов на дату
interface DayTimeSlotsProps {
  date: string;
  className?: string;
}

export const DayTimeSlots: React.FC<DayTimeSlotsProps> = ({ date, className = '' }) => {
  const timeSlots = useTimeSlots();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!date) return;
      
      setLoading(true);
      try {
        const daySlots = await timeSlots.getTimeSlotsForDate(date);
        setSlots(daySlots);
      } catch (error) {
        console.error('Error fetching day slots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [date]);

  if (!date) return null;

  if (loading) {
    return (
      <div className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="text-sm text-gray-600">Загрузка расписания...</span>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">На эту дату нет запланированных событий</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          События на {new Date(date).toLocaleDateString('ru-RU')}:
        </span>
      </div>
      
      <div className="space-y-1">
        {slots.map((slot, index) => (
          <div key={slot.id || index} className="text-xs text-blue-600">
            <span className="font-medium">
              {slot.start_time} - {slot.end_time}
            </span>
            {slot.slot_details.event_title && (
              <span className="ml-2">
                {slot.slot_details.event_title}
                {slot.slot_details.location && ` (${slot.slot_details.location})`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Встроенный валидатор для использования в форме
interface InlineTimeSlotValidatorProps {
  date: string;
  startTime: string;
  endTime: string;
  eventId?: string;
  showDaySchedule?: boolean;
}

export const InlineTimeSlotValidator: React.FC<InlineTimeSlotValidatorProps> = ({
  date,
  startTime,
  endTime,
  eventId,
  showDaySchedule = true,
}) => {
  if (!date) return null;

  return (
    <div className="space-y-3 mt-4">
      <TimeSlotValidator
        date={date}
        startTime={startTime}
        endTime={endTime}
        eventId={eventId}
      />
      
      {showDaySchedule && (
        <DayTimeSlots date={date} />
      )}
    </div>
  );
};

export default TimeSlotValidator;