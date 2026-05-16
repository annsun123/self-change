"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Shadow, ShadowRecord } from "@/types/database";
import { ShadowSelfRatingCard } from "@/components/shadow-hall/self-rating-card";
import { BattleLogDetail } from "@/components/shadow-hall/battle-log-detail";
import { Plus, ChevronRight } from "lucide-react";

type ViewState = 'list' | 'log';

export default function ShadowHallPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeShadows, setActiveShadows] = useState<Shadow[]>([]);
  const [dormantShadows, setDormantShadows] = useState<Shadow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedShadow, setSelectedShadow] = useState<Shadow | null>(null);
  const [shadowRecords, setShadowRecords] = useState<ShadowRecord[]>([]);
  const [ratingShadow, setRatingShadow] = useState<Shadow | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Load all shadows
      const { data: allShadows } = await supabase
        .from('shadows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (allShadows) {
        setActiveShadows(allShadows.filter(s => s.is_active));
        setDormantShadows(allShadows.filter(s => !s.is_active));
      }

      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const loadShadowRecords = async (shadowType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: records } = await supabase
      .from('shadow_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('shadow_type', shadowType)
      .order('date', { ascending: false });

    if (records) setShadowRecords(records);
  };

  const handleViewLog = async (shadow: Shadow) => {
    setSelectedShadow(shadow);
    await loadShadowRecords(shadow.shadow_type);
    setViewState('log');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedShadow(null);
    setShadowRecords([]);
  };

  const handleStartRating = (shadow: Shadow) => {
    setRatingShadow(shadow);
  };

  const handleRatingSubmit = async (rating: '+1' | '-1' | 'skip' | 'breakthrough', behaviorRecord: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ratingShadow) return;

    const today = new Date().toISOString().split('T')[0];

    // Insert shadow record
    const { error: recordError } = await supabase
      .from('shadow_records')
      .upsert({
        user_id: user.id,
        shadow_type: ratingShadow.shadow_type,
        date: today,
        self_rating: rating,
        behavior_record: behaviorRecord,
        teacher_response: getTeacherResponse(rating, ratingShadow.shadow_type),
      });

    if (recordError) {
      console.error('Failed to save shadow record:', recordError);
      return;
    }

    // Update shadow HP based on rating
    let hpDelta = 0;
    if (rating === '+1') hpDelta = 1;
    if (rating === '-1' || rating === 'breakthrough') hpDelta = -1;

    const currentHp = ratingShadow.current_hp;
    let newHp = Math.max(0, currentHp + hpDelta);
    let newMaxHp = ratingShadow.max_hp;
    let newShatterCount = ratingShadow.shatter_count;
    let newRound = ratingShadow.current_round;
    let isActive = ratingShadow.is_active;

    // Handle breakthrough
    if (rating === 'breakthrough' || (rating === '-1' && newHp === 0)) {
      newShatterCount += 1;
      if (newShatterCount === 1) {
        newMaxHp = 5;
        newHp = 5;
      } else if (newShatterCount === 2) {
        newMaxHp = 3;
        newHp = 3;
      } else {
        newMaxHp = 3;
        newHp = 3;
      }
      newRound += 1;

      // Enter dormant state
      if (newRound >= 4) {
        isActive = false;
      }
    }

    // Update shadow
    const { error: shadowError } = await supabase
      .from('shadows')
      .update({
        current_hp: newHp,
        max_hp: newMaxHp,
        shatter_count: newShatterCount,
        current_round: newRound,
        is_active: isActive,
        last_damaged_at: new Date().toISOString(),
      })
      .eq('id', ratingShadow.id);

    if (shadowError) {
      console.error('Failed to update shadow:', shadowError);
    }

    setRatingShadow(null);

    // Refresh data
    const { data: allShadows } = await supabase
      .from('shadows')
      .select('*')
      .eq('user_id', user.id);

    if (allShadows) {
      setActiveShadows(allShadows.filter(s => s.is_active));
      setDormantShadows(allShadows.filter(s => !s.is_active));
    }
  };

  const getTeacherResponse = (rating: string, shadowType: string) => {
    const teacher = shadowType === 'arrogance' ? '申先生' : '徐娘子';
    if (rating === '+1') {
      return '你觉察到了吗？这已经是改变的第一步了。';
    } else if (rating === '-1') {
      return '这一步太难了。你做到了。';
    } else if (rating === 'breakthrough') {
      return '恭喜你。但是——你觉得它真的离开了吗？';
    }
    return '';
  };

  const getTrend = (shadow: Shadow) => {
    // Simplified trend - in real app would calculate from records
    if (shadow.current_hp === shadow.max_hp) return '→';
    if (shadow.current_hp > shadow.max_hp / 2) return '↘';
    return '↗';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  // Battle log view
  if (viewState === 'log' && selectedShadow) {
    return (
      <BattleLogDetail
        shadow={selectedShadow}
        records={shadowRecords}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/scroll-map')} className="text-stone-500 hover:text-stone-300">
            ← 返回
          </button>
          <h1 className="text-xl font-serif text-amber-400">🏯 阴影阁</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Active Shadows */}
        <section>
          <h2 className="text-sm text-stone-500 mb-3">🟢 当前战斗中的阴影</h2>
          <div className="space-y-3">
            {activeShadows.length === 0 ? (
              <p className="text-stone-600 text-center py-8">暂无战斗中的阴影</p>
            ) : (
              activeShadows.map((shadow) => {
                const shadowName = shadow.shadow_type === 'arrogance' ? '逆星' : '毒疮';
                const shadowDesc = shadow.shadow_type === 'arrogance' ? '高傲' : '自私';
                return (
                  <div
                    key={shadow.id}
                    className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🖤</span>
                        <div>
                          <p className="text-stone-200">{shadowName}（{shadowDesc}）</p>
                          <p className="text-stone-500 text-sm">
                            {shadow.current_hp}/{shadow.max_hp} · 第{shadow.current_round}轮 · 态势：{getTrend(shadow)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartRating(shadow)}
                          className="px-3 py-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded text-amber-400"
                        >
                          记录
                        </button>
                        <button
                          onClick={() => handleViewLog(shadow)}
                          className="px-3 py-1 text-xs text-stone-500 hover:text-stone-300 flex items-center gap-1"
                        >
                          战史 <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* HP Visual */}
                    <div className="mt-3 flex gap-1">
                      {Array.from({ length: shadow.max_hp }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded ${
                            i < shadow.current_hp ? 'bg-amber-600' : 'bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Dormant Shadows */}
        {dormantShadows.length > 0 && (
          <section>
            <h2 className="text-sm text-stone-500 mb-3">🟡 休眠中的阴影（已崩解）</h2>
            <div className="space-y-3">
              {dormantShadows.map((shadow) => {
                const shadowName = shadow.shadow_type === 'arrogance' ? '逆星' : shadow.shadow_type === 'selfishness' ? '毒疮' : shadow.shadow_type;
                return (
                  <div
                    key={shadow.id}
                    className="p-4 bg-stone-900/30 border border-stone-800/50 rounded-lg opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💤</span>
                        <div>
                          <p className="text-stone-400">{shadowName}</p>
                          <p className="text-stone-600 text-sm">
                            已崩解 × {shadow.shatter_count}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewLog(shadow)}
                        className="px-3 py-1 text-xs text-stone-500 hover:text-stone-300 flex items-center gap-1"
                      >
                        战史 <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Add Shadow Button */}
        <button className="w-full p-4 border border-dashed border-stone-700 hover:border-amber-600/50 rounded-lg text-stone-500 hover:text-amber-400 flex items-center justify-center gap-2 transition-all">
          <Plus size={18} />
          新增阴影
        </button>
      </main>

      {/* Rating Modal */}
      {ratingShadow && (
        <ShadowSelfRatingCard
          shadow={ratingShadow}
          onSubmit={handleRatingSubmit}
          onClose={() => setRatingShadow(null)}
        />
      )}
    </div>
  );
}