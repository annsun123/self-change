"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FIVE_TASKS, getRandomEncouragement, sortTasksByTime, getPeriodOfDay } from "@/components/morning/encouragement-pool";
import type { Profile, ShadowType } from "@/types/database";
import type { ScheduleTask } from "@/types/database";

type Step = 'goal' | 'tasks' | 'preview' | 'complete';

export default function MorningPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('goal');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Goal state
  const [goalText, setGoalText] = useState('');
  const [goalShadow, setGoalShadow] = useState<ShadowType | null>(null);
  const [goalReward, setGoalReward] = useState('');
  const [goalCompleted, setGoalCompleted] = useState<boolean | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Record<string, {
    enabled: boolean;
    content: string;
    startTime: string;
    endTime: string;
    duration: string;
    meditationContent: string; // for meditation task
  }>>({
    reading: { enabled: false, content: '', startTime: '', endTime: '', duration: '30分钟', meditationContent: '' },
    writing: { enabled: false, content: '', startTime: '', endTime: '', duration: '30分钟', meditationContent: '' },
    service: { enabled: false, content: '', startTime: '', endTime: '', duration: '1小时', meditationContent: '' },
    meditation: { enabled: false, content: '', startTime: '', endTime: '', duration: '15分钟', meditationContent: '' },
    exercise: { enabled: false, content: '', startTime: '', endTime: '', duration: '20分钟', meditationContent: '' },
  });

  // Encouragement for service
  const [encouragement, setEncouragement] = useState(getRandomEncouragement());

  // Load profile for today's goal check
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Profile query error:', error);
          throw error;
        }

        if (data) {
          setProfile(data);
          // Pre-fill existing goal if any
          if (data.today_goal) {
            setGoalText(data.today_goal);
          }
        } else {
          // Profile doesn't exist - redirect to onboarding
          console.warn('Profile not found for user:', user.id);
          router.push('/onboarding');
        }
      } catch (err: unknown) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router, supabase]);

  const handleToggleTask = (taskType: string) => {
    setTasks(prev => ({
      ...prev,
      [taskType]: { ...prev[taskType], enabled: !prev[taskType].enabled }
    }));
  };

  const handleTaskContentChange = (taskType: string, content: string) => {
    setTasks(prev => ({
      ...prev,
      [taskType]: { ...prev[taskType], content }
    }));
  };

  const handleTaskTimeChange = (taskType: string, field: 'startTime' | 'endTime', value: string) => {
    setTasks(prev => ({
      ...prev,
      [taskType]: { ...prev[taskType], [field]: value }
    }));
  };

  const handleRefreshEncouragement = () => {
    setEncouragement(getRandomEncouragement());
  };

  const handleNextFromGoal = () => {
    if (!goalText.trim()) {
      // Allow empty goal - user can proceed without goal
    }
    setStep('tasks');
  };

  const handleBackToGoal = () => setStep('goal');
  const handleBackToTasks = () => setStep('tasks');

  const calculateDurationFromTimes = (startTime: string, endTime: string): number | null => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) return null;
    return endMinutes - startMinutes;
  };

  const buildScheduleTasks = useCallback((): ScheduleTask[] => {
    const result: ScheduleTask[] = [];

    // Add enabled tasks
    for (const taskKey of Object.keys(tasks)) {
      const task = tasks[taskKey as keyof typeof tasks];
      if (task.enabled || (taskKey === 'meditation' && task.meditationContent)) {
        // Calculate actual duration from start/end times if available
        const actualDuration = calculateDurationFromTimes(task.startTime, task.endTime);
        const duration = actualDuration ?? parseDuration(task.duration);

        const scheduleTask: ScheduleTask = {
          type: taskKey as ScheduleTask['type'],
          content: taskKey === 'meditation' && task.meditationContent
            ? task.meditationContent
            : task.content || FIVE_TASKS.find(t => t.type === taskKey)?.placeholder || '',
          start_time: task.startTime || null,
          end_time: task.endTime || null,
          duration,
          completed: false,
        };
        if (scheduleTask.content) {
          result.push(scheduleTask);
        }
      }
    }

    return result;
  }, [tasks]);

  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)/);
    if (!match) return 0;
    const num = parseInt(match[1], 10);
    if (duration.includes('小时') || duration.includes('h')) return num * 60;
    return num;
  };

  const handleConfirmSchedule = useCallback(async () => {
    if (!profile) {
      setSaveError('用户信息加载中，请稍候');
      return;
    }
    setSaving(true);

    const today = new Date().toISOString().split('T')[0];
    const scheduleTasks = buildScheduleTasks();

    try {
      // Save to database
      const { error: scheduleError } = await supabase.from('daily_schedules').upsert({
        user_id: profile.id,
        date: today,
        goal_text: goalText.trim() || null,
        goal_shadow: goalShadow,
        goal_reward: goalReward.trim() || null,
        tasks: scheduleTasks,
      }, { onConflict: 'user_id,date' });

      if (scheduleError) throw scheduleError;

      // Update profile with goal
      const { error: profileError } = await supabase.from('profiles').update({
        today_goal: goalText.trim() || null,
        today_goal_achieved: goalCompleted,
      }).eq('id', profile.id);

      if (profileError) throw profileError;

      setSaving(false);
      setStep('complete');
      setTimeout(() => router.push('/scroll-map'), 2000);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setSaving(false);
      setSaveError('保存失败，请重试');
    }
  }, [profile, goalText, goalShadow, goalReward, buildScheduleTasks, supabase, router]);

  // Sort tasks by time for preview
  const sortedTasks = sortTasksByTime(
    buildScheduleTasks().filter(t => t.start_time)
  );

  // Group tasks by period
  const tasksByPeriod = sortedTasks.reduce((acc, task) => {
    const period = getPeriodOfDay(task.start_time || '');
    if (!acc[period]) acc[period] = [];
    acc[period].push(task as ScheduleTask);
    return acc;
  }, {} as Record<string, ScheduleTask[]>);

  // Generate dynamic Shen Xiansheng comment based on user's plan
  const generateShenComment = () => {
    const enabledTaskCount = Object.values(tasks).filter(t => t.enabled).length;

    if (enabledTaskCount === 0) {
      return '无妨。有时候休息也是一种前进。';
    }
    if (goalShadow === 'arrogance') {
      return '今日克制高傲，便是离王座更近一步。';
    }
    if (goalShadow === 'selfishness') {
      return '今日学会分享，便是积德之举。';
    }
    if (enabledTaskCount >= 3) {
      return '功课虽多，不急不躁。一步一步来。';
    }
    return '一日之计在于晨。去吧，殿下。';
  };

  const renderTaskPanel = (taskKey: string, task: typeof tasks[typeof taskKey]) => {
    const taskConfig = FIVE_TASKS.find(t => t.type === taskKey);
    if (!taskConfig) return null;

    const isServiceTask = taskKey === 'service';
    const isMeditationTask = taskKey === 'meditation';
    const isExerciseTask = taskKey === 'exercise';
    const isWritingTask = taskKey === 'writing';

    return (
      <div
        key={taskKey}
        className={`p-4 rounded-lg border transition-all ${
          task.enabled ? 'border-stone-700 bg-stone-900/50' : 'border-stone-800 bg-stone-900/20 opacity-60'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{taskConfig.emoji}</span>
          <span className="text-amber-400 font-medium">{taskConfig.name}</span>
          {(
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={task.enabled}
                onChange={() => handleToggleTask(taskKey)}
                className="sr-only"
              />
              <span className={`w-5 h-5 rounded border flex items-center justify-center ${
                task.enabled ? 'bg-amber-600 border-amber-600' : 'border-stone-600'
              }`}>
                {task.enabled && '✓'}
              </span>
            </label>
          )}
        </div>

        {isMeditationTask ? (
          <div className="space-y-3">
            <textarea
              value={task.meditationContent}
              onChange={(e) => setTasks(prev => ({
                ...prev,
                meditation: { ...prev.meditation, meditationContent: e.target.value }
              }))}
              placeholder="此刻我在想什么？（自由书写）"
              className="w-full h-24 p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-amber-600"
            />
            <div className="flex items-center gap-2 text-stone-400 text-xs">
              <span>💡</span>
              <span>引导问题（随机显示）：今天有什么事让你心乱？</span>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={task.content}
              onChange={(e) => handleTaskContentChange(taskKey, e.target.value)}
              placeholder={taskConfig.placeholder}
              className="w-full p-3 mb-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
            />

            {/* Options for writing task */}
            {isWritingTask && taskConfig.options && (
              <div className="mb-3">
                <div className="flex gap-2 flex-wrap">
                  {taskConfig.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTasks(prev => ({
                        ...prev,
                        writing: { ...prev.writing, content: opt }
                      }))}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        task.content === opt
                          ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                          : 'border-stone-700 text-stone-500 hover:border-stone-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Options for exercise task */}
            {isExerciseTask && taskConfig.options && (
              <div className="mb-3">
                <div className="flex gap-2 flex-wrap">
                  {taskConfig.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTasks(prev => ({
                        ...prev,
                        exercise: { ...prev.exercise, content: opt }
                      }))}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        task.content === opt
                          ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                          : 'border-stone-700 text-stone-500 hover:border-stone-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration for service task */}
            {isServiceTask && taskConfig.durations && (
              <div className="mb-3">
                <div className="flex gap-2 flex-wrap">
                  {taskConfig.durations.map(d => (
                    <button
                      key={d}
                      onClick={() => setTasks(prev => ({
                        ...prev,
                        service: { ...prev.service, duration: d }
                      }))}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        task.duration === d
                          ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                          : 'border-stone-700 text-stone-500 hover:border-stone-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time inputs */}
            <div className="flex gap-2 items-center text-sm">
              <span className="text-stone-500">时间:</span>
              <input
                type="time"
                value={task.startTime}
                onChange={(e) => handleTaskTimeChange(taskKey, 'startTime', e.target.value)}
                className="px-2 py-1 bg-stone-800 border border-stone-700 rounded text-stone-200 focus:outline-none focus:border-amber-600"
              />
              <span className="text-stone-500">至</span>
              <input
                type="time"
                value={task.endTime}
                onChange={(e) => handleTaskTimeChange(taskKey, 'endTime', e.target.value)}
                className="px-2 py-1 bg-stone-800 border border-stone-700 rounded text-stone-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Encouragement for service task */}
            {isServiceTask && (
              <div className="mt-3 p-3 bg-stone-800/50 rounded border border-stone-800">
                <p className="text-stone-400 text-sm italic">「{encouragement}」</p>
                <button
                  onClick={handleRefreshEncouragement}
                  className="mt-1 text-xs text-stone-500 hover:text-stone-300"
                >
                  🔄 换一句
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col"
      style={{
        backgroundImage: "url('/images/scenes/morning.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-stone-950/75 pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center justify-between">
        <button
          onClick={() => router.push('/scroll-map')}
          className="text-lg text-stone-500 hover:text-amber-400"
          title="返回主界面"
        >
          🏠
        </button>
        <span className="text-amber-500/60 text-xs">☀️ 晨间规划</span>
        <div className="w-8" /> {/* Spacer for alignment */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {isLoading ? (
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">⏳</div>
            <p className="text-stone-400">加载中...</p>
          </div>
        ) : (
        <div className="w-full max-w-lg space-y-6 relative z-10">

          {/* Step 1: Goal Setting */}
          {step === 'goal' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="text-4xl mb-3">🚩</div>
                <h2 className="text-xl font-serif text-amber-400">今日目标</h2>
                <p className="text-stone-500 text-sm mt-1">今天我想成为这样的人</p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="例：今天我要打败逆星，主动承认错误"
                    className="w-full p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 text-center"
                  />
                </div>

                <div>
                  <p className="text-stone-500 text-sm mb-2">关联阴影（可选）</p>
                  <div className="flex gap-3 justify-center">
                    {(['arrogance', 'selfishness'] as const).map((shadow) => (
                      <button
                        key={shadow}
                        onClick={() => setGoalShadow(goalShadow === shadow ? null : shadow)}
                        className={`px-4 py-2 rounded border transition-all ${
                          goalShadow === shadow
                            ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                            : 'border-stone-700 text-stone-400 hover:border-stone-600'
                        }`}
                      >
                        {shadow === 'arrogance' ? '逆星（高傲）' : '毒疮（自私）'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={goalReward}
                    onChange={(e) => setGoalReward(e.target.value)}
                    placeholder="如果成功完成，给自己一个小奖励（可选）"
                    className="w-full p-3 bg-stone-900/30 border border-stone-800 rounded-lg text-stone-300 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleNextFromGoal}
                className="w-full py-4 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
              >
                编排功课 →
              </button>
            </div>
          )}

          {/* Step 2: Tasks */}
          {step === 'tasks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-serif text-amber-400">编排功课</h2>
                <p className="text-stone-500 text-sm mt-1">从五门功课中选择今日要做的</p>
              </div>

              {/* Service task - always visible */}
              {renderTaskPanel('service', tasks.service)}

              {/* Other tasks - collapsible */}
              <details className="group">
                <summary className="flex items-center gap-2 p-3 cursor-pointer text-stone-500 hover:text-stone-300">
                  <span>▼</span>
                  <span>其他功课</span>
                </summary>
                <div className="space-y-3 mt-3">
                  {renderTaskPanel('reading', tasks.reading)}
                  {renderTaskPanel('writing', tasks.writing)}
                  {renderTaskPanel('meditation', tasks.meditation)}
                  {renderTaskPanel('exercise', tasks.exercise)}
                </div>
              </details>

              <button
                onClick={() => setStep('preview')}
                className="w-full py-4 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
              >
                预览日程 →
              </button>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <h2 className="text-xl font-serif text-amber-400">王子一日的规划</h2>
                <p className="text-stone-500 text-sm mt-1">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Goal summary with completion marking */}
              {goalText && (
                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-stone-400 text-sm">🚩 今日目标</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGoalCompleted(true)}
                        className={`px-3 py-1 text-xs rounded border transition-all ${
                          goalCompleted === true
                            ? 'border-green-500 bg-green-900/20 text-green-400'
                            : 'border-stone-600 text-stone-500 hover:border-green-600'
                        }`}
                      >
                        ✅ 完成
                      </button>
                      <button
                        onClick={() => setGoalCompleted(false)}
                        className={`px-3 py-1 text-xs rounded border transition-all ${
                          goalCompleted === false
                            ? 'border-red-500 bg-red-900/20 text-red-400'
                            : 'border-stone-600 text-stone-500 hover:border-red-600'
                        }`}
                      >
                        ❌ 未完成
                      </button>
                    </div>
                  </div>
                  <p className="text-amber-300 mt-1">{goalText}</p>
                  {goalShadow && (
                    <p className="text-stone-500 text-xs mt-1">
                      关联阴影：{goalShadow === 'arrogance' ? '逆星（高傲）' : '毒疮（自私）'}
                    </p>
                  )}
                </div>
              )}

              {/* Schedule by period */}
              <div className="space-y-4">
                {Object.entries(tasksByPeriod).map(([period, periodTasks]) => (
                  <div key={period}>
                    <p className="text-stone-500 text-sm mb-2">-- {period} --</p>
                    {periodTasks.map((task, i) => {
                      const taskConfig = FIVE_TASKS.find(t => t.type === task.type);
                      return (
                        <div key={i} className="p-3 bg-stone-900/30 border border-stone-800/50 rounded mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{taskConfig?.emoji}</span>
                            <span className="text-stone-300">{task.content || taskConfig?.name}</span>
                          </div>
                          {task.start_time && (
                            <p className="text-stone-500 text-xs mt-1">
                              {task.start_time}{task.end_time ? ` ~ ${task.end_time}` : ''}
                              {task.duration ? ` · ${task.duration}分钟` : ''}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Shen Xiansheng's word */}
              <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-center space-y-3">
                <img
                  src="/images/characters/shen-xiansheng.png"
                  alt="申先生"
                  className="w-14 h-14 object-cover rounded-full border border-amber-600/30 mx-auto"
                />
                <div>
                  <p className="text-amber-400/80 text-sm italic">「{generateShenComment()}」</p>
                  <p className="text-stone-600 text-xs mt-1">—— 申先生</p>
                </div>
              </div>

              <button
                onClick={handleConfirmSchedule}
                disabled={saving}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 rounded-lg text-stone-100 font-medium transition-all"
              >
                {saving ? '保存中...' : '确认今日规划'}
              </button>
              {saveError && (
                <p className="text-red-400 text-sm text-center">{saveError}</p>
              )}
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="text-6xl">✨</div>
              <h3 className="text-xl font-serif text-amber-400">规划已记录</h3>
              <p className="text-stone-400">今日修五门，明日成一人。</p>
              <p className="text-stone-500 text-sm animate-pulse">返回主界面...</p>
            </div>
          )}
        </div>
        )}
      </main>
      </div>{/* close relative z-10 wrapper */}
    </div>
  );
}