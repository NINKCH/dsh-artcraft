---
name: artcraft-edit-rhythm
description: 剪辑节奏与转场决策——镜头时长与情绪曲线、剪切点选择、动作/图形/视线匹配、J-cut 与 L-cut、跳切与蒙太奇的取舍、转场词典与"默认永远是切"、节拍剪辑与声音先行，并映射到 FilmCraft timeline/trim/captions/transcript/multicam 与 SoundCraft 节拍分析命令。用于剪辑、粗剪、节奏调整与转场设计。
---

# 剪辑节奏与转场

剪辑的本质是**控制信息与情绪的释放速度**。节奏不是"快"，而是"该快的地方快、该停的地方停"。

## 一、镜头时长与情绪曲线

| 段落功能 | 时长倾向 | 手法 |
|---|---|---|
| 建立（开场/新场景） | 长（3–6s+） | 少切、让观众读空间 |
| 递进（信息累积） | 递减 | 景别递进 + 切换加快 |
| 峰值（冲突/高潮） | 最短 | 短切、近景、声音同步冲击 |
| 余韵（收束） | 拉长 | 一个长镜或静帧，留呼吸 |

**情绪曲线**：把每场标出"紧张值"，剪辑时让切点密度与之同向变化。平直的密度=观众走神。

## 二、剪切点怎么选（五种可靠切点）

| 切点 | 说明 | 优点 |
|---|---|---|
| **动作中切** | 在动作进行中切走 | 最隐蔽、最顺 |
| **情绪峰值前切** | 在情绪刚要爆时切走 | 保留张力 |
| **视线转移切** | 角色看向某处时切到所看之物 | 天然动机 |
| **声音先行（J-cut）** | 下一场声音先入 | 段落缝合顺滑 |
| **静默前切** | 台词/音乐落点后 2–3 帧切 | 有"落定感" |

**避免**：在动作完成后停顿再切（显拖沓）、在完全静止时硬切（显跳）。

## 三、剪辑类型与何时用

| 类型 | 何时用 | 何时别用 |
|---|---|---|
| 动作匹配 cut on action | 动作段落、打斗、开门 | 动作方向不一致时 |
| 图形匹配 graphic match | 相似形状/构图转场 | 过度刻意时 |
| 视线匹配 eyeline match | 对话、观察 | 视线方向错乱 |
| **J-cut / L-cut** | 对话戏、场景过渡（声音先行/滞后） | 纪录片采访硬切时 |
| 跳切 jump cut | 时间压缩、焦躁、Vlog | 叙事连续场景（会"穿帮"） |
| 蒙太奇 montage | 时间流逝、训练/准备段 | 关键冲突（会泄压） |
| 插入镜头 insert | 强调道具/细节 | 无信息量时 |
| 交叉剪辑 cross-cut | 平行时空、追逐 | 线索过多（>3 线） |
| 平行剪辑 parallel | 对比主题 | 无明显对比时 |

## 四、转场词典（**默认永远是切**）

| 转场 | 语义 | 何时用 | 何时别用 |
|---|---|---|---|
| **切 cut** | 中性、默认 | 90% 场合 | —— |
| 叠化 dissolve | 时间流逝、柔和过渡 | 段落之间、回忆 | 同场对话内 |
| 闪白/闪黑 flash | 冲击、断裂 | 高能转场、惊吓 | 文艺段落 |
| 划像 wipe | 空间/时间并列 | 类型片、幽默 | 严肃题材 |
| 匹配转场 match cut | 巧思、主题呼应 | 记忆点 | 滥用即花哨 |
| 隐藏剪辑 invisible cut | 无缝长镜错觉 | 沉浸式段落 | 需要明显断点时 |
| 声音转场 sound bridge | 用声音缝合画面 | 几乎所有好剪辑 | —— |

**铁律**：转场承载语义；**没有动机就不加转场**——"加个酷炫转场"是新手病。相邻转场不要连续用同一种。

## 五、音乐、节拍与声音先行

- **节拍切**：把切点落在音乐重拍上（情绪段），但**不要每拍都切**——重拍切 + 弱拍留白更有力。
- **声音先行**：下一场的声音提前 0.5–1.5s 进入（J-cut）；或上一场声音延后（L-cut）。
- **留白**：情绪峰值后给 0.5–1s 无声或环境声，比继续堆音乐更有效。
- **响度**：跨段落响度要一致（见 artcraft-sound-design 与 artcraft-delivery-qc）。

## 六、ArtCraft 落点（真实命令族）

**FilmCraft（剪辑主场）**

| 动作 | 命令 |
|---|---|
| 放置/移动/剃刀 | `timeline.place` · `timeline.move` · `timeline.razor` |
| 修剪（常规/波纹） | `timeline.trim {mode:"regular\|ripple"}` · `trim.ripplePrevious/rippleNext` |
| 滚动/滑移/滑动 | `timeline.roll` · `timeline.slip` · `timeline.slide` |
| 变速（速率拉伸） | `timeline.rateStretch` |
| 微调（按帧） | `timeline.nudgeLeft/Right`(+5) · `timeline.slipLeft/Right` · `timeline.slideUp/Down` |
| 加转场 | `sequence.applyVideoTransition {effect:"cross_dissolve\|…", frames, edge, params}` · `sequence.applyAudioTransition` |
| 默认转场批量 | `trim.applyDefaultTransition` |
| 试看剪点 | `trim.playAround {clock, loop}` · `trim.selectNearest` · `trim.extendToPlayhead` |
| 标记（镜头点/音乐点/待办） | `markers.*`（32 条） |
| 多机位切换 | `multicam.*`（35 条，含按音频对齐与切换） |
| 播放头/走带 | `playhead.*`（14 条） |

**自动粗剪（家族自带，不需要外部工具）**

| 目标 | 命令 |
|---|---|
| 转写 | `transcript.generate {model:"whisper-base", language}`（`transcript.models` 查可用模型） |
| **去停顿** | `transcript.removePauses {minSeconds, keepSeconds}` |
| **去口头禅** | `transcript.removeFillers {fillers}` |
| 由转写生成字幕 | `transcript.createCaptions {maxChars, lines, minSeconds, maxSeconds}` |
| 字幕精修 | `captions.*`（拆/并/改文/调时/样式/导入导出 srt·vtt·scc·mcc·stl·ttml·dfxp） |
| 字幕升级为图形 | `graphics.upgradeCaption`（可做花字/动效字幕） |

**节拍与音乐（SoundCraft）**：`event.beat_detective {sensitivity}`（检测节拍）· `event.identify_beat` · `event.extract_chords`（和弦）· `event.input_quantize`（量化到节拍）。把检测出的拍点写进 FilmCraft `markers.*`，再按标记切。

## 七、剪辑质检清单（交付前自查）

- [ ] 每场有明确的**情绪走向**，不是匀速
- [ ] 相邻镜头**景别不重复**（除非刻意）
- [ ] 无"动作完成后停顿"的拖沓切点
- [ ] 转场**有语义动机**，且不连续重复
- [ ] 对话戏有 J-cut/L-cut，不是全程硬切
- [ ] 声音跨切点连续（无爆音/断点），响度一致
- [ ] 音乐重拍与关键切点**对齐或刻意错开**
- [ ] 字幕不断句错误、不超安全区（见 artcraft-delivery-qc）

> 一句话原则：**切点是观众注意力的呼吸口**——该给信息时切，该给情绪时停。
