# ArtCraft 13 成员命令族总表（实测）

> 来源：2026-10 在本机对 13 个成员 CLI 的 `commands` 注册表实测。
> 精确条目数来自 JSON 注册表（`commands --json`：filmcraft / effectcraft / photocraft / gridcraft / wordcraft / figcraft），其余为 id 扫描值（近似）。
> 随时复核：`artcraft_cli { bin:"<app>", args:["commands","--json"] }`（不支持 `--json` 的成员直接 `commands`）。

## 规模总览

| 成员 | 命令数 | 版本实测 | 定位 |
|---|---:|---|---|
| EffectCraft | 731（含 **307 效果**） | 0.10.0 | 合成 / 动效 / VFX |
| FilmCraft | 701 | 0.8.0 | 剪辑 / 字幕 / 调色 / 混音 |
| FigCraft | 552 | — | 界面设计与原型 |
| SoundCraft | 478 | 0.7.0 | 音频后期 / 混音 |
| VectorCraft | 385 | 0.11.0 | 矢量插画 |
| PhotoCraft | 364（**62 滤镜**） | 0.9.0 | 图像 / 影调 |
| WordCraft | 299 | 0.7.0 | 写作 / 文档 |
| DesignCraft | 279 | 0.8.0 | 页面排版 / 出版 |
| LightCraft | 192（**122 develop 控制**） | 0.8.0 | 照片 / RAW 冲洗 |
| DeckCraft | 165 | 0.7.0 | 演示 / 幻灯片 |
| CADCraft | 139 | 0.7.0 | 制图 |
| GridCraft | 115 | 0.7.0 | 表格 / 数据 |
| PdfCraft | 71（**86 个可运行工具**） | 0.8.0 | PDF / 文档质检 |

## 各成员主要命令族

