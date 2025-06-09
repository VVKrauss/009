import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, CreditCard, Edit, Check, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';

type Registration = {
  id: string;
  full_name: string;
  email: string;
  adult_tickets: number;
  child_tickets: number;
  total_amount: number;
  status: boolean;
  created_at: string;
};

type EventDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    max_registrations: number;
    current_registration_count: number;
    registrations_list: Registration[];
    languages: string[];
    event_type: string;
    payment_link?: string;
    payment_link_clicks?: number;
  };
};

const EventDetailsModal = ({ isOpen, onClose, event }: EventDetailsModalProps) => {
  const navigate = useNavigate();
  const [editingRegistration, setEditingRegistration] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});
  const [localEvent, setLocalEvent] = useState(event);
 
  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration.id);
    setEditForm(registration);
  };

  const handleSaveRegistration = async (registrationId: string) => {
    try {
      if (!editForm.full_name || !editForm.email) {
        toast.error('Имя и email обязательны для заполнения');
        return;
      }

      const updatedRegistrations = localEvent.registrations_list.map((reg: Registration) =>
        reg.id === registrationId ? { ...reg, ...editForm } : reg
      );

      const newCount = updatedRegistrations.reduce((acc: number, reg: Registration) =>
        acc + (reg.status ? (reg.adult_tickets + reg.child_tickets) : 0), 0
      );

      const { error: updateError } = await supabase
        .from('events')
        .update({
          registrations_list: updatedRegistrations,
          current_registration_count: newCount
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setLocalEvent(prev => ({
        ...prev,
        registrations_list: updatedRegistrations,
        current_registration_count: newCount
      }));

      setEditingRegistration(null);
      setEditForm({});

      toast.success('Регистрация успешно обновлена');
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Ошибка при обновлении регистрации');
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту регистрацию?')) {
      return;
    }

    try {
      const { data: currentEvent, error: fetchError } = await supabase
        .from('events')
        .select('registrations_list, current_registration_count')
        .eq('id', event.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedRegistrations = currentEvent.registrations_list.filter(
        (reg: Registration) => reg.id !== registrationId
      );

      const newCount = updatedRegistrations.reduce((acc: number, reg: Registration) => 
        acc + (reg.status ? (reg.adult_tickets + reg.child_tickets) : 0), 0
      );

      const { error: updateError } = await supabase
        .from('events')
        .update({
          registrations_list: updatedRegistrations,
          current_registration_count: newCount
        })
        .eq('id', event.id);

      if (updateError) throw updateError;

      setLocalEvent(prev => ({
        ...prev,
        registrations_list: updatedRegistrations,
        current_registration_count: newCount
      }));

      toast.success('Регистрация удалена');
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Ошибка при удалении регистрации');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Детали мероприятия"
      size="xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Основная информация
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300">
                <Calendar className="h-5 w-5" />
                <span>{format(parseISO(event.date), 'd MMMM yyyy', { locale: ru })}</span>
              </div>
              <div className="flex items-center gap-2 text-dark-600 dark:text-dark-300">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Статистика
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dark-600 dark:text-dark-300">Всего мест:</span>
                <span className="font-medium">{event.max_registrations || 'Не ограничено'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-600 dark:text-dark-300">Зарегистрировано:</span>
                <span className="font-medium">{event.current_registration_count}</span>
              </div>
              {event.payment_link && (
                <div className="flex items-center justify-between">
                  <span className="text-dark-600 dark:text-dark-300">Переходов по ссылке оплаты:</span>
                  <span className="font-medium">{event.payment_link_clicks || 0}</span>
                </div>
              )}
              {event.max_registrations > 0 && (
                <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{
                      width: `${(event.current_registration_count / event.max_registrations) * 100}%`
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-4">Управление регистрациями</h3>
          {localEvent.registrations_list?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-700">
                    <th className="px-4 py-3 text-left">Имя</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-center">Взрослые</th>
                    <th className="px-4 py-3 text-center">Дети</th>
                    <th className="px-4 py-3 text-right">Сумма</th>
                    <th className="px-4 py-3 text-center">Статус</th>
                    <th className="px-4 py-3 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {localEvent.registrations_list.map((registration) => (
                    <tr
                      key={registration.id}
                      className="border-t border-gray-200 dark:border-dark-700"
                    >
                      {editingRegistration === registration.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.full_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={editForm.adult_tickets || 0}
                              onChange={(e) => setEditForm({ ...editForm, adult_tickets: parseInt(e.target.value) })}
                              className="w-20 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={editForm.child_tickets || 0}
                              onChange={(e) => setEditForm({ ...editForm, child_tickets: parseInt(e.target.value) })}
                              className="w-20 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              value={editForm.total_amount || 0}
                              onChange={(e) => setEditForm({ ...editForm, total_amount: parseInt(e.target.value) })}
                              className="w-24 px-2 py-1 border rounded text-right"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={editForm.status ? 'true' : 'false'}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value === 'true' })}
                              className="px-2 py-1 border rounded"
                            >
                              <option value="true">Активна</option>
                              <option value="false">Отменена</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveRegistration(registration.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingRegistration(null)}
                                className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">{registration.full_name}</td>
                          <td className="px-4 py-3">{registration.email}</td>
                          <td className="px-4 py-3 text-center">{registration.adult_tickets}</td>
                          <td className="px-4 py-3 text-center">{registration.child_tickets}</td>
                          <td className="px-4 py-3 text-right">{registration.total_amount}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registration.status
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {registration.status ? 'Активна' : 'Отменена'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditRegistration(registration)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRegistration(registration.id)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-dark-500 dark:text-dark-400">
              Нет зарегистрированных участников
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
          <button
            onClick={onClose}
            className="btn-outline"
          >
            Закрыть
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(`/admin/events/${event.id}/edit`);
            }}
            className="btn-primary"
          >
            Редактировать
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;