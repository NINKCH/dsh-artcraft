---
name: artcraft-lens-park_chan_wook
description: >-
  导演透镜（ArtCraft 适配版）：朴赞郁导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 朴赞郁导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: park_chan_wook
lens_kit_mm: [28, 40, 50, 85]   # 28 只给那一次不可能运动；40-50 做正面对称；85 给装饰性插入
camera:
  prefer: ["one impossible continuous move per scene (through a wall, floor, or 90-degree rotation)", "locked frontal symmetrical hold", "constant-speed lateral track along a patterned wall", "90-degree overhead of the act", "ornamental insert on hands and objects"]
  avoid: ["handheld verite", "documentary reframe", "unmotivated dutch angle", "random shake", "drone establishing shot"]
  motion_budget: high          # 高但被编排：每场恰好一次夸张运动，其余全锁定
  height: "chest height 1.4m frontal and locked; the flourish changes height mid-move"
shot_size_bias: ["frontal symmetrical medium", "wide showing the whole decorated room", "ornamental insert", "90-degree overhead", "medium close-up held one beat too long"]
composition: ["at least three distinct patterns visible per interior frame", "frontal symmetry with one deliberate off-axis element", "frame within frame through a decorated doorway", "foreground lace or foliage as a scrim", "the guilty object placed at exact frame centre"]
lighting:
  key_quality: mixed
  key_ratio: "3:1 常规；8:1 暴力发生的那一颗（靠关补光而非加硬光）"
  motivation: practical
  signature: "暖实用光以掠射角打在纹样表面，让图案浮起；冷色只从窗外进来，不超过 20% 画幅"
palette:
  dominant: "burgundy, olive green, mustard gold, walnut brown"
  accent: "blood red, jade green, ivory"
  saturation: high
  contrast: mid
editing:
  avg_shot_length_s: "3-8，含一次 40-90 秒的形式长镜"
  transition_bias: ["hard cut", "match cut on pattern or shape", "sudden 0.5s ornamental insert"]
  coverage_style: "对称正面单人 + 装饰性插入 + 每场一次炫技长镜；反打保持完全相同构图"
sound:
  music: "室内乐或圆舞曲端正演奏，与内容落差即反讽；无 stinger，无低频轰击"
  ambience: "被放大的精确拟音：织物、瓷器、剪刀、钥匙、指甲刮木头"
  dialogue: "过度礼貌、书面、称谓完整；威胁用敬语说出"
  silence_use: "暴力前 1-2 秒把音乐与环境声一起切掉，再一次性推回"
performance:
  register: "得体的表情比情境允许的多维持 1-2 秒才变；'晚一拍'是表演签名"
  blocking: "端坐对称、手有明确位置；站起来是重大事件，一场最多一次"
aspect_bias: "2.39:1 / 1.85:1"
ai_video:
  clip_duration_s: "4-8"
  prompt_bias: "点名画面里三种具体图案，然后把摄影机运动写成起点—路径—终点三段式的确定路径（下降、后退、旋转各写出量）；人物只做一个礼节性动作。"
  risk: "高密度花纹会让模型产生摩尔纹、墙纸蠕动和图案漂移。缓解：把花纹烘进关键帧、选用大尺度母题（最小重复单元 ≥ 1/40 画幅高）；除那一次编排好的运动外，其余镜头的运动限制在单轴且慢。"
negative_prompt_adds: ["handheld shake", "flat grey walls", "empty minimalist set", "moire", "tiny repeating micro-pattern", "gore splatter", "lens flare", "modern office lighting"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"3-8，含一次 40-90 秒的形式长镜"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "match cut on pattern or shape", "sudden 0.5s ornamental insert"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："对称正面单人 + 装饰性插入 + 每场一次炫技长镜；反打保持完全相同构图"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"3:1 常规；8:1 暴力发生的那一颗（靠关补光而非加硬光）"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："burgundy, olive green, mustard gold, walnut brown" → `mixer.{green,red,orange,aqua}.*` 定点 + `grading.*` 方向
- 点缀："blood red, jade green, ivory"
- 饱和/对比：high / mid
- 光线签名："暖实用光以掠射角打在纹样表面，让图案浮起；冷色只从窗外进来，不超过 20% 画幅"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："室内乐或圆舞曲端正演奏，与内容落差即反讽；无 stinger，无低频轰击"
- 环境："被放大的精确拟音：织物、瓷器、剪刀、钥匙、指甲刮木头"
- 对白："过度礼貌、书面、称谓完整；威胁用敬语说出"
- 静默："暴力前 1-2 秒把音乐与环境声一起切掉，再一次性推回"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["one impossible continuous move per scene (through a wall, floor, or 90-degree rotation)", "locked frontal symmetrical hold", "constant-speed lateral track along a patterned wall", "90-degree overhead of the act", "ornamental insert on hands and objects"]
- 避免：["handheld verite", "documentary reframe", "unmotivated dutch angle", "random shake", "drone establishing shot"]
- 运动预算：high
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
