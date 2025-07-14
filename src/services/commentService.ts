// 🗒️ Сервис для работы с комментариями
// ====================================

import { supabase } from '@/lib/supabase';
import type { 
  Comment, 
  CreateCommentData, 
  UpdateCommentData, 
  CommentStats 
} from '@/types/comments';

export class CommentService {
  
  // 📖 Получение комментариев для события
  static async getComments(eventId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_comments_with_authors', { event_uuid: eventId });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
      throw new Error('Не удалось загрузить комментарии');
    }
  }

  // ✍️ Создание нового комментария
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          event_id: commentData.event_id,
          author_id: user.id,
          parent_id: commentData.parent_id || null,
          text: commentData.text.trim()
        })
        .select(`
          *,
          profiles:author_id(full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Создаем уведомление для родительского комментария
      if (commentData.parent_id) {
        await this.createReplyNotification(
          commentData.parent_id, 
          commentData.event_id,
          data.id
        );
      }

      return this.formatComment(data);
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
      throw new Error('Не удалось создать комментарий');
    }
  }

  // ✏️ Обновление комментария
  static async updateComment(commentId: string, updateData: UpdateCommentData): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          text: updateData.text.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          profiles:author_id(full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      return this.formatComment(data);
    } catch (error) {
      console.error('Ошибка обновления комментария:', error);
      throw new Error('Не удалось обновить комментарий');
    }
  }

  // 🗑️ Удаление комментария (мягкое удаление)
  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      throw new Error('Не удалось удалить комментарий');
    }
  }

  // ❤️ Поставить/убрать лайк
  static async toggleLike(commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      // Проверяем, есть ли уже лайк
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Убираем лайк
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Получаем обновленное количество лайков
        const { data: comment } = await supabase
          .from('comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        return { 
          liked: false, 
          likesCount: comment?.likes_count || 0 
        };
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;

        // Создаем уведомление автору комментария
        await this.createLikeNotification(commentId);

        // Получаем обновленное количество лайков
        const { data: comment } = await supabase
          .from('comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        return { 
          liked: true, 
          likesCount: comment?.likes_count || 0 
        };
      }
    } catch (error) {
      console.error('Ошибка обработки лайка:', error);
      throw new Error('Не удалось обработать лайк');
    }
  }

  // 📊 Получение статистики комментариев
  static async getCommentStats(eventId: string): Promise<CommentStats> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, likes_count, author_id')
        .eq('event_id', eventId)
        .eq('is_deleted', false);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        total: data?.length || 0,
        totalLikes: data?.reduce((sum, comment) => sum + comment.likes_count, 0) || 0,
        userCommentsCount: user ? 
          data?.filter(comment => comment.author_id === user.id).length || 0 : 0
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      throw new Error('Не удалось получить статистику');
    }
  }

  // 🔔 Создание уведомления об ответе
  private static async createReplyNotification(
    parentCommentId: string, 
    eventId: string,
    newCommentId: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Получаем автора родительского комментария
      const { data: parentComment } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentCommentId)
        .single();

      if (parentComment && parentComment.author_id !== user.id) {
        await supabase.rpc('create_comment_notification', {
          recipient_uuid: parentComment.author_id,
          sender_uuid: user.id,
          comment_uuid: newCommentId,
          event_uuid: eventId,
          notification_type: 'reply'
        });
      }
    } catch (error) {
      console.error('Ошибка создания уведомления об ответе:', error);
    }
  }

  // 🔔 Создание уведомления о лайке
  private static async createLikeNotification(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Получаем информацию о комментарии
      const { data: comment } = await supabase
        .from('comments')
        .select('author_id, event_id')
        .eq('id', commentId)
        .single();

      if (comment && comment.author_id !== user.id) {
        await supabase.rpc('create_comment_notification', {
          recipient_uuid: comment.author_id,
          sender_uuid: user.id,
          comment_uuid: commentId,
          event_uuid: comment.event_id,
          notification_type: 'like'
        });
      }
    } catch (error) {
      console.error('Ошибка создания уведомления о лайке:', error);
    }
  }

  // 🔄 Форматирование комментария
  private static formatComment(rawComment: any): Comment {
    return {
      id: rawComment.id,
      event_id: rawComment.event_id,
      author_id: rawComment.author_id,
      parent_id: rawComment.parent_id,
      text: rawComment.text,
      likes_count: rawComment.likes_count || 0,
      replies_count: rawComment.replies_count || 0,
      is_deleted: rawComment.is_deleted || false,
      is_edited: rawComment.is_edited || false,
      edited_at: rawComment.edited_at,
      created_at: rawComment.created_at,
      updated_at: rawComment.updated_at,
      author_name: rawComment.profiles?.full_name || 
                   rawComment.profiles?.email || 
                   'Аноним',
      author_avatar: rawComment.profiles?.avatar_url,
      user_liked: rawComment.user_liked || false
    };
  }

  // 🔴 Подписка на изменения комментариев (Real-time)
  static subscribeToComments(
    eventId: string, 
    onUpdate: (payload: any) => void
  ) {
    const channel = supabase
      .channel(`comments:${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `event_id=eq.${eventId}`
      }, onUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export default CommentService;