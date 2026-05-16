import type { DialogueNode } from "@/lib/dialogue-engine";

export const eveningWeek1Tree: Record<string, DialogueNode> = {
  // 开场
  start: {
    id: "start",
    speaker: "system",
    text: "入夜。茅屋中烛火已燃。两位老师在等你。",
    nextNodeId: "xu_opening",
  },
  xu_opening: {
    id: "xu_opening",
    speaker: "xu_niangzi",
    text: "殿下，今天过得如何？",
    choices: [
      {
        text: "没什么特别的，跟往常一样",
        nextNodeId: "xu_follow_up_normal",
      },
      {
        text: "今天发生了一些事",
        nextNodeId: "xu_follow_up_event",
      },
      {
        text: "我今天又犯了老毛病",
        nextNodeId: "xu_follow_up_mistake",
      },
    ],
  },

  // 正常回应
  xu_follow_up_normal: {
    id: "xu_follow_up_normal",
    speaker: "xu_niangzi",
    text: "那我们来聊聊一件小事吧。",
    nextNodeId: "ask_shadow_awareness",
  },
  xu_follow_up_event: {
    id: "xu_follow_up_event",
    speaker: "xu_niangzi",
    text: "哦？说来听听。",
    nextNodeId: "xu_reflect_meditation",
  },
  xu_follow_up_mistake: {
    id: "xu_follow_up_mistake",
    speaker: "xu_niangzi",
    text: "没关系。说说看，我们聊聊。",
    nextNodeId: "ask_shadow_awareness",
  },

  // 修心感悟回调
  xu_reflect_meditation: {
    id: "xu_reflect_meditation",
    speaker: "xu_niangzi",
    text: "今早你修了心。\n\n{{meditation}}\n\n现在回看，你有什么新的理解吗？",
    nextNodeId: "free_reflection",
  },

  // 自由叙述分支
  free_reflection: {
    id: "free_reflection",
    speaker: "shen_xiansheng",
    text: "说来听听，今日遇到了什么？",
    choices: [
      {
        text: "今天有人挑战我，我差点发火",
        nextNodeId: "reflection_anger",
        effect: { shadow: { type: "arrogance", damage: 1 }, wangde: 1 },
      },
      {
        text: "今天我拒绝了一个请求",
        nextNodeId: "reflection_rejection",
        effect: { shadow: { type: "selfishness", damage: 1 }, wangde: 0 },
      },
      {
        text: "今天我默默帮助了一个人",
        nextNodeId: "reflection_help",
        effect: { shadow: { type: "selfishness", damage: 2 }, wangde: 2 },
      },
    ],
  },

  // 愤怒反思
  reflection_anger: {
    id: "reflection_anger",
    speaker: "shen_xiansheng",
    text: "差点发火？后来呢？",
    nextNodeId: "shen_praise_pause",
  },
  shen_praise_pause: {
    id: "shen_praise_pause",
    speaker: "shen_xiansheng",
    text: "你注意到了，就已经是进步。",
    nextNodeId: "evening_summary",
  },

  // 拒绝反思
  reflection_rejection: {
    id: "reflection_rejection",
    speaker: "xu_niangzi",
    text: "那时候你心里怎么想？",
    nextNodeId: "evening_summary",
  },

  // 帮助他人
  reflection_help: {
    id: "reflection_help",
    speaker: "xu_niangzi",
    text: "善。殿下今日种下了善因。",
    nextNodeId: "evening_summary",
  },

  // 询问阴影觉察
  ask_shadow_awareness: {
    id: "ask_shadow_awareness",
    speaker: "shen_xiansheng",
    text: "今日你有没有注意到自己的某个阴影冒出来了？",
    choices: [
      {
        text: "有，逆星出现了",
        nextNodeId: "shadow_seen_arrogance",
        effect: { shadow: { type: "arrogance", damage: 1 }, wangde: 1 },
      },
      {
        text: "有，毒疮出现了",
        nextNodeId: "shadow_seen_selfish",
        effect: { shadow: { type: "selfishness", damage: 1 }, wangde: 1 },
      },
      {
        text: "没有，它们今天没出现",
        nextNodeId: "shadow_not_seen",
        effect: { wangde: 1 },
      },
    ],
  },

  // 看到逆星
  shadow_seen_arrogance: {
    id: "shadow_seen_arrogance",
    speaker: "shen_xiansheng",
    text: "什么时候？什么感觉？",
    nextNodeId: "evening_summary",
  },

  // 看到毒疮
  shadow_seen_selfish: {
    id: "shadow_seen_selfish",
    speaker: "xu_niangzi",
    text: "那时候你心里怎么想？",
    nextNodeId: "evening_summary",
  },

  // 没看到阴影
  shadow_not_seen: {
    id: "shadow_not_seen",
    speaker: "xu_niangzi",
    text: "没关系，有时候它们藏得很深。明天再注意就好。",
    nextNodeId: "evening_summary",
  },

  // 晚间总结
  evening_summary: {
    id: "evening_summary",
    speaker: "system",
    text: "今日对话结束。王子在地图上微微前进一步。",
    effects: { completeDialogue: true, wangde: 1 },
  },
};