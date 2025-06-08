import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, Calendar, Clock, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { sendTelegramNotification } from '../../utils/telegramNotifications';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type RegistrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    price: number;
    currency: string;
    payment_type: string;
    payment_link?: string;
    payment_widget_id?: string;
    widget_chooser?: boolean;
    couple_discount?: number;
    child_half_price?: boolean;
    max_registrations: number;
    current_registration_count: number;
    adults_only?: boolean;
  };
};

const RegistrationModal = ({ isOpen, onClose, event }: RegistrationModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    comment: '',
    adultTickets: 1,
    childTickets: 0
  });
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationDetails, setRegistrationDetails] = useState<{
    id: string;
    fullName: string;
    email: string;
    adultTickets: number;
    childTickets: number;
    total: number;
  } | null>(null);

  const isFreeOrDonation = event.payment_type === 'free' || event.payment_type === 'donation';
  
  const roundUpToHundred = (num: number) => Math.ceil(num / 100) * 100;

  const calculateTotal = () => {
    if (isFreeOrDonation) return 0;

    let adultTotal = 0;
    let childTotal = 0;

    if (event.couple_discount && formData.adultTickets >= 2) {
      const pairs = Math.floor(formData.adultTickets / 2);
      const single = formData.adultTickets % 2;
      
      const discountedPairPrice = event.price * 2 * (1 - event.couple_discount / 100);
      adultTotal = pairs * roundUpToHundred(discountedPairPrice) + single * event.price;
    } else {
      adultTotal = formData.adultTickets * event.price;
    }

    if (!event.adults_only) {
      const childPrice = event.child_half_price ? event.price / 2 : event.price;
      childTotal = formData.childTickets * childPrice;
    }

    return adultTotal + childTotal;
  };

  const getPriceDetails = () => {
    if (isFreeOrDonation) return null;

    const details = [];
    const totalAdult = formData.adultTickets;
    const totalChild = event.adults_only ? 0 : formData.childTickets;

    if (event.couple_discount && totalAdult >= 2) {
      const pairs = Math.floor(totalAdult / 2);
      const single = totalAdult % 2;
      
      const regularPrice = single * event.price;
      const pairPrice = event.price * 2 * (1 - event.couple_discount / 100);
      const roundedPairPrice = roundUpToHundred(pairPrice);

      details.push(
        <div key="adult" className="flex justify-between">
          <span>
            Взрослые ({totalAdult}×)
            {pairs > 0 && (
              <span className="text-xs text-green-500 dark:text-green-400 ml-1">
                ({pairs}×2 со скидкой {event.couple_discount}%)
              </span>
            )}
          </span>
          <span>
            {pairs > 0 && (
              <span className="text-xs line-through text-gray-500 dark:text-gray-400 mr-1">
                {event.price * 2 * pairs}
              </span>
            )}
            {pairs * roundedPairPrice + regularPrice} {event.currency}
          </span>
        </div>
      );
    } else {
      details.push(
        <div key="adult" className="flex justify-between">
          <span>Взрослые ({totalAdult}×)</span>
          <span>{totalAdult * event.price} {event.currency}</span>
        </div>
      );
    }

    if (!event.adults_only && totalChild > 0) {
      const childPrice = event.child_half_price ? event.price / 2 : event.price;
      details.push(
        <div key="child" className="flex justify-between">
          <span>
            Дети ({totalChild}×)
            {event.child_half_price && (
              <span className="text-xs text-green-500 dark:text-green-400 ml-1">
                (50% скидка)
              </span>
            )}
          </span>
          <span>{childPrice * totalChild} {event.currency}</span>
        </div>
      );
    }

    return details;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: eventData, error: fetchError } = await supabase
        .from('events')
        .select('registrations_list, current_registration_count')
        .eq('id', event.id)
        .single();

      if (fetchError) throw fetchError;

      const currentRegistrations = Array.isArray(eventData.registrations_list) 
        ? eventData.registrations_list 
        : [];

      const total = calculateTotal();
      const registrationId = crypto.randomUUID();
      
      const registrationData = {
        id: registrationId,
        full_name: formData.name,
        email: formData.contact,
        phone: formData.phone,
        comment: formData.comment,
        adult_tickets: Number(formData.adultTickets),
        child_tickets: Number(event.adults_only ? 0 : formData.childTickets),
        total_amount: Number(total),
        status: true,
        created_at: new Date().toISOString(),
        payment_link_clicked: false
      };

      const updatedRegistrationsList = [...currentRegistrations, registrationData];

      const totalTickets = registrationData.adult_tickets + registrationData.child_tickets;
      const newRegistrationCount = (eventData.current_registration_count || 0) + totalTickets;

      const { error: updateError } = await supabase
        .from('events')
        .update({
          registrations_list: updatedRegistrationsList,
          current_registration_count: newRegistrationCount
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setRegistrationDetails({
        id: registrationId,
        fullName: formData.name,
        email: formData.contact,
        adultTickets: formData.adultTickets,
        childTickets: event.adults_only ? 0 : formData.childTickets,
        total
      });
      
      setRegistrationSuccess(true);
      toast.success('Регистрация успешна!');

      const message = `🎟 <b>Новая регистрация</b>\n\n` +
        `Мероприятие: ${event.title}\n` +
        `Дата: ${format(parseISO(event.date), 'dd.MM.yyyy HH:mm', { locale: ru })}\n` +
        `Участник: ${formData.name}\n` +
        `Email: ${formData.contact}\n` +
        `Телефон: ${formData.phone}\n` +
        `Комментарий: ${formData.comment}\n` +
        `Взрослых: ${formData.adultTickets}\n` +
        `Детей: ${event.adults_only ? 0 : formData.childTickets}\n` +
        `Сумма: ${total} ${event.currency}\n` +
        `ID: ${registrationId}`;

      await sendTelegramNotification(message);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-md">
        <div className="sticky top-0 bg-white dark:bg-dark-800 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{event.title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {registrationSuccess && registrationDetails ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Регистрация подтверждена!</h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span>Имя:</span>
                  <span className="font-medium">{registrationDetails.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{registrationDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Взрослых билетов:</span>
                  <span className="font-medium">{registrationDetails.adultTickets}</span>
                </div>
                {!event.adults_only && registrationDetails.childTickets > 0 && (
                  <div className="flex justify-between">
                    <span>Детских билетов:</span>
                    <span className="font-medium">{registrationDetails.childTickets}</span>
                  </div>
                )}
                {!isFreeOrDonation && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600 font-medium flex justify-between">
                    <span>Итого:</span>
                    <span>{registrationDetails.total} {event.currency}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded text-sm text-gray-700 dark:text-gray-200"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>{format(parseISO(event.date), 'dd.MM.yy', { locale: ru })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>{format(parseISO(event.date), 'HH:mm', { locale: ru })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="line-clamp-1 max-w-[100px]">{event.location}</span>
                </div>
                {!isFreeOrDonation && (
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{event.price} {event.currency}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />

                <input
                  type="tel"
                  placeholder="Телефон"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />

                <textarea
                  placeholder="Комментарий"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                />

                {!isFreeOrDonation && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Взрослые</div>
                      <input
                        type="number"
                        value={formData.adultTickets}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          adultTickets: Math.max(1, parseInt(e.target.value) || 1) 
                        })}
                        min="1"
                        max="10"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    
                    {!event.adults_only && (
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Дети</div>
                        <input
                          type="number"
                          value={formData.childTickets}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            childTickets: Math.max(0, parseInt(e.target.value) || 0)
                          })}
                          min="0"
                          max="10"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {!isFreeOrDonation && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm space-y-2 text-gray-800 dark:text-gray-200">
                    {getPriceDetails()}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 font-medium flex justify-between">
                      <span>Итого:</span>
                      <span>{calculateTotal()} {event.currency}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded text-sm text-gray-700 dark:text-gray-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm disabled:opacity-50"
                  >
                    {loading ? '...' : 'Подтвердить'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;