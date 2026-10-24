---
name: artcraft-lens-villeneuve
description: >-
  导演透镜（ArtCraft 适配版）：丹尼斯·维伦纽瓦导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 丹尼斯·维伦纽瓦导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: villeneuve
lens_kit_mm: [21, 40, 75]   # 21 给纪念碑尺度，40 给程序化中景，75 压缩疲惫的脸；不用超广也不用超长
camera:
  prefer: [locked wide, constant-speed lateral track, constant-speed push toward vanishing point, high overhead, slow tilt up a structure]
  avoid: [handheld, orbit, whip pan, speed ramp, crash zoom]
  motion_budget: low          # 有移动但恒速无表情，像在丈量空间
  height: "eye level or extreme overhead; nothing in between"
shot_size_bias: [extreme wide, wide, overhead, medium close-up, close-up]
composition: [center symmetry, single strong horizon at one-eighth or seven-eighths height, human at 5-15 percent of frame height, silhouette against a lit plane, negative space as the subject]
lighting:
  key_quality: soft
  key_ratio: "5:1 to 8:1"     # 逆光面对正面补光，不是常规主光对补光
  motivation: naturalistic
  signature: "整面墙或整片天当光源的逆光；人物半剪影，无硬边阴影"
palette:
  dominant: "one hue per sequence: ochre sand, teal fog, copper interior, ink green, grey-white ice"
  accent: "a single small warm point, usually a lamp or a fire"
  saturation: low
  contrast: mid
editing:
  avg_shot_length_s: "8-18"
  transition_bias: [hard cut, fade, dissolve]
  coverage_style: "一场 3-9 个镜头；人物进画前留 2 秒，出画后留 3 秒；事件后必给余波镜头"
sound:
  music: "40-80Hz 轰鸣、持续合成音、共振铜管；无旋律记忆点，只有质地与压强"
  ambience: "分层的风、沙粒打在织物上、呼吸、远处金属应力"
  dialogue: "被环境声压低，关键台词只说一次，'听不清'是主题的一部分"
  silence_use: "全段 20-40% 的时长无音乐；低频比画面早进 2-4 秒"
performance:
  register: "内敛专业疲惫，情绪靠呼吸与姿态的微小塌陷"
  blocking: "人物穿过巨大空间，方向单一，速度恒定；停下来的那一次就是转折"
aspect_bias: "2.39:1"        # 宽画幅强化水平线与横向丈量；9:16 交付时的构图改写见「镜头语言」末条
ai_video:
  clip_duration_s: "8-15"     # 越长越好；给模型时间把雾的层次渲染出来
  prompt_bias: "先写几何体与材料，再写雾从第几米开始，最后才写人；人的描述不超过一句，且必须给出他占画面高度的比例。"
  risk: "模型把'宏大'渲染成拥挤的赛博城市，或把雾渲染成整体模糊。缓解：负面词点名 neon 与 holographic；把雾写成 depth gradient（近处清晰、30 米外淡 2-3 档），并给一个已知尺寸的参照物。"
negative_prompt_adds: [holographic interface, neon signage, cluttered cyberpunk street, hard-edged shadows, handheld shake, split warm-cool grade, busy background detail, visible lens flare]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"8-18"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut, fade, dissolve]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："一场 3-9 个镜头；人物进画前留 2 秒，出画后留 3 秒；事件后必给余波镜头"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"5:1 to 8:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："one hue per sequence: ochre sand, teal fog, copper interior, ink green, grey-white ice" → `mixer.{green,aqua}.*` 定点 + `grading.*` 方向
- 点缀："a single small warm point, usually a lamp or a fire"
- 饱和/对比：low / mid
- 光线签名："整面墙或整片天当光源的逆光；人物半剪影，无硬边阴影"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："40-80Hz 轰鸣、持续合成音、共振铜管；无旋律记忆点，只有质地与压强"
- 环境："分层的风、沙粒打在织物上、呼吸、远处金属应力"
- 对白："被环境声压低，关键台词只说一次，'听不清'是主题的一部分"
- 静默："全段 20-40% 的时长无音乐；低频比画面早进 2-4 秒"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[locked wide, constant-speed lateral track, constant-speed push toward vanishing point, high overhead, slow tilt up a structure]
- 避免：[handheld, orbit, whip pan, speed ramp, crash zoom]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
