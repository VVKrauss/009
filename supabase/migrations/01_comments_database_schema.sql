-- 🗒️ Система комментариев v2.0 - Структура базы данных
-- ===============================================================

-- 1. Создание таблицы комментариев
-- ================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 5000),
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    replies_count INTEGER DEFAULT 0 CHECK (replies_count >= 0),
    is_deleted BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создание таблицы лайков
-- ==========================
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 3. Создание таблицы уведомлений
-- ===============================
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    event_id UUID NOT NULL,
    type TEXT CHECK (type IN ('reply', 'like', 'mention')) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создание индексов для производительности
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_likes_count ON comments(likes_count DESC);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON comment_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON comment_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON comment_notifications(recipient_id, is_read);

-- 5. Триггеры для автоматического обновления
-- ==========================================

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для подсчета лайков
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments 
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments 
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_count();

-- Триггер для подсчета ответов
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE comments 
        SET replies_count = replies_count + 1
        WHERE id = NEW.parent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE comments 
        SET replies_count = replies_count - 1
        WHERE id = OLD.parent_id;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_replies_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_replies_count();

-- 6. Политики безопасности (RLS)
-- ==============================

-- Включаем RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- Политики для comments
CREATE POLICY "Все могут читать неудаленные комментарии"
    ON comments FOR SELECT
    USING (is_deleted = false);

CREATE POLICY "Авторизованные пользователи могут создавать комментарии"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Пользователи могут обновлять свои комментарии"
    ON comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Пользователи могут удалять свои комментарии"
    ON comments FOR DELETE
    USING (auth.uid() = author_id);

-- Политики для comment_likes
CREATE POLICY "Все могут читать лайки"
    ON comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Авторизованные пользователи могут ставить лайки"
    ON comment_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои лайки"
    ON comment_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Политики для comment_notifications
CREATE POLICY "Пользователи видят только свои уведомления"
    ON comment_notifications FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Система может создавать уведомления"
    ON comment_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Пользователи могут обновлять свои уведомления"
    ON comment_notifications FOR UPDATE
    USING (auth.uid() = recipient_id);

-- 7. Функции для работы с комментариями
-- ====================================

-- Функция для получения комментариев с информацией об авторах
CREATE OR REPLACE FUNCTION get_comments_with_authors(event_uuid UUID)
RETURNS TABLE (
    id UUID,
    event_id UUID,
    author_id UUID,
    parent_id UUID,
    text TEXT,
    likes_count INTEGER,
    replies_count INTEGER,
    is_deleted BOOLEAN,
    is_edited BOOLEAN,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    author_avatar TEXT,
    user_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.event_id,
        c.author_id,
        c.parent_id,
        c.text,
        c.likes_count,
        c.replies_count,
        c.is_deleted,
        c.is_edited,
        c.edited_at,
        c.created_at,
        COALESCE(p.full_name, p.email, 'Аноним') as author_name,
        p.avatar_url as author_avatar,
        EXISTS(
            SELECT 1 FROM comment_likes cl 
            WHERE cl.comment_id = c.id AND cl.user_id = auth.uid()
        ) as user_liked
    FROM comments c
    LEFT JOIN profiles p ON c.author_id = p.id
    WHERE c.event_id = event_uuid 
    AND c.is_deleted = false
    ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания уведомления
CREATE OR REPLACE FUNCTION create_comment_notification(
    recipient_uuid UUID,
    sender_uuid UUID,
    comment_uuid UUID,
    event_uuid UUID,
    notification_type TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Не создаем уведомление самому себе
    IF recipient_uuid = sender_uuid THEN
        RETURN NULL;
    END IF;
    
    -- Проверяем, нет ли уже такого уведомления
    SELECT id INTO notification_id 
    FROM comment_notifications 
    WHERE recipient_id = recipient_uuid 
    AND sender_id = sender_uuid 
    AND comment_id = comment_uuid 
    AND type = notification_type;
    
    -- Если уведомления нет, создаем новое
    IF notification_id IS NULL THEN
        INSERT INTO comment_notifications (
            recipient_id, sender_id, comment_id, event_id, type
        ) VALUES (
            recipient_uuid, sender_uuid, comment_uuid, event_uuid, notification_type
        ) RETURNING id INTO notification_id;
    END IF;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Тестовые данные (опционально)
-- ================================
/*
-- Uncomment to insert test data
INSERT INTO comments (event_id, author_id, text) VALUES 
('123e4567-e89b-12d3-a456-426614174000', auth.uid(), 'Отличное мероприятие!'),
('123e4567-e89b-12d3-a456-426614174000', auth.uid(), 'Согласен, очень познавательно!');
*/

-- Финальная проверка
SELECT 'Система комментариев v2.0 успешно создана!' as status;