# ArtCraft 13 成员命令族总表（实测）

> 来源：2026-10-21 在本机对 13 个成员 CLI 的 `commands` 注册表实测（家族全量更新后版本，见规模总览）。
> 精确条目数来自 JSON 注册表（`commands --json`：filmcraft / effectcraft / photocraft / gridcraft / wordcraft / figcraft），其余为 id 扫描值（近似）。
> 随时复核：`artcraft_cli { bin:"<app>", args:["commands","--json"] }`（不支持 `--json` 的成员直接 `commands`）。

## 规模总览

| 成员 | 命令数 | 版本实测 | 定位 |
|---|---:|---|---|
| EffectCraft | 731（含 **307 效果**；**`effect.setParam` 已移除，属性读写走 `prop.*`**） | 0.13.0 | 合成 / 动效 / VFX |
| PhotoCraft | 918（**62 滤镜**；0.11 编辑器命令大量上引擎） | 0.11.1 | 图像 / 影调 |
| FigCraft | 569 | 0.8.0 | 界面设计与原型 |
| WordCraft | 633 | 0.9.0 | 写作 / 文档 |
| SoundCraft | 480（**0.10 新增 `midi.*`/`video.*`/`audiosuite`**） | 0.10.0 | 音频后期 / 混音 |
| VectorCraft | 401（**0.14 新增 `text`/`variable`/`pdf.preset`/`print`**） | 0.14.0 | 矢量插画 |
| FilmCraft | 701 | 0.10.0 | 剪辑 / 字幕 / 调色 / 混音 |
| LightCraft | 227（**122 develop 控制**；**0.10 新增 `print.*` 模板与 `slideshow.export`**） | 0.10.0 | 照片 / RAW 冲洗 |
| DesignCraft | 309（**0.10 新增 `toc`/`footnote`/`xref`/`index`/`preflight`**） | 0.10.0 | 页面排版 / 出版 |
| DeckCraft | 209 | 0.9.0 | 演示 / 幻灯片 |
| PdfCraft | 77（**86 个可运行工具**；新增 `create`/`text_edit`） | 0.10.1 | PDF / 文档质检 |
| CADCraft | 139 | 0.10.0 | 制图 |
| GridCraft | 341 | 0.9.0 | 表格 / 数据 |

## 各成员主要命令族

