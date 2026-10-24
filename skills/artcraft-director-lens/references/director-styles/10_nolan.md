---
name: artcraft-lens-nolan
description: >-
  导演透镜（ArtCraft 适配版）：克里斯托弗·诺兰导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 克里斯托弗·诺兰导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: nolan
lens_kit_mm: [14, 21, 35, 50]   # 广角为主：14-21 给尺度，21 贴到 60-90cm 给物理重量，50 是长焦上限
camera:
  prefer: [controlled handheld follow, wide tracking alongside action, slow push-in on a mechanism, crane up to reveal scale, locked insert on an instrument]
  avoid: [orbit for its own sake, whip pan, slow motion for beauty, dreamy diffusion, drone flythrough]
  motion_budget: high         # 镜头几乎总在移动，但移动是"跟上"，不是表演
  height: "eye level, camera close to the body, occasionally low to give machinery mass"
shot_size_bias: [medium close-up, wide tracking, extreme wide for scale, mechanism insert, over-shoulder]
composition: [figure against oversized real structure, horizon low to give sky weight, mechanism readable in frame, two timelines matched by shape, foreground hardware giving depth]
lighting:
  key_quality: mixed
  key_ratio: "3:1 to 4:1"
  motivation: naturalistic
  signature: "真实天光加可见的工作灯；夜景只有钠灯暖橙一个暖点"
palette:
  dominant: "concrete grey, steel blue, black, canvas khaki"
  accent: "sodium amber, warning red"
  saturation: low
  contrast: mid
editing:
  avg_shot_length_s: "2-5"
  transition_bias: [hard cut, match cut, cut on sound]
  coverage_style: "交叉剪辑为结构；轮转周期从 12 秒收紧到 3 秒，每次切线带走一个新信息"
sound:
  music: "持续低频脉冲与无解决的上升音型，功能是报时而非煽情"
  ambience: "金属应力、气压、低频冲击、按空间尺寸变化的混响"
  dialogue: "规则说明必须在动作压力下说出，禁止坐下来解释"
  silence_use: "只在归零前一拍使用，长度 0.5-1.5 秒，用来放大下一次冲击"
performance:
  register: "理性克制，情绪藏在选择里；崩溃上限是一次呼吸失控"
  blocking: "人物永远在执行一件有时限的任务，走位由机制而非情绪决定"
aspect_bias: "1.90:1 / 2.20:1"   # 比 2.39:1 高的画幅：同样的画面宽度下多出的纵向余量留给天空和头顶，尺度靠竖向撑起来
ai_video:
  clip_duration_s: "3-6"       # 每条线单独生成，交叉在剪辑台完成，不要求模型在一条 clip 里切线
  prompt_bias: "一条 clip 只讲一个机制事实：一个动作、一个镜头运动、一个可见的计时器变化。把'尺度'翻译成具体材料与尺寸，不要写'宏大'。"
  risk: "模型把'高概念'渲染成发光全息与赛博界面，并把交叉剪辑压成一镜。缓解：负面词里点名 holographic UI 与 neon；三条线各出一条 clip，用同一组材料词、同一色温、同一颗粒描述锁一致性。"
negative_prompt_adds: [glowing holographic interface, floating blue data, neon signage, obvious CGI sheen, slow motion, dreamy diffusion, saturated color grade, lens flare]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"2-5"s**（tightening / 紧凑对话（3–6s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut, match cut, cut on sound]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："交叉剪辑为结构；轮转周期从 12 秒收紧到 3 秒，每次切线带走一个新信息"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"3:1 to 4:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："concrete grey, steel blue, black, canvas khaki" → `mixer.{red,orange,blue}.*` 定点 + `grading.*` 方向
- 点缀："sodium amber, warning red"
- 饱和/对比：low / mid
- 光线签名："真实天光加可见的工作灯；夜景只有钠灯暖橙一个暖点"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："持续低频脉冲与无解决的上升音型，功能是报时而非煽情"
- 环境："金属应力、气压、低频冲击、按空间尺寸变化的混响"
- 对白："规则说明必须在动作压力下说出，禁止坐下来解释"
- 静默："只在归零前一拍使用，长度 0.5-1.5 秒，用来放大下一次冲击"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[controlled handheld follow, wide tracking alongside action, slow push-in on a mechanism, crane up to reveal scale, locked insert on an instrument]
- 避免：[orbit for its own sake, whip pan, slow motion for beauty, dreamy diffusion, drone flythrough]
- 运动预算：high
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
