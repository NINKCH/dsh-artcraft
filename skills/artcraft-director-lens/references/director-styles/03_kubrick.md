---
name: artcraft-lens-kubrick
description: >-
  导演透镜（ArtCraft 适配版）：斯坦利·库布里克导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 斯坦利·库布里克导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: kubrick
lens_kit_mm: [18, 25, 35]   # 18/25 制造单点透视与轻微脸部变形，让走廊两壁在画面里收拢；35 只在需要一个"正常"参照镜头时使用，用量不超过全段 20%
camera:
  prefer: ["locked symmetrical frame", "constant-speed dolly-in along the vanishing axis", "constant-speed dolly-out on the same axis", "low tracking follow at 0.5-0.8m", "overhead perpendicular insert"]
  avoid: ["handheld", "camera orbit", "whip pan", "any acceleration or deceleration in a move", "reframing mid-shot"]
  motion_budget: low
  height: "锁定在层高的一半（2.8-3.2m 层高对应 1.4-1.6m），天花与地面的收拢楔形才上下对称；或 0.5-0.8m 低位跟随。一场戏内高度不变"
shot_size_bias: ["symmetrical wide with strong vanishing point", "frontal medium on the centre axis", "overhead insert of floor pattern or object", "long-held frontal close-up", "extreme wide of the empty space"]
composition: ["one-point perspective, vanishing point at frame centre", "bilateral symmetry or exact mirroring", "subject riding the centre axis", "corridor/room as a compressing funnel", "flat frontal planes stacked in depth"]
lighting:
  key_quality: hard
  key_ratio: "2:1，压迫最强处可到 1.5:1"
  motivation: stylized
  signature: "画面内可见且对称排布的硬光阵列；短硬阴影方向互相抵消，没有一块可藏身的暗部"
palette:
  dominant: 冷白、灰、纯黑
  accent: 血红、金、单一饱和色块（一个空间一个色）
  saturation: mid
  contrast: mid
editing:
  avg_shot_length_s: "12-40，极少低于 6"
  transition_bias: ["hard cut", "match cut"]
  coverage_style: "覆盖极简：一个构图撑完一个节拍；同一构图在段落内回来 2-3 次形成结构性重复"
sound:
  music: 结构装置——一段乐曲覆盖整个段落，独立于画面情绪起伏
  ambience: 机械与身体对立：通风、伺服、硬表面上的脚步回声、呼吸
  dialogue: 语速比自然慢约 30%，停顿加长，礼貌到不自然
  silence_use: 长镜头后 1/3 抽掉音乐，只留呼吸，直到切点
performance:
  register: 刻意僵硬、过度精确、内部自洽；允许直视镜头把观众推回分析距离
  blocking: 人物沿中轴前进或后退；侧向移动一律被构图纠正回对称
aspect_bias: "1.85:1 / 1.66:1；避免 2.39:1，它会削弱建筑的垂直压迫"
ai_video:
  clip_duration_s: "8-12（推轨需要行程；短于 6 秒看不出匀速）；12-40 秒的长凝视用同参数分段续接拼出来"
  prompt_bias: 把"匀速"和"不重新构图"写成硬约束；一条 clip 只有一个直线运动，且运动方向必须与消失点轴线重合。
  risk: 模型会自动给推轨加缓入缓出，并在人物移动时重新构图，对称立刻塌。对策是显式写 constant speed, no ease-in or ease-out, no reframing，并把对称与消失点写进关键帧而不是只写进运动提示词。
negative_prompt_adds: ["handheld shake", "camera orbit", "ease-in ease-out camera move", "reframing", "warm fill light", "shallow depth of field", "soft focus or bokeh", "text or watermark"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"12-40，极少低于 6"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "match cut"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："覆盖极简：一个构图撑完一个节拍；同一构图在段落内回来 2-3 次形成结构性重复"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"2:1，压迫最强处可到 1.5:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：冷白、灰、纯黑 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：血红、金、单一饱和色块（一个空间一个色）
- 饱和/对比：mid / mid
- 光线签名："画面内可见且对称排布的硬光阵列；短硬阴影方向互相抵消，没有一块可藏身的暗部"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：结构装置——一段乐曲覆盖整个段落，独立于画面情绪起伏
- 环境：机械与身体对立：通风、伺服、硬表面上的脚步回声、呼吸
- 对白：语速比自然慢约 30%，停顿加长，礼貌到不自然
- 静默：长镜头后 1/3 抽掉音乐，只留呼吸，直到切点
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked symmetrical frame", "constant-speed dolly-in along the vanishing axis", "constant-speed dolly-out on the same axis", "low tracking follow at 0.5-0.8m", "overhead perpendicular insert"]
- 避免：["handheld", "camera orbit", "whip pan", "any acceleration or deceleration in a move", "reframing mid-shot"]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
