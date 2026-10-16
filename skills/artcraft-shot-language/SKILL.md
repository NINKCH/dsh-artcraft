---
name: artcraft-shot-language
description: 镜头语言设计——景别、机位、角度、运动、构图、光线、轴线、覆盖拍摄与分镜的"何时用/何时别用"决策表，并把每种语法映射到 ArtCraft 家族可执行命令（EffectCraft camera/view/layer、FilmCraft graphics/timeline、LightCraft develop、VectorCraft perspective、FigCraft layout）。用于分镜设计、镜头选择、画面构图与机位调度。
---

# 镜头语言：判断 → 语法 → 命令

先问三个问题，再选语法：**这场戏要让观众感到什么？信息给谁、瞒谁？权力关系如何用站位与机位表达？** 想清楚再落到下面的表。

## 一、景别（决定"观众离角色多远、知道多少"）

| 景别 | 叙事功能 | 何时用 | 何时别用 | ArtCraft 落点 |
|---|---|---|---|---|
| 大远景 ELS | 交代环境、人的渺小 | 开场、转场、孤立感 | 对话戏 | EffectCraft 3D 视图/大场景；LightCraft 宽裁切 |
| 远景 LS | 空间关系、人物全身+环境 | 建立镜头、群戏 | 情绪特写 | FilmCraft 时间线选镜；LightCraft `crop.aspect` |
| 全景 FS | 全身、动作完整 | 动作段落、调度展示 | 内心戏 | FilmCraft `graphics.*` 构图参考 |
| 中景 MS | 对话主力景别 | 常规对话 | 强调细节时 | 剪辑节奏见 artcraft-edit-rhythm |
| 中近景 MCU | 情绪开始进入 | 对话升级、微表情 | 大动作 | EffectCraft 合成裁切/放大 |
| 近景 CU | 情绪、心理 | 情绪峰值、关键台词 | 交代空间 | EffectCraft `layer.*` 缩放关键帧 |
| 大特写 ECU | 压迫、细节符号 | 反转、道具暗示 | 长段落 | PhotoCraft `filter.*` 强化质感 |

**交替规则**：相邻镜头避免同景别硬接（除非刻意"跳轴式"冲击）；情绪上升时景别递进（MS→MCU→CU），段落收束回到 LS 交代。

## 二、机位与角度（决定"谁强谁弱"）

| 角度 | 心理效果 | 何时用 | 落点 |
|---|---|---|---|
| 平视 | 平等、客观 | 常态对话 | 基准 |
| 仰拍 | 压迫感、权威 | 强者、威胁、英雄化 | EffectCraft 3D `camera.orbit/pan` 抬高机位 |
| 俯拍 | 弱势、被审视 | 失败、屈服、全景调度 | 同上，机位下压 |
| 斜角 Dutch | 失衡、不安 | 危机、精神异常 | EffectCraft `layer.*` 旋转 |
| 过肩 OTS | 对话关系、代入 | 正反打 | 双人机位对切 |
| 主观 POV | 强代入 | 惊悚、代入角色视线 | 与视线匹配剪辑配合 |
| 鸟瞰/虫视 | 极致权力差 | 强调、类型化 | 特例，慎用 |

**轴线铁律**：保持 180° 轴线，越轴会让空间"翻转"让人失忆。需要越轴时用**中性镜头**或**运动越轴**过渡。到 ArtCraft 落点：在分镜/调度阶段就用 FigCraft/DeckCraft 画**俯视调度图**（站位+走位线+机位+灯位+轴线），**在图纸期消灭跳轴**。

## 三、运动（决定"情绪是推上去还是压下来"）

| 运动 | 语义 | 何时用 | 何时别用 |
|---|---|---|---|
| 推 / 前移 | 进入、聚焦、压迫 | 强调、揭示 | 每镜都推=廉价 |
| 拉 / 后移 | 抽离、揭示环境、失落 | 段落收尾、反转 | 情绪正高时 |
| 摇 pan | 展示空间、跟随 | 环境交代 | 快速摇易糊 |
| 移 track | 伴随、沉浸 | 走廊、跟随 | 无动机时 |
| 升降 crane | 宏大、命运感 | 开场/结尾 | 小场景 |
| 跟 follow | 参与感 | 动作、行走 | 稳定器缺失时 |
| 手持 | 真实、紧张 | 纪实、冲突 | 精致产品镜头 |
| **变焦 vs 位移** | 变焦=机械抽离；位移=观众移动 | 变焦做"惊觉"，位移做"进入" | 二者混用会晕 |
| 环绕 orbit | 仪式感、审视 | 英雄时刻 | 对话 |

ArtCraft 落点：EffectCraft **`camera.orbit` / `camera.pan` / `camera.dolly`**（3D 机位）、`camera.fromView`、`camera.orbitNull`；2D 素材用 `layer.*` 的位移/缩放关键帧 + `keys.easyEase*` 缓动；FilmCraft 用 `effects.setParam` + `effects.addKeyframe` 做运动/缩放。

**运动铁律**：**单镜单向**（一个镜头一个运动方向），起幅与落幅都要有"到达感"；缓动用 `keys.easyEase` / `keys.easyEaseIn/Out`，避免线性生硬。

## 四、构图（画面内"眼睛往哪走"）

| 法则 | 用途 | 落点 |
|---|---|---|
| 三分法 | 通用平衡 | 参考线：FigCraft `grid.*` / `layout.*`；VectorCraft `view.guides.*` |
| 中心构图 | 仪式感、对峙 | FilmCraft `graphics.alignFrame.hcenter/vcenter` |
| 对称 | 秩序/压迫 | 同上 + 精确对齐 |
| 框式构图 | 窥视、层次 | 前景元素放置（`graphics.arrangeLayer`） |
| 引导线 | 视线导向主体 | 透视作图 VectorCraft `perspective.grid/snap` |
| 负空间 | 孤独、留白 | 主体偏移，`graphics.nudge*` 微调 |
| 视线空间 | 人物"看向"要留空 | 主体偏左则留右 |
| 头顶空间 | 太挤显压抑、太空显漂浮 | 微调 `graphics.nudgeUp/Down` |
| 前景/中景/远景层次 | 纵深感 | 分层合成（EffectCraft `layer.*`） |

安全区：字幕/图形用 FilmCraft `graphics.*` 的**安全区与响应式设计**（`graphics.setResponsiveTime`、`graphics.pin`），竖屏另有平台安全区。

## 五、光线（决定"质感与情绪底色"）

| 光型 | 效果 | 何时用 | 落点 |
|---|---|---|---|
| 主光 + 辅光 | 常规立体 | 多数场景 | LightCraft `light.*`（曝光/对比/高光/阴影/白/黑） |
| 轮廓光 rim | 分离主体与背景 | 暗背景、人物 | LightCraft `grading.highlights.*`；EffectCraft 光效层 |
| 伦勃朗光 | 戏剧肖像 | 人物特写 | `grading.*` 分区色调 |
| 明暗对照 chiaroscuro | 强对比、压迫 | 悬疑/权谋 | `light.contrast` + `curve.*` |
| 实用光 practical | 真实感光源入画 | 夜戏、室内 | 合成光效（EffectCraft `effect.*`） |
| 黄金时刻 | 温暖、怀旧 | 情感段落 | LightCraft `wb.temp/tint` + `grading` |
| 无源光 | **大忌**：光没有来源 | —— | 调度图阶段标注灯位即可避免 |

**光比**：情绪越紧、光比越大；写实场景 4:1~6:1，惊悚可 8:1 以上。

## 六、焦点与景深

- 浅景深引导注意；深景深展示调度。
- EffectCraft：`camera.setFocusToLayer` / `camera.linkFocusToLayer`（焦点跟随）、`camera.linkFocusToPoi`（对焦兴趣点）；镜头虚化用 `effect.*` 中的模糊族（Blur & Sharpen 共 16 个）。
- PhotoCraft：`filter.blurGallery.*`（tiltShift/irisBlur/fieldBlur/spinBlur/pathBlur）做选择性虚化；`filter.blur.*` 做整体虚化。

## 七、覆盖拍摄与分镜（把语法变成可执行清单）

标准覆盖：**主镜头（Master）→ 中景对话 → 反应镜头 → 插入镜头（手/道具/细节）→ 特写情绪点**。

分镜最小字段（写进分镜表，供后续执行）：
`镜号 · 景别 · 角度 · 运动(方向/幅度/起落幅) · 时长 · 画面内容 · 光线 · 声音 · 转场`

ArtCraft 承载：**FigCraft**（画板/组件/原型，做可交互分镜与界面资产）· **DeckCraft**（幻灯片式分镜）· **DesignCraft**（图文版面/画册）· **GridCraft**（镜头数据表：排序/筛选/透视）· **FilmCraft**（时间线落地；`markers.*` 标注镜头点）。

## 八、速查：从意图到命令

| 意图 | 首选命令族 |
|---|---|
| 设计机位/运镜 | EffectCraft `camera.*`、`view.3d.*`、`layer.*`+`keys.*` |
| 画面内文字/图形构图 | FilmCraft `graphics.*`（新文本/形状/对齐/分布在帧·组·选区三个层级） |
| 透视/等距作图 | VectorCraft `perspective.grid.define/preset/snap` |
| 界面与布局资产 | FigCraft `layout.*`、`grid.*`、`component.*` |
| 影调与光线 | LightCraft `develop.*`（见 artcraft-color-light） |
| 分镜表与调度图 | DeckCraft `slide.*`、DesignCraft `object.*`、GridCraft `data.*` |

> 判断优先于语法：**先定情绪与信息，再选景别与运动**；语法服务于叙事，不为炫技而动镜头。
