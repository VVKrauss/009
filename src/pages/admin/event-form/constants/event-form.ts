export const FIELD_LIMITS = {
  TITLE_MAX_LENGTH: 70,
  SHORT_DESC_MAX_LENGTH: 150,
  DESC_MAX_LENGTH: 800,
};

export const VALIDATION_MESSAGES = {
  TITLE_REQUIRED: 'Название мероприятия обязательно',
  TITLE_TOO_LONG: (excess: number) => `Название слишком длинное (превышение на ${excess} символов)`,
  
  DESCRIPTION_REQUIRED: 'Описание мероприятия обязательно',
  DESCRIPTION_TOO_LONG: (excess: number) => `Описание слишком длинное (превышение на ${excess} символов)`,
  
  SHORT_DESC_TOO_LONG: (excess: number) => `Краткое описание слишком длинное (превышение на ${excess} символов)`,
  
  DATETIME_REQUIRED: 'Дата и время мероприятия обязательны',
  DATETIME_INVALID: 'Неверный формат даты или времени',
  END_TIME_INVALID: 'Время окончания должно быть позже времени начала',
  
  LOCATION_REQUIRED: 'Место проведения обязательно',
  
  PAYMENT_LINK_INVALID: 'Неверный формат ссылки на оплату',
  VIDEO_URL_INVALID: 'Неверный формат ссылки на видео',
  PHOTO_GALLERY_INVALID: 'Неверный формат ссылки на фотогалерею',
  
  PROGRAM_TITLE_REQUIRED: 'Название программы обязательно',
  PROGRAM_DESCRIPTION_REQUIRED: 'Описание программы обязательно',
  PROGRAM_TIME_REQUIRED: 'Время начала и окончания программы обязательны',
  
  TIME_SLOT_CONFLICT: 'Выбранное время пересекается с другим мероприятием',
  TIME_SLOT_INVALID: 'Неверный формат времени',
};

export const EVENT_TYPES = [
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

export const PAYMENT_TYPES = ['cost', 'free', 'donation'];
export const LANGUAGES = ['Русский', 'Английский', 'Сербский'];
export const AGE_CATEGORIES = ['0+', '12+', '18+'];
export const CURRENCIES = ['RSD', 'EUR', 'RUB'];
export const STATUSES = ['draft', 'active', 'past'];

export const DEFAULT_EVENT = {
  title: '',
  short_description: '',
  description: '',
  event_type: 'Lecture',
  bg_image: null,
  original_bg_image: null,
  date: new Date().toISOString().split('T')[0],
  start_time: '18:00',
  end_time: '20:00',
  location: 'ScienceHub, Сараевская 48, Белград',
  age_category: '0+',
  price: 0,
  currency: 'RSD',
  status: 'draft',
  payment_type: 'free',
  languages: ['Русский'],
  speakers: [],
  hide_speakers_gallery: false,
  registrations: {
    max_regs: null,
    current: 0,
    current_adults: 0,
    current_children: 0,
    reg_list: []
  }
};