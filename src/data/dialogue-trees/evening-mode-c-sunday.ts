import type { DialogueNode } from "@/lib/dialogue-engine";

// Mode C - Sunday: 周回顾与前瞻 (Weekly Review & Forward Planning)
// 一周结束，总结与定下周一的小目标
export const eveningSundayTree: Record<string, DialogueNode> = {
  start: {
    id: "start",
    speaker: "system",
    text: "入夜。这一周结束了。\n两位老师与你坐在灯下，桌上放着这一周的记录。",
    nextNodeId: "xu_week_review",
  },
  xu_week_review: {
    id: "xu_week_review",
    speaker: "xu_niangzi",
    text: "这一周，殿下有什么感受？",
    choices: [
      {
        text: "进步了，感觉自己变好了一点",
        nextNodeId: "review_progress",
      },
      {
        text: "退步了，有几天没有坚持住",
        nextNodeId: "review_regress",
      },
      {
        text: "差不多，时好时坏",
        nextNodeId: "review_same",
      },
    ],
  },
  review_progress: {
    id: "review_progress",
    speaker: "shen_xiansheng",
    text: "好。说说看，是什么让你觉得进步了？",
    nextNodeId: "review_progress_detail",
  },
  review_progress_detail: {
    id: "review_progress_detail",
    speaker: "xu_niangzi",
    text: "是哪一天？做了什么？",
    nextNodeId: "review_share_good",
  },
  review_share_good: {
    id: "review_share_good",
    speaker: "system",
    text: "你分享了其中的一个时刻。\n两位老师静静听着。",
    nextNodeId: "xu_affirm_good",
  },
  xu_affirm_good: {
    id: "xu_affirm_good",
    speaker: "xu_niangzi",
    text: "这就是觉察的力量。\n\n记住这种感觉。",
    nextNodeId: "plan_next_week",
  },
  review_regress: {
    id: "review_regress",
    speaker: "shen_xiansheng",
    text: "退步了，也是一种觉察。\n\n说说看，是什么让你觉得退步了？",
    nextNodeId: "review_regress_detail",
  },
  review_regress_detail: {
    id: "review_regress_detail",
    speaker: "xu_niangzi",
    text: "是哪一天？发生了什么事？",
    nextNodeId: "review_share_bad",
  },
  review_share_bad: {
    id: "review_share_bad",
    speaker: "system",
    text: "你说了那一夜的事。\n老师们没有责备，只是静静看着你。",
    nextNodeId: "shen_comfort",
  },
  shen_comfort: {
    id: "shen_comfort",
    speaker: "shen_xiansheng",
    text: "退步了，不是回到起点。\n\n路还在，你还在走。这就够了。",
    nextNodeId: "plan_next_week",
  },
  review_same: {
    id: "review_same",
    speaker: "xu_niangzi",
    text: "差不多，也是真实的。\n\n有时候原地踏步，是为了让下一步更稳。",
    nextNodeId: "plan_next_week",
  },
  plan_next_week: {
    id: "plan_next_week",
    speaker: "shen_xiansheng",
    text: "那么，下周殿下想做什么？\n\n不想大目标。就一件事。\n你觉得下周最需要注意的是什么？",
    nextNodeId: "set_small_goal",
  },
  set_small_goal: {
    id: "set_small_goal",
    speaker: "system",
    text: "在心中想一件事...\n\n那件事是什么？",
    choices: [
      {
        text: "想要更警觉，早一点注意到阴影",
        nextNodeId: "goal_awareness",
      },
      {
        text: "想要做完每天的功课",
        nextNodeId: "goal_discipline",
      },
      {
        text: "想要在冲突中保持冷静",
        nextNodeId: "goal_calm",
      },
      {
        text: "我还没想好",
        nextNodeId: "goal_not_ready",
      },
    ],
  },
  goal_awareness: {
    id: "goal_awareness",
    speaker: "xu_niangzi",
    text: "好。早一点觉察，就早一点自由。\n\n下周每天问自己三次：我现在有什么感觉？",
    nextNodeId: "sunday_complete",
  },
  goal_discipline: {
    id: "goal_discipline",
    speaker: "shen_xiansheng",
    text: "好。每日功课，是修行的基础。\n\n下周的每一天，至少完成一件事。",
    nextNodeId: "sunday_complete",
  },
  goal_calm: {
    id: "goal_calm",
    speaker: "xu_niangzi",
    text: "好。冲突中的冷静，是很深功夫。\n\n下次感到要发火时，深呼吸三秒。",
    nextNodeId: "sunday_complete",
  },
  goal_not_ready: {
    id: "goal_not_ready",
    speaker: "shen_xiansheng",
    text: "没关系。下周开始时再想。\n\n有时候，不知道也是一种知道。",
    nextNodeId: "sunday_complete",
  },
  sunday_complete: {
    id: "sunday_complete",
    speaker: "system",
    text: "灯渐渐暗了。一周结束。\n\n新的一周，在等待。",
    effects: { completeDialogue: true, wangde: 1 },
  },
};