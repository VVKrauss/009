import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchHeaderData();
  }, []);

  const fetchHeaderData = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('header_settings')
        .single();

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
    }
  };

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
  };

  const getImageUrl = (image: string) => {
    if (!image) return 'https://via.placeholder.com/1920x600?text=No+image';
    if (image.startsWith('http')) return image;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${image}`;
  };

  if (headerData.style === 'slideshow' && headerData.slideshow.slides.length > 0) {
    return (
      <section className="relative h-hero">
        <Slider {...sliderSettings} className="h-full events-slideshow">
          {headerData.slideshow.slides.map((slide) => (
            <div key={slide.id} className="h-hero relative">
              {/* Image container with proper aspect ratio */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={getImageUrl(slide.image)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
              </div>
              
              {/* Content overlay */}
              <div className="relative h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center text-center px-4">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                    {slide.title}
                  </h1>
                  <p className="text-base md:text-lg mb-6 text-white/90 max-w-md">
                    {slide.subtitle}
                  </p>
                </div>
                {/* <Link 
                  to="/about" 
                  className="absolute bottom-6 right-6 p-2 text-white hover:text-primary-300 transition-colors"
                >
                  <ArrowRight className="h-6 w-6" />
                </Link> */}
              </div>
            </div>
          ))}
        </Slider>
      </section>
    );
  }

  return (
    <section className="relative h-hero flex items-center justify-center">
      <div className="flex flex-col items-center justify-center h-full w-full">
        {/* Logo container - 20% of hero height */}
        <div className="h-[60%] flex items-center justify-center mb-4">
          <img 
            src={headerData.centered.logoLight}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain dark:hidden"
          />
          <img 
            src={headerData.centered.logoDark}
            alt="ScienceHub Logo"
            className="h-full w-auto object-contain hidden dark:block"
          />
        </div>
        
        {/* Title and subtitle - compact */}
        <div className="text-center px-4 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {headerData.centered.title}
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            {headerData.centered.subtitle}
          </p>
        </div>
        
  
      </div>
    </section>
  );
};

export default HeroSection;