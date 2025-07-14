import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { formatRussianDate, formatTimeRange, isValidDateString } from '../../utils/dateTimeUtils';
import { getSupabaseImageUrl } from '../../utils/imageUtils';

type Event = {
  id: string;
  title: string;
  short_description: string;
  start_at: string;
  end_at: string;
  location: string;
  bg_image: string;
  // Legacy fields for backward compatibility
  date?: string;
  start_time?: string;
  end_time?: string;
};

type EventSlideshowProps = {
  events: Event[];
  titleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  desktopTitleStyle?: React.CSSProperties;
  desktopDescriptionStyle?: React.CSSProperties;
  formatTimeRange?: (start: string, end: string) => string;
};

const EventSlideshow = ({ 
  events,
  titleStyle = {},
  descriptionStyle = {},
  desktopTitleStyle = {},
  desktopDescriptionStyle = {},
  formatTimeRange: customFormatTimeRange
}: EventSlideshowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderReady, setSliderReady] = useState(false);

  // Проверяем, что у нас есть валидные события
  const validEvents = events.filter(event => event && event.id && event.title);

  useEffect(() => {
    // Задержка для корректной инициализации слайдера
    const timer = setTimeout(() => {
      setSliderReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Безопасная функция форматирования даты
  const formatEventDate = (event: Event): string => {
    try {
      // Сначала пытаемся использовать start_at (новое поле)
      if (isValidDateString(event.start_at)) {
        return formatRussianDate(event.start_at, 'd MMMM');
      }
      
      // Fallback на legacy поле start_time
      if (isValidDateString(event.start_time)) {
        return formatRussianDate(event.start_time!, 'd MMMM');
      }
      
      // Fallback на legacy поле date
      if (isValidDateString(event.date)) {
        return formatRussianDate(event.date!, 'd MMMM');
      }
      
      return 'Дата не указана';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Дата не указана';
    }
  };

  // Безопасная функция форматирования времени
  const formatEventTimeRange = (event: Event): string => {
    try {
      // Сначала пытаемся использовать start_at/end_at
      if (event.start_at && event.end_at) {
        if (customFormatTimeRange) {
          return customFormatTimeRange(event.start_at, event.end_at);
        }
        return formatTimeRange(event.start_at, event.end_at);
      }
      
      // Fallback на legacy поля
      if (event.start_time && event.end_time) {
        if (customFormatTimeRange) {
          return customFormatTimeRange(event.start_time, event.end_time);
        }
        return formatTimeRange(event.start_time, event.end_time);
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting time range:', error);
      return '';
    }
  };

  // Настройки слайдера с улучшенной обработкой ошибок
  const settings = {
    dots: true,
    infinite: validEvents.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: validEvents.length > 1,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    pauseOnFocus: true,
    pauseOnDotsHover: true,
    swipeToSlide: true,
    accessibility: true,
    beforeChange: (_: number, next: number) => {
      setCurrentSlide(next);
    },
    customPaging: (i: number) => (
      <button
        type="button"
        aria-label={`Слайд ${i + 1}`}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          i === currentSlide 
            ? 'bg-white scale-125' 
            : 'bg-white/50 hover:bg-white/75'
        }`}
      />
    ),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false
        }
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true
        }
      }
    ],
    // Добавляем обработчики ошибок
    onReInit: () => {
      console.log('Slider reinitialized');
    },
    onInit: () => {
      console.log('Slider initialized');
    }
  };

  // Если нет валидных событий, не показываем слайдшоу
  if (validEvents.length === 0) {
    return (
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Нет доступных мероприятий для отображения</p>
      </div>
    );
  }

  // Если слайдер еще не готов, показываем загрузку
  if (!sliderReady) {
    return (
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Слайдшоу */}
      <div className="events-slideshow">
        <Slider {...settings}>
          {validEvents.map((event) => {
            return (
              <div key={event.id} className="relative h-[300px] sm:h-[400px] md:h-[500px] outline-none">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: event.bg_image 
                      ? `url(${getSupabaseImageUrl(event.bg_image)})` 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundPosition: 'center 30%'
                  }}
                >
                  <div className="absolute inset-0 bg-black/50" />
                </div>
                
                {/* Контент на изображении */}
                <div className="relative h-full flex items-center">
                  <div className="container px-4 sm:px-6 mx-auto">
                    {/* Десктопная версия (вся информация) */}
                    <div className="hidden md:block max-w-2xl text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4" style={desktopTitleStyle}>
                        {event.title || 'Название не указано'}
                      </h2>
                      <p className="text-base md:text-lg mb-6 line-clamp-2" style={desktopDescriptionStyle}>
                        {event.short_description || 'Описание отсутствует'}
                      </p>
                      <div className="flex flex-row flex-wrap gap-6 mb-8 text-white/90">
                        <Link 
                          to={`/events/${event.id}`}
                          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 group"
                          aria-label="Подробнее о мероприятии"
                        >
                          <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5" />
                        <span>
                          {formatEventDate(event)}
                          {formatEventTimeRange(event) && (
                            <>
                              {' • '}
                              {formatEventTimeRange(event)}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Мобильная версия (только мета-информация) */}
                    <div className="md:hidden absolute bottom-6 left-0 right-0 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-3 text-white">
                        <div className="flex items-center gap-2 text-sm sm:text-base">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>
                            {formatEventDate(event)}
                            {formatEventTimeRange(event) && (
                              <>
                                {' • '}
                                {formatEventTimeRange(event)}
                              </>
                            )}
                          </span>
                        </div>
                        <Link 
                          to={`/events/${event.id}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 group"
                          aria-label="Подробнее о мероприятии"
                        >
                          <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>

      {/* Блок с названием и описанием для мобильной версии */}
      <div className="md:hidden container px-4 sm:px-6 mt-4 mx-auto">
        {validEvents.map((event, index) => {
          return (
            <div 
              key={event.id} 
              className={`${index === currentSlide ? 'block' : 'hidden'}`}
            >
              <h2 className="text-xl font-bold mb-2" style={titleStyle}>
                {event.title || 'Название не указано'}
              </h2>
              <p className="text-sm line-clamp-2" style={descriptionStyle}>
                {event.short_description || 'Описание отсутствует'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Стили для слайдшоу */}
      <style jsx global>{`
        .events-slideshow .slick-dots {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex !important;
          justify-content: center;
          gap: 8px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .events-slideshow .slick-dots li {
          display: inline-block;
          margin: 0 4px;
          width: auto;
          height: auto;
        }
        
        .events-slideshow .slick-dots li button {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }
        
        .events-slideshow .slick-dots li button:before {
          display: none;
        }
        
        .events-slideshow .slick-prev,
        .events-slideshow .slick-next {
          z-index: 10;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .events-slideshow .slick-prev:hover,
        .events-slideshow .slick-next:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .events-slideshow .slick-prev {
          left: 16px;
        }
        
        .events-slideshow .slick-next {
          right: 16px;
        }
        
        .events-slideshow .slick-prev:before,
        .events-slideshow .slick-next:before {
          color: white;
          font-size: 24px;
        }
        
        @media (max-width: 640px) {
          .events-slideshow .slick-dots {
            bottom: 10px;
          }
          
          .events-slideshow .slick-prev,
          .events-slideshow .slick-next {
            display: none !important;
          }
        }
        
        @media (max-width: 1024px) {
          .events-slideshow .slick-prev,
          .events-slideshow .slick-next {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EventSlideshow;