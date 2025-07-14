// 🗒️ Типы для системы комментариев
// =====================================

export interface Comment {
  id: string;
  event_id: string;
  author_id: string;
  parent_id: string | null;
  text: string;
  likes_count: number;
  replies_count: number;
  is_deleted: boolean;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Информация об авторе (из JOIN запроса)
  author_name?: string;
  author_avatar?: string;
  
  // Пользовательские данные
  user_liked?: boolean;
  
  // Вложенные ответы (для древовидной структуры)
  replies?: Comment[];
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentNotification {
  id: string;
  recipient_id: string;
  sender_id: string;
  comment_id: string;
  event_id: string;
  type: 'reply' | 'like' | 'mention';
  is_read: boolean;
  created_at: string;
}

export interface CreateCommentData {
  event_id: string;
  text: string;
  parent_id?: string;
}

export interface UpdateCommentData {
  text: string;
}

export interface CommentFormData {
  text: string;
}

// Настройки для компонентов
export interface CommentSectionConfig {
  maxDepth?: number; // Максимальная глубина вложенности
  showAvatars?: boolean;
  allowEditing?: boolean;
  allowReplies?: boolean;
  showTimestamps?: boolean;
  pageSize?: number;
}

// Состояние загрузки
export interface CommentLoadingState {
  loading: boolean;
  submitting: boolean;
  liking: boolean;
  error: string | null;
}

// Статистика комментариев
export interface CommentStats {
  total: number;
  totalLikes: number;
  userCommentsCount: number;
}

// Фильтры для комментариев
export interface CommentFilters {
  sortBy: 'newest' | 'oldest' | 'popular';
  showDeleted?: boolean;
}

export default Comment;