"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile, Shadow, DailySchedule } from "@/types/database";
import { getPhaseDisplayInfo, type Weather } from "@/lib/game-logic";
import { getVeinCount, VEIN_POSITIONS, hasFullGlow } from "@/lib/wangde-visual";
import { TOTAL_STEPS } from "@/lib/assessment";
import { FIVE_TASKS } from "@/components/morning/encouragement-pool";

export default function ScrollMapPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shadows, setShadows] = useState<Shadow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<Weather>("clear");
  const [todaySchedule, setTodaySchedule] = useState<DailySchedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load shadow records for weather calculation
      const { data: recentRecords } = await supabase
        .from('shadow_records')
        .select('self_rating')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      // Load shadow data
      const { data: shadowsData } = await supabase
        .from("shadows")
        .select("*")
        .eq("user_id", user.id);

      if (shadowsData) {
        setShadows(shadowsData);
      }

      // Load today's schedule
      const today = new Date().toISOString().split('T')[0];
      const { data: scheduleData } = await supabase
        .from("daily_schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (scheduleData) {
        setTodaySchedule(scheduleData);
      }

      // Calculate holistic weather from shadow records + lessons + flag
      if (recentRecords && recentRecords.length > 0) {
        let score = 0;
        recentRecords.forEach(r => {
          if (r.self_rating === '-1') score += 1;
          if (r.self_rating === '+1') score -= 1;
        });

        // Incorporate lesson completion
        if (scheduleData?.tasks && scheduleData.tasks.length > 0) {
          const completedCount = scheduleData.tasks.filter((t: any) => t.completed).length;
          const rate = completedCount / scheduleData.tasks.length;
          if (rate >= 0.7) score += 1;
          else if (rate === 0) score -= 1;
        }

        // Incorporate flag achievement
        if (profileData?.today_goal_achieved === true) score += 1;
        else if (profileData?.today_goal_achieved === false) score -= 1;

        // Apply weather logic
        if (score >= 3) setWeather("clear");
        else if (score >= 1) setWeather("cloudy");
        else if (score >= -1) setWeather("rainbow");
        else setWeather("storm");
      }

      setLoading(false);
    };

    loadUserData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleToggleTaskCompletion = async (taskIndex: number) => {
    if (!todaySchedule || !profile) return;

    const updatedTasks = [...todaySchedule.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      completed: !updatedTasks[taskIndex].completed
    };

    const scheduleDate = todaySchedule.date;

    // Optimistic update
    setTodaySchedule({ ...todaySchedule, tasks: updatedTasks });

    // Persist to database
    const { error } = await supabase
      .from('daily_schedules')
      .update({ tasks: updatedTasks })
      .eq('user_id', profile.id)
      .eq('date', scheduleDate);

    if (error) {
      console.error('Failed to update task completion:', error);
      // Revert on error
      setTodaySchedule(todaySchedule);
    }
  };

  // Render HP squares
  const renderHpGrid = (shadow: Shadow) => {
    const filled = shadow.current_hp;
    const total = shadow.max_hp;
    const empty = total - filled;
    return (
      <div key={shadow.id} className="flex items-center gap-1">
        <span className="text-xs text-stone-400">
          {shadow.shadow_type === "arrogance" ? "逆星" : "毒疮"}:
        </span>
        <span>
          {"⬛".repeat(filled)}
          {"⬜".repeat(empty)}
        </span>
      </div>
    );
  };

  // Calculate Wangde veins
  const wangde = profile?.wangde || 0;
  const veinCount = getVeinCount(wangde);

  // Weather emoji
  const getWeatherEmoji = (w: Weather) => {
    switch (w) {
      case "clear": return "☀️";
      case "cloudy": return "⛅";
      case "storm": return "⛈️";
      case "rainbow": return "🌈";
      default: return "🌤️";
    }
  };

  // Goal flag display
  const todayGoal = profile?.today_goal;
  const goalAchieved = profile?.today_goal_achieved || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  const phaseInfo = profile ? getPhaseDisplayInfo(profile.current_phase) : null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-serif text-amber-400">自我改变</h1>
          {phaseInfo && (
            <p className="text-xs text-stone-500">
              {phaseInfo.emoji} {phaseInfo.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/behavior-analysis')}
            className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-300 border border-stone-800 rounded"
          >
            📜 行为录
          </button>
          <button
            onClick={() => router.push('/shadow-hall')}
            className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-300 border border-stone-800 rounded"
          >
            🏯 阴影阁
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-stone-500 hover:text-stone-300"
          >
            退出
          </button>
        </div>
      </header>

      {/* Main Content - 滚动地图 */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* 地图区域 */}
        <div className="relative w-full max-w-lg aspect-[4/3] bg-stone-900/50 rounded-xl border border-stone-800 overflow-hidden flex items-center justify-center">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-stone-800/50 to-transparent" />
          </div>

          {/* 地图内容 */}
          <div className="text-center space-y-6 z-10">
            <div className="text-8xl">
              {weather === "storm" ? "⛈️" : weather === "rainbow" ? "🌈" : "🗺️"}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-amber-400">
                第 {profile?.created_at
  ? Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))
  : 1} 天
              </h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-stone-400 text-sm">
                  {profile ? `当前位置：${profile.scroll_position.toLocaleString()}` : "Loading..."}
                </p>
                <button
                  onClick={() => router.push('/assessment')}
                  className="px-2 py-0.5 text-xs text-amber-400 border border-amber-600/30 hover:bg-amber-900/20 rounded transition-all"
                >
                  ⚔ 考核
                </button>
              </div>
            </div>

            {/* 王子状态 + 旗帜 */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="text-4xl">👸</div>
              {/* Goal Flag */}
              {todayGoal && (
                <div className="text-2xl" title={todayGoal}>
                  {goalAchieved ? "🏁" : "🚩"}
                </div>
              )}
              <div className="text-left">
                <p className="text-amber-300 text-sm">
                  {profile?.nickname || profile?.username || "殿下"}
                </p>
                <p className="text-stone-500 text-xs">
                  距离王宫还有 {Math.max(0, TOTAL_STEPS - (profile?.scroll_position || 0)).toLocaleString()} 步
                </p>
              </div>
            </div>

            {/* 王德纹路可视化 - 当veinCount > 0时显示 */}
            {veinCount > 0 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <span className="text-amber-500 text-sm mr-2">✨</span>
                {VEIN_POSITIONS.slice(0, veinCount).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  />
                ))}
                {veinCount < 5 && Array.from({ length: 5 - veinCount }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-6 h-1 bg-stone-700 rounded-full" />
                ))}
              </div>
            )}

            {/* Full glow indicator */}
            {hasFullGlow(wangde) && (
              <p className="text-amber-400 text-xs animate-pulse">✨ 金光绕身</p>
            )}
          </div>

          {/* 天气效果 */}
          <div className="absolute top-4 right-4 text-2xl">
            {weather === "clear" && <span className="animate-pulse">{getWeatherEmoji(weather)}</span>}
            {weather === "cloudy" && getWeatherEmoji(weather)}
            {weather === "storm" && <span className="animate-bounce">{getWeatherEmoji(weather)}</span>}
            {weather === "rainbow" && getWeatherEmoji(weather)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4 pt-8 w-full max-w-lg">
          <button
            onClick={() => router.push("/morning")}
            className="p-6 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/30 rounded-lg transition-all"
          >
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-amber-400 font-medium">晨间规划</div>
            <div className="text-xs text-stone-500 mt-1">3-5分钟</div>
          </button>
          <button
            onClick={() => router.push("/evening")}
            className="p-6 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/30 rounded-lg transition-all"
          >
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-amber-400 font-medium">晚间对话</div>
            <div className="text-xs text-stone-500 mt-1">5-9分钟 · 核心</div>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="p-6 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/30 rounded-lg transition-all"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="text-amber-400 font-medium">今日日程</div>
            <div className="text-xs text-stone-500 mt-1">查看规划</div>
          </button>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="p-4 border-t border-stone-800">
        <div className="flex flex-col items-center gap-2">
          {/* 王德显示 with veins */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">王德:</span>
              <span className="text-amber-400 font-medium">{wangde}</span>
              <span className="text-stone-600 text-xs">/ 15</span>
            </div>
            {/* Vein indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < veinCount ? 'text-amber-400' : 'text-stone-700'}`}
                >
                  ✦
                </span>
              ))}
            </div>
            <span className="text-stone-600 text-xs">
              {veinCount}纹
            </span>
          </div>

          {/* 阴影 HP 显示 */}
          <div className="flex items-center gap-6 text-xs">
            {shadows.length > 0 ? (
              shadows.map(renderHpGrid)
            ) : (
              <span className="text-stone-600">暂无阴影数据</span>
            )}
          </div>
        </div>
      </footer>

      {/* 今日日程 Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif text-amber-400">📋 今日日程</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-stone-500 hover:text-stone-300"
              >
                ✕
              </button>
            </div>

            {todaySchedule ? (
              <>
                {/* 今日目标 */}
                {todaySchedule.goal_text && (
                  <div className="mb-4 p-3 bg-amber-900/10 border border-amber-800/30 rounded-lg">
                    <p className="text-stone-400 text-xs">🚩 今日目标</p>
                    <p className="text-amber-300 mt-1">{todaySchedule.goal_text}</p>
                    {todaySchedule.goal_shadow && (
                      <p className="text-stone-500 text-xs mt-1">
                        关联阴影：{todaySchedule.goal_shadow === 'arrogance' ? '逆星（高傲）' : '毒疮（自私）'}
                      </p>
                    )}
                  </div>
                )}

                {/* 功课列表 */}
                {todaySchedule.tasks && todaySchedule.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {todaySchedule.tasks.map((task, i) => {
                      const taskConfig = FIVE_TASKS.find(t => t.type === task.type);
                      return (
                        <div
                          key={i}
                          onClick={() => handleToggleTaskCompletion(i)}
                          className={`p-3 border rounded-lg flex items-start gap-3 cursor-pointer transition-all ${
                            task.completed
                              ? 'bg-stone-800/30 border-stone-700'
                              : 'bg-stone-800/50 border-stone-700 hover:border-stone-600'
                          }`}
                        >
                          <span className="text-xl">{taskConfig?.emoji || '📋'}</span>
                          <div className="flex-1">
                            <p className={`${task.completed ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                              {task.content || taskConfig?.name}
                            </p>
                            {task.start_time && (
                              <p className="text-stone-500 text-xs mt-1">
                                ⏰ {task.start_time}{task.end_time ? ` ~ ${task.end_time}` : ''}
                                {task.duration ? ` · ${task.duration}分钟` : ''}
                              </p>
                            )}
                          </div>
                          <span className={task.completed ? 'text-green-400' : 'text-stone-600'}>
                            {task.completed ? '✅' : '○'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-stone-500 text-sm">今日尚未编排功课</p>
                )}

                {todaySchedule.goal_reward && (
                  <div className="mt-4 p-3 bg-stone-800/30 rounded border border-stone-700">
                    <p className="text-stone-400 text-xs">🎁 完成奖励</p>
                    <p className="text-stone-300 text-sm mt-1">{todaySchedule.goal_reward}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-stone-400">今日尚未编排功课</p>
                <p className="text-stone-600 text-sm mt-1">请点击☀️晨间规划开始今日安排</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}