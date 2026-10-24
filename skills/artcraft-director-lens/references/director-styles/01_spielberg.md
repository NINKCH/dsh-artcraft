---
name: artcraft-lens-spielberg
description: >-
  导演透镜（ArtCraft 适配版）：史蒂文·斯皮尔伯格导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 史蒂文·斯皮尔伯格导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: spielberg
lens_kit_mm: [21, 35, 50, 135]   # 21/35 撑三层纵深与空间可读；50 是普通人的中性焦段；135 从远处切反应，机位不动而情绪跳变
camera:
  prefer: ["slow dolly-in to close-up", "walking-pace tracking follow", "crane down into eye level", "motivated pan connecting person to threat", "rack focus across three planes"]
  avoid: ["dutch angle", "unmotivated handheld", "orbit around subject", "snap zoom", "whip pan"]
  motion_budget: medium
  height: "成人对话眼平；奇观与威胁段落降到 1.0-1.3m 的孩子视线高度，机位锁定"
shot_size_bias: ["medium close-up reaction", "wide with three-plane depth", "medium two-shot", "insert on the carried object", "extreme wide for scale"]
composition: ["three-plane deep staging", "silhouette against a bright named source", "doorway frame-within-frame", "subject in lower third under a large event", "clear exit visible in every wide"]
lighting:
  key_quality: mixed
  key_ratio: "3:1 温暖段；8:1 威胁段"
  motivation: practical
  signature: "薄雾中一束看得见的硬光柱，加发梢逆光轮廓"
palette:
  dominant: 琥珀、钨丝暖黄、灰蓝绿
  accent: 单一高饱和红或纯白光点
  saturation: mid
  contrast: mid
editing:
  avg_shot_length_s: "3-7 动作段；5-9 情绪段"
  transition_bias: ["hard cut", "match cut", "dissolve"]
  coverage_style: "完整经典覆盖：主镜 + 反打 + 反应 + 插入，切点落在反应而非揭示"
sound:
  music: 单人物动机旋律，比情绪转折早 1-2 秒进入
  ambience: 威胁先由声音抵达，画面滞后 3-8 秒
  dialogue: 家庭群戏可重叠，每场保留一句完全听清
  silence_use: 揭示前 1.5-3 秒近乎全静音，只留一个环境元素
performance:
  register: 高可读性，观众 1 秒内能命名情绪；用肌肉指令而非形容词导戏
  blocking: 人物朝向或背离他想要的东西移动；摄影机守住空间地图
aspect_bias: "1.85:1 / 16:9"
ai_video:
  clip_duration_s: "4-8"
  prompt_bias: 每条 clip 只装一次看、一个摄影机行为、一个环境反应；反应镜头单独成条，先生成反应再生成揭示。
  risk: 惊奇脸会退化成呆滞空瞪。对策是把表情写成可执行动作（眉毛抬起、嘴唇分开约 1 厘米、屏住呼吸），并在同一条里写清引发它的光变化。
negative_prompt_adds: ["dutch angle", "handheld shake", "camera orbit", "slow motion", "extra background crowd", "modern screens or phones", "text or watermark", "flat even lighting"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"3-7 动作段；5-9 情绪段"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "match cut", "dissolve"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："完整经典覆盖：主镜 + 反打 + 反应 + 插入，切点落在反应而非揭示"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"3:1 温暖段；8:1 威胁段"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：琥珀、钨丝暖黄、灰蓝绿 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：单一高饱和红或纯白光点
- 饱和/对比：mid / mid
- 光线签名："薄雾中一束看得见的硬光柱，加发梢逆光轮廓"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：单人物动机旋律，比情绪转折早 1-2 秒进入
- 环境：威胁先由声音抵达，画面滞后 3-8 秒
- 对白：家庭群戏可重叠，每场保留一句完全听清
- 静默：揭示前 1.5-3 秒近乎全静音，只留一个环境元素
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["slow dolly-in to close-up", "walking-pace tracking follow", "crane down into eye level", "motivated pan connecting person to threat", "rack focus across three planes"]
- 避免：["dutch angle", "unmotivated handheld", "orbit around subject", "snap zoom", "whip pan"]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
