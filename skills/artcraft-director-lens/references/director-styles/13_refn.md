---
name: artcraft-lens-refn
description: >-
  导演透镜（ArtCraft 适配版）：尼古拉斯·温丁·雷弗恩导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 尼古拉斯·温丁·雷弗恩导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: refn
lens_kit_mm: [25, 40, 75]   # 25 把房间拍成舞台，40 拍仪式中景，75 拍锁死的脸；避免长焦压缩与广角变形
camera:
  prefer: [locked frontal symmetric frame, single constant push under 5cm per second, locked face portrait held 12-25s, overhead centred on the ritual, hard cut between identical setups]
  avoid: [handheld, orbit, pan, tilt, any move that breaks symmetry]
  motion_budget: none
  height: "chest height, perpendicular to the wall, subject's centre line exactly on frame centre"
shot_size_bias: [medium frontal, close-up frontal portrait, wide frontal of the room as a stage, overhead, extreme close-up on hands]
composition: [absolute bilateral symmetry, flat frontal plane with no depth cues, subject dead centre, colour split into two hard-edged halves, large areas of pure black as material]
lighting:
  key_quality: hard
  key_ratio: "8:1 to 12:1"
  motivation: stylized
  signature: "舞台灯式硬边色块；画面里能直接看见两种颜色的分界线"
palette:
  dominant: "magenta, electric blue"
  accent: "blood red, moonlight violet, pure black"
  saturation: high
  contrast: high
editing:
  avg_shot_length_s: "10-25"
  transition_bias: [hard cut]
  coverage_style: "同机位同姿势重复 2-3 次；一场 2-5 个镜头；暴力单镜完成，前后各挂静止镜头"
sound:
  music: "合成器音墙决定段落长度，低频持续音加琶音循环，几乎不变化"
  ambience: "要么压到近乎消失，要么夸张到不自然（呼吸、织物、灯的嗡鸣），不共存"
  dialogue: "短、宣告式、无信息量，一场不超过两句"
  silence_use: "暴力前 1-2 秒完全静音，让声效独自炸开"
performance:
  register: "雕塑式克制，姿态优先于表情；直视镜头每段只用一次"
  blocking: "人物走到画面正中并停住；走位是直线，方向只有前后"
aspect_bias: "2.39:1"
ai_video:
  clip_duration_s: "8-15"
  prompt_bias: "先写颜色分界线在画面的哪个位置，再写人物姿势，最后只给一个微动作；运动预算给光，不给摄影机也不给人。"
  risk: "锁死构图加静止人物容易被模型渲染成一张死图；'霓虹'又常被理解成拥挤的赛博街景加招牌文字。缓解：明确写 the camera does not move and the subject does not walk，把唯一的运动交给光（例如 the magenta wash slowly shifts to cyan over six seconds），并在负面词里点名 signage 与 text。"
negative_prompt_adds: [street signage, on-screen text, cyberpunk crowd, rain-slick busy street, handheld shake, soft diffused fill, pastel desaturation, foreground obstruction]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"10-25"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："同机位同姿势重复 2-3 次；一场 2-5 个镜头；暴力单镜完成，前后各挂静止镜头"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"8:1 to 12:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："magenta, electric blue" → `mixer.{magenta,red,blue}.*` 定点 + `grading.*` 方向
- 点缀："blood red, moonlight violet, pure black"
- 饱和/对比：high / high
- 光线签名："舞台灯式硬边色块；画面里能直接看见两种颜色的分界线"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："合成器音墙决定段落长度，低频持续音加琶音循环，几乎不变化"
- 环境："要么压到近乎消失，要么夸张到不自然（呼吸、织物、灯的嗡鸣），不共存"
- 对白："短、宣告式、无信息量，一场不超过两句"
- 静默："暴力前 1-2 秒完全静音，让声效独自炸开"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[locked frontal symmetric frame, single constant push under 5cm per second, locked face portrait held 12-25s, overhead centred on the ritual, hard cut between identical setups]
- 避免：[handheld, orbit, pan, tilt, any move that breaks symmetry]
- 运动预算：none
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
