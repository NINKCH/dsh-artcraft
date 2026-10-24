---
name: artcraft-lens-fellini
description: >-
  导演透镜（ArtCraft 适配版）：费德里科·费里尼导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 费德里科·费里尼导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: fellini
lens_kit_mm: [18, 25, 32]   # 18 装下整支队伍与前景穿行；25 做正面近景的漫画式透视夸张（不要用长焦修正）；32 是人群中跟移的默认焦段
camera:
  prefer: ["drifting track through a crowd at 0.4-0.8 m/s", "pan handing off from one face to the next", "frontal wide close-up with mild distortion", "crane rising over a procession", "follow that loses the subject and finds another"]
  avoid: ["locked symmetrical wide", "long-lens compression", "shallow-focus isolation", "static shot-reverse-shot", "drone-style detached flyover"]
  motion_budget: high
  height: "眼平游动为主；垂直事件时升到 2.5-4m 让人群变成图案"
shot_size_bias: ["wide of the whole procession", "frontal close-up of a single strange face", "medium tracking through bodies", "over-shoulder past a foreground passer-by", "high angle turning the crowd into a pattern"]
composition: ["figures entering continuously from both frame edges", "foreground passers-by occupying 10-30%", "reframed every 2-3 seconds, never settled", "one vertical event lifting someone above the crowd", "direct address to the lens"]
lighting:
  key_quality: mixed
  key_ratio: "4:1，阴影保留细节"
  motivation: stylized
  signature: "硬边舞台光区被常驻的雾柔化半米；人物走进走出光区，明暗切换本身是表演"
palette:
  dominant: 粉、金、酒红、天蓝
  accent: 纯白与漆黑的服装对撞
  saturation: high
  contrast: mid
editing:
  avg_shot_length_s: "6-14；结尾段拉到 15-30"
  transition_bias: ["hard cut on a musical phrase end", "match cut on a recurring image", "dissolve"]
  coverage_style: "不做正反打；一个游动镜头交接多个人物，离题镜头占段落 15-25%"
sound:
  music: 圆舞曲、进行曲、马戏团铜管——先于动作确定节拍，人物跟着音乐走路
  ambience: 允许非写实：笑声、叫卖、祈祷、海浪出现在物理上不该出现的地方
  dialogue: 互相压过、听不清，是人群的质地；重要的话在音乐间隙由一个人单独说出
  silence_use: 极少；只用在某个意象第二次回来时，留一种声音（风、海、铃）
performance:
  register: 夸张、怪诞、可笑又可怜；选角标准是"一张脸能说完一个故事"
  blocking: 主角站着不动被环绕，人群绕他运动；群众演员每人有一句话身份与一个正在做的动作
aspect_bias: "1.85:1；黑白段落可用 1.37:1"   # 9:16 交付时的构图改写见「镜头语言」末条
ai_video:
  clip_duration_s: "6-12"
  prompt_bias: 先写人群的行为清单（谁在做什么），再写摄影机；把"持续有人从画面边缘进出"写成硬要求，把音乐节拍写进动作描述（walking on the beat of a waltz）。
  risk: 模型会把人群做成对称、同步、面目模糊的背景板，怪异感消失。对策是点名 3-5 个具体人物及其各自动作与服装，并写 no two people doing the same thing、faces distinct and exaggerated。
negative_prompt_adds: ["symmetrical composition", "synchronised crowd", "blurred faceless background people", "shallow depth of field", "long-lens compression", "cold desaturated palette", "text or watermark", "empty space"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"6-14；结尾段拉到 15-30"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut on a musical phrase end", "match cut on a recurring image", "dissolve"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："不做正反打；一个游动镜头交接多个人物，离题镜头占段落 15-25%"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"4:1，阴影保留细节"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：粉、金、酒红、天蓝 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：纯白与漆黑的服装对撞
- 饱和/对比：high / mid
- 光线签名："硬边舞台光区被常驻的雾柔化半米；人物走进走出光区，明暗切换本身是表演"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：圆舞曲、进行曲、马戏团铜管——先于动作确定节拍，人物跟着音乐走路
- 环境：允许非写实：笑声、叫卖、祈祷、海浪出现在物理上不该出现的地方
- 对白：互相压过、听不清，是人群的质地；重要的话在音乐间隙由一个人单独说出
- 静默：极少；只用在某个意象第二次回来时，留一种声音（风、海、铃）
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["drifting track through a crowd at 0.4-0.8 m/s", "pan handing off from one face to the next", "frontal wide close-up with mild distortion", "crane rising over a procession", "follow that loses the subject and finds another"]
- 避免：["locked symmetrical wide", "long-lens compression", "shallow-focus isolation", "static shot-reverse-shot", "drone-style detached flyover"]
- 运动预算：high
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
