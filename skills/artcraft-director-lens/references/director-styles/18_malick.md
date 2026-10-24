---
name: artcraft-lens-malick
description: >-
  导演透镜（ArtCraft 适配版）：泰伦斯·马力克导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 泰伦斯·马力克导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: malick
lens_kit_mm: [14, 21, 28, 35]   # 广角必须配贴近：拍手 30-50cm，拍脸 60-90cm；前景巨大而地平线在后
camera:
  prefer: ["drifting handheld just behind a shoulder at walking pace", "low sweep up past a body toward sky or canopy", "slow arc while walking around a figure", "sudden tilt away from a face to a hand, grass, or water", "floating rise at gait rhythm"]
  avoid: ["locked tripod hold", "symmetrical frontal composition", "zoom", "whip pan", "drone hero shot"]
  motion_budget: high          # 持续但慢：0.8-1.2 m/s，低频，无急停急起
  height: "continuously variable 0.3-1.8m, never settles"
shot_size_bias: ["close insert on hands and objects", "medium close following just off a shoulder", "wide with a figure small against sky", "low angle through grass or foliage", "back-of-head follow"]
composition: ["huge foreground element with the horizon behind it", "sun in frame behind the subject", "figure entering or leaving frame constantly", "no symmetry, no centred subject", "sky occupying the upper half"]
lighting:
  key_quality: soft
  key_ratio: "2:1 to 3:1"
  motivation: naturalistic
  signature: "太阳在人物后方、高度 2-10 度，直射进广角镜头；脸只靠天光和地面反射抬起来，不打灯"
palette:
  dominant: "grass green, wheat gold, sky blue-white, skin"
  accent: "low-sun amber, deep shadow blue"
  saturation: mid
  contrast: low
editing:
  avg_shot_length_s: "2-5，每 60-90 秒给一颗 6-10 秒不切的呼吸镜头"
  transition_bias: ["hard cut", "dissolve on light", "cut away mid-gesture"]
  coverage_style: "不做覆盖率：同一情境连拍 5-10 分钟不停机，在素材里找顺序"
sound:
  music: "古典 / 合唱 / 极简弦乐成段铺陈，不按情绪点入场；最重的手势处突然抽掉 2-4 秒"
  ambience: "风穿过草、虫鸣、水、远处的鸟、衣料摩擦、土上的脚步"
  dialogue: "重叠、轻声、常被风盖住，一半听不清；重要的话交给旁白"
  silence_use: "极少真静音；用音乐抽掉来代替静音"
performance:
  register: "不给情绪指令，给情境与一个物理任务，然后长时间拍"
  blocking: "并肩走、绕圈、一前一后；很少静止面对彼此，对峙用背影和距离表达"
aspect_bias: "2.39:1 / 1.85:1"
ai_video:
  clip_duration_s: "3-5"
  prompt_bias: "一条 clip 只装一个手势、一个持续漂移的运动、一个在动的自然元素；永远不装情节动作。"
  risk: "模型会把 handheld 做成抖动、把 magic hour 做成橙色滤镜。缓解：把漂移写成一条路径（'像被一个走路的人抱着，缓慢向右并略微上升'），把光写成物理事实（'太阳刚在地平线上方、在她身后，直射进镜头；她的脸只被天空照亮'）。"
negative_prompt_adds: ["locked tripod", "symmetrical composition", "orange colour-grade filter", "hard shadows", "studio lighting", "camera jitter", "slow motion", "drone shot"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"2-5，每 60-90 秒给一颗 6-10 秒不切的呼吸镜头"s**（tightening / 紧凑对话（3–6s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "dissolve on light", "cut away mid-gesture"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："不做覆盖率：同一情境连拍 5-10 分钟不停机，在素材里找顺序"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"2:1 to 3:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："grass green, wheat gold, sky blue-white, skin" → `mixer.{green,orange,blue}.*` 定点 + `grading.*` 方向
- 点缀："low-sun amber, deep shadow blue"
- 饱和/对比：mid / low
- 光线签名："太阳在人物后方、高度 2-10 度，直射进广角镜头；脸只靠天光和地面反射抬起来，不打灯"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："古典 / 合唱 / 极简弦乐成段铺陈，不按情绪点入场；最重的手势处突然抽掉 2-4 秒"
- 环境："风穿过草、虫鸣、水、远处的鸟、衣料摩擦、土上的脚步"
- 对白："重叠、轻声、常被风盖住，一半听不清；重要的话交给旁白"
- 静默："极少真静音；用音乐抽掉来代替静音"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["drifting handheld just behind a shoulder at walking pace", "low sweep up past a body toward sky or canopy", "slow arc while walking around a figure", "sudden tilt away from a face to a hand, grass, or water", "floating rise at gait rhythm"]
- 避免：["locked tripod hold", "symmetrical frontal composition", "zoom", "whip pan", "drone hero shot"]
- 运动预算：high
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
