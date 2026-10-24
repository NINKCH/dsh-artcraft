---
name: artcraft-lens-scorsese
description: >-
  导演透镜（ArtCraft 适配版）：马丁·斯科塞斯导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 马丁·斯科塞斯导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: scorsese
lens_kit_mm: [18, 27, 40, 75]   # 18/27 撑稳定器长镜头，让背景始终贴着人物；40 拍自辩的中近景；75 是急推的落点——急推由一支约 27-75mm 的变焦头在 0.5-1 秒内推完，机位不动
camera:
  prefer: ["steadicam long take entering a space", "dolly-in that accelerates then stops hard", "snap zoom on a face", "lateral tracking along a bar or table", "locked frontal when the character addresses the lens"]
  avoid: ["unmotivated handheld shake", "drifting float with no endpoint", "slow drone-like flyover", "symmetrical locked wide", "static coverage of a moving scene"]
  motion_budget: high
  height: "眼平；入场长镜头维持 1.5-1.6m 恒定，暴力节拍可掉到腰高"
shot_size_bias: ["steadicam medium tracking", "close-up on excitement or shame", "wide of the room as a social map", "insert of money/hands/glass", "frontal medium for direct address"]
composition: ["subject centred with the world streaming past behind", "layered background of people who all have business", "practical light source burning in frame", "over-shoulder into a room the character is not yet allowed in", "frontal symmetrical only for direct address"]
lighting:
  key_quality: hard
  key_ratio: "5:1，方向混乱（多个实用光源互相打架）"
  motivation: practical
  signature: "入画且允许过曝的霓虹与灯罩，常驻烟雾让每个光源都有可见光锥"
palette:
  dominant: 酒吧红、后厨绿、钠黄街灯、包厢金
  accent: 白炽过曝的高光点、单一冷蓝（警灯或电视）
  saturation: high
  contrast: high
editing:
  avg_shot_length_s: "1.5-3 音乐蒙太奇；8-15 崩塌段（无音乐）"
  transition_bias: ["hard cut on the downbeat", "jump cut", "freeze frame", "whip pan"]
  coverage_style: "长镜头承担入场，碎切承担上升；同一空间在上升与坠落时用相同机位、不同节奏拍两次"
sound:
  music: 场景内可见来源的流行歌（点唱机、车载电台、楼上派对），可被人物关掉；关掉即转折
  ambience: 三层都市噪音——低频车流、中频人声餐具、高频笑声玻璃警笛
  dialogue: 重叠、打断、语速快；群戏只需听清一条线，其余是能量
  silence_use: 崩塌段完全无音乐，只留房间底噪，持续 15 秒以上
performance:
  register: 魅力与危险并存；演"我在解释"，不许演"我知道我错了"
  blocking: 人物不断向房间更深处移动；被排除时用一道门或一群背影挡住他
aspect_bias: "1.85:1 / 16:9"
ai_video:
  clip_duration_s: "2-4 蒙太奇碎片；8-12 入场长镜头"
  prompt_bias: 把摄影机运动写成有终点的句子（"tracks with him until he stops at the bar, then holds"），不要写"camera moves through the scene"。速度曲线必须显式：slow start, faster middle, hard stop。
  risk: 模型把"跟拍"做成无止境的漂移，人物与背景脱节，能量变成眩晕。对策是每条 clip 指定一个停止点与停止时的构图，并把背景人物写成"各自有事在做"而不是"人群"。
negative_prompt_adds: ["handheld jitter", "aimless floating camera", "slow motion", "empty background", "clean even lighting", "modern smartphone screens", "text or watermark", "symmetrical composition"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"1.5-3 音乐蒙太奇；8-15 崩塌段（无音乐）"s**（montage / 快切（1.2–2.5s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut on the downbeat", "jump cut", "freeze frame", "whip pan"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："长镜头承担入场，碎切承担上升；同一空间在上升与坠落时用相同机位、不同节奏拍两次"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"5:1，方向混乱（多个实用光源互相打架）"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：酒吧红、后厨绿、钠黄街灯、包厢金 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：白炽过曝的高光点、单一冷蓝（警灯或电视）
- 饱和/对比：high / high
- 光线签名："入画且允许过曝的霓虹与灯罩，常驻烟雾让每个光源都有可见光锥"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：场景内可见来源的流行歌（点唱机、车载电台、楼上派对），可被人物关掉；关掉即转折
- 环境：三层都市噪音——低频车流、中频人声餐具、高频笑声玻璃警笛
- 对白：重叠、打断、语速快；群戏只需听清一条线，其余是能量
- 静默：崩塌段完全无音乐，只留房间底噪，持续 15 秒以上
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["steadicam long take entering a space", "dolly-in that accelerates then stops hard", "snap zoom on a face", "lateral tracking along a bar or table", "locked frontal when the character addresses the lens"]
- 避免：["unmotivated handheld shake", "drifting float with no endpoint", "slow drone-like flyover", "symmetrical locked wide", "static coverage of a moving scene"]
- 运动预算：high
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
