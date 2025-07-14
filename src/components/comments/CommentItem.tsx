// 🗒️ Компонент отдельного комментария
// ===================================

import React, { useState } from 'react';
import { 
  Heart, 
  Reply, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Clock,
  User,
  Check,
  X
} from 'lucide-react';
import { CommentForm } from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import type { Comment, CommentSectionConfig } from '@/types/comments';

interface CommentItemProps {
  comment: Comment;
  config: CommentSectionConfig;
  depth?: number;
  onToggleLike: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReply: (text: string, parentId: string) => Promise<void>;
  loading?: {
    liking?: boolean;
    submitting?: boolean;
  };
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  config,
  depth = 0,
  onToggleLike,
  onUpdateComment,
  onDeleteComment,
  onReply,
  loading = {}
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();

  const isAuthor = user?.id === comment.author_id;
  const canReply = config.allowReplies && depth < (config.maxDepth || 3);
  const showReplies = comment.replies && comment.replies.length > 0;

  // 📅 Форматирование времени
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ru 
      });
    } catch {
      return 'недавно';
    }
  };

  // ❤️ Обработка лайка
  const handleLike = async () => {
    try {
      await onToggleLike(comment.id);
    } catch (error) {
      console.error('Ошибка при лайке:', error);
    }
  };

  // ↩️ Обработка ответа
  const handleReply = async (text: string) => {
    try {
      await onReply(text, comment.id);
      setShowReplyForm(false);
    } catch (error) {
      console.error('Ошибка при ответе:', error);
    }
  };

  // ✏️ Сохранение редактирования
  const handleSaveEdit = async () => {
    if (editText.trim() === comment.text) {
      setIsEditing(false);
      return;
    }

    try {
      await onUpdateComment(comment.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка при редактировании:', error);
      setEditText(comment.text); // Восстанавливаем оригинальный текст
    }
  };

  // 🗑️ Удаление комментария
  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      try {
        await onDeleteComment(comment.id);
      } catch (error) {
        console.error('Ошибка при удалении:', error);
      }
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
      <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
        
        {/* Заголовок комментария */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            
            {/* Аватар автора */}
            {config.showAvatars && (
              <div className="flex-shrink-0">
                {comment.author_avatar ? (
                  <img
                    src={comment.author_avatar}
                    alt={comment.author_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            )}

            {/* Информация об авторе */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {comment.author_name}
                </span>
                
                {/* Метка автора */}
                {isAuthor && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    Вы
                  </span>
                )}
                
                {/* Метка редактирования */}
                {comment.is_edited && (
                  <span className="text-gray-400 text-xs">
                    изменено
                  </span>
                )}
              </div>
              
              {/* Время публикации */}
              {config.showTimestamps && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(comment.created_at)}</span>
                  {comment.is_edited && comment.edited_at && (
                    <span>(изм. {formatTime(comment.edited_at)})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Меню действий */}
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border shadow-lg rounded-lg py-1 z-10 min-w-[120px]">
                  {config.allowEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      Редактировать
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Текст комментария или форма редактирования */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-300"
              rows={3}
              maxLength={5000}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="p-2 text-green-600 hover:text-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {comment.text}
            </p>
          </div>
        )}

        {/* Действия с комментарием */}
        <div className="flex items-center gap-4">
          
          {/* Лайк */}
          <button
            onClick={handleLike}
            disabled={loading.liking}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              comment.user_liked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-red-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                comment.user_liked ? 'fill-current' : ''
              }`}
            />
            <span className="text-sm font-medium">
              {comment.likes_count || 0}
            </span>
          </button>

          {/* Ответить */}
          {canReply && user && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all"
            >
              <Reply className="w-4 h-4" />
              <span className="text-sm">Ответить</span>
            </button>
          )}

          {/* Количество ответов */}
          {showReplies && (
            <span className="text-sm text-gray-500">
              {comment.replies_count} {
                comment.replies_count === 1 ? 'ответ' :
                comment.replies_count < 5 ? 'ответа' : 'ответов'
              }
            </span>
          )}
        </div>

        {/* Форма ответа */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              parentId={comment.id}
              loading={loading.submitting}
              placeholder="Напишите ответ..."
              autoFocus
              compact
            />
          </div>
        )}
      </div>

      {/* Рекурсивный рендер ответов */}
      {showReplies && (
        <div className="ml-4">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              config={config}
              depth={depth + 1}
              onToggleLike={onToggleLike}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onReply={onReply}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Закрытие меню при клике вне его */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default CommentItem;