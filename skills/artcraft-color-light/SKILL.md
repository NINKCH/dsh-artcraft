---
name: artcraft-color-light
description: 影调与调色决策——一级（曝光/对比/白平衡/饱和）与二级（HSL 限定/肤色/局部）的作业顺序与判据、跨镜头一致性（FilmCraft lumetri.applyMatch、LightCraft develop 分区）、示波器客观判读、Log/HDR 到交付空间的转换、风格 look 与题材表达、常见偏色与过饱和的排查。映射到 LightCraft 122 个 develop 控制、FilmCraft lumetri/lut/scopes、PhotoCraft image.adjustments 与 filter。
---

# 影调与调色

目标顺序永远是：**先统一（一致性）→ 再修正（技术）→ 后风格（创作）**。跳过前两步直接套 LUT，是全片跳色的根源。

## 一、一级校色：固定顺序与判据

| 顺序 | 调整 | 判据（客观） | 常见错 |
|---|---|---|---|
| 1 | 曝光 / 黑位 / 白位 | 波形图：黑位不贴底、白位不削顶 | 黑位抬高→发灰；白位削顶→死白 |
| 2 | 对比 / 曲线 | 直方图分布，主体落在中段 | 对比过猛→暗部糊 |
| 3 | 白平衡（色温/色调） | 矢量示波器：肤色线附近 | 偏黄/偏青不察 |
| 4 | 饱和 / 自然饱和度 | 矢量示波器不越界 | 过饱和→溢出结块 |

**LightCraft 落点（122 控制 / 14 分区，0.10 未变）**——标准冲洗顺序：

```
profile.amount → wb.temp / wb.tint → light.exposure / light.contrast /
light.highlights / light.shadows / light.whites / light.blacks →
curve.*（highlights/lights/darks/shadows + splitShadows/splitMid/splitHighlights）→
color.vibrance / color.saturation → grading.*（阴影/中间调/高光/全局 的 hue·sat·lum）→
mixer.*（8 色相 × hue/sat/lum，用于定点修色）→
detail.*（锐化 4 + 降噪 7）→ optics.*（畸变/暗角/去边/色差）→
geometry.*（透视/旋转/裁切）→ effects.texture/clarity/dehaze → grain.* → vignette.*
```

**FilmCraft 落点**：`lumetri.setSection {section:"basic|creative|curves|wheels"}`、`lumetri.setInputLut`（技术 LUT：Log→709）、`lumetri.setLook`（创意 Look）、`lumetri.applyPreset`、`presets.save/apply`（自制预设跨镜复用）。

**PhotoCraft 落点**：`image.adjustments.exposure/levels/curves/vibrance/desaturate`；RAW 走 `filter.cameraRaw`；批量一致性用 `actions.record → actions.save → file.automate.batch`。

**打印版式（LightCraft 0.10 新增）**：`print.template.list/apply/save` + `print.cell.*` + `print.layout`——把冲洗结果按版式模板排进打印页；`slideshow.export` 直接出幻灯片。

## 二、二级校色与局部

| 手法 | 何时用 | 落点 |
|---|---|---|
| HSL 限定（定点修色） | 只改某色相（如把草地压黄） | LightCraft `mixer.<color>.hue/sat/lum`；PhotoCraft `filter.*` 选择性 |
| 肤色优先 | 任何风格化前先护住肤色 | LightCraft `mixer.orange.*` + `grading.midtones.*`；矢量示波器核对 |
| 分区调色 | 阴影/中间调/高光分别偏移 | LightCraft `grading.shadows/midtones/highlights.*`；FilmCraft `wheels`（三路色轮） |
| 局部遮罩 | 只调人脸/天空/背景 | LightCraft `mask.*`（12 条）+ `develop` 局部；FilmCraft `masks.*`（含 `masks.track` 跟踪） |
| 分离色调 | 阴影冷/高光暖的"电影感" | LightCraft `grading.blending` + `balance`；`curve.splitShadows/splitMid/splitHighlights` |

## 三、跨镜头一致性（**先做这一步**）

