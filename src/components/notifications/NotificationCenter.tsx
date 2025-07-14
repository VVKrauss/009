// 🗒️ Центр уведомлений о комментариях
// ===================================

import React, { useState } from 'react';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  X, 
  Check, 
  CheckCheck, 
  Trash2,
  User,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCommentNotifications } from '@/hooks/useCommentNotifications';
import type { CommentNotification } from '@/types/comments';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission
  } = useCommentNotifications();

  // 🎨 Иконка для типа уведомления
  const getNotificationIcon = (type: CommentNotification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'mention':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // 📝 Текст уведомления
  const getNotificationText = (notification: CommentNotification) => {
    const senderName = notification.sender?.full_name || 
                      notification.sender?.email || 
                      'Пользователь';
    
    switch (notification.type) {
      case 'like':
        return `${senderName} лайкнул ваш комментарий`;
      case 'reply':
        return `${senderName} ответил на ваш комментарий`;
      case 'mention':
        return `${senderName} упомянул вас в комментарии`;
      default:
        return 'Новое уведомление';
    }
  };

  // 🕐 Форматирование времени
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ru 
      });
    } catch {
      return 'недавно';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Кнопка уведомлений */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
        title={`Уведомления${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Индикатор непрочитанных */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Панель уведомлений */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Панель */}
          <div className="absolute right-0 top-12 w-96 bg-white border shadow-lg rounded-lg z-50 max-h-96 overflow-hidden">
            
            {/* Заголовок */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Уведомления</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Отметить все как прочитанные */}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Отметить все как прочитанные"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Закрыть */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Кнопка включения браузерных уведомлений */}
              {Notification.permission === 'default' && (
                <button
                  onClick={requestNotificationPermission}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Включить браузерные уведомления
                </button>
              )}
            </div>

            {/* Список уведомлений */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Загружаем уведомления...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-500 mb-2">Нет уведомлений</h4>
                  <p className="text-sm text-gray-400">
                    Здесь будут появляться уведомления о новых комментариях и лайках
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        
                        {/* Аватар отправителя */}
                        <div className="flex-shrink-0">
                          {notification.sender?.avatar_url ? (
                            <img
                              src={notification.sender.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Содержимое уведомления */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <p className="text-sm text-gray-900">
                                {getNotificationText(notification)}
                              </p>
                            </div>
                            
                            {/* Индикатор непрочитанного */}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          {/* Превью комментария */}
                          {notification.comment?.text && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              "{notification.comment.text}"
                            </p>
                          )}
                          
                          {/* Время и действия */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {/* Перейти к комментарию */}
                              <button
                                onClick={() => {
                                  // TODO: Навигация к комментарию
                                  window.location.href = `/events/${notification.event_id}#comment-${notification.comment_id}`;
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Перейти к комментарию"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              
                              {/* Отметить как прочитанное */}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Отметить как прочитанное"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              
                              {/* Удалить */}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Удалить уведомление"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;