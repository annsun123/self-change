"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { day0OnboardingTree } from "@/data/dialogue-trees/day0-onboarding";
import {
  DialogueEngine,
  DialogueNode,
  SpeakerType,
  getSpeakerDisplayName,
  getSpeakerEmoji,
} from "@/lib/dialogue-engine";
import { use } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [engine] = useState(() => new DialogueEngine(day0OnboardingTree));
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null);
  const [history, setHistory] = useState<{ node: DialogueNode; timestamp: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [accumulatedWangde, setAccumulatedWangde] = useState(0);
  const [shadowDamage, setShadowDamage] = useState<Record<string, number>>({});

  // 初始化对话
  useEffect(() => {
    const startNode = engine.getStartNode();
    if (startNode) {
      setCurrentNode(startNode);
      setHistory([{ node: startNode, timestamp: Date.now() }]);
    }
  }, [engine]);

  // 处理选项选择
  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (!currentNode || isTransitioning) return;

      setIsTransitioning(true);

      // 计算效果
      const choice = currentNode.choices?.[choiceIndex];
      if (choice?.effect) {
        if (choice.effect.wangde) {
          setAccumulatedWangde((prev) => prev + choice.effect!.wangde!);
        }
        if (choice.effect.shadow) {
          setShadowDamage((prev) => ({
            ...prev,
            [choice.effect!.shadow!.type]: (prev[choice.effect!.shadow!.type] || 0) + choice.effect!.shadow!.damage,
          }));
        }
      }

      // 推进到下一节点
      const result = engine.processChoice(currentNode.id, choiceIndex);
      if (result.nextNode) {
        setCurrentNode(result.nextNode);
        setHistory((prev) => [...prev, { node: result.nextNode!, timestamp: Date.now() }]);

        // 检查是否完成
        if (result.nextNode.effects?.completeDialogue) {
          setTimeout(() => setIsComplete(true), 1500);
        }
      }

      setTimeout(() => setIsTransitioning(false), 300);
    },
    [currentNode, engine, isTransitioning]
  );

  // 推进到下一节点（无选项时）
  const handleAdvance = useCallback(() => {
    if (!currentNode || isTransitioning || currentNode.choices) return;

    setIsTransitioning(true);

    const nextNode = engine.advanceToNext(currentNode.id);
    if (nextNode) {
      setCurrentNode(nextNode);
      setHistory((prev) => [...prev, { node: nextNode, timestamp: Date.now() }]);

      if (nextNode.effects?.completeDialogue) {
        setTimeout(() => setIsComplete(true), 1500);
      }
    }

    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentNode, engine, isTransitioning]);

  // 完成 onboarding
  const completeOnboarding = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 计算阴影HP变化
    const shadowChanges: Record<string, number> = {};
    if (shadowDamage["arrogance"]) {
      shadowChanges["arrogance"] = shadowDamage["arrogance"];
    }
    if (shadowDamage["selfishness"]) {
      shadowChanges["selfishness"] = shadowDamage["selfishness"];
    }

    // 更新 profiles
    const updates: Record<string, unknown> = {
      onboarding_complete: true,
      wangde: accumulatedWangde,
      scroll_position: 0,
      day_in_journey: 1,
      current_phase: "awakening",
    };

    await supabase.from("profiles").update(updates).eq("id", user.id);

    // 如果有阴影伤害，创建或更新阴影记录
    for (const [shadowType, damage] of Object.entries(shadowDamage)) {
      await supabase.from("shadows").upsert(
        {
          user_id: user.id,
          shadow_type: shadowType,
          current_hp: 7 - damage, // 初始7，受伤减少
          max_hp: 7,
          shatter_count: 0,
          is_active: true,
          last_damaged_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,shadow_type",
        }
      );
    }

    router.push("/scroll-map");
  }, [supabase, router, accumulatedWangde, shadowDamage]);

  // 完成时自动跳转
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(completeOnboarding, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, completeOnboarding]);

  // 等待验证
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, supabase]);

  // 加载中
  if (!currentNode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="text-amber-400 text-lg animate-pulse">烛火摇曳中...</div>
      </div>
    );
  }

  // 完成界面
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
        <div className="text-center space-y-6 max-w-lg px-8">
          <div className="text-6xl">✨</div>
          <h2 className="text-2xl font-serif text-amber-400">初遇结束</h2>
          <p className="text-stone-400">
            王子在城外荒野安顿下来。
            <br />
            明天，真正的旅程开始。
          </p>
          <div className="text-sm text-stone-500 animate-pulse">正在进入主界面...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 relative overflow-hidden">
      {/* 烛火氛围背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 渐变光晕 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-orange-900/5 rounded-full blur-2xl" />
      </div>

      {/* 顶部装饰 */}
      <header className="p-4 border-b border-stone-800/50 relative z-10">
        <div className="text-center">
          <span className="text-amber-500/60 text-xs">第一日 · 初遇</span>
        </div>
      </header>

      {/* 对话区域 */}
      <main className="flex-1 flex flex-col items-center justify-end p-6 pb-24 relative z-10">
        {/* 当前对话节点 */}
        <div
          className={`w-full max-w-lg transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {/* 说话者信息 */}
          <div className="flex items-center gap-3 mb-4">
            {currentNode.speaker !== "system" && (
              <>
                <span className="text-2xl">{getSpeakerEmoji(currentNode.speaker as SpeakerType)}</span>
                <span className="text-amber-400 font-medium">
                  {getSpeakerDisplayName(currentNode.speaker as SpeakerType)}
                </span>
              </>
            )}
          </div>

          {/* 对话文本 */}
          <div
            className={`rounded-xl p-6 mb-8 ${
              currentNode.speaker === "system"
                ? "bg-stone-800/30 text-stone-400 text-center text-sm"
                : "bg-stone-900/80 border border-stone-800"
            }`}
          >
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{currentNode.text}</p>
          </div>

          {/* 选项 */}
          {currentNode.choices && currentNode.choices.length > 0 && (
            <div className="space-y-3">
              {currentNode.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(index)}
                  disabled={isTransitioning}
                  className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/50 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all duration-200 disabled:opacity-50"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {/* 继续按钮（无选项时） */}
          {!currentNode.choices && !currentNode.effects?.completeDialogue && (
            <button
              onClick={handleAdvance}
              disabled={isTransitioning}
              className="mt-6 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all duration-200 disabled:opacity-50"
            >
              继续 →
            </button>
          )}
        </div>

        {/* 历史记录（底部） */}
        <div className="w-full max-w-lg space-y-4 mb-8 opacity-30 text-sm">
          {history.slice(-3, -1).map((item, idx) => (
            <div key={idx} className="text-stone-500">
              <span className="font-medium text-stone-400">
                {getSpeakerDisplayName(item.node.speaker as SpeakerType)}:
              </span>{" "}
              {item.node.text.slice(0, 50)}...
            </div>
          ))}
        </div>
      </main>

      {/* 状态栏 */}
      <footer className="p-4 border-t border-stone-800/50 relative z-10">
        <div className="flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-stone-500">王德:</span>
            <span className="text-amber-400">+{accumulatedWangde}</span>
          </div>
          {Object.entries(shadowDamage).map(([type, dmg]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="text-stone-500">阴影:</span>
              <span className="text-stone-400">-{dmg}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}