# 自我改变 - 开发日志

## 2026-05-08 完成的工作

### 1. 项目结构搭建
- `src/app/page.tsx` — 入口路由（登录检查 → 跳转）
- `src/app/login/page.tsx` — 登录/注册页面
- `src/app/onboarding/page.tsx` — Day 0 初遇对话（完整对话树）

### 2. 数据库配置
- Supabase 项目：tuavlvxqybbpktjvkovl
- 创建 profiles 表 + RLS 策略 + trigger 自动创建 profile
- 创建 daily_tasks 表（晨间功课存储）

### 3. 对话系统
- `src/lib/dialogue-engine.ts` — 对话状态机引擎
- `src/data/dialogue-trees/day0-onboarding.ts` — Day 0 初遇对话 JSON
- `src/data/dialogue-trees/evening-week1.ts` — 晚间对话 JSON

### 4. 游戏逻辑
- `src/lib/game-logic.ts` — HP计算、王德累积、天气判断、功课选项

### 5. 核心页面
- `src/app/(main)/scroll-map/page.tsx` — 主界面（地图 + 状态栏）
- `src/app/(main)/morning/page.tsx` — 晨间仪式（选功课）
- `src/app/(main)/evening/page.tsx` — 晚间对话（选择式）

### 6. 项目文档
- `CLAUDE.md` — 项目核心文档（技术栈、设计原则、MVP范围）

---

## 重要说明

### 技术栈
- Next.js 16 (App Router)
- Supabase (Auth + Database)
- TypeScript + Tailwind CSS
- Zustand + SWR

### 当前状态
- 用户可以注册/登录
- 登录后进入初遇对话 → 主界面
- 晨间/晚间流程可以完整走完
- 数据会保存到 Supabase

### MVP 完成度
- ✅ Day 0 初遇对话
- ✅ 晨间仪式（选功课）
- ✅ 晚间对话（选择式）
- ✅ 逆星 HP 追踪
- ✅ 王德计数
- ✅ 滚动地图主界面
- ✅ Supabase Auth

---

## 下周继续开发

### 待完成
1. **午后驿站**（可选，3点微提醒）
2. **大臣密报**（周末特殊事件）
3. **毒疮阴影**（第二个阴影）
4. **滚动地图动画**（美化）
5. **阶段升级逻辑**（Awakening → Self_Cultivation）

### 重要文件路径
```
D:\Trae CN\documents\app_design\self-change\
├── CLAUDE.md                    # 项目文档
├── src/
│   ├── app/
│   │   ├── page.tsx             # 入口
│   │   ├── login/page.tsx       # 登录
│   │   ├── onboarding/page.tsx  # 初遇对话
│   │   └── (main)/
│   │       ├── scroll-map/      # 主界面
│   │       ├── morning/         # 晨间
│   │       └── evening/         # 晚间
│   ├── data/dialogue-trees/     # 对话树 JSON
│   ├── lib/
│   │   ├── dialogue-engine.ts   # 对话引擎
│   │   └── game-logic.ts        # 游戏逻辑
│   └── types/
│       ├── database.ts          # 数据库类型
│       └── game.ts              # 游戏类型
```

### 运行命令
```bash
cd "D:\Trae CN\documents\app_design\self-change"
npm run dev   # 启动开发服务器
```

---

## 数据库表结构

### profiles
- id, username, current_phase, wangde, scroll_position, day_in_journey, onboarding_complete...

### shadows
- id, user_id, shadow_type, current_hp, max_hp, shatter_count, is_active...

### daily_tasks
- id, user_id, assigned_date, task_description, task_category, status...

---

## 设计文档
- `D:\Trae CN\documents\app_design\app-design.md` — 完整设计规范
- `D:\Trae CN\documents\app_design\app-design-dialogue.md` — 对话树设计