1. **参考镜头**：选一个曝光与白平衡最准的镜头做基准。
2. **匹配**：FilmCraft `lumetri.applyMatch {clip, referenceTime|referenceFrame|referenceTimecode, faceDetection}`——按参考帧匹配，人脸优先。
3. **锁定配方**：把成品参数存成预设（`presets.save` / LightCraft `preset.create`），后续镜头 `applyPreset` 复用；LightCraft 可 `history.*` 回溯与 `version.*` 留版。
4. **核对**：`scopes.read {scopes:["waveform","parade","histogram","vectorscopeYuv",…]}` 横向比对，逐镜读数一致。

**一致性三件套**：参考帧匹配 + 参数预设 + 示波器读数。

## 四、Log / HDR / 色彩空间

- 先查：`color.spaces`（FilmCraft）列出可用色彩空间；交付前明确目标空间（Rec.709 交付，Log 只作中间）。
- 技术转换：`lumetri.setInputLut`（输入 LUT，如 S-Log3→709）；不用外部工具。
- HDR→SDR：LightCraft 用 `hdr.maxEv / hdr.sdrBrightness / hdr.sdrContrast / hdr.sdrHighlights / hdr.sdrShadows / hdr.sdrWhites / hdr.sdrClarity`（7 个映射控制）；FilmCraft 走 `lumetri` + `lut` 并核 `scopes.read`。
- LUT 资产：`lut.import/list/export`（.cube 等格式）可复用；`lut.export` 便于交接。

## 五、风格 look 与题材（用参数表达，不靠玄学）

| 题材 | 影调倾向 | 参数落点（LightCraft 为例） |
|---|---|---|
| 都市短剧 | 干净、肤色透亮 | 曝光微提、`grading.midtones` 微暖、`vibrance` +、`clarity` 微增 |
| 悬疑/权谋 | 低饱和、青冷阴影 | `grading.shadows.hue` 偏青、`saturation` −、`light.contrast` +、`vignette.amount` + |
| 回忆/怀旧 | 暖黄、柔焦、颗粒 | `wb.temp` +、`grain.amount` +、`effects.texture`、高光柔化 |
| 纪录片 | 中性、低干预 | 只做曝光/白平衡/轻微对比，`grain` 0 |
| 广告/产品 | 高对比高清晰 | `detail.sharpenAmount` +、`clarity` +、色彩干净（避免溢色） |
| 夜戏 | 保留暗部层次 | 黑位不贴底、`light.shadows` +、`denoise` 加强、`grain` 压噪点 |

**风格化铁律**：**先统一、后风格**；同一部片最多 1–2 种影调倾向，跨集沿用同一预设（保证"60 集像同一部剧"）。

## 六、常见问题速查

| 症状 | 可能原因 | 处理 |
|---|---|---|
| 全片发灰 | 黑位抬高 | 压低 `light.blacks` / 曲线暗部 |
| 肤色发黄/发青 | 白平衡或 `mixer.orange` 偏移 | 回正 `wb.tint`，核对矢量示波器肤色线 |
| 颜色结块/溢出 | 过饱和 | 降 `color.saturation`，改提 `vibrance` |
| 跨镜跳色 | 未做匹配 | `lumetri.applyMatch` + 预设复用 |
| 暗部噪点爆发 | 提亮过度/未降噪 | `detail.nrLuminance` + `denoise.*`（LightCraft 16 条） |
| 锐化出现白边 | 锐化过量 | `detail.sharpenMasking` + 降 `sharpenAmount` |
| HDR 片子在 SDR 上发闷 | 未做色调映射 | `hdr.sdr*` 七控制 / `lumetri` 映射 |

## 七、作业模板

```
1) 探      artcraft_cli { bin:"lightcraft", args:["run","--demo","develop.controls"] }  # 看可用控制
           artcraft_cli { bin:"filmcraft", args:["commands","lumetri"] }               # 看调色族
2) 统一    lumetri.applyMatch（参考帧）→ presets.save
3) 修正    一级四项 → 二级限定 → 局部遮罩
4) 核对    scopes.read（波形/矢量/直方）逐镜读数
5) 风格    Look/LUT/预设，跨镜复用
6) 交付    按 artcraft-delivery-qc 核响度与色彩空间
```
