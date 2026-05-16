import type { DialogueNode } from "@/lib/dialogue-engine";

// Mode C - Saturday: 大臣密报 (Minister Report)
// 李判书来访，回顾本周表现
export const eveningSaturdayTree: Record<string, DialogueNode> = {
  start: {
    id: "start",
    speaker: "system",
    text: "入夜。但今晚的气氛不同寻常。\n一位身着官服的中年人站在门外，神色凝重。",
    nextNodeId: "shen_explain",
  },
  shen_explain: {
    id: "shen_explain",
    speaker: "shen_xiansheng",
    text: "殿下，这位是李判书。父王派来的密使。\n他想单独与你谈谈。",
    nextNodeId: "minister_greeting",
  },
  minister_greeting: {
    id: "minister_greeting",
    speaker: "system",
    text: "李判书拱手行礼，目光打量着你。",
    nextNodeId: "minister_speak",
  },
  minister_speak: {
    id: "minister_speak",
    speaker: "system",
    text: "「殿下，陛下命臣前来，回顾您这一周的表现。」",
    nextNodeId: "minister_review_start",
  },
  minister_review_start: {
    id: "minister_review_start",
    speaker: "system",
    text: "李判书打开一份卷轴，上面记录着你的行踪。",
    nextNodeId: "minister_question_1",
  },
  minister_question_1: {
    id: "minister_question_1",
    speaker: "system",
    text: "「听说殿下这周几次与阴影作战？」\n「结果如何？」",
    choices: [
      {
        text: "我赢了几次，但也有失手的时候",
        nextNodeId: "minister_honest",
        effect: { wangde: 2 },
      },
      {
        text: "大部分时候守住了",
        nextNodeId: "minister_good",
        effect: { wangde: 2 },
      },
      {
        text: "说实话，我需要回去看看记录",
        nextNodeId: "minister_humble",
        effect: { wangde: 1 },
      },
    ],
  },
  minister_honest: {
    id: "minister_honest",
    speaker: "system",
    text: "李判书微微点头，在卷轴上写了什么。\n「诚实，是美德。」",
    nextNodeId: "minister_question_2",
  },
  minister_good: {
    id: "minister_good",
    speaker: "system",
    text: "李判书露出一丝笑意。\n「好。陛下会高兴听到这个。」",
    nextNodeId: "minister_question_2",
  },
  minister_humble: {
    id: "minister_humble",
    speaker: "system",
    text: "李判书看了你一眼。\n「不逞强，很好。」",
    nextNodeId: "minister_question_2",
  },
  minister_question_2: {
    id: "minister_question_2",
    speaker: "system",
    text: "「听说殿下这周做了些劳作？」\n「申先生评价很高。」",
    nextNodeId: "shen_comment",
  },
  shen_comment: {
    id: "shen_comment",
    speaker: "shen_xiansheng",
    text: "「回大人，殿下这周确实勤勉。」\n「每日的功课都有完成。」",
    nextNodeId: "minister_final",
  },
  minister_final: {
    id: "minister_final",
    speaker: "system",
    text: "李判书合上卷轴，站起身来。\n\n「殿下，陛下让我转告一句话：」",
    nextNodeId: "minister_message",
  },
  minister_message: {
    id: "minister_message",
    speaker: "system",
    text: "「『路还很长，但你在走。』」\n\n李判书拱手告辞，消失在夜色中。",
    nextNodeId: "xu_reflection",
  },
  xu_reflection: {
    id: "xu_reflection",
    speaker: "xu_niangzi",
    text: "殿下，今日被审视，感觉如何？\n\n这只是一个开始。越接近王宫，越多眼睛看着你。",
    nextNodeId: "shen_encourage",
  },
  shen_encourage: {
    id: "shen_encourage",
    speaker: "shen_xiansheng",
    text: "但你今天的表现，很好。\n\n不骄不躁，如实回答。\n这是殿下成熟的表现。",
    nextNodeId: "saturday_complete",
  },
  saturday_complete: {
    id: "saturday_complete",
    speaker: "system",
    text: "李判书的脚步声渐渐远去。\n今夜的风，带着王宫的气息。",
    effects: { completeDialogue: true, wangde: 2 },
  },
};