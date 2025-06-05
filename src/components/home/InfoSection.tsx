import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type InfoSectionData = {
  title: string;
  description: string;
  image: string;
  enabled: boolean;
  order: number;
};

const InfoSection = () => {
  const [data, setData] = useState<InfoSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageHeight, setImageHeight] = useState('auto');

  useEffect(() => {
    let isMounted = true;
    
    const fetchInfoData = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('site_settings')
          .select('info_section')
          .single();

        if (!isMounted) return;

        if (error) throw error;

        if (settings?.info_section) {
          setData(settings.info_section);
        }
      } catch (err) {
        console.error('Error fetching info section data:', err);
        if (isMounted) setError('Не удалось загрузить данные');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInfoData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data?.image || !imageRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });

    observer.observe(imageRef.current);

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [data?.image]);

  // Эффект для вычисления высоты текстового контента
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const textContent = containerRef.current.querySelector('.text-content');
        if (textContent) {
          setImageHeight(`${textContent.scrollHeight}px`);
        }
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [data]);

  if (isLoading) {
    return <div className="section bg-white dark:bg-dark-900 min-h-[400px] flex items-center justify-center">Загрузка...</div>;
  }

  if (error) {
    return <div className="section bg-white dark:bg-dark-900 min-h-[400px] flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!data || !data.enabled) {
    return null;
  }

  return (
    <section className="section bg-white dark:bg-dark-900" ref={containerRef}>
      <div className="container grid-layout">
        <div className="text-content">
          <h3 className="mb-6">{data.title}</h3>
          <div 
            className="text-base space-y-4 mb-8"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
          <Link 
            to="/about" 
            className="inline-flex items-center text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors font-medium"
          >
            Подробнее
            <ArrowRight className="ml-2" />
          </Link>
        </div>
        <div className="image-content mt-8 md:mt-0">
          <div 
            className="w-full rounded-lg overflow-hidden"
            style={{ height: imageHeight }}
          >
            <img 
              ref={imageRef}
              data-src={data.image}
              alt={data.title}
              className="w-full h-full object-cover"
              loading="lazy"
              width="600"
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;