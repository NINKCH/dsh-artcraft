---
name: artcraft-delivery-qc
description: 交付与质检——平台规格（横竖屏分辨率/帧率/码率/时长/响度/字幕安全区）、导出预设与格式选择、交换格式交付（EDL/XML/FCPXML/OTIO/AAF/OMF）、客观质检（探产物/示波器/音频体检/无障碍/数据校验/尺寸测量）、主观复核（抽帧联络表 + 视觉确认）、命名与目录规范、常见翻车排查。用于成片导出、平台适配与交付前把关。
---

# 交付与质检

交付不是"导出完事"，而是**证明它符合规格**。所有质检结论要基于事实（参数读数、抽帧图、体检报告），不基于"我觉得没问题"。

## 一、平台规格速查

| 平台/场景 | 画幅 | 建议分辨率 | 帧率 | 视频码率 | 音频 | 响度 |
|---|---|---|---|---|---|---|
| B 站 / YouTube 横屏 | 16:9 | 1920×1080（可 4K） | 24/25/30/60 | 1080p 8–12 Mbps；4K 35–45 Mbps | AAC 192–320 kbps | −14 LUFS |
| 抖音 / Reels / Shorts 竖屏 | 9:16 | 1080×1920 | 30/60 | 6–10 Mbps | AAC 128–192 kbps | −14 LUFS |
| 微信视频号 | 9:16 或 1:1 | 1080×1920 / 1080×1080 | 30 | 6–8 Mbps | AAC 128 kbps | −14 LUFS |
| 广播/电视 | 16:9 | 1920×1080 | 25/50（PAL）· 29.97/59.94（NTSC） | 50 Mbps+ 或 ProRes | PCM | **−23 LUFS** |
| 影院/DCP | 1.85 / 2.39 | 2K/4K | 24 | JPEG2000 | PCM 5.1 | −27 LUFS 参考 |
| 播客（纯音频） | — | — | — | — | WAV/AAC 44.1k+ | −16 LUFS |

**字幕安全区**：竖屏下字幕避开底部 12–15%（平台 UI 遮挡区）、左右各留 5%；横屏底部 10%。FilmCraft `graphics.*` 与 `captions.setStyle` 支持安全区参数。

## 二、导出：预设优先，参数兜底

```
1) 查预设   filmcraft-cli export --list-presets          # 名称/类别/格式
2) 用预设   export <out> --preset <name> [--range entire|inOut|workArea] [--scale] [--quality]
3) 无预设   显式指定：--format h264|hevc|prores|dnxhr|… --bitrateKbps --audioCodec aac|pcm|flac
```

- **FilmCraft**：`export.presets.list` / `export.formats` / `file.exportMedia {path, preset|format, width, height, fps, bitrateKbps, bitrateMode, audioCodec, …}`；`--gpu-rendering auto|off` 控制硬件编码；`--queue` 走导出队列。
- **EffectCraft**：`render --format h264|hevc|av1|prores|webm|png|jpeg|tiff|exr|gif|wav|aiff`（`exec app.capabilities` 可列全部导出格式）+ `--resolution full|half|third|quarter`、`--quality best|draft`、`--channels rgb|rgba`、`--prores PROFILE`、`--webm-codec vp9|av1`。
- **PhotoCraft**：`convert <in> <out> [--format] [--quality] [--tiff-layers]`。
- **VectorCraft**：`convert IN OUT [--scale] [--artboard|--range] [--outline-text]`。
- **DeckCraft/DesignCraft/WordCraft/GridCraft/CADCraft/PdfCraft**：各有 `convert`/`render`/`export` 子命令；PDF 类注意 `--scale`、出血、CMYK（FigCraft `export --bleed --crop-marks --cmyk`）。
- **音频**：SoundCraft `file.bounce_mix` / `file.bounce_stems {dir, format: wav|aiff|flac, bit_depth: 16|24|32f}`。

## 三、交换格式（跨软件交付）

| 目标 | 命令 | 说明 |
|---|---|---|
| 剪辑时间线 | FilmCraft `file.exportInterchange {format:"edl\|xml\|fcpxml\|otio\|aaf\|omf", path, sequence}` | **OTIO/FCPXML 优先**；EDL 仅作剪辑清单（单轨、无特效） |
| 给混音师 | `file.exportAaf` / `file.exportOmf` | 支持 `handles`、`breakoutToMono`、`audio:"embedded\|separate"` |
| 字幕交付 | `captions.export {path, format:"srt\|vtt\|scc\|mcc\|stl\|ttml\|dfxp"}` | 平台不同格式不同 |
| 静态图/序列 | PhotoCraft `convert`、EffectCraft `render --format png|exr|tiff` | 序列命名用 `%04d` 约定 |

