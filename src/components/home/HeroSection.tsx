import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Конфигурация высоты hero-секции
const HERO_HEIGHT = 'min-h-[80vh]'; // Можно изменить на нужное значение
const LOGO_HEIGHT_RATIO = 0.6; // 60% от высоты hero-секции

type HeaderStyle = 'centered' | 'slideshow';
type Slide = {
  id: string;
  image: string;
  title: string;
  subtitle: string; 
};

type HeaderData = {
  style: HeaderStyle;
  centered: {
    title: string;
    subtitle: string;
    logoLight: string;
    logoDark: string;
  };
  slideshow: {
    slides: Slide[];
    settings: {
      autoplaySpeed: number;
      transition: 'fade' | 'slide';
    };
  };
};

const defaultHeaderData: HeaderData = {
  style: 'centered',
  centered: {
    title: 'ScienceHub',
    subtitle: 'Место для научного сообщества',
    logoLight: 'https://jfvinriqydjtwsmayxix.supabase.co/storage/v1/object/public/images/logo/logo_science_hub%20no_title.png',
    logoDark: 'https://jfvinriqydjtwsmayxix.supabase.co/storage/v1/object/public/images/logo/logo_white_science_hub%20no_title.png'
  },
  slideshow: {
    slides: [],
    settings: {
      autoplaySpeed: 5000,
      transition: 'fade'
    }
  }
};

const HeroSection = () => {
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<Slider>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchHeaderData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('site_settings')
          .select('header_settings')
          .single();

        if (!isMounted) return;

        if (error) throw error;

        if (data?.header_settings) {
          setHeaderData({
            ...defaultHeaderData,
            ...data.header_settings,
            slideshow: {
              ...defaultHeaderData.slideshow,
              ...data.header_settings.slideshow,
              settings: {
                ...defaultHeaderData.slideshow.settings,
                ...data.header_settings.slideshow?.settings
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching header settings:', error);
        if (isMounted) setError('Не удалось загрузить данные заголовка');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHeaderData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: headerData.slideshow.settings.autoplaySpeed,
    fade: headerData.slideshow.settings.transition === 'fade',
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
    arrows: false,
    ref: sliderRef
  };

  const getImageUrl = (image: string) => {
    if (!image) return 'https://via.placeholder.com/1920x600?text=No+image';
    if (image.startsWith('http')) return image;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${image}`;
  };

  if (isLoading) {
    return (
      <section className={`relative ${HERO_HEIGHT} flex items-center justify-center bg-gray-100 dark:bg-dark-800`}>
        <div className="text-center">Загрузка...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`relative ${HERO_HEIGHT} flex items-center justify-center bg-gray-100 dark:bg-dark-800`}>
        <div className="text-center text-red-500">{error}</div>
      </section>
    );
  }

  if (headerData.style === 'slideshow' && headerData.slideshow.slides.length > 0) {
    return (
      <section className={`relative ${HERO_HEIGHT}`}>
        <Slider {...sliderSettings} className="h-full">
          {headerData.slideshow.slides.map((slide) => (
            <div key={slide.id} className={`${HERO_HEIGHT} relative`}>
              {/* Lazy-loaded image with placeholder */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={getImageUrl(slide.image)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50" />
              </div>
              
              {/* Content overlay */}
              <div className="relative h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center text-center px-4">
                  <h1 className="text-2xl md:text-4xl font-bold mb-4 text-white">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl">
                    {slide.subtitle}
                  </p>
                  <Link 
                    to="/about" 
                    className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Узнать больше
                    <ArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>
    );
  }

  return (
    <section className={`relative ${HERO_HEIGHT} flex items-center justify-center bg-gray-50 dark:bg-dark-900`}>
      <div className="flex flex-col items-center justify-center h-full w-full">
        {/* Logo container with dynamic height */}
        <div 
          className={`w-full flex items-center justify-center mb-8`}
          style={{ height: `calc(${LOGO_HEIGHT_RATIO * 100}%)` }}
        >
          <img 
            src={headerData.centered.logoLight}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain dark:hidden"
            loading="eager"
          />
          <img 
            src={headerData.centered.logoDark}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain hidden dark:block"
            loading="eager"
          />
        </div>
        
        {/* Title and subtitle */}
        <div className="text-center px-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {headerData.centered.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            {headerData.centered.subtitle}
          </p>
          <Link 
            to="/about" 
            className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Узнать больше
            <ArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;