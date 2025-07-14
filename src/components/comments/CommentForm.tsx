// 🗒️ Форма для добавления комментариев
// =====================================

import React, { useState, useRef } from 'react';
import { Send, Loader2, X, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CommentFormProps {
  onSubmit: (text: string, parentId?: string) => Promise<void>;
  parentId?: string;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  onCancel?: () => void;
  className?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  parentId,
  loading = false,
  placeholder = 'Напишите комментарий...',
  autoFocus = false,
  compact = false,
  onCancel,
  className = ''
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, profile } = useAuth();

  const isReply = Boolean(parentId);
  const canSubmit = text.trim().length > 0 && !loading;

  // 📝 Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    try {
      await onSubmit(text.trim(), parentId);
      setText('');
      setIsFocused(false);
      
      // Сброс высоты textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    }
  };

  // 📏 Автоматическое изменение высоты textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Автоматически изменяем высоту
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // ⌨️ Обработка горячих клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(e as any);
      }
    }
    
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  // 🚫 Проверка авторизации
  if (!user) {
    return (
      <div className={`bg-gray-50 border rounded-lg p-4 text-center ${className}`}>
        <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-3">
          Войдите в систему, чтобы оставить комментарий
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
          Войти
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className={`bg-white border rounded-lg transition-all duration-200 ${
        isFocused ? 'border-blue-300 shadow-sm' : 'border-gray-200'
      } ${compact ? 'p-3' : 'p-4'}`}>
        
        {/* Информация о пользователе */}
        {!compact && (
          <div className="flex items-center gap-3 mb-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Пользователь'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {profile?.full_name || profile?.email || 'Пользователь'}
            </span>
          </div>
        )}

        {/* Индикатор ответа */}
        {isReply && (
          <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2 mb-3 rounded-r">
            <span className="text-sm text-blue-700 font-medium">
              Ответ на комментарий
            </span>
          </div>
        )}

        {/* Поле ввода */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={loading}
            className={`w-full border-0 resize-none focus:outline-none placeholder-gray-400 ${
              compact ? 'text-sm' : 'text-base'
            }`}
            style={{ 
              minHeight: compact ? '60px' : '80px',
              maxHeight: '200px'
            }}
            maxLength={5000}
          />
          
          {/* Счетчик символов */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length}/5000
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-500">
            {isReply ? (
              'Esc для отмены, Ctrl+Enter для отправки'
            ) : (
              'Ctrl+Enter для быстрой отправки'
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Кнопка отмены (для ответов) */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                canSubmit
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Отправляем...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="text-sm">
                    {isReply ? 'Ответить' : 'Отправить'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Подсказка для новых пользователей */}
      {!compact && text.length === 0 && !isFocused && (
        <div className="mt-2 text-xs text-gray-500">
          💡 Поделитесь своими впечатлениями о мероприятии, задайте вопросы или оставьте отзыв
        </div>
      )}
    </form>
  );
};

export default CommentForm;