| 成员 | 主要族（数量） |
|---|---|
| FilmCraft | `graphics` 82 · `clip` 57 · `file` 57 · **`timeline` 56** · `sequence` 45 · `project` 40 · `edit` 39 · **`multicam` 35** · `markers` 32 · **`trim` 24** · **`captions` 22** · `mixer` 20 · `export` 19 · `effects` 16 · **`transcript` 14** · `masks` 12 · `essentialSound` 9 · **`lumetri` 7** · **`tts` 7** · `lut` 4 · `scopes` 1 · `color` 1 |
| EffectCraft | `layer` 121 · `view` 78 · `file` 61 · **`keys` 36** · `comp` 31 · `edit` 27 · **`track` 22** · **`essential` 22** · `renderQueue` 20 · `effect` 19 · **`camera` 19** · **`prop` 18（替代已移除的 `effect.setParam`）** · `mask` 17 · `time` 17 · **`roto` 14** · `text` 13 · `footage` 12 · **`puppet` 10** · `face` 5（0.13 新增） · `learn` 5（0.13 新增） |
| FigCraft | `text` 52 · `view` 48 · `vector` 40 · `object` 27 · `tool` 21 · `select` 21 · **`component` 21** · `collab` 20 · `file` 20 · **`proto` 20** · `library` 18 · **`variable` 18** · `edit` 15 · `comment` 14 · `plugin` 11 · **`style` 10** · `version` 8 · `instance` 8 · `annotation` 8 · `branch` 7 |
| SoundCraft | `view` 96 · `edit` 93 · **`track` 65** · `event` 35（含 **`beat_detective`/`identify_beat`/`extract_chords`**） · `options` 35 · `clip` 31 · **`mix` 29** · `setup` 20 · `file` 17（**`bounce_mix`/`bounce_stems`**） · `transport` 13 · **`session` 11（含 `audio_health`）** · **`automation` 10** · **`midi` 6 · `video` 3 · `audiosuite` 1（0.10 新增）** |
| VectorCraft | **`object` 71** · **`perspective` 24** · `select` 18 · `file` 17 · `swatch` 15 · `document` 12 · **`text` 10 · `variable` 9 · `brush` 9 · `library` 9 · `print` 9（0.14 新增）** · `layer` 11 · `path` 11 · **`symbol` 10** · **`dataset` 10** · **`pdf.preset` 5 · `flattener` 6（0.14 新增）** |
| PhotoCraft | **`filter` 62**（gallery 47 / blur 11 / stylize 9 / distort 9 / render 9 / pixelate 7 / blurGallery 5 / noise 5 / sharpen 5 …） · `edit` 31 · `layer` 26 · `select` 19 · `file.automate` 18 · `channel` 18 · **`actions` 14** · `brush` 13 · `paint` 12 · `gradient` 12 · **`image.adjustments` 9** · **0.11 新增引擎化：`type` 9 · `shape` 9 · `path` 9 · `pattern` 10 · `swatches` 9 · `slice` 6 · `variables`/`jobs`/`plugin`** |
| WordCraft | `para` 28 · `format` 25 · `file` 18（含 `accessibility`） · **`review` 16** · `equation` 15 · `insert` 15 · `table` 14 · **0.9 新增：`edit` 10 · `outline` 8 · `caret` 7 · `layout` 7 · `arrange` 9 · `draw` 9 · `shape` 6 · `canvas` 4 · `fields` 6 · `design` 4 · `hf` 3 · `developer` 3** |
| DesignCraft | `object` 22 · **`style` 17** · `file` 15 · `transform` 10 · `data` 10 · `type` 10 · **0.10 新增：`toc` 3 · `footnote` 4 · `xref` 3 · `index` 3 · `preflight.run` · `condition` 5 · `flex` 5 · `xml` 4 · `variables` 4 · `spelling` 3 · `hyperlink` 4** · `layout` 7 · `book` 7 · `article` 6 |
| LightCraft | `library` 20 · **`faces` 17** · **`denoise` 16** · **`develop` 16（122 控制 / 14 分区，未变）** · **0.10 新增：`print` 17（版式模板 cell/layout/template）· `slideshow.export`** · `photo` 14 · `mask` 12 · `keyword` 12 · `preset` 9 · `crop` 6 · `stack` 6 · `version` 5 · `history` 5 |
| DeckCraft | `format` 32 · `shape` 19 · `slide` 15 · `file` 13 · **`animation` 10** · `text` 10 · **0.9 新增：`picture` 9 · `comment` 7 · `review` 7 · `table` 5 · `chart` 3 · `master` 2 · `handout` 1** · `media` 7 · `insert` 7 · `arrange` 7 · **`design` 5** · **`transition` 4** |
| CADCraft | `table` 11 · `arc` 10 · `zoom` 9 · **`dimstyle` 7** · `blocks` 6 · `grip` 6 · `layout` 6 · `layerstate` 5 · `vports` 5 · `circle` 5 · **0.10 新增：`compare` 2 · `quickcalc` · `revcloud` 2 · `constraints` 2** |
| GridCraft | `home` 12 · **`pivot` 11** · `insert` 10 · **`data` 10** · **0.9 新增：`cell` 2 · `range` · `table` 3 · `object` 2 · `link` · `draw` 4 · `review` 2 · `window`** · `view` 9 · `sheet` 8 · `edit` 7 · `file` 7 · `selection` 6 · **`formulas` 5** · `chart` 3 |
| PdfCraft | `edit` 13 · `page` 10 · **`measure` 7** · **`a11y` 5** · `export` 4 · `ocr` 3 · `form` 3 · `comment` 3 · `protect` 2 · `sign` 2 · **0.10 新增：`create`（新建 PDF）· `text_edit` · `form_fields` · `standards`**（另有 86+ 个可 `run` 的工具，含 `a11y.check`/`a11y.report`/`measure.info`/`optimize.reduce`/`standards.pdfa`/`doc.compare`） |

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
