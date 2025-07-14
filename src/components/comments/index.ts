// 🗒️ Экспорт компонентов системы комментариев
// ============================================

export { CommentSection } from './CommentSection';
export { CommentForm } from './CommentForm';
export { CommentList, CommentStats } from './CommentList';
export { CommentItem } from './CommentItem';

// Экспорт типов
export type { 
  Comment,
  CommentLike,
  CommentNotification,
  CreateCommentData,
  UpdateCommentData,
  CommentFormData,
  CommentSectionConfig,
  CommentLoadingState,
  CommentStats as CommentStatsType,
  CommentFilters
} from '@/types/comments';

// Экспорт сервисов
export { CommentService } from '@/services/commentService';

// Экспорт хуков
export { useCommentNotifications } from '@/hooks/useCommentNotifications';

// Экспорт компонентов уведомлений
export { NotificationCenter } from '@/components/notifications/NotificationCenter';