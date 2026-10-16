---
name: artcraft-sound-design
description: 声音设计决策——对白优先原则、清理链顺序（降噪/去齿音/EQ/压缩/响度）、Essential Sound 四类素材的正确用法、响度标准（-14 LUFS 流媒体 / -23 LUFS 广播 / -16 播客）与真峰值、音乐与音效的进入退出点、声音先行、混音空间与自动化，映射到 FilmCraft essentialSound/mixer/clipMixer/tts 与 SoundCraft mix/automation/track/session.audio_health。用于配音、混音、响度归一与成片音质把关。
---

# 声音设计

**第一原则：对白永远优先。** 任何处理只要让台词听不清，就是错的——音乐、音效、氛围全部让路。

## 一、三层结构

| 层 | 内容 | 目标 |
|---|---|---|
| 对白 | 台词、旁白 | 清晰、响度稳定、无噪声 |
| 音乐 | 主题曲、铺底 | 情绪推进，不抢对白 |
| 音效/环境 | 动效、氛围、拟音 | 真实感与强调 |

**层级纪律**：对白 −12~−6 dBFS 峰值区间；音乐比对白低 6–12 dB（对白段落）；音效点可瞬时突出但不超过对白。

## 二、对白清理链（顺序不能乱）

```
1 降噪（先去底噪，否则后续放大噪声）
2 去齿音 / 去咝声
3 EQ（高通去隆隆声；中频提清晰度；去箱音）
4 压缩（控制动态，让小声也听得见）
5 响度归一（最后一步，全片一致）
```

**FilmCraft 落点**：`essentialSound.setType {type:"dialogue"}` → `essentialSound.set {key:"repair.noise.on|repair.noise.amount|…"}` → `essentialSound.applyPreset {preset, type}` → `essentialSound.autoMatch {target:lufs}`（响度匹配）→ `essentialSound.inspect` 核对。

**SoundCraft 落点**：`mix.insert`（插件插入）· `mix.insert_param`（插件参数）· `track.bypass_delay/dynamics`（旁通对比）· `session.audio_health`（工程音频体检）· `file.bounce_stems`（分轨导出）· `automation.set_point / write_range / thin`（自动化写点与稀疏化）。

## 三、音乐：进入、铺底与退出

- **进入点**：在情绪转折前 0.5–1s 进入（不要与切点完全同帧，易"撞"）。
- **铺底**：对白段落把音乐压 6–12 dB；有歌词的音乐会与台词抢注意力——**对白段落避免歌词**。
- **退出**：在段落落点后留 0.5–1s 尾音或干脆切掉，制造呼吸。
- **自动闪避**：FilmCraft `essentialSound.generateDucking {clips}` 自动生成音乐避让对白的音量关键帧（比手写快且不会漏）。

## 四、音效与环境

- 音效服务画面：动作 → 落点音；转场 → 过渡音；情绪 → 心跳/耳鸣等主观音。
- 环境声是"真实感的地基"：即使很轻也要铺（否则对白像在真空里）。
- **不要每个动作都配音效**（音效过密 = 廉价）；重点动作才给强调。

## 五、响度标准（客观交付判据）

| 平台/场景 | 目标响度 | 真峰值上限 |
|---|---|---|
| 流媒体/Web（B 站、YouTube、抖音等） | **−14 LUFS** | −1 dBTP |
| 广播（EBU R128） | **−23 LUFS** | −2 dBTP |
| 播客 | −16 LUFS | −1.5 dBTP |

**做法**：先做动态处理（压缩/限制），**最后**统一响度；`essentialSound.autoMatch {target}` 一键匹配，或用 `mix.*` / SoundCraft `automation.*` 手工到位。交付前必须复核真峰值，避免削波。

## 六、混音空间与自动化

| 目标 | 手法 | 落点 |
|---|---|---|
| 音量层级 | 轨道推子 + 关键帧 | FilmCraft `mixer.setStrip {volumeDb}` · `mixer.setValue {lane:"volume\|pan\|mute"}` |
| 声像定位 | 对白居中，环境铺宽 | `mixer.setValue {lane:"pan"}` |
| 分组处理 | 对白/音乐/音效各走子混音 | `mixer.addSubmix {name, channels}` |
| 自动化写入 | 实时推子录制或写点 | `mixer.recordStart/recordStop` · `mixer.touch/release` · SoundCraft `automation.write_range/set_point` |
| 片段级微调 | 单条片段增减益 | FilmCraft `clipMixer.set {effect:"volume"\|"panner"}` · SoundCraft `clip.*` |
| **响度一致化** | 片段增益 ↔ 音量自动化互转 | SoundCraft `automation.clip_gain_to_volume / volume_to_clip_gain` |
| 分轨交付 | 给混音师 stem | `file.bounce_stems {dir, format, bit_depth}` · `file.export_clip_groups` |
| 整混导出 | 母版 | `file.bounce_mix` · `file.export_selected_tracks_as_session` |

## 七、旁白合成（家族自带 TTS）

FilmCraft `tts.voices`（列音色）→ `tts.preview`（试听）→ `tts.create {text, voice, pitch, pace}` → `tts.render`（合成）→ `tts.edit`（改文本/音色/语速）。`tts.downloadVoices` 可下载自然音色。

**用法要点**：旁白语速 pace 与画面节奏匹配；段落间留气口；合成后仍要走上面的清理与响度链。

## 八、声音质检清单

- [ ] 台词全程清晰，无被音乐/音效盖住
- [ ] 无爆音、无削波（真峰值达标）
- [ ] 底噪已处理，静音段不是"死寂"（有环境底）
- [ ] 全片响度一致（跨段落无忽大忽小）
- [ ] 切点处声音连续（无断点/无爆音）
- [ ] 转场有声音动机（不是画面变了声音才跟上）
- [ ] 交付：`session.audio_health` 无异常 + 分轨/母版齐全

## 九、作业模板

```
1) 分类   essentialSound.setType {type:"dialogue|music|sfx|ambience"}（逐类处理）
2) 清理   repair.* → EQ → 压缩 → autoMatch（响度）
3) 铺陈   音乐进入/退出点 + generateDucking + 环境底噪
4) 混音   子混音分组 → 推子自动化 → 片段级微调
5) 复核   session.audio_health + 真峰值 + 全片响度一致性
6) 交付   file.bounce_mix / file.bounce_stems（wav/aiff/flac, 16/24/32f）
```
