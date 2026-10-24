---
name: artcraft-lens-coen_brothers
description: >-
  导演透镜（ArtCraft 适配版）：科恩兄弟导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 科恩兄弟导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: coen_brothers
lens_kit_mm: [14, 21, 27, 40]   # 14-21 低机位运动与怪诞近景；27 冷面正面对称；40 全片唯一一次不开玩笑的单人
camera:
  prefer: ["low-mounted wide dolly running ahead of or behind a walking subject", "dead-frontal locked symmetrical hold", "fast push-in on an object", "90-degree overhead of a mess being cleaned up", "snap pan between two square-on people"]
  avoid: ["drifting handheld", "orbit", "shallow-focus beauty shot", "slow motion", "crane release"]
  motion_budget: medium        # 二元：要么完全锁定，要么一次恒速直线机械运动；没有微调构图
  height: "0.4-0.6m tilted up 10-15 degrees for the running moves; dead-frontal eye level 1.6m, axis level, for the deadpan holds"
shot_size_bias: ["dead-frontal medium", "wide with subject centred in a flat landscape or wall", "low-angle wide with ceiling and floor both in frame", "extreme close-up as punctuation", "90-degree overhead insert"]
composition: ["subject dead centre with a door, window or sign behind the head like a halo", "wide-angle with both ceiling and floor visible", "the object of value at exact frame centre", "flat institutional wall as backdrop", "two people square-on at social distance, neither adjusting"]
lighting:
  key_quality: hard
  key_ratio: "3:1 室内；8:1 夜外景"
  motivation: practical
  signature: "难看的顶光——荧光管、裸灯泡、雪地反光——在每个人眼窝里留下阴影，让称职的人显得愚蠢"
palette:
  dominant: "institutional beige, motel brown, snow white, fluorescent green-white"
  accent: "blood red, mustard yellow, police blue"
  saturation: mid
  contrast: mid
editing:
  avg_shot_length_s: "4-9，每颗对话镜头的出点后拖 0.5-1.5 秒"
  transition_bias: ["hard cut", "hard cut across a violent size jump (wide to extreme close-up)"]
  coverage_style: "正面单人 + 一颗主镜；反应镜头被刻意克扣，只在最不该给时给一次"
sound:
  music: "稀少；只允许地域性源音乐，或一段完全不匹配的庄严曲子端正演奏。禁止喜剧音效与 stinger"
  ambience: "地域具体：平地上的风、某台特定机器、某种鸟、踩雪声、荧光镇流器嗡鸣"
  dialogue: "慢、过分客气、口音明确；把对方的话原样复述一遍再回答"
  silence_use: "问题之后 2-3 秒死寂，环境声不减，谁都不动——主要喜剧乐器"
performance:
  register: "绝对认真；人物不知道自己在喜剧里。表情中性，唯一破绽是眨眼变快"
  blocking: "两人正对面方形站位，社交距离，谁都不调整姿势，尴尬完整保留"
aspect_bias: "1.85:1 / 2.39:1"
ai_video:
  clip_duration_s: "3-6"
  prompt_bias: "先建一个正面对称的死中构图，给主体一个过度认真的小动作，然后让摄影机要么完全不动，要么走一条直线。"
  risk: "模型会自作主张'把喜剧演出来'：夸张表情、耸肩、假笑，结果全是挤眉弄眼。缓解：显式写 expression completely neutral, no smile, no eyebrow movement，把笑点交给几何、物件和时长。"
negative_prompt_adds: ["smiling", "exaggerated expression", "comic reaction face", "handheld shake", "shallow depth of field", "warm romantic light", "slow motion", "dynamic action pose"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"4-9，每颗对话镜头的出点后拖 0.5-1.5 秒"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "hard cut across a violent size jump (wide to extreme close-up)"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："正面单人 + 一颗主镜；反应镜头被刻意克扣，只在最不该给时给一次"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"3:1 室内；8:1 夜外景"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："institutional beige, motel brown, snow white, fluorescent green-white" → `mixer.{green,red,blue,yellow}.*` 定点 + `grading.*` 方向
- 点缀："blood red, mustard yellow, police blue"
- 饱和/对比：mid / mid
- 光线签名："难看的顶光——荧光管、裸灯泡、雪地反光——在每个人眼窝里留下阴影，让称职的人显得愚蠢"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："稀少；只允许地域性源音乐，或一段完全不匹配的庄严曲子端正演奏。禁止喜剧音效与 stinger"
- 环境："地域具体：平地上的风、某台特定机器、某种鸟、踩雪声、荧光镇流器嗡鸣"
- 对白："慢、过分客气、口音明确；把对方的话原样复述一遍再回答"
- 静默："问题之后 2-3 秒死寂，环境声不减，谁都不动——主要喜剧乐器"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["low-mounted wide dolly running ahead of or behind a walking subject", "dead-frontal locked symmetrical hold", "fast push-in on an object", "90-degree overhead of a mess being cleaned up", "snap pan between two square-on people"]
- 避免：["drifting handheld", "orbit", "shallow-focus beauty shot", "slow motion", "crane release"]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
