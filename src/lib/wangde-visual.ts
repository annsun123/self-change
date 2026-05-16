// 王德纹路计算

const WANGDE_THRESHOLDS = [3, 6, 9, 12, 15]; // 每3点王德 = 1道纹路
const MAX_VEINS = 5; // 5道纹路：脚踝→膝盖→腰带→胸口→肩膀→头顶

/**
 * 根据王德值计算纹路数量
 */
export function getVeinCount(wangde: number): number {
  let count = 0;
  for (const threshold of WANGDE_THRESHOLDS) {
    if (wangde >= threshold) count++;
  }
  return count;
}

/**
 * 获取纹路位置的key（用于渲染）
 */
export const VEIN_POSITIONS = [
  'ankle',   // 脚踝 - 第1道纹路
  'knee',    // 膝盖 - 第2道纹路
  'waist',   // 腰带 - 第3道纹路
  'chest',   // 胸口 - 第4道纹路
  'shoulder',// 肩膀 - 第5道纹路
] as const;

export type VeinPosition = typeof VEIN_POSITIONS[number];

/**
 * 获取纹路位置的中文名称
 */
export function getVeinPositionName(position: VeinPosition): string {
  const names: Record<VeinPosition, string> = {
    ankle: '脚踝',
    knee: '膝盖',
    waist: '腰带',
    chest: '胸口',
    shoulder: '肩膀',
  };
  return names[position];
}

/**
 * 检查是否应该显示金光绕身（所有纹路都点亮）
 */
export function hasFullGlow(wangde: number): boolean {
  return wangde >= WANGDE_THRESHOLDS[MAX_VEINS - 1];
}

/**
 * 获取王德阶段的中文名称
 */
export function getWangdeStageName(veinCount: number): string {
  if (veinCount === 0) return '尚未有纹路';
  if (veinCount === 1) return '脚踝微光';
  if (veinCount === 2) return '膝下有光';
  if (veinCount === 3) return '腰带生辉';
  if (veinCount === 4) return '胸口盈光';
  if (veinCount >= 5) return '德满金光';
  return '';
}