| 成员 | 主要族（数量） |
|---|---|
| FilmCraft | `graphics` 82 · `clip` 57 · `file` 57 · **`timeline` 56** · `sequence` 45 · `project` 40 · `edit` 39 · **`multicam` 35** · `markers` 32 · **`trim` 24** · **`captions` 22** · `mixer` 20 · `export` 19 · `effects` 16 · **`transcript` 14** · `masks` 12 · `essentialSound` 9 · **`lumetri` 7** · **`tts` 7** · `lut` 4 · `scopes` 1 · `color` 1 |
| EffectCraft | `layer` 121 · `view` 78 · `file` 61 · **`keys` 36** · `comp` 31 · `edit` 27 · **`track` 22** · **`essential` 22** · `renderQueue` 20 · `effect` 19 · **`camera` 19** · `prop` 18 · `mask` 17 · `time` 17 · **`roto` 14** · `text` 13 · `footage` 12 · **`puppet` 10** |
| FigCraft | `text` 52 · `view` 48 · `vector` 40 · `object` 27 · `tool` 21 · `select` 21 · **`component` 21** · `collab` 20 · `file` 20 · **`proto` 20** · `library` 18 · **`variable` 18** · `edit` 15 · `comment` 14 · `plugin` 11 · **`style` 10** · `version` 8 · `instance` 8 · `annotation` 8 · `branch` 7 |
| SoundCraft | `view` 96 · `edit` 93 · **`track` 65** · `event` 35（含 **`beat_detective`/`identify_beat`/`extract_chords`**） · `options` 35 · `clip` 31 · **`mix` 29** · `setup` 20 · `file` 17（**`bounce_mix`/`bounce_stems`**） · `transport` 13 · **`session` 11（含 `audio_health`）** · **`automation` 10** |
| VectorCraft | **`object` 71** · **`perspective` 24** · `select` 18 · `file` 17 · `swatch` 15 · `document` 12 · `layer` 11 · `path` 11 · **`symbol` 10** · **`dataset` 10** |
| PhotoCraft | **`filter` 62**（gallery 47 / blur 11 / stylize 9 / distort 9 / render 9 / pixelate 7 / blurGallery 5 / noise 5 / sharpen 5 …） · `edit` 31 · `layer` 26 · `select` 19 · `file.automate` 18 · `channel` 18 · **`actions` 14** · `brush` 13 · `paint` 12 · `gradient` 12 · **`image.adjustments` 9** |
| WordCraft | `para` 28 · `format` 25 · `file` 18（含 `accessibility`） · **`review` 16** · `equation` 15 · `insert` 15 · `table` 14 · `view` 13 · `select` 12 · `picture` 11 · `styles` 11 · **`references` 10** · `mailings` 9 |
| DesignCraft | `object` 22 · **`style` 17** · `file` 15 · `transform` 10 · `data` 10 · `type` 10 · `library` 8 · `layout` 7 · `book` 7 · `article` 6 · `table` 7 |
| LightCraft | `library` 20 · **`faces` 17** · **`denoise` 16** · **`develop` 16（122 控制 / 14 分区）** · `photo` 14 · `mask` 12 · `keyword` 12 · `preset` 9 · `crop` 6 · `stack` 6 · `version` 5 · `history` 5 |
| DeckCraft | `format` 32 · `shape` 19 · `slide` 15 · `file` 13 · **`animation` 10** · `text` 10 · `edit` 9 · `media` 7 · `insert` 7 · `arrange` 7 · **`design` 5** · **`transition` 4** |
| CADCraft | `table` 11 · `arc` 10 · `zoom` 9 · **`dimstyle` 7** · `blocks` 6 · `grip` 6 · `layout` 6 · `layerstate` 5 · `vports` 5 · `circle` 5 |
| GridCraft | `home` 12 · **`pivot` 11** · `insert` 10 · **`data` 10** · `view` 9 · `sheet` 8 · `edit` 7 · `file` 7 · `selection` 6 · **`formulas` 5** · `chart` 3 · `slicer` 3 |
| PdfCraft | `edit` 13 · `page` 10 · **`measure` 7** · **`a11y` 5** · `export` 4 · `ocr` 3 · `form` 3 · `comment` 3 · `protect` 2 · `sign` 2（另有 86 个可 `run` 的工具，含 `a11y.check`/`a11y.report`/`measure.info`/`optimize.reduce`/`standards.pdfa`/`doc.compare`） |

## 自发现三件套

| 需求 | 命令 |
|---|---|
| 全部命令 | `commands [--json]`（部分成员支持 `--filter TEXT`） |
| 单命令参数与前置 | `describe <id>` → params / enabled / **disabled_reason** / where |
| 能力总览 | EffectCraft：`exec app.capabilities` → 命令数 / 效果数 / 导出格式 / 表达式 |
| 枚举型清单 | `transition.list`（DeckCraft）· `animation.list` · `lumetri.presets` · `presets.list` · `graphics.template.list` · `lut.list` · `roto.models`（EffectCraft）· `transcript.models` · `tts.voices` · `color.spaces` · `formulas.functions`（GridCraft）· `catalog.query`（LightCraft） |
| 探针 | `probe`（FilmCraft）· `info`（PhotoCraft/VectorCraft/PdfCraft/WordCraft/DeckCraft/GridCraft/CADCraft/FigCraft/SoundCraft）· `develop.controls`（LightCraft） |

## 使用的注意点

- **参数名随成员而异**：FilmCraft/EffectCraft 用 `params` JSON；SoundCraft 用 `key=value`；LightCraft 用 `control=<id> value=<v>`；GridCraft 用 `--cmd 'id={json}'`。
- **前置条件是硬门槛**：先 `describe`，看到 `enabled:false` 就按 `disabled_reason` 先满足条件（建轨、开工程、做选择）。
- **端口**：控制通道默认 filmcraft 9876 / effectcraft 9877 / vectorcraft 7979 / lightcraft 7980，其余动态（`app --port` 后用 `port` 直连）。
