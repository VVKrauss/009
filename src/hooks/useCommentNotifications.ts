// 🗒️ Хук для работы с уведомлениями комментариев
// =================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { CommentNotification } from '@/types/comments';

interface NotificationState {
  notifications: CommentNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useCommentNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null
  });

  const { user } = useAuth();

  // 📖 Загрузка уведомлений
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('comment_notifications')
        .select(`
          *,
          sender:sender_id(full_name, email, avatar_url),
          comment:comment_id(text)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.is_read).length;

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        loading: false
      }));
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      setState(prev => ({
        ...prev,
        error: 'Не удалось загрузить уведомления',
        loading: false
      }));
    }
  }, [user]);

  // ✅ Отметка уведомления как прочитанного
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  }, []);

  // ✅ Отметка всех уведомлений как прочитанных
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comment_notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений:', error);
    }
  }, [user]);

  // 🗑️ Удаление уведомления
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('comment_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setState(prev => {
        const notification = prev.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.is_read;
        
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
        };
      });
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  }, []);

  // 🔔 Подписка на новые уведомления
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Real-time подписка на новые уведомления
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comment_notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('Новое уведомление:', payload);
        
        // Добавляем новое уведомление в начало списка
        setState(prev => ({
          ...prev,
          notifications: [payload.new as CommentNotification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1
        }));

        // Показываем браузерное уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = payload.new as CommentNotification;
          const message = notification.type === 'like' 
            ? 'Кто-то лайкнул ваш комментарий'
            : 'Кто-то ответил на ваш комментарий';
            
          new Notification('ScienceHub', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  // 🔔 Запрос разрешения на браузерные уведомления
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    refresh: loadNotifications
  };
};

export default useCommentNotifications;