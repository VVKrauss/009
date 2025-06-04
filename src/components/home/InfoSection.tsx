import { useState, useEffect } from 'react';
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
  const [data, setData] = useState<InfoSectionData>({
    title: 'Добро пожаловать в ScienceHub',
    description: 'Мы создаем уникальное пространство для науки, образования и инноваций. Присоединяйтесь к нашему сообществу исследователей, предпринимателей и энтузиастов.',
    image: 'https://wummwcsqsznyyaajcxww.supabase.co/storage/v1/object/public/images/logo/logo_science_hub%20no_title.png',
    enabled: true,
    order: 1
  });

  useEffect(() => {
    fetchInfoData();
  }, []);

  const fetchInfoData = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('info_section')
        .single();

      if (error) throw error;

      if (settings?.info_section) {
        setData(settings.info_section);
      }
    } catch (error) {
      console.error('Error fetching info section data:', error);
    }
  };

  if (!data.enabled) {
    return null;
  }

  return (
    <section className="section bg-white dark:bg-dark-900">
      <div className="container grid-layout items-center">
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
          <img 
            src={data.image} 
            alt={data.title} 
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </div>
    </section>
  );
};

export default InfoSection;