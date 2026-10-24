---
name: artcraft-lens-hou_hsiao_hsien
description: >-
  导演透镜（ArtCraft 适配版）：侯孝贤导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 侯孝贤导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: hou_hsiao_hsien
lens_kit_mm: [50, 85, 100]   # 从 6-12 米外用中长焦拍全景：远，但清楚；不用广角贴近
camera:
  prefer: ["locked long hold on sticks", "minimal reframe pan under 20 degrees", "hold on the empty room after everyone leaves", "shoot one room from inside another through a doorway", "deep-focus three-plane static frame"]
  avoid: ["push-in", "handheld", "crane", "orbit", "cut to close-up"]
  motion_budget: none          # 唯一允许的运动是慢到观众察觉不到的补构图摇
  height: "seated eye height 1.0-1.2m, locked, unchanged for the whole scene"
shot_size_bias: ["wide", "medium wide", "doorway-framed wide", "medium two-shot at distance", "empty room after exit"]
composition: ["doorway or window frame eating the outer quarter of the frame", "three simultaneous planes of activity", "figures small and off-centre", "flat frontal wall behind the action", "camera positioned outside the room being filmed"]
lighting:
  key_quality: soft
  key_ratio: "2:1 to 4:1"
  motivation: naturalistic
  signature: "门口或窗口的白天户外光是唯一主光，室内低 1-2 档，脸允许在暗部，没有任何补光"
palette:
  dominant: "aged wood brown, whitewash grey, foliage green outside the door, washed indigo cloth"
  accent: "one saturated note only — a red garment, a plastic bucket, a green fluorescent tube"
  saturation: mid
  contrast: mid
editing:
  avg_shot_length_s: "40-120"
  transition_bias: ["hard cut", "fade to black"]
  coverage_style: "一场 1-3 个镜头，无反打无特写；每次切点同时跳过一段时间"
sound:
  music: "近乎为零，且只用源音乐（隔壁收音机、街上驶过的车、别的房间的歌）"
  ambience: "完整现场声床：蝉、车流、厨房、电扇、隔壁电视；本底噪声全片不断"
  dialogue: "重叠、含混、带方言，边做事边说，一半听不清；音量随距离衰减"
  silence_use: "没有真正的静音；最重的转折可以完全没有声音标记"
performance:
  register: "非表演；先做手上的事，情绪从做事的节奏里漏出来"
  blocking: "人物自由进出画面，摄影机不追；离开后房间里剩下的人才是内容"
aspect_bias: "1.85:1 / 16:9"   # 9:16 交付时的构图改写见「镜头语言」末条
ai_video:
  clip_duration_s: "8-12"      # 取所用工具的单条上限（各家不同，以其当前文档为准）；宁可一条完整长镜，不要三个短镜头
  prompt_bias: "把整个房间写成一张同时进行的小动作清单（前中后各一件），然后明确要求摄影机什么都不做。"
  risk: "模型把'固定机位'理解成静止照片，或者自作主张加一个缓推。缓解：点名三处持续的小运动（蒸汽、风扇、窗帘、电视闪烁、远处门口有人经过），并显式写 camera does not move, no zoom, no push-in。"
negative_prompt_adds: ["camera push-in or zoom", "handheld shake", "close-up", "shallow depth of field", "dramatic lighting", "orchestral score", "empty stylized set", "slow motion"]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"40-120"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**["hard cut", "fade to black"]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："一场 1-3 个镜头，无反打无特写；每次切点同时跳过一段时间"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"2:1 to 4:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："aged wood brown, whitewash grey, foliage green outside the door, washed indigo cloth" → `mixer.{green,red}.*` 定点 + `grading.*` 方向
- 点缀："one saturated note only — a red garment, a plastic bucket, a green fluorescent tube"
- 饱和/对比：mid / mid
- 光线签名："门口或窗口的白天户外光是唯一主光，室内低 1-2 档，脸允许在暗部，没有任何补光"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："近乎为零，且只用源音乐（隔壁收音机、街上驶过的车、别的房间的歌）"
- 环境："完整现场声床：蝉、车流、厨房、电扇、隔壁电视；本底噪声全片不断"
- 对白："重叠、含混、带方言，边做事边说，一半听不清；音量随距离衰减"
- 静默："没有真正的静音；最重的转折可以完全没有声音标记"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：["locked long hold on sticks", "minimal reframe pan under 20 degrees", "hold on the empty room after everyone leaves", "shoot one room from inside another through a doorway", "deep-focus three-plane static frame"]
- 避免：["push-in", "handheld", "crane", "orbit", "cut to close-up"]
- 运动预算：none
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
