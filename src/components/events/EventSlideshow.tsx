import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type Event = {
  id: string;
  title: string;
  short_description: string; // Changed from description to short_description
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  bg_image: string;
};

type EventSlideshowProps = {
  events: Event[];
};

const formatEventTime = (timeValue: string): string => {
  if (!timeValue) return '--:--';

  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue.substring(0, 5);
  }

  try {
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    }
  } catch (e) {
    console.error('Error parsing timestamp:', timeValue, e);
  }

  const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  return timeValue;
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  const start = formatEventTime(startTime);
  const end = formatEventTime(endTime);
  return start && end ? `${start} - ${end}` : start || end || '';
};

const EventSlideshow = ({ events }: EventSlideshowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
    customPaging: (i: number) => (
      <div
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
      }
    ]
  };

  const getImageUrl = (event: Event) => {
    if (!event.bg_image) return 'https://via.placeholder.com/1920x600?text=No+image';
    if (event.bg_image.startsWith('http')) return event.bg_image;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${event.bg_image}`;
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Слайдшоу */}
      <Slider {...settings} className="events-slideshow">
        {events.map(event => (
          <div key={event.id} className="relative h-[300px] sm:h-[400px] md:h-[500px]">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${getImageUrl(event)})`,
                backgroundPosition: 'center 30%'
              }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
            
            {/* Контент на изображении */}
            <div className="relative h-full flex items-center">
              <div className="container px-4 sm:px-6">
                {/* Десктопная версия (вся информация) */}
                <div className="hidden md:block max-w-2xl text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {event.title}
                  </h2>
                  <p className="text-base md:text-lg mb-6 line-clamp-2">
                    {event.short_description} {/* Changed from description to short_description */}
                  </p>
                  <div className="flex flex-row flex-wrap gap-6 mb-8 text-white/90">
                    <div className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5" />
                      <span>
                        {format(parseISO(event.date), 'd MMMM', { locale: ru })}
                        {' • '}
                        {formatTimeRange(event.start_time, event.end_time)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={`/events/${event.id}`}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 group"
                    aria-label="Подробнее о мероприятии"
                  >
                    <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Мобильная версия (только мета-информация) */}
                <div className="md:hidden absolute bottom-6 left-0 right-0 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-3 text-white">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>
                          {format(parseISO(event.date), 'd MMMM', { locale: ru })}
                          {' • '}
                          {formatTimeRange(event.start_time, event.end_time)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm sm:text-base">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>{event.location}</span>
                        </div>
                      )}
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
        ))}
      </Slider>

      {/* Блок с названием и описанием для мобильной версии */}
      <div className="md:hidden container px-4 sm:px-6 mt-4">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className={`${index === currentSlide ? 'block' : 'hidden'}`}
          >
            <h2 className="text-xl font-bold mb-2">
              {event.title}
            </h2>
            <p className="text-sm line-clamp-2">
              {event.short_description} {/* Changed from description to short_description */}
            </p>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .events-slideshow .slick-dots {
          bottom: 20px;
        }
        .events-slideshow .slick-dots li {
          margin: 0 4px;
        }
        @media (max-width: 640px) {
          .events-slideshow .slick-dots {
            bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventSlideshow;