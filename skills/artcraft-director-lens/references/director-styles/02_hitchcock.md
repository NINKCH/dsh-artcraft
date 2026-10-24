---
name: artcraft-lens-hitchcock
description: >-
  导演透镜（ArtCraft 适配版）：阿尔弗雷德·希区柯克导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 阿尔弗雷德·希区柯克导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: hitchcock
lens_kit_mm: [28, 50, 100, 135]   # 28 一次性交代房间地图；50 是客观中性眼；100/135 做"凝视的选择性"压缩，把远处的危险拉到观众鼻子底下
camera:
  prefer: ["locked frame held past comfort", "slow dolly-in on a detail", "point-of-view pan following an eyeline", "high overhead on a stairwell or floor plan", "creep-in behind foreground obstruction"]
  avoid: ["handheld", "camera orbit", "whip pan", "crash zoom", "constant reframing"]
  motion_budget: low
  height: "眼平为主；命运节拍升到 3-6 米俯拍，威胁节拍降到 0.3-0.6 米"
shot_size_bias: ["extreme close-up on the object", "close-up reaction", "point-of-view medium", "obstructed medium two-shot", "one wide as the room map"]
composition: ["foreground obstruction 20-35% of frame", "frame within frame via door/stair/window", "geometric shadow cast across the wall", "negative space where the threat will enter", "eyeline axis shared across three shots"]
lighting:
  key_quality: hard
  key_ratio: "4:1"
  motivation: practical
  signature: "日常照度不降，阴影是可辨认的几何形状（百叶、扶手、门缝），不是氛围雾"
palette:
  dominant: 中性冷灰、米白、家具木色
  accent: 正红、深绿、金属金——只在信息转折时出现
  saturation: mid
  contrast: high
editing:
  avg_shot_length_s: "4-9 基线；0.4-1.5 仅在暴力瞬间"
  transition_bias: ["hard cut", "match cut", "dissolve"]
  coverage_style: "看-所见-反应三镜结构占段落一半以上；交叉剪辑保持危险线:角色线 = 1:3"
sound:
  music: 短、重复、音程尖锐的动机，在观众已知危险之后进入
  ambience: 每段选一个"时钟"（滴水、脚步、门锁、电话铃）负责时间流逝
  dialogue: 反派降低语速、增加停顿；主角越解释越可疑
  silence_use: 最紧的 3-5 秒抽掉音乐只留时钟，用一个非音乐硬声落点
performance:
  register: 隐藏与泄露同时进行——手先泄露，脸后泄露
  blocking: 角色走向他不该走向的地方；观众已知的危险停在画外或前景遮挡后
aspect_bias: "1.85:1；单人主观段落可收到 1.66:1 以压缩两侧逃逸空间"
ai_video:
  clip_duration_s: "3-6 用于延迟节拍；1-2 用于碎片化插入"
  prompt_bias: 一条 clip 只做一件事——要么是"角色靠近"，要么是"危险移动"，绝不同时。把观众已知的危险放在前景遮挡或画面边缘，让它几乎不动。
  risk: 模型倾向于把静止的威胁"补上动作"，等待感立刻变成动作戏。对策是在提示词里显式写 the threat does not move，并把 clip 缩到 4 秒以内。
negative_prompt_adds: ["handheld shake", "camera orbit", "jump scare motion", "blood or gore", "sudden lighting change", "extra people entering frame", "text or watermark", "lens flare"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"4-9 基线；0.4-1.5 仅在暴力瞬间"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "match cut", "dissolve"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："看-所见-反应三镜结构占段落一半以上；交叉剪辑保持危险线:角色线 = 1:3"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"4:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：中性冷灰、米白、家具木色 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：正红、深绿、金属金——只在信息转折时出现
- 饱和/对比：mid / high
- 光线签名："日常照度不降，阴影是可辨认的几何形状（百叶、扶手、门缝），不是氛围雾"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：短、重复、音程尖锐的动机，在观众已知危险之后进入
- 环境：每段选一个"时钟"（滴水、脚步、门锁、电话铃）负责时间流逝
- 对白：反派降低语速、增加停顿；主角越解释越可疑
- 静默：最紧的 3-5 秒抽掉音乐只留时钟，用一个非音乐硬声落点
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked frame held past comfort", "slow dolly-in on a detail", "point-of-view pan following an eyeline", "high overhead on a stairwell or floor plan", "creep-in behind foreground obstruction"]
- 避免：["handheld", "camera orbit", "whip pan", "crash zoom", "constant reframing"]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
