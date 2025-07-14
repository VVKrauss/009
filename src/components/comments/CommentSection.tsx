// 🗒️ Основной компонент секции комментариев
// ===========================================

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CommentService } from '@/services/commentService';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { CommentStats } from './CommentStats';
import type { Comment, CommentSectionConfig, CommentLoadingState } from '@/types/comments';

interface CommentSectionProps {
  eventId: string;
  config?: CommentSectionConfig;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  eventId,
  config = {},
  className = ''
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [state, setState] = useState<CommentLoadingState>({
    loading: true,
    submitting: false,
    liking: false,
    error: null
  });

  const defaultConfig: CommentSectionConfig = {
    maxDepth: 3,
    showAvatars: true,
    allowEditing: true,
    allowReplies: true,
    showTimestamps: true,
    pageSize: 20,
    ...config
  };

  // 📖 Загрузка комментариев
  const loadComments = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await CommentService.getComments(eventId);
      setComments(data);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Ошибка загрузки комментариев' 
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [eventId]);

  // 🔄 Начальная загрузка и подписка на изменения
  useEffect(() => {
    loadComments();

    // Подписываемся на real-time обновления
    const unsubscribe = CommentService.subscribeToComments(eventId, (payload) => {
      console.log('Real-time update:', payload);
      // Перезагружаем комментарии при изменениях
      loadComments();
    });

    return unsubscribe;
  }, [eventId, loadComments]);

  // ✍️ Создание нового комментария
  const handleCreateComment = async (text: string, parentId?: string) => {
    try {
      setState(prev => ({ ...prev, submitting: true, error: null }));
      
      await CommentService.createComment({
        event_id: eventId,
        text,
        parent_id: parentId
      });

      // Перезагружаем комментарии
      await loadComments();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Ошибка создания комментария' 
      }));
    } finally {
      setState(prev => ({ ...prev, submitting: false }));
    }
  };

  // ❤️ Обработка лайков
  const handleToggleLike = async (commentId: string) => {
    try {
      setState(prev => ({ ...prev, liking: true }));
      
      const result = await CommentService.toggleLike(commentId);
      
      // Обновляем состояние комментария локально
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes_count: result.likesCount,
              user_liked: result.liked 
            }
          : comment
      ));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Ошибка обработки лайка' 
      }));
    } finally {
      setState(prev => ({ ...prev, liking: false }));
    }
  };

  // ✏️ Обновление комментария
  const handleUpdateComment = async (commentId: string, text: string) => {
    try {
      await CommentService.updateComment(commentId, { text });
      await loadComments();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Ошибка обновления комментария' 
      }));
    }
  };

  // 🗑️ Удаление комментария
  const handleDeleteComment = async (commentId: string) => {
    try {
      await CommentService.deleteComment(commentId);
      await loadComments();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Ошибка удаления комментария' 
      }));
    }
  };

  // 🏗️ Построение древовидной структуры комментариев
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Создаем карту всех комментариев
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Строим дерево
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const treeComments = buildCommentTree(comments);

  // 🎨 Рендер состояния загрузки
  if (state.loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Загружаем комментарии...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Заголовок секции */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Комментарии
            </h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {comments.length}
            </span>
          </div>
          
          {/* Статистика */}
          <CommentStats eventId={eventId} />
        </div>
      </div>

      {/* Ошибка */}
      {state.error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{state.error}</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Форма создания комментария */}
        <div className="mb-6">
          <CommentForm
            onSubmit={handleCreateComment}
            loading={state.submitting}
            placeholder="Поделитесь своим мнением о мероприятии..."
          />
        </div>

        {/* Список комментариев */}
        {treeComments.length > 0 ? (
          <CommentList
            comments={treeComments}
            config={defaultConfig}
            onToggleLike={handleToggleLike}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onReply={handleCreateComment}
            loading={{
              liking: state.liking,
              submitting: state.submitting
            }}
          />
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">
              Пока нет комментариев
            </h4>
            <p className="text-gray-400">
              Станьте первым, кто поделится мнением об этом мероприятии!
            </p>
          </div>
        )}
      </div>

      {/* Индикатор загрузки лайков */}
      {state.liking && (
        <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
          Обновляем лайк...
        </div>
      )}
    </div>
  );
};

export default CommentSection;