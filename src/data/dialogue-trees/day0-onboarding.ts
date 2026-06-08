import type { DialogueNode } from "@/lib/dialogue-engine";

export const day0OnboardingTree: Record<string, DialogueNode> = {
  // 开场 - 烛火渐亮
  start: {
    id: "start",
    speaker: "system",
    text: "「朝鲜王朝 · 某年冬」",
    effects: { showScene: "candle" },
    nextNodeId: "scene_intro",
  },
  scene_intro: {
    id: "scene_intro",
    speaker: "system",
    text: "画面渐亮——破旧茅屋，窗外大雪。你浑身泥泞地坐在草席上。徐娘子端来一碗热汤，申先生坐在对面。",
    nextNodeId: "shen_opening",
  },

  // 申先生开场
  shen_opening: {
    id: "shen_opening",
    speaker: "shen_xiansheng",
    text: "从前你住的地方，叫做景福宫。现在你坐的地方，叫草庐。你知道为什么你会在这里吗？",
    choices: [
      {
        text: "因为我做错了事，被父王赶出来了",
        nextNodeId: "answer_awareness",
        effect: { shadow: { type: "arrogance", damage: 1 }, wangde: 1 },
      },
      {
        text: "我说不清楚……都发生了太多",
        nextNodeId: "answer_confused",
      },
    ],
  },

  // 分支A：认错
  answer_awareness: {
    id: "answer_awareness",
    speaker: "shen_xiansheng",
    text: "知道错，是改的第一步。",
    nextNodeId: "xu_deep_question",
  },
  xu_deep_question: {
    id: "xu_deep_question",
    speaker: "xu_niangzi",
    text: "能说出来，就已经不是同一个人了。——殿下心里，有想改变的事吗？",
    nextNodeId: "core_question",
  },

  // 分支B：说不清
  answer_confused: {
    id: "answer_confused",
    speaker: "xu_niangzi",
    text: "不着急，慢慢想。",
    nextNodeId: "shen_follow_up",
  },
  shen_follow_up: {
    id: "shen_follow_up",
    speaker: "shen_xiansheng",
    text: "那就从今天的事说起吧。",
    nextNodeId: "core_question",
  },

  // 核心问题 - 识别阴影
  core_question: {
    id: "core_question",
    speaker: "shen_xiansheng",
    text: "你心里觉得自己最不该做的事情是什么？",
    choices: [
      {
        text: "我背叛了父王的信任",
        nextNodeId: "shadow_betrayal",
        effect: { shadow: { type: "selfishness", damage: 1 }, wangde: 1 },
      },
      {
        text: "我太放纵了，沉迷享乐，荒废正事",
        nextNodeId: "shadow_indulgence",
        effect: { shadow: { type: "arrogance", damage: 1 }, wangde: 1 },
      },
      {
        text: "我谁也不服，觉得他们都不如我",
        nextNodeId: "shadow_arrogance",
        effect: { shadow: { type: "arrogance", damage: 1 }, wangde: 1 },
      },
      {
        text: "我太自私了，只想着自己",
        nextNodeId: "shadow_selfish",
        effect: { shadow: { type: "selfishness", damage: 1 }, wangde: 1 },
      },
    ],
  },

  // 阴影分支反馈
  shadow_betrayal: {
    id: "shadow_betrayal",
    speaker: "shen_xiansheng",
    text: "信任像瓷器，碎了难补。但也不是不可能。",
    nextNodeId: "xu_betrayal_deep",
  },
  shadow_indulgence: {
    id: "shadow_indulgence",
    speaker: "shen_xiansheng",
    text: "耽于逸乐，是亡国之始。",
    nextNodeId: "xu_indulgence_deep",
  },
  shadow_arrogance: {
    id: "shadow_arrogance",
    speaker: "shen_xiansheng",
    text: "傲慢是先折自己。",
    nextNodeId: "xu_arrogance_deep",
  },
  shadow_selfish: {
    id: "shadow_selfish",
    speaker: "shen_xiansheng",
    text: "一国之王若只想着自己，那百姓怎么办？",
    nextNodeId: "xu_selfish_deep",
  },

  // 徐娘子追问（各分支汇合）
  xu_betrayal_deep: {
    id: "xu_betrayal_deep",
    speaker: "xu_niangzi",
    text: "殿下还记得，那天你为什么要那么做吗？",
    nextNodeId: "first_lesson",
  },
  xu_indulgence_deep: {
    id: "xu_indulgence_deep",
    speaker: "xu_niangzi",
    text: "但你能说出来，就是好兆头。",
    nextNodeId: "first_lesson",
  },
  xu_arrogance_deep: {
    id: "xu_arrogance_deep",
    speaker: "xu_niangzi",
    text: "殿下从小就是这样。其实……是因为害怕吧？",
    nextNodeId: "first_lesson",
  },
  xu_selfish_deep: {
    id: "xu_selfish_deep",
    speaker: "xu_niangzi",
    text: "但现在你愿意说出来了。这就很好。",
    nextNodeId: "first_lesson",
  },

  // 老师的第一课
  first_lesson: {
    id: "first_lesson",
    speaker: "shen_xiansheng",
    text: "从今天起，你住在这里。我不教你诗书礼仪——那些你早该会了。我要你学的是另一件事：看清自己。",
    choices: [
      {
        text: "请先生指教",
        nextNodeId: "lesson_accept",
        effect: { wangde: 1 },
      },
      {
        text: "……我很害怕",
        nextNodeId: "lesson_fear",
      },
    ],
  },

  // 接受教诲
  lesson_accept: {
    id: "lesson_accept",
    speaker: "shen_xiansheng",
    text: "明日清晨，我告诉你第一件事。",
    nextNodeId: "declaration",
  },

  // 表达恐惧（深入分支）
  lesson_fear: {
    id: "lesson_fear",
    speaker: "xu_niangzi",
    text: "怕什么？我们都在这里。",
    choices: [
      {
        text: "我怕我改不了",
        nextNodeId: "fear_cant_change",
      },
      {
        text: "我怕父王不会原谅我",
        nextNodeId: "fear_not_forgiven",
      },
    ],
  },
  fear_cant_change: {
    id: "fear_cant_change",
    speaker: "xu_niangzi",
    text: "殿下，没人要求你一夜间变一个人。今天你能坐在这里认错，已经是三年来第一次了。",
    nextNodeId: "declaration",
  },
  fear_not_forgiven: {
    id: "fear_not_forgiven",
    speaker: "xu_niangzi",
    text: "原谅不原谅，要看你的行动。但至少要让他看到，他儿子在努力。",
    nextNodeId: "declaration",
  },

  // 立誓 — 王子宣言
  declaration: {
    id: "declaration",
    speaker: "shen_xiansheng",
    text: "在开始之前，有一件事要做。——你对自己说一句话。不是对我，不是对父王，是对你自己。\\n\\n你想成为什么样的人？",
    choices: [
      {
        text: "我想堂堂正正地回去。",
        nextNodeId: "declaration_response",
        effect: { wangde: 2 },
      },
      {
        text: "我想对得起自己。",
        nextNodeId: "declaration_response",
        effect: { wangde: 2 },
      },
      {
        text: "（沉默良久）……我不想再逃了。",
        nextNodeId: "declaration_response",
        effect: { wangde: 2 },
      },
    ],
  },
  declaration_response: {
    id: "declaration_response",
    speaker: "xu_niangzi",
    text: "好。记住这句话。——往后难的时候，我会提醒你自己说过什么。",
    nextNodeId: "xu_encouragement",
  },

  // 徐娘子鼓励
  xu_encouragement: {
    id: "xu_encouragement",
    speaker: "xu_niangzi",
    text: "今天先到这里。喝完汤去睡吧。明天……我们开始。",
    effects: {
      shadow: { type: "arrogance", damage: 2 },
      wangde: 1,
    },
    nextNodeId: "dialogue_complete",
  },

  // 对话完成
  dialogue_complete: {
    id: "dialogue_complete",
    speaker: "system",
    text: "初遇结束。王子在地图起点安顿下来。",
    effects: { completeDialogue: true },
  },
};