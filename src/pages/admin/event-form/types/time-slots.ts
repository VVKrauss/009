export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  slot_details: {
    event_id?: string;
    event_title?: string;
    event_type?: string;
    location?: string;
    reserved_by?: string;
    notes?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  start_at: string; // ISO datetime
  end_at: string; // ISO datetime
}

export interface TimeSlotConflict {
  hasConflict: boolean;
  conflictingSlots: TimeSlot[];
  message: string;
}

export interface CreateTimeSlotRequest {
  date: string;
  start_time: string;
  end_time: string;
  slot_details: object;
}

export interface TimeSlotValidationResult {
  isValid: boolean;
  message: string;
  conflicts?: TimeSlot[];
}

export interface UseTimeSlotsReturn {
  checkTimeSlotAvailability: (date: string, startTime: string, endTime: string, excludeEventId?: string) => Promise<TimeSlotValidationResult>;
  createTimeSlot: (slotData: CreateTimeSlotRequest) => Promise<TimeSlot | null>;
  updateTimeSlot: (slotId: string, slotData: Partial<CreateTimeSlotRequest>) => Promise<boolean>;
  deleteTimeSlot: (slotId: string) => Promise<boolean>;
  getTimeSlotsForDate: (date: string) => Promise<TimeSlot[]>;
  getTimeSlotsForDateRange: (startDate: string, endDate: string) => Promise<TimeSlot[]>;
  createEventTimeSlot: (eventData: {
    id: string;
    title: string;
    event_type: string;
    location: string;
    date: string;
    start_time: string;
    end_time: string;
  }) => Promise<TimeSlot | null>;
  deleteEventTimeSlot: (eventId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}