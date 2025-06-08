// 1. Создаем файл constants.ts
export interface Speaker {
  id: string;
  name: string;
  field_of_expertise: string;
  photos: { url: string; isMain?: boolean }[];
  active: boolean;
}

export interface FestivalProgramItem {
  title: string;
  description: string;
  image_url: string;
  start_time: string;
  end_time: string;
  lecturer_id: string;
}

export type Event = {
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
  max_registrations: number | null;
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
};

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

export const paymentTypes = ['cost', 'free', 'donation'];
export const languages = ['Русский', 'Английский', 'Сербский'];
export const ageCategories = ['0+', '12+', '18+'];
export const currencies = ['RSD', 'EUR', 'RUB'];
export const statuses = ['draft', 'active', 'past'];

export const TITLE_MAX_LENGTH = 50;
export const SHORT_DESC_MAX_LENGTH = 150;
export const DESC_MAX_LENGTH = 800;