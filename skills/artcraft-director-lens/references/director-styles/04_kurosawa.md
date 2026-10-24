---
name: artcraft-lens-kurosawa
description: >-
  导演透镜（ArtCraft 适配版）：黑泽明导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 黑泽明导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: kurosawa
lens_kit_mm: [50, 100, 250]   # 50 交代空间关系；100 拍身体与阵型；250 把人群压成一堵墙，并让正面冲来的人几乎看不出在推进
camera:
  prefer: ["lateral tracking across a formation", "long-lens locked hold on the waiting group", "pan sweeping the line", "single decisive push down the depth axis", "multi-camera simultaneous coverage at 50/100/250mm"]
  avoid: ["camera orbit", "handheld shake as default", "crash zoom", "slow-motion hero move", "close following in tight spaces"]
  motion_budget: medium
  height: "眼平或略低；泥地段落降到 0.6-0.9m 让泥水进入前景"
shot_size_bias: ["extreme wide with figures under 1/6 frame height", "long-lens compressed group band", "close-up on a wet exhausted face", "insert of feet in mud", "medium of the body in stance"]
composition: ["lateral bands stacked by long-lens compression", "triangular or wedge formation pointing at the conflict", "high ground versus low ground as class information", "weather layer between camera and subject", "figure isolated against an open sky or field"]
lighting:
  key_quality: hard
  key_ratio: "6:1 或更高"
  motivation: naturalistic
  signature: "逆光让雨丝、尘埃与呼出的白气变成亮线；去色后画面仍靠明暗分区成立"
palette:
  dominant: 土黄、泥褐、湿布墨黑、雨天灰白
  accent: 正红、靛蓝、旗帜金——贴在织物与盔甲上，不打在空气里
  saturation: mid
  contrast: high
editing:
  avg_shot_length_s: "8-20 等待段；2-5 战斗段"
  transition_bias: ["hard cut", "wipe", "match cut"]
  coverage_style: "多机位同拍同一动作，剪辑在焦段压缩度之间切换而非在角度之间切换；屏幕运动方向全段不变"
sound:
  music: 打击乐与管乐的重复动机，在集体行动开始的那一刻进入
  ambience: 自然声承担叙事——暴雨掩盖脚步、风吹散号令、泥水声标记体力耗尽
  dialogue: 号令短促可被风削弱；重要信息用身体动作复述一次
  silence_use: 决战结束后音乐先停，只剩雨或风，持续 5 秒以上再切场
performance:
  register: 高度身体化，允许大幅度戏剧能量；疲惫（湿透、发抖、喘）是主要表演材料
  blocking: 阵型有顶点且顶点指向冲突方向；高地与泥地的分配就是阶级分配
aspect_bias: "2.35:1（横向运动与群像）；单人段落可用 1.37:1"   # 9:16 交付时的构图改写见「镜头语言」末条
ai_video:
  clip_duration_s: "3-6 战斗；6-10 等待"
  prompt_bias: 先写天气对身体的作用（湿透的布、被吹动的头发、泥中的脚），再写动作；镜头运动只写"横移"或"锁定"，不要写复合运动。
  risk: 模型会把雨做成一层不影响人物的粒子，人物依然干燥挺拔，史诗感立刻塌成壁纸。对策是在提示词里点名织物状态（soaked cloth clinging to the back）与步态改变（feet sinking, gait heavy），并把湿度写进关键帧而不是只写进视频提示词。
negative_prompt_adds: ["dry clothing in rain", "clean faces", "slow motion", "camera orbit", "shallow depth of field", "zippers or nylon", "text or watermark", "flat frontal fill light"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"8-20 等待段；2-5 战斗段"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "wipe", "match cut"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："多机位同拍同一动作，剪辑在焦段压缩度之间切换而非在角度之间切换；屏幕运动方向全段不变"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"6:1 或更高"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色：土黄、泥褐、湿布墨黑、雨天灰白 → `mixer.{}.*` 定点 + `grading.*` 方向
- 点缀：正红、靛蓝、旗帜金——贴在织物与盔甲上，不打在空气里
- 饱和/对比：mid / high
- 光线签名："逆光让雨丝、尘埃与呼出的白气变成亮线；去色后画面仍靠明暗分区成立"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐：打击乐与管乐的重复动机，在集体行动开始的那一刻进入
- 环境：自然声承担叙事——暴雨掩盖脚步、风吹散号令、泥水声标记体力耗尽
- 对白：号令短促可被风削弱；重要信息用身体动作复述一次
- 静默：决战结束后音乐先停，只剩雨或风，持续 5 秒以上再切场
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["lateral tracking across a formation", "long-lens locked hold on the waiting group", "pan sweeping the line", "single decisive push down the depth axis", "multi-camera simultaneous coverage at 50/100/250mm"]
- 避免：["camera orbit", "handheld shake as default", "crash zoom", "slow-motion hero move", "close following in tight spaces"]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
