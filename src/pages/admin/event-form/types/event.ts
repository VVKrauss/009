import { EventRegistrations } from '../../constants';

export interface FestivalProgramItem {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
}

export interface Event {
  id: string;
  title: string;
  short_description: string;
  description: string;
  event_type: string;
  bg_image: string | null;
  original_bg_image: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  age_category: string;
  price: number | null;
  currency: string;
  status: string;
  payment_type: string;
  languages: string[];
  speakers: string[];
  hide_speakers_gallery?: boolean;
  couple_discount?: string;
  child_half_price?: boolean;
  payment_link?: string;
  payment_widget_id?: string;
  widget_chooser?: boolean;
  video_url?: string;
  photo_gallery?: string;
  festival_program?: FestivalProgramItem[];
  registrations?: EventRegistrations;
  // Legacy fields - will be removed after migration
  max_registrations?: number | null;
  current_registration_count?: number;
  registrations_list?: any[];
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  conflicts?: any[];
}