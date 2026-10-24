---
name: artcraft-lens-fincher
description: >-
  导演透镜（ArtCraft 适配版）：大卫·芬奇导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 大卫·芬奇导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: fincher
lens_kit_mm: [35, 85, 135]   # 85/135 为主力，长焦压缩把人物从背景抠出；35 只用于一次性交代几何
camera:
  prefer: [locked precise frame, imperceptible 3-6 percent push-in, slow pull-back on a mechanical dolly, surveillance framing from behind glass, invisible complex oner]
  avoid: [handheld, camera shake, orbit, whip pan, wide-angle distortion]
  motion_budget: low          # 有移动但幅度以百分比计量，观众不应察觉
  height: "exact eye level or 10cm above, repeatable to the centimetre"
shot_size_bias: [medium close-up, close-up, medium from a surveillance position, insert on hands and documents, wide only to establish geometry once]
composition: [subject isolated by shallow depth at f/2-f/2.8, background compressed into unreadable color blocks, framing through glass or a door gap, exact horizontal and vertical alignment, subject placed on a third with dead space where the threat would be]
lighting:
  key_quality: mixed
  key_ratio: "4:1 to 6:1"
  motivation: practical
  signature: "青绿阴影对琥珀实用光；黑位抬起，阴影里始终有可读纹理"
palette:
  dominant: "teal-green shadow, desaturated charcoal, cold grey"
  accent: "amber practical, sodium yellow, a single skin tone"
  saturation: low
  contrast: low
editing:
  avg_shot_length_s: "4-9"     # 场景内的信息蒙太奇可降到 0.5-1.5 秒
  transition_bias: [hard cut, cut to black]
  coverage_style: "机位可精确复现；切点必须能说出理由；场景末尾用近乎静止的长挂收尾"
sound:
  music: "电子与合成器持续音，制造生理不适；可在场景中途无交代地消失"
  ambience: "键盘、复印机、荧光镇流器、硬盘、电流嗡鸣，可推到主导地位"
  dialogue: "清晰干燥、混响少、语速偏快、信息密度高、情绪幅度小"
  silence_use: "说谎者说完后停 2-3 秒不切，用静默暴露破绽"
performance:
  register: "收敛精算，魅力来自能力；加害者造型平庸不加设计"
  blocking: "走位由工作流程决定；人物很少正对镜头，常被摄影机从其不知情的位置观察"
aspect_bias: "2.39:1"
ai_video:
  clip_duration_s: "4-8"
  prompt_bias: "点名唯一实用光源实体，把推进写成百分比，把景深写成光圈值；主体动作限定为一个职业性小动作（对齐、擦拭、翻页、点击）。"
  risk: "模型给出手持漂移、镜头光晕和压死的纯黑，或把'干净'渲染成塑料感 CG。缓解：负面词写 handheld drift / lens flare / crushed black；正面写 fine film grain、dust-free air、locked frame with zero breathing。"
negative_prompt_adds: [handheld drift, camera shake, lens flare, crushed pure black, warm romantic glow, atmospheric haze, visible bokeh balls, wide-angle distortion]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"4-9"s**（conventional（5–12s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut, cut to black]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："机位可精确复现；切点必须能说出理由；场景末尾用近乎静止的长挂收尾"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"4:1 to 6:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："teal-green shadow, desaturated charcoal, cold grey" → `mixer.{green,orange,aqua,yellow}.*` 定点 + `grading.*` 方向
- 点缀："amber practical, sodium yellow, a single skin tone"
- 饱和/对比：low / low
- 光线签名："青绿阴影对琥珀实用光；黑位抬起，阴影里始终有可读纹理"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："电子与合成器持续音，制造生理不适；可在场景中途无交代地消失"
- 环境："键盘、复印机、荧光镇流器、硬盘、电流嗡鸣，可推到主导地位"
- 对白："清晰干燥、混响少、语速偏快、信息密度高、情绪幅度小"
- 静默："说谎者说完后停 2-3 秒不切，用静默暴露破绽"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[locked precise frame, imperceptible 3-6 percent push-in, slow pull-back on a mechanical dolly, surveillance framing from behind glass, invisible complex oner]
- 避免：[handheld, camera shake, orbit, whip pan, wide-angle distortion]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
