-- =====================================================
-- 添加昵称字段
-- =====================================================

-- 给 profiles 表添加 nickname（显示昵称，不同于登录用户名）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 更新自动创建用户档案的触发器，支持从 user_meta_data 读取 nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 创建用户档案
    INSERT INTO public.profiles (id, username, nickname)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'nickname'
    );

    -- 创建初始阴影（逆星 - 高傲）
    INSERT INTO public.shadows (user_id, shadow_type, current_hp, max_hp)
    VALUES (NEW.id, 'arrogance', 7, 7);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
