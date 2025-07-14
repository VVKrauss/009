// 🗒️ Список комментариев и статистика
// ===================================

import React from 'react';
import { CommentItem } from './CommentItem';
import type { Comment, CommentSectionConfig } from '@/types/comments';

// 📋 Компонент списка комментариев
interface CommentListProps {
  comments: Comment[];
  config: CommentSectionConfig;
  onToggleLike: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReply: (text: string, parentId: string) => Promise<void>;
  loading?: {
    liking?: boolean;
    submitting?: boolean;
  };
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  config,
  onToggleLike,
  onUpdateComment,
  onDeleteComment,
  onReply,
  loading = {}
}) => {
  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          config={config}
          depth={0}
          onToggleLike={onToggleLike}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onReply={onReply}
          loading={loading}
        />
      ))}
    </div>
  );
};

// 📊 Компонент статистики комментариев
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { CommentService } from '@/services/commentService';
import type { CommentStats as CommentStatsType } from '@/types/comments';

interface CommentStatsProps {
  eventId: string;
  className?: string;
}

export const CommentStats: React.FC<CommentStatsProps> = ({
  eventId,
  className = ''
}) => {
  const [stats, setStats] = useState<CommentStatsType>({
    total: 0,
    totalLikes: 0,
    userCommentsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await CommentService.getCommentStats(eventId);
        setStats(data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [eventId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 text-sm text-gray-500 ${className}`}>
      {/* Общее количество комментариев */}
      <div className="flex items-center gap-1">
        <MessageCircle className="w-4 h-4" />
        <span>{stats.total}</span>
      </div>

      {/* Общее количество лайков */}
      <div className="flex items-center gap-1">
        <Heart className="w-4 h-4" />
        <span>{stats.totalLikes}</span>
      </div>

      {/* Комментарии пользователя */}
      {stats.userCommentsCount > 0 && (
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>Ваших: {stats.userCommentsCount}</span>
        </div>
      )}
    </div>
  );
};

export default CommentStats;