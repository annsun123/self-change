-- =====================================================
-- Row Level Security 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogue_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wangde_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_events ENABLE ROW LEVEL SECURITY;

-- profiles 策略
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- shadows 策略
CREATE POLICY "Users can manage own shadows"
    ON public.shadows FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- daily_tasks 策略
CREATE POLICY "Users can manage own tasks"
    ON public.daily_tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- dialogues 策略
CREATE POLICY "Users can manage own dialogues"
    ON public.dialogues FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- dialogue_messages 策略
CREATE POLICY "Users can view own dialogue messages"
    ON public.dialogue_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.dialogues
        WHERE dialogues.id = dialogue_messages.dialogue_id
        AND dialogues.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own dialogue messages"
    ON public.dialogue_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.dialogues
        WHERE dialogues.id = dialogue_messages.dialogue_id
        AND dialogues.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own dialogue messages"
    ON public.dialogue_messages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.dialogues
        WHERE dialogues.id = dialogue_messages.dialogue_id
        AND dialogues.user_id = auth.uid()
    ));

-- wangde_events 策略
CREATE POLICY "Users can manage own wangde events"
    ON public.wangde_events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- artifacts 策略
CREATE POLICY "Users can manage own artifacts"
    ON public.artifacts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- narrative_events 策略
CREATE POLICY "Users can manage own narrative events"
    ON public.narrative_events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
