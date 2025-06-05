import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Slider = lazy(() => import('react-slick'));
const LazySlider = lazy(() => import('react-slick/slick-carousel'));

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

interface HeroSectionProps {
  height?: number | string; // Можно передать число (пиксели) или строку (например, "50vh")
}

const HeroSection = ({ height = 400 }: HeroSectionProps) => {
  const [headerData, setHeaderData] = useState<HeaderData>(defaultHeaderData);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<Slider>(null);

  // Формируем значение высоты
  const sectionHeight = typeof height === 'number' ? `${height}px` : height;
  const logoHeight = typeof height === 'number' ? `${height * 0.6}px` : `60vh`;

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
      <section 
        className="relative flex items-center justify-center bg-gray-100 dark:bg-dark-800" 
        style={{ height: sectionHeight }}
      >
        <div className="text-center">Загрузка...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section 
        className="relative flex items-center justify-center bg-gray-100 dark:bg-dark-800" 
        style={{ height: sectionHeight }}
      >
        <div className="text-center text-red-500">{error}</div>
      </section>
    );
  }

  if (headerData.style === 'slideshow' && headerData.slideshow.slides.length > 0) {
    return (
      <section className="relative" style={{ height: sectionHeight }}>
        <Suspense fallback={<div className="bg-gray-200 dark:bg-dark-700" style={{ height: sectionHeight }} />}>
          <Slider {...sliderSettings} className="h-full">
            {headerData.slideshow.slides.map((slide) => (
              <div key={slide.id} className="relative" style={{ height: sectionHeight }}>
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={getImageUrl(slide.image)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/50" />
                </div>
                
                <div className="relative h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center text-center px-4">
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 text-white">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </Suspense>
      </section>
    );
  }

  return (
    <section 
      className="relative flex items-center justify-center bg-gray-50 dark:bg-dark-900" 
      style={{ height: sectionHeight }}
    >
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div 
          className="w-full flex items-center justify-center mb-8"
          style={{ height: logoHeight }}
        >
          <img 
            src={headerData.centered.logoLight}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain dark:hidden"
            loading="lazy"
            decoding="async"
          />
          <img 
            src={headerData.centered.logoDark}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain hidden dark:block"
            loading="lazy"
            decoding="async"
          />
        </div>
        
        <div className="text-center px-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {headerData.centered.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            {headerData.centered.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;