import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Clock, MapPin, Users, ArrowRight, Check } from 'lucide-react';
import Layout from '../components/layout/Layout';
import PageHeader from '../components/ui/PageHeader';
import BookingForm from '../components/rent/BookingForm';
import { Link } from 'react-router-dom';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type PriceItem = {
  id: string;
  name: string;
  price: number;
  duration: string;
  description?: string;
};

type RentInfoSettings = {
  id: number;
  title: string;
  description: string;
  photos: string[] | null;
  amenities: string[] | null;
  pricelist: PriceItem[];
  contacts: {
    address: string;
    phone: string;
    email: string;
    map_link?: string;
  };
  main_prices: {
    hourly: number;
    daily: number;
  };
  included_services: string[];
};

const getDurationIcon = (duration: string) => {
  switch (duration) {
    case 'hour':
      return <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    case 'day':
      return <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    case 'week':
      return <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    case 'month':
      return <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    default:
      return <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
  }
};

const getDurationLabel = (duration: string) => {
  switch (duration) {
    case 'hour':
      return 'час';
    case 'day':
      return 'день';
    case 'week':
      return 'неделя';
    case 'month':
      return 'месяц';
    default:
      return duration;
  }
};

const RentPage = () => {
  const [settings, setSettings] = useState<RentInfoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rent_info_settings')
          .select('*')
          .single();

        if (error) throw error;
        setSettings(data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Не удалось загрузить информацию о пространстве');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <PageHeader title="" />
        <div className="section bg-gray-50 dark:bg-dark-800">
          <div className="container text-center py-12">
            Загрузка...
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !settings) {
    return (
      <Layout>
        <PageHeader title="" />
        <div className="section bg-gray-50 dark:bg-dark-800">
          <div className="container text-center py-12 text-red-600">
            {error || 'Данные не найдены'}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title={settings.title}
        subtitle="Аренда пространства для мероприятий"
      />
      
      <main className="section bg-gray-50 dark:bg-dark-800">
        <div className="container">
          {/* Hero Section */}
          <div className="mb-12 bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden">
            {settings.photos && settings.photos.length > 0 && (
              <div className="h-64 md:h-96 w-full">
                <img
                  src={settings.photos[0].startsWith('http') 
                    ? settings.photos[0] 
                    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${settings.photos[0]}`}
                  alt={settings.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

{/* Description with HTML and Photo Gallery */}
<div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Text content - takes 2/3 of width on large screens */}
  <div 
    className="lg:col-span-2 prose dark:prose-invert max-w-none"
    dangerouslySetInnerHTML={{ __html: settings.description }}
  />
  
  {/* Photo gallery - takes 1/3 of width on large screens */}
  {settings.photos && settings.photos.length > 0 && (
    <div className="hidden lg:flex flex-col gap-4 h-full">
      {settings.photos.map((photo, index) => (
        <div 
          key={index}
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            maxHeight: `calc((100% - ${(settings.photos!.length - 1) * 16}px) / ${settings.photos!.length})`,
            minHeight: '100px'
          }}
        >
          <img
            src={photo.startsWith('http') 
              ? photo 
              : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${photo}`}
            alt={`${settings.title} - фото ${index + 1}`}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      ))}
    </div>
  )}
</div>

          {/* Main pricing section */}
          {settings.main_prices && (
            <div className="mb-6 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h2 className="text-2xl font-semibold text-center mb-6">Стоимость аренды</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="text-center p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">Почасовая аренда</div>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {settings.main_prices.hourly} €<span className="text-base font-normal text-gray-500 dark:text-gray-400"> / час</span>
                  </div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">Дневная аренда</div>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {settings.main_prices.daily} €<span className="text-base font-normal text-gray-500 dark:text-gray-400"> / день</span>
                  </div>
                </div>
              </div>
              
              {/* Included services */}
              {settings.included_services && settings.included_services.length > 0 && (
                <div className="mt-8 max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium text-center mb-4">Включено в стоимость:</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                    {settings.included_services.map((service, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Additional services */}
          {settings.pricelist && settings.pricelist.length > 0 && (
            <div className="mb-12 bg-white dark:bg-dark-900 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Дополнительные услуги</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settings.pricelist.map((item) => (
                    <div key={item.id} className="border dark:border-dark-700 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                          {getDurationIcon(item.duration)}
                        </div>
                        <h3 className="font-medium text-lg">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {item.description}
                        </p>
                      )}
                      <div className="text-2xl font-bold">
                        {item.price} €
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                          {' '}/ {getDurationLabel(item.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contacts */}
          {settings.contacts && (
            <div className="mb-12 bg-white dark:bg-dark-900 rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Контакты</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Адрес</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {settings.contacts.address}
                    </p>
                    {settings.contacts.map_link && (
                      <a
                        href={settings.contacts.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Посмотреть на карте
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Контакты</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {settings.contacts.phone}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {settings.contacts.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking Form */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-md p-8 text-center">
            <BookingForm />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default RentPage;