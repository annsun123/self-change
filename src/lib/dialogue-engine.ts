export type SpeakerType = "shen_xiansheng" | "xu_niangzi" | "system";

export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  effect?: {
    shadow?: { type: "arrogance" | "selfishness"; damage: number };
    wangde?: number;
  };
}

export interface DialogueNode {
  id: string;
  speaker: SpeakerType;
  text: string;
  choices?: DialogueChoice[];
  nextNodeId?: string;
  effects?: {
    showScene?: string;
    shadow?: { type: "arrogance" | "selfishness"; damage: number };
    wangde?: number;
    completeDialogue?: boolean;
  };
}

export interface DialogueState {
  currentNodeId: string;
  accumulatedEffects: {
    shadowDamage: Record<string, number>;
    wangdeGained: number;
  };
  isComplete: boolean;
}

export interface DialogueContext {
  meditationContent?: string | null;
  goalText?: string | null;
}

export function interpolateNodeText(
  node: DialogueNode,
  context: DialogueContext
): string {
  if (!node.text) return node.text;
  let text = node.text;
  if (context.meditationContent) {
    text = text.replace(/\{\{meditation\}\}/g, context.meditationContent);
  }
  if (context.goalText) {
    text = text.replace(/\{\{goal\}\}/g, context.goalText);
  }
  // Default replacement for meditation if not found
  text = text.replace(/\{\{meditation\}\}/g, '今日未曾记录');
  text = text.replace(/\{\{goal\}\}/g, '');
  return text;
}

export class DialogueEngine {
  private tree: Record<string, DialogueNode>;
  private history: string[] = [];

  constructor(tree: Record<string, DialogueNode>) {
    this.tree = tree;
  }

  getNode(nodeId: string): DialogueNode | null {
    return this.tree[nodeId] || null;
  }

  getStartNode(): DialogueNode | null {
    return this.tree["start"] || null;
  }

  processChoice(
    nodeId: string,
    choiceIndex: number
  ): { nextNode: DialogueNode | null; effects: DialogueChoice["effect"] | null } {
    const node = this.tree[nodeId];
    if (!node || !node.choices || choiceIndex >= node.choices.length) {
      return { nextNode: null, effects: null };
    }

    const choice = node.choices[choiceIndex];
    this.history.push(nodeId);

    return {
      nextNode: this.tree[choice.nextNodeId] || null,
      effects: choice.effect || null,
    };
  }

  advanceToNext(nodeId: string): DialogueNode | null {
    const node = this.tree[nodeId];
    if (!node || !node.nextNodeId) return null;
    this.history.push(nodeId);
    return this.tree[node.nextNodeId] || null;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  reset(): void {
    this.history = [];
  }
}

export function createDialogueEngine(
  tree: Record<string, DialogueNode>
): DialogueEngine {
  return new DialogueEngine(tree);
}

export function getSpeakerDisplayName(speaker: SpeakerType): string {
  switch (speaker) {
    case "shen_xiansheng":
      return "申先生";
    case "xu_niangzi":
      return "徐娘子";
    case "system":
      return "旁白";
    default:
      return "";
  }
}

export function getSpeakerEmoji(speaker: SpeakerType): string {
  switch (speaker) {
    case "shen_xiansheng":
      return "👨‍🏫";
    case "xu_niangzi":
      return "👩‍🏫";
    case "system":
      return "📜";
    default:
      return "";
  }
}