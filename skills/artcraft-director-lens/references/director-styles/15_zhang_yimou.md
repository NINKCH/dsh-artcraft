---
name: artcraft-lens-zhang_yimou
description: >-
  导演透镜（ArtCraft 适配版）：张艺谋导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 张艺谋导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: zhang_yimou
lens_kit_mm: [35, 50, 85, 135]   # 35 做院落单点对称；85-135 把重复单元压成平面图案；24mm 以下会破坏等距
camera:
  prefer: ["locked symmetrical wide", "constant-speed lateral track parallel to a rank", "slow push-in on the one figure breaking the pattern", "rise from eye level to 90-degree overhead", "locked overhead top-down of the grid"]
  avoid: ["handheld shake", "orbit", "whip pan", "dutch angle", "unmotivated reframe"]
  motion_budget: medium        # 恒速无加减速；横移 0.3-0.5 m/s，缓推 8 秒 1.5 米
  height: "eye level 1.6m locked, or 90-degree overhead; 中间高度不用"
shot_size_bias: ["extreme wide with the color field", "wide symmetrical", "overhead pattern shot", "medium close-up of the single break", "insert on the colored material"]
composition: ["single-hue field filling 60-80% of frame", "grid of repeating units with one break", "one-point perspective through a courtyard or gallery", "overhead figures as graphic points", "one saturated accent against skin and black hair"]
lighting:
  key_quality: hard
  key_ratio: "3:1 外景日光；6:1-8:1 灯笼阵夜内景"
  motivation: stylized
  signature: "颜色来自材料而非滤色片；硬光让织纹与颗粒可见，阴影里保留色相"
palette:
  dominant: "one hue per movement — red, ochre yellow, jade green, or ink blue"
  accent: "skin tone, black hair, one patch of pure white or pure black"
  saturation: high
  contrast: mid
editing:
  avg_shot_length_s: "4-10 仪式段；3-6 冲突段"
  transition_bias: ["hard cut", "match cut on pattern", "dissolve"]
  coverage_style: "一场 4-8 个镜头；全景与顶俯为主，特写只给破格的人或物"
sound:
  music: "打击乐定拍，单件民乐器只在破格时进入"
  ambience: "材料的声音——布抖、谷落、木轴、整齐落地的脚步"
  dialogue: "少而宣告式；群体人声当音效用，音量高于对白"
  silence_use: "换色前 1-2 秒近乎全静音，只留一个环境元素"
performance:
  register: "外化、可在全景中读出；姿态与屏息大于表情"
  blocking: "全员同拍同角度的网格队形；主角全段只破格 1-2 次"
aspect_bias: "2.39:1 / 1.85:1"   # 横向排布队列；顶俯图形镜头允许切到更方的比例；9:16 交付时的构图改写见「镜头语言」末条
ai_video:
  clip_duration_s: "3-6"
  prompt_bias: "先写颜色和承载它的材料，再写队列的行列数与统一动作，最后写那唯一一个不同步的人；每条 clip 只做一个恒速运动。"
  risk: "远景人群会糊成多肢体、脸部融化的一团。缓解：让人群背对或戴统一头饰、把人群放在中景以外并只保留 2-3 排、把破格者单独生成一条再剪在一起。"
negative_prompt_adds: ["desaturated palette", "mixed color temperatures in one frame", "neon signage", "handheld shake", "lens flare", "zippers or printed logos", "asymmetric crop", "shallow depth of field"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"4-10 仪式段；3-6 冲突段"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "match cut on pattern", "dissolve"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："一场 4-8 个镜头；全景与顶俯为主，特写只给破格的人或物"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"3:1 外景日光；6:1-8:1 灯笼阵夜内景"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："one hue per movement — red, ochre yellow, jade green, or ink blue" → `mixer.{green,red,aqua,blue,yellow}.*` 定点 + `grading.*` 方向
- 点缀："skin tone, black hair, one patch of pure white or pure black"
- 饱和/对比：high / mid
- 光线签名："颜色来自材料而非滤色片；硬光让织纹与颗粒可见，阴影里保留色相"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："打击乐定拍，单件民乐器只在破格时进入"
- 环境："材料的声音——布抖、谷落、木轴、整齐落地的脚步"
- 对白："少而宣告式；群体人声当音效用，音量高于对白"
- 静默："换色前 1-2 秒近乎全静音，只留一个环境元素"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked symmetrical wide", "constant-speed lateral track parallel to a rank", "slow push-in on the one figure breaking the pattern", "rise from eye level to 90-degree overhead", "locked overhead top-down of the grid"]
- 避免：["handheld shake", "orbit", "whip pan", "dutch angle", "unmotivated reframe"]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
