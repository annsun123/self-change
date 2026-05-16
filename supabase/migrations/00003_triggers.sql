-- =====================================================
-- 自动创建用户档案触发器
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 创建用户档案
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username');

    -- 创建初始阴影（逆星 - 高傲）
    INSERT INTO public.shadows (user_id, shadow_type, current_hp, max_hp)
    VALUES (NEW.id, 'arrogance', 7, 7);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在用户注册时自动触发
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
