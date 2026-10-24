---
name: artcraft-lens-bi_gan
description: >-
  导演透镜（ArtCraft 适配版）：毕赣导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

<!-- 改编自 DirectorSKILL（MIT License）© 2026 wangzhang-wu — https://github.com/wuwangzhang1216/DirectorSKILL 。
     依据 MIT 许可改编并随 @ninkch/dsh-artcraft 分发；新增「ArtCraft 落点」章节。
     方法论仅用于原创创作：不得复刻真实影片的具体镜头、台词、角色或情节。 -->

# 毕赣导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: bi_gan
lens_kit_mm: [18, 25, 35]   # 广角为主：狭窄空间可通行，自然景深，湿反光铺满画面
camera:
  prefer: [continuous gimbal drift at walking pace, follow from one to two seconds behind, pass-through a door or bridge or tunnel as a transition, drift away from the subject at the end, slow rise up a stairwell]
  avoid: [cut, locked tripod, absolute drone smoothness, whip pan, crash zoom]
  motion_budget: medium       # 一直在动，但速度恒定在 0.8-1.2m/s，是走路不是飞行
  height: "shoulder to chest, with a slight breathing rise and fall, never perfectly level"
shot_size_bias: [medium following shot, wide traversal, over-shoulder from behind, medium close-up in passing, empty frame after the subject leaves]
composition: [wet reflective foreground, doorway and tunnel framing as transition gates, mixed light sources within one frame, subject leaving and re-entering frame, recurring object placed at a passing point]
lighting:
  key_quality: soft
  key_ratio: "2.5:1 to 3.5:1"
  motivation: practical
  signature: "潮湿表面的反射当主光；霓虹、荧光管、白炽灯泡、电视青光同框且不校正色温"
palette:
  dominant: "humid teal-green, dim purple, tungsten amber"
  accent: "karaoke neon pink, television cyan, rust red"
  saturation: low
  contrast: low
editing:
  avg_shot_length_s: "45-600"
  transition_bias: [pass-through as transition, fade, dissolve]
  coverage_style: "一场一镜，无覆盖率；镜头在人物离开后继续漂移 10 秒以上"
sound:
  music: "老歌、卡拉 OK 伴唱、磁带走带声；音源必须在场景里有物理出处"
  ambience: "雨、滴水、电风扇、火、远处摩托、犬吠、球杆撞击"
  dialogue: "方言、低音量，可被雨声盖过一半"
  silence_use: "不用完全消音；静默由自然声填满，孤独感来自声音的空旷而非无声"
performance:
  register: "内敛，情绪靠沉默、抽烟、走路速度传达；同一张脸可以是两个人"
  blocking: "沿一条可绘制的路径行走，途经 3-5 个点；允许走出画面再走回"
aspect_bias: "2.39:1"
ai_video:
  clip_duration_s: "10-20"    # 取所用工具允许的最长单条时长；长镜头靠首尾帧串联，不指望单条 clip 完成
  prompt_bias: "先写路径（起点、途经点、终点）和每个点的光源类型，再写摄影机的漂移速度与滞后量，人物动作只写走路与一次停顿。"
  risk: "单条 clip 的时长上限远短于一个数分钟的长镜头（以当前主流工具而言，用前请查其当前文档），逐条生成又会在中途丢失人物身份和光源逻辑。缓解：在提供首帧输入的工具上把长镜头切成链条，用上一段的末帧做下一段的首帧，并把每个接缝安排在一次穿越（过门／钻桥洞／穿雨帘）上，这样接缝读起来像设计过的通过而不是剪辑；链条的具体做法由 ai-video-tool-adapters.md 负责。"
negative_prompt_adds: [hard cut, dry clean surfaces, hard-edged shadows, drone-smooth flight, saturated stage color, symmetric composition, corrected white balance, empty sterile space]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"45-600"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[pass-through as transition, fade, dissolve]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："一场一镜，无覆盖率；镜头在人物离开后继续漂移 10 秒以上"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"2.5:1 to 3.5:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："humid teal-green, dim purple, tungsten amber" → `mixer.{green,red,orange,aqua,purple}.*` 定点 + `grading.*` 方向
- 点缀："karaoke neon pink, television cyan, rust red"
- 饱和/对比：low / low
- 光线签名："潮湿表面的反射当主光；霓虹、荧光管、白炽灯泡、电视青光同框且不校正色温"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："老歌、卡拉 OK 伴唱、磁带走带声；音源必须在场景里有物理出处"
- 环境："雨、滴水、电风扇、火、远处摩托、犬吠、球杆撞击"
- 对白："方言、低音量，可被雨声盖过一半"
- 静默："不用完全消音；静默由自然声填满，孤独感来自声音的空旷而非无声"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[continuous gimbal drift at walking pace, follow from one to two seconds behind, pass-through a door or bridge or tunnel as a transition, drift away from the subject at the end, slow rise up a stairwell]
- 避免：[cut, locked tripod, absolute drone smoothness, whip pan, crash zoom]
- 运动预算：medium
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
