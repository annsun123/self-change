import type { DialogueNode } from "@/lib/dialogue-engine";

// Mode B: 反思引导 - For users who are perfunctory (敷衍)
// Triggered when user has 3+ perfunctory responses
export const eveningModeBTree: Record<string, DialogueNode> = {
  start: {
    id: "start",
    speaker: "system",
    text: "入夜。烛火比往常更暗了一些。两位老师的目光更深沉。",
    nextNodeId: "xu_gentle_opening",
  },
  xu_gentle_opening: {
    id: "xu_gentle_opening",
    speaker: "xu_niangzi",
    text: "殿下，这几日你总说'没什么特别的'。\n那不是你的真心话吧？",
    nextNodeId: "shen_gentle_probe",
  },
  shen_gentle_probe: {
    id: "shen_gentle_probe",
    speaker: "shen_xiansheng",
    text: "有时候，我们不想说。\n有时候，我们不知道怎么说。\n有时候，我们觉得自己不配说。\n\n哪一种，是殿下的情况？",
    choices: [
      {
        text: "我确实觉得没什么好说的",
        nextNodeId: "b_not_worth_saying",
      },
      {
        text: "我不想说",
        nextNodeId: "b_dont_want_say",
      },
      {
        text: "我不知道怎么说",
        nextNodeId: "b_dont_know_how",
      },
    ],
  },
  b_not_worth_saying: {
    id: "b_not_worth_saying",
    speaker: "xu_niangzi",
    text: "没什么好说？\n\n殿下，你的一天里，有吃饭吧？",
    nextNodeId: "b_continue_probe",
  },
  b_dont_want_say: {
    id: "b_dont_want_say",
    speaker: "shen_xiansheng",
    text: "不想说，也是一种回答。\n\n那我们就不说。\n但可以告诉我，今天有没有一个瞬间，你感到...不舒服？",
    nextNodeId: "b_continue_probe",
  },
  b_dont_know_how: {
    id: "b_dont_know_how",
    speaker: "xu_niangzi",
    text: "不知道怎么说的时候，就试着说一件事。\n\n哪怕是一件很小的事。",
    nextNodeId: "b_continue_probe",
  },
  b_continue_probe: {
    id: "b_continue_probe",
    speaker: "shen_xiansheng",
    text: "今天有没有一个时刻，你心里闪过一丝不安？\n\n不是大不安，就是一点点。",
    choices: [
      {
        text: "好像有一个...但我说不清楚",
        nextNodeId: "b_acknowledge_small",
        effect: { wangde: 1 },
      },
      {
        text: "没有，我真的什么都没注意到",
        nextNodeId: "b_no_awareness",
      },
      {
        text: "有，但我不确定那算不算",
        nextNodeId: "b_acknowledge_small",
        effect: { wangde: 1 },
      },
    ],
  },
  b_acknowledge_small: {
    id: "b_acknowledge_small",
    speaker: "xu_niangzi",
    text: "这就够了。\n\n能感到一点点，就说明你在觉察。\n这比什么都重要。",
    nextNodeId: "b_summary",
  },
  b_no_awareness: {
    id: "b_no_awareness",
    speaker: "shen_xiansheng",
    text: "没关系。\n\n明天，试着在一天里找一个时刻，停下来，问问自己：\n我现在感觉怎么样？\n\n不需要答案，只需要问。",
    nextNodeId: "b_summary",
  },
  b_summary: {
    id: "b_summary",
    speaker: "system",
    text: "今晚的对话很短。\n但短，不代表没有收获。",
    effects: { completeDialogue: true },
  },
};