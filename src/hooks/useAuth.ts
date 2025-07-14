// 🗒️ Хук авторизации (интегрированная версия для комментариев)
// ==============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  // 📖 Загрузка профиля пользователя
  const loadProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Если профиль не найден, создаем базовый профиль
        if (error.code === 'PGRST116') {
          const basicProfile: Profile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          };
          
          setState(prev => ({ 
            ...prev, 
            profile: basicProfile,
            loading: false 
          }));
          return;
        }
        throw error;
      }

      setState(prev => ({ 
        ...prev, 
        profile: data,
        loading: false 
      }));
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Не удалось загрузить профиль пользователя',
        loading: false 
      }));
    }
  };

  // 🔄 Инициализация и отслеживание состояния авторизации
  useEffect(() => {
    // Получаем текущую сессию
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          setState(prev => ({ ...prev, user: session.user }));
          await loadProfile(session.user);
        } else {
          setState(prev => ({ 
            ...prev, 
            user: null, 
            profile: null, 
            loading: false 
          }));
        }
      } catch (error) {
        console.error('Ошибка получения сессии:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Ошибка авторизации',
          loading: false 
        }));
      }
    };

    getSession();

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setState(prev => ({ ...prev, user: session.user, error: null }));
          await loadProfile(session.user);
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🚪 Вход в систему
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Ошибка входа в систему',
        loading: false 
      }));
      throw error;
    }
  };

  // 📝 Регистрация
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Ошибка регистрации',
        loading: false 
      }));
      throw error;
    }
  };

  // 🚪 Выход из системы
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Ошибка выхода:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Ошибка выхода из системы' 
      }));
    }
  };

  // 🔄 Обновление профиля
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('Пользователь не авторизован');

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: state.user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Обновляем локальное состояние
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Ошибка обновления профиля',
        loading: false 
      }));
      throw error;
    }
  };

  // 🔐 Проверка, является ли пользователь администратором
  const isAdmin = () => {
    return state.user?.email === 'admin@sciencehub.rs' || 
           state.profile?.full_name?.toLowerCase().includes('admin');
  };

  // 📧 Получение отображаемого имени пользователя
  const getDisplayName = () => {
    if (state.profile?.full_name) return state.profile.full_name;
    if (state.user?.email) return state.user.email.split('@')[0];
    return 'Пользователь';
  };

  // 🖼️ Получение аватара пользователя
  const getAvatarUrl = () => {
    return state.profile?.avatar_url || state.user?.user_metadata?.avatar_url;
  };

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin,
    getDisplayName,
    getAvatarUrl,
    isAuthenticated: !!state.user
  };
};

export default useAuth;