---
name: artcraft-lens-tarkovsky
description: >-
  导演透镜（ArtCraft 适配版）：安德烈·塔可夫斯基导演风格 Skill。把该导演的工作方式翻译成 ArtCraft 可执行参数——FilmCraft 时间线与转场、LightCraft 影调分区、SoundCraft 声音规则、EffectCraft 机位。当用户点名该导演、要求该风格，或项目美学圣经引用该透镜时加载。
---

# 安德烈·塔可夫斯基导演风格 Skill（ArtCraft 适配版）

## 风格参数 / Style parameters

```yaml
style_id: tarkovsky
lens_kit_mm: [28, 35, 50]   # 广角到标准，深焦分层；靠景深而非切镜建立层次
camera:
  prefer: [locked hold, very slow lateral dolly, slow push-in on an object, slow tilt down to water, walking-pace follow from behind]
  avoid: [handheld shake, whip pan, orbit, crash zoom, drone reveal]
  motion_budget: low          # 10 秒内位移 ≤ 1 米，恒速，无加减速
  height: "waist to chest, level or slightly low, planted like a witness"
shot_size_bias: [wide, medium wide, insert or detail, over-shoulder from behind, close-up]
composition: [deep staging with three or more planes, reflective foreground, off-center or back-turned figure, vertical layering from ceiling to floor, threshold framing]
lighting:
  key_quality: soft
  key_ratio: "2:1 to 3:1"
  motivation: naturalistic
  signature: "阴天窗光加单一火光点；无硬边阴影，湿表面自己发光"
palette:
  dominant: "mud brown, wet stone grey, moss green, sepia"
  accent: "fire orange, milk white, rust"
  saturation: low
  contrast: low
editing:
  avg_shot_length_s: "30-90"
  transition_bias: [hard cut, slow dissolve, fade]
  coverage_style: "单机位单角度，一个镜头解决一场戏，不拍反打"
sound:
  music: "极少，出现时为宗教性合唱或单一持续音，不跟画面情绪走"
  ambience: "可数的滴水、风穿空屋、火焰爆裂、远处狗叫；环境声即主音轨"
  dialogue: "低音量慢速，常在画外或背对镜头说出，每场 40 字以内"
  silence_use: "连续 5-15 秒静默，用来让观众听出空间尺寸"
performance:
  register: "内敛疲惫，情绪落后事件 2-3 秒，反应幅度小于事实要求"
  blocking: "长时间静止或缓慢走动，常背对镜头或被前景遮挡"
aspect_bias: "1.66:1 / 4:3"   # 竖向余量留给天花板、树冠和垂落的水
ai_video:
  clip_duration_s: "8-15"     # 取所用工具允许的最长单条时长；宁可一个长镜头，不要三个短镜头
  prompt_bias: "主体动作写到最小（呼吸、转头、放下一件东西），描述预算全部给环境运动和材质：水、火、雾、布料、光的缓慢变化。"
  risk: "模型把'慢'理解成'静止'，输出一张会呼吸的照片。缓解：显式命名两个持续的环境运动源，并给镜头一个恒速微移。"
negative_prompt_adds: [saturated colors, hard-edged shadows, lens flare, fast camera move, quick cuts, glossy clean surfaces, stage-symmetric framing, orchestral swell]
```

## ArtCraft 落点（本插件适配）

### 剪辑（FilmCraft）
- 单镜均长目标 **"30-90"s**（observational / 长镜（8–15s 档））→ `timeline.place` 铺轨后按分配修长：`timeline.trim {mode:"ripple"}`、`timeline.rateStretch` 微调
- 转场偏好：**[hard cut, slow dissolve, fade]** → `sequence.applyVideoTransition {effect}` / `sequence.setTransition {duration, align}`
- 覆盖方式："单机位单角度，一个镜头解决一场戏，不拍反打"
- 音画切点：对白/音乐切点参考 SoundCraft `event.beat_detective` 的节拍位置

### 影调（LightCraft / FilmCraft Lumetri）
- 光比目标 **"2:1 to 3:1"** → LightCraft `light.contrast` + `grading.shadows/highlights` 分离
- 主色："mud brown, wet stone grey, moss green, sepia" → `mixer.{green}.*` 定点 + `grading.*` 方向
- 点缀："fire orange, milk white, rust"
- 饱和/对比：low / low
- 光线签名："阴天窗光加单一火光点；无硬边阴影，湿表面自己发光"
- 落点命令：`develop.set control=<id> value=<v>` 逐项；定稿 `preset.create` 固化，整批 `preset.apply`；FilmCraft 侧 `lumetri.setLook` + `presets.save`

### 声音（SoundCraft / FilmCraft）
- 音乐："极少，出现时为宗教性合唱或单一持续音，不跟画面情绪走"
- 环境："可数的滴水、风穿空屋、火焰爆裂、远处狗叫；环境声即主音轨"
- 对白："低音量慢速，常在画外或背对镜头说出，每场 40 字以内"
- 静默："连续 5-15 秒静默，用来让观众听出空间尺寸"
- 落点命令：`essentialSound.setType` + `essentialSound.generateDucking`（避让对白）+ `essentialSound.autoMatch {target:-14}`；SoundCraft `mix.insert` 挂处理链

### 机位与运动（EffectCraft）
- 优先：[locked hold, very slow lateral dolly, slow push-in on an object, slow tilt down to water, walking-pace follow from behind]
- 避免：[handheld shake, whip pan, orbit, crash zoom, drone reveal]
- 运动预算：low
- 落点命令：`camera.orbit/pan/dolly` + `view.3d.*` 机位；2D 素材用 `layer.*` + `keys.easyEase*` 缓动

### 质检挂钩（artcraft_qc / 人工复核）
- 逐镜抽帧复核 + `scopes.read` 示波器核对影调是否落在本透镜的光比与色相档位
