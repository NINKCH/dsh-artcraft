---
name: artcraft-lens-bergman
description: >-
  导演透镜（ArtCraft 适配版）：英格玛·伯格曼导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 英格玛·伯格曼导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: bergman
lens_kit_mm: [75, 100, 150]   # 75 中近景；100/150 拍大特写，长焦不给脸任何变形借口；单脸收到 f/11-f/16 让整张脸落在景深内，双脸构图开到 f/2.8-f/4 留给变焦点
camera:
  prefer: ["locked frontal close-up on the eyeline axis", "two-face composition with one profile in foreground", "focus pull between two faces instead of a cut", "imperceptible push-in at 0.02-0.05 m/s", "hold past the emotional peak"]
  avoid: ["handheld", "shot-reverse-shot on fixed A/B setups", "camera orbit", "wide establishing of the room", "any move the audience can notice"]
  motion_budget: low   # 实际接近 none：唯一允许的运动是观众察觉不到的推进
  height: "眼平，精确对齐演员瞳孔高度；全场不变"
shot_size_bias: ["extreme close-up filling 60-80% of frame height", "two-face composition", "medium close-up at 75mm", "hands or object insert", "one wide only if the room must be established once"]
composition: ["camera on the eyeline axis, deviation under 10 degrees", "two faces overlapping at their edges, one frontal one profile", "near-black or near-white flat background", "negative space on the side the character is avoiding", "whole face inside depth of field"]
lighting:
  key_quality: hard
  key_ratio: "6:1，暗面不补光但保留轮廓"
  motivation: practical
  signature: "正侧方 90 度单光源，鼻影把脸分成两半；背景压成单色平面"
palette:
  dominant: 灰蓝、灰绿、近黑、近白
  accent: 皮肤的暖色是画面里唯一的暖
  saturation: low
  contrast: high
editing:
  avg_shot_length_s: "20-90；一场 4 分钟的戏只用 5-8 个镜头"
  transition_bias: ["hard cut", "fade"]
  coverage_style: "不做标准正反打；用画内移动与变焦点代替切换，情绪高点之后再拍 3-5 秒"
sound:
  music: 极少；只在场景之间的空白处，不与对白同时存在
  ambience: 单一持续元素（钟摆、海浪、风穿窗缝），让沉默可被计量
  dialogue: 干、近、无混响；呼吸与吞咽必须清晰可闻
  silence_use: 每场指定 2-3 处 4-8 秒沉默，并写清沉默时镜头在拍谁的脸
performance:
  register: 高度抑制；最高强度是"没有哭出来但脸正在塌"，指令写成抑制目标
  blocking: 人物在画内起身、转身、靠近窗；谁离镜头近谁在这一刻更有权力
aspect_bias: "1.37:1 / 4:3——接近方形的画幅让脸在竖向被填满；16:9 会在脸两侧留下无用空间"
ai_video:
  clip_duration_s: "8-15（在工具能稳住身份的前提下取最长）"
  prompt_bias: 一条 clip 只写一次微表情变化 + 一次呼吸事件，摄影机写成 locked 或 imperceptible push-in；显式写 the whole face stays in focus。唯一例外是双脸变焦点那一条——它要从 negative 里拿掉 shallow depth of field，改写成 focus shifts from the front face to the face behind over 1.5 seconds。20 秒以上的长镜头用同参数分段续接拼出来，接点选在动作完全静止的那一帧。
  risk: 模型会给静止的脸补上多余动作（转头、眨眼过频、微笑）并把背景虚化成柔焦氛围，抑制感立刻消失。对策是写 no head turn, blinks only once, background flat and dark, no bokeh，并把 clip 控制在一次心理变化点之内。
negative_prompt_adds: ["shallow depth of field or bokeh", "soft glamour lighting", "head turning away", "smiling", "camera movement", "warm colour grade", "background detail or props", "text or watermark"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"20-90；一场 4 分钟的戏只用 5-8 个镜头"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "fade"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："不做标准正反打；用画内移动与变焦点代替切换，情绪高点之后再拍 3-5 秒"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"6:1，暗面不补光但保留轮廓"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：灰蓝、灰绿、近黑、近白 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：皮肤的暖色是画面里唯一的暖
- 饱和/对比：low / high
- 光线签名："正侧方 90 度单光源，鼻影把脸分成两半；背景压成单色平面"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：极少；只在场景之间的空白处，不与对白同时存在
- 环境：单一持续元素（钟摆、海浪、风穿窗缝），让沉默可被计量
- 对白：干、近、无混响；呼吸与吞咽必须清晰可闻
- 静默：每场指定 2-3 处 4-8 秒沉默，并写清沉默时镜头在拍谁的脸
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked frontal close-up on the eyeline axis", "two-face composition with one profile in foreground", "focus pull between two faces instead of a cut", "imperceptible push-in at 0.02-0.05 m/s", "hold past the emotional peak"]
- 避免：["handheld", "shot-reverse-shot on fixed A/B setups", "camera orbit", "wide establishing of the room", "any move the audience can notice"]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
