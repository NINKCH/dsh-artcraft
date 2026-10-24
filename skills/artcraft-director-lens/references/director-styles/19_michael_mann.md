---
name: artcraft-lens-michael_mann
description: >-
  导演透镜（ArtCraft 适配版）：迈克尔·曼导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 迈克尔·曼导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: michael_mann
lens_kit_mm: [18, 25, 35, 50]   # 18-25 让室内也有天际线；35 做双人；50 只给流程插入（手、工具、接口）
camera:
  prefer: ["locked wide with the horizon at eye level", "loose handheld from a moving vehicle", "constant-speed lateral track along a glass wall", "static hold on a figure 30-60m away", "fast pan only inside a gunfight"]
  avoid: ["crane reveal", "orbit", "dutch angle", "slow motion", "drone hero shot"]
  motion_budget: medium
  height: "eye level 1.6m, lens axis level; dash or hood height inside vehicles"
shot_size_bias: ["wide with the standing figure 8-15% of frame height", "medium two-shot at 2-4m separation", "procedural insert on hands and equipment", "static long-lens hold at distance", "figure against glass with city reflected on the face"]
composition: ["horizon or skyline at eye level even in interiors", "figure small against a bright lit field", "glass reflection layering city over face", "large negative space on one side", "equipment dead centre in inserts"]
lighting:
  key_quality: mixed
  key_ratio: "6:1 to 10:1 at night"
  motivation: practical
  signature: "没有一盏电影灯：每个光源都有城里的名字；同一帧至少两种色温对抗；脸低于主光 1.5-2 档"
palette:
  dominant: "sodium amber, mercury blue-green, LED cyan-white, black"
  accent: "taillight red, hazard orange"
  saturation: mid
  contrast: high
editing:
  avg_shot_length_s: "3-8"
  transition_bias: ["hard cut"]
  coverage_style: "流程段每步一颗按物理顺序；对白段正反打快切；段尾给一颗 6-12 秒城市空镜"
sound:
  music: "持续电子 / 环境铺底，一首铺满整段，不做情绪点提示"
  ambience: "不间断的低频城市底噪：高速车流、空调机组、远处飞机、变压器嗡鸣"
  dialogue: "短促、技术性、只说名词和名字；一段不超过 6 句"
  silence_use: "决定发生时切掉音乐，让高速路声接管 3-5 秒"
performance:
  register: "不表演；动作准确、节省、不重复；情绪全片只出现一次且短"
  blocking: "人与人保持 2-4 米不主动接触；视线常越过对方看向远处"
aspect_bias: "2.39:1 / 1.85:1"   # 9:16 交付时画高百分比与横向距离都要改写，见「镜头语言」末条
ai_video:
  clip_duration_s: "3-6"
  prompt_bias: "点名每一个市政光源及其颜色和方位，给室内也写上窗外的天际线，让主体小而背景亮。"
  risk: "模型会'美化'夜景：抬阴影、统一白平衡、自动加雨和体积光束。缓解：显式写 mixed color temperature、左右两侧各自的光源颜色、deep black shadows with visible noise、dry pavement、no fog、no light beams。"
negative_prompt_adds: ["fog", "volumetric light beams", "rain-slick streets", "unified colour grade", "lens flare", "warm cozy lighting", "crowded background people", "slow motion"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"3-8"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："流程段每步一颗按物理顺序；对白段正反打快切；段尾给一颗 6-12 秒城市空镜"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"6:1 to 10:1 at night"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："sodium amber, mercury blue-green, LED cyan-white, black" → `mixer.{green,red,orange,aqua,blue}.*` 定点 + `grading.*` 方向
- 点缀："taillight red, hazard orange"
- 饱和/对比：mid / high
- 光线签名："没有一盏电影灯：每个光源都有城里的名字；同一帧至少两种色温对抗；脸低于主光 1.5-2 档"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："持续电子 / 环境铺底，一首铺满整段，不做情绪点提示"
- 环境："不间断的低频城市底噪：高速车流、空调机组、远处飞机、变压器嗡鸣"
- 对白："短促、技术性、只说名词和名字；一段不超过 6 句"
- 静默："决定发生时切掉音乐，让高速路声接管 3-5 秒"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked wide with the horizon at eye level", "loose handheld from a moving vehicle", "constant-speed lateral track along a glass wall", "static hold on a figure 30-60m away", "fast pan only inside a gunfight"]
- 避免：["crane reveal", "orbit", "dutch angle", "slow motion", "drone hero shot"]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
