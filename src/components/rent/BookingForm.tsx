import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isPast, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { sendTelegramNotification } from '../../utils/telegramNotifications';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_details: {
    type?: string;
    title?: string;
    description?: string;
    user_name?: string;
    user_contact?: string;
    social_contact?: string;
    event_id?: string;
  };
  created_at: string;
  updated_at: string;
}

interface DateAvailability {
  date: string;
  status: 'free' | 'partial' | 'busy';
}

interface BookingData {
  name: string;
  email: string;
  phone: string;
  social_contact: string;
  selectedSlots: {
    start_time: string;
    end_time: string;
  }[];
  selectionState: 'initial' | 'first-selected' | 'range-selected';
}

const BookingForm = () => {
  // ... rest of the code remains exactly the same ...
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      {/* ... rest of the JSX remains exactly the same ... */}
    </div>
  );
};

export default BookingForm;