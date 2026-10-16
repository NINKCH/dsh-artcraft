# 转场接口与选用决策（FilmCraft / DeckCraft）

> 接口来自本机命令表与官方控制协议（已验证）；选用决策是创作判断（见 `../SKILL.md` 第四节）。
> 铁律：**默认永远是切**；转场必须承载语义。

## 一、命令接口（已验证）

| 命令 | 参数 | 说明 |
|---|---|---|
| `sequence.applyVideoTransition` | `{clip?, effect:"<id>\|<显示名>"?, frames?, edge:"in"\|"out"?, params?:{…}, reverse?}` | 在剪辑点加视频转场 |
| `sequence.applyAudioTransition` | `{clip?, effect?, frames?, edge?, params?, reverse?}` | 音频转场；**已验证**的音频转场名：`constant_power` / `constant_gain` / `exponential_fade` |
| `sequence.setTransition` | `{transition, params?, reverse?, reset?, duration?, align:"center"\|"start"\|"end", start?, merge?, begin?}` | 修改已有转场的参数与时长/对齐 |
| `sequence.removeTransition` | `{transitions?:[id]}` | 清除转场 |
| `trim.applyDefaultTransition` | `{clips?}` | 给选区套默认转场（批量） |
| `effects.setDefaultTransition` | `{effect:"constant_power\|constant_gain\|exponential_fade\|<video transition>"}` | 设定默认转场类型 |

**视频转场的取值**：CLI 提示里以 `cross_dissolve|Cross Dissolve|…` 形式给出（应用内会截断长枚举），
即**既接受 id 也接受显示名**；完整清单以应用「效果 → 视频转场」目录为准。
DeckCraft（演示）另有 `transition.list` / `transition.set {kind, option?, duration?, index?}`，其 kind 枚举为
`none|morph|fade|push|wipe|split|reveal|cut|randomBar|shape|uncover|cover|flash|…`（以 `transition.list` 为准）。

## 二、选用决策表

| 转场 | 语义 | 何时用 | 何时别用 | 时长经验 |
|---|---|---|---|---|
| **切 cut** | 中性、默认 | 90% 场合；对话、动作、信息递进 | —— | 0 |
| 叠化 dissolve | 时间流逝 / 柔和过渡 | 段落之间、回忆、时间跳跃 | 同场对话内（会显得"软"） | 12–24 帧 |
| 划像 wipe | 并列、类型化 | 类型片、幽默、对比 | 严肃写实题材 | 8–16 帧 |
| 闪白/闪黑 | 冲击、断裂 | 高能转场、惊吓、章节切换 | 文艺/写实段落 | 4–8 帧 |
| 匹配转场 match cut | 主题呼应、巧思 | 记忆点、呼应结构 | 滥用即花哨 | 0（靠构图） |
| 隐藏剪辑 | 无缝长镜错觉 | 沉浸式、伪一镜到底 | 需要明确断点时 | 0 |
| 声音桥 sound bridge | 缝合段落 | **几乎所有好剪辑** | —— | 0.5–1.5 s 提前/延后 |
| 音频转场 `constant_power` | 等功率交叉淡化 | 音乐/环境声衔接（默认） | —— | 12–24 帧 |
| 音频转场 `constant_gain` | 等增益（线性） | 需要保持电平感时 | 长叠化（中段会塌） | 8–16 帧 |
| 音频转场 `exponential_fade` | 指数淡化 | 情绪渐弱/渐强 | 需要等功率时 | 12–36 帧 |

## 三、操作要点

1. **先切点、后转场**：转场加在已确认的剪辑点上；`sequence.setTransition {align:"center"}` 可让转场居中（默认），需要特定对齐时用 `align:"start"|"end"`。
2. **时长按语义给**：情绪越强、转场越短（或干脆用切）；叙事性过渡（回忆）可给 24 帧以上。
3. **声音优先于画面**：跨段落时先做 J-cut/L-cut（声音先行/延后），再考虑画面转场；多数情况下声音桥已足够，画面不必加转场。
4. **一致性**：同一部片最多 1–2 种转场类型；同类转场时长统一（写入美学圣经，见 artcraft-style-bible）。
5. **批量**：给一组剪辑点统一套默认转场 → 先 `effects.setDefaultTransition`，再 `trim.applyDefaultTransition`。

## 四、常见错误

| 错误 | 症状 | 纠正 |
|---|---|---|
| 每个剪辑点都加转场 | 花哨、廉价、节奏被拖慢 | 只保留有语义的少数转场 |
| 同场对话内用叠化 | 节奏发软、像幻灯片 | 用切；需要柔和时用声音桥 |
| 转场时长超镜头长度 | 报错或画面异常 | 先看镜头时长（`trim.playAround` 试看） |
| 音频转场类型混用 | 段落间电平跳变 | 全片统一一种音频转场 |
| 转场代替叙事 | 观众被形式干扰 | 问"这个转场说了什么"——答不出就删 |
