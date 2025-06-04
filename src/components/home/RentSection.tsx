import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type RentSectionData = {
  title: string;
  description: string;
  image: string;
  enabled: boolean;
  order: number;
};

const RentSection = () => {
  const [data, setData] = useState<RentSectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentData();
  }, []);

  const fetchRentData = async () => {
    try {
      setLoading(true);
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('rent_selection')
        .single();

      if (error) throw error;

      // Проверяем наличие данных в поле rent_selection
      if (settings?.rent_selection) {
        setData(settings.rent_selection);
      }
    } catch (error) {
      console.error('Error fetching Rent section data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data || !data.enabled) {
    return null;
  }

  return (
    <section className="section bg-white dark:bg-dark-900">
      <div className="container grid-layout items-center">
        <div className="image-content order-1 md:order-none mt-8 md:mt-0">
          <img 
            src={data.image} 
            alt={data.title} 
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
        
        <div className="text-content order-2 md:order-none">
          <h3 className="mb-6">{data.title}</h3> 
          <div 
            className="text-base space-y-4 mb-8"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
          <Link 
            to="/rent" 
            className="inline-flex items-center text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors font-medium"
          >
            Забронировать
            <ArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RentSection;