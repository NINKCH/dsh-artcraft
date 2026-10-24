---
name: artcraft-lens-wong_kar_wai
description: >-
  导演透镜（ArtCraft 适配版）：王家卫导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 王家卫导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: wong_kar_wai
lens_kit_mm: [18, 25, 85]   # 广角贴身拍变形的亲密，85mm 隔街压缩人流；中焦段刻意回避
camera:
  prefer: [small-amplitude handheld, step-print slow motion, reframe-in-shot, shoot through foreground obstruction, low-angle from a corner]
  avoid: [locked tripod, symmetric center framing, smooth gimbal glide, drone, full clean wide]
  motion_budget: medium       # 频率高、幅度小：几乎每秒都在微调，但整镜位移 < 1 米。写提示词时给的是"重新构图"，不是"运动"
  height: "chest to shoulder, often from a corner or across an obstruction, rarely level with the eyes"
shot_size_bias: [medium close-up, close-up of hands and objects, obstructed medium, over-shoulder, extreme close-up]
composition: [foreground obstruction in every frame, subject pushed to frame edge, frame within frame via door or window, mirror or glass reflection, head cropped at top]
lighting:
  key_quality: hard
  key_ratio: "6:1 to 10:1"
  motivation: practical
  signature: "裸灯泡与招牌直射给硬边和高光比，霓虹管只负责染色勾边；空气里有烟和水汽，光柱可见"
palette:
  dominant: "neon green, deep red, tungsten amber"
  accent: "magenta, jade, gold"
  saturation: high
  contrast: high
editing:
  avg_shot_length_s: "1.5-4"   # 每段允许一个 6-12 秒的慢动作长挂
  transition_bias: [hard cut, jump cut, whip pan, dissolve]
  coverage_style: "同一动作跳接三次，位置微移；关键进展留在两个镜头之间"
sound:
  music: "一首歌即一个主题，全片出现 2-3 次，每次对应关系的一次退步"
  ambience: "雨、电话铃、收音机、餐馆碗碟、楼下摩托、隔壁电视"
  dialogue: "短、跳跃、答非所问；被环境声盖掉一半是可接受的"
  silence_use: "极少完全静默；用歌声顶替静默，让人物在音乐里失语"
performance:
  register: "克制迷人，台词与意图错开一层，不说真正的需求"
  blocking: "两人同框不得正对；一个背对或隔玻璃，距离以厘米计量"
aspect_bias: "1.85:1"        # 窄边框加强前景遮挡的压迫；9:16 竖幅同样成立
ai_video:
  clip_duration_s: "4-8"      # 短，靠碎片累积；慢动作段落单独出一条
  prompt_bias: "先写前景挡什么，再写霓虹的两种颜色，最后才写人做什么；动作只留一个，且必须是'收回'而不是'伸出'。"
  risk: "模型把手持理解成整体抖动，把慢动作理解成平滑插帧的升格。缓解：写 'small handheld reframing, not shake'；步进印片要同时点名两件事——'long-shutter trails behind the moving hand' 和 'repeated-frame stutter, not smooth slow motion'，只写其一都拿不到；再锁死一个静止的前景遮挡物做位移参照。"
negative_prompt_adds: [locked tripod stillness, symmetric center framing, even soft fill, desaturated palette, clean empty space, smooth gimbal glide, full frontal face, clear unobstructed view]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"1.5-4"s**（tightening / 紧凑对话（3–6s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut, jump cut, whip pan, dissolve]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："同一动作跳接三次，位置微移；关键进展留在两个镜头之间"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"6:1 to 10:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："neon green, deep red, tungsten amber" → `mixer.{green,magenta,red,orange,aqua}.*` 定点 + `grading.*` 方向
- 点缀："magenta, jade, gold"
- 饱和/对比：high / high
- 光线签名："裸灯泡与招牌直射给硬边和高光比，霓虹管只负责染色勾边；空气里有烟和水汽，光柱可见"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："一首歌即一个主题，全片出现 2-3 次，每次对应关系的一次退步"
- 环境："雨、电话铃、收音机、餐馆碗碟、楼下摩托、隔壁电视"
- 对白："短、跳跃、答非所问；被环境声盖掉一半是可接受的"
- 静默："极少完全静默；用歌声顶替静默，让人物在音乐里失语"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[small-amplitude handheld, step-print slow motion, reframe-in-shot, shoot through foreground obstruction, low-angle from a corner]
- 避免：[locked tripod, symmetric center framing, smooth gimbal glide, drone, full clean wide]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