## 四、客观质检（读数 + 体检）

| 检查项 | 用什么 | 通过判据 |
|---|---|---|
| 容器/流参数 | `filmcraft probe <media>`、各成员 `info` | 分辨率/帧率/时长/音轨布局与规格一致 |
| 画面电平 | `scopes.read {scopes:["waveform","parade","histogram","vectorscopeYuv"]}` | 黑不贴底、白不削顶、矢量不越界 |
| 黑帧/冻结/静音 | 抽样探 + 抽帧目视 | 无意外黑场/定格/无声段 |
| 音频体检 | SoundCraft `session.audio_health`；FilmCraft `essentialSound.inspect` | 无丢失/无异常片段 |
| 真峰值/响度 | `essentialSound.autoMatch` 后核对 | 达标（见 artcraft-sound-design） |
| 文档无障碍 | PdfCraft `a11y.check`、`a11y.alt_text`、`a11y.reading_options`；WordCraft `file.accessibility` | 无致命项 |
| 尺寸/边距 | PdfCraft `measure.distances/area`；FigCraft `measure.distances/padding` | 符合版式与出血要求 |
| 数据正确性 | GridCraft `data.validate` / `data.validation` | 无校验失败项 |
| 字体齐全 | FilmCraft `graphics.fonts.used`；FigCraft `--no-system-fonts` 渲染一致性 | 无缺字/回退字体 |
| 快捷键冲突（工程健康） | FilmCraft `shortcuts.audit` / `shortcuts.conflicts` | 无冲突残留 |

## 五、主观复核（机器读数之外）

1. **抽帧联络表**：整片按固定间隔抽帧（FilmCraft `render` 单帧 / PhotoCraft `convert` / `ui.screenshot`），拼成联络表。
2. **自己看**：由你（多模态）逐格确认——构图、曝光、肤色、字幕位置、转场是否自然。
3. **听**：对白清晰度、音乐是否抢戏、切点有无爆音（无法听时，至少核对响度与波形读数）。
4. **看首尾**：开头 3 秒与结尾 3 秒是观众最挑剔的地方，必须单独复核。

## 六、命名与目录规范

```
<project>/
  media/     素材（只读，不改）
  craft/     工程文件与中间产物（.fcproj/.ecproj/.pcraft/.figcraft…）
  out/       交付物
     <name>_<平台>_<画幅>_<版本>.<ext>
     例：ep01_douyin_9x16_v3.mp4
  reports/   质检记录（读数、抽帧图、体检输出）
```

**版本纪律**：改一版进一位（v1→v2→v3），**绝不覆盖上一版交付物**；最终版单独标记 `_final`。

## 七、常见翻车与排查

| 症状 | 原因 | 处理 |
|---|---|---|
| 平台压片后变糊 | 码率不足 / 二次压缩 | 提码率、给平台更大源文件 |
| 竖屏被 UI 挡字幕 | 未留安全区 | 字幕上移；`captions.setStyle` 调位置 |
| 颜色在平台上变了 | 色彩空间/标签错误 | 明确交付 Rec.709 并核对 `color.spaces` |
| 音画不同步 | 源 VFR / 帧率不匹配 | 先统一恒定帧率再导出 |
| 响度忽大忽小 | 未统一归一化 | `autoMatch` 全片统一（见 sound-design） |
| 时长超平台限制 | 未按规格裁剪 | 导出前核对平台时长上限 |
| 字幕时间轴偏移 | 帧率/时基换算错误 | 用 `captions.setTimes` 按秒/帧/时间码校正 |
| 字体在不同机器不一致 | 系统字体依赖 | 用内置字体（FigCraft `--no-system-fonts`）或转曲 |

## 八、交付前最终清单

- [ ] 规格：分辨率/帧率/码率/时长/画幅 全部达标
- [ ] 画面：无黑帧冻结、示波器不越界、主观复核通过
- [ ] 声音：响度达标、真峰值不削、无爆音、对白清晰
- [ ] 字幕：时间轴正确、不断句错、在安全区内、格式正确
- [ ] 元数据：标题/作者/描述（`metadata.set`）填写完整
- [ ] 交换件：需要交接时 OTIO/FCPXML/AAF 已生成并验证可打开
- [ ] 命名与版本：规范、未覆盖旧版
- [ ] 报告：读数与抽帧证据已留档（reports/）
