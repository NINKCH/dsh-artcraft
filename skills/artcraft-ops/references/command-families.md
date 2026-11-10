# ArtCraft 17 成员命令族总表（实测）

> 来源：2026-11-10 在本机对 17 个成员 CLI 的 `commands` / `commands --json` / `tools` 注册表实测（家族全量更新后版本，见规模总览）。
> **精确条目数**来自 JSON 注册表（`commands --json` 返回数组：photocraft / vectorcraft / filmcraft / lightcraft / effectcraft / wordcraft / gridcraft / soundcraft / figcraft / solidcraft / craftanything；pdfcraft 用 `tools`，materialcraft 用 `commands --json`）；**近似值**为文本表 id 扫描（deckcraft / cadcraft / texturecraft / designcraft）。
> 随时复核：`artcraft_cli { bin:"<app>", args:["commands","--json"] }`（不支持 `--json` 的成员直接 `commands`）。
> 整表重刷：家族更新后在仓库里跑 `node scripts/harvest-commands.mjs --out harvest.json --diff <上一次>.json`，一条命令重测全部成员并列出新增/移除的命令 id。
> 成员装在哪里不影响调用：`artcraft.config.json` 的 `bins` 写绝对路径或安装目录，`roots[]` 写安装根目录（也可用环境变量 `ARTCRAFT_ROOTS`），`artcraft_discover` 会自动填充与纠正。

## 规模总览

| 成员 | 命令数 | 版本实测 | 定位 |
|---|---:|---|---|
| PhotoCraft | 1005（**filter 124**） | 0.22.0 | 图像 / 影调 |
| VectorCraft | 966（`object` 152 · `addon` 74） | 0.23.0 | 矢量插画 |
| EffectCraft | 761（含 **307 效果**；属性读写走 `prop.*`，`effect.setParam` 已移除） | 0.23.1 | 合成 / 动效 / VFX |
| FilmCraft | 718 | 0.19.0 | 剪辑 / 字幕 / 调色 / 混音 |
| WordCraft | 670 | 0.17.0 | 写作 / 文档 |
| FigCraft | 643 | 0.17.0 | 界面设计与原型 |
| SolidCraft | 570（`sketch` 126 / `solid` 36 / `render` 60；参数化三维 CAD） | 0.30.1 | 三维 CAD / 装配 |
| DesignCraft | 555（近似） | 0.19.0 | 页面排版 / 出版 |
| SoundCraft | 483（`midi.*`/`video.*`/`audiosuite`） | 0.19.0 | 音频后期 / 混音 |
| CADCraft | 457（**319 条扁平 id** + 族命令；近似） | 0.19.0 | 2D 制图（与 SolidCraft 三维互补） |
| LightCraft | 389（**122 develop 控制 / 18 分区**） | 0.20.0 | 照片 / RAW 冲洗 |
| GridCraft | 385 | 0.18.0 | 表格 / 数据 |
| DeckCraft | 331（近似） | 0.17.0 | 演示 / 幻灯片 |
| Craft Anything | 322（**是 agent 工具，不是引擎命令**；17 个工具集） | 0.6.0 | 软件研究 / 逆向 / 重建（非创作） |
| PdfCraft | 200（`tools` 注册表，**200 个可运行工具**） | 0.20.0 | PDF / 文档质检 |
| TextureCraft | 175（近似；`layer` 26 / `bake` 13） | 0.5.0 | 3D 纹理绘制 / 烘焙 |
| MaterialCraft | 112（`graph` 61；另有 **29 个节点**） | 0.3.0 | 节点式材质设计 |

合计 **8742** 条命令面（其中 322 为 Craft Anything 的工具面）。

## 各成员主要命令族

| 成员 | 主要族（数量） |
|---|---|
| PhotoCraft | **`filter` 124**（gallery / blur / stylize / distort / render / pixelate / noise / sharpen…） · `layer` 233 · `type` 98 · `edit` 79 · `image` 66 · `file` 60 · `select` 35 · `view` 31 · `paint` 28 · `path` 27 · `actions` 27 · `channel` 22 · `brush` 18 · `layerComp` 14 |
| VectorCraft | **`object` 152** · **`addon` 74（插件/脚本）** · `select` 55 · `text` 42 · `document` 37 · `path` 34 · `edit` 31 · `file` 28 · `type` 27 · `layer` 26 · **`symbol` 25 · `perspective` 25** · `swatch` 23 · `paint` 22 |
| FilmCraft | `graphics` 83 · `file` 57 · `clip` 57 · **`timeline` 57** · `sequence` 51 · `project` 40 · `edit` 39 · **`multicam` 35** · `markers` 33 · **`trim` 24 · `captions` 23** · `mixer` 20 · `export` 19 · `media` 17 · 另有 `lumetri` / `essentialSound` / `transcript` / `tts` / `lut` / `scopes` / `masks` |
| EffectCraft | `layer` 124 · `view` 78 · `file` 66 · **`keys` 37** · `comp` 33 · `edit` 27 · `effect` 25 · **`track` 22 · `essential` 22** · `camera` 20 · `renderQueue` 20 · **`prop` 18（替代已移除的 `effect.setParam`）** · `mask` 18 · `time` 17 · `roto` 14 · `text` 13 · `footage` 12 · `puppet` 10 · `face` 5 · `learn` 5 |
| WordCraft | `para` 59 · `table` 48 · `view` 45 · `insert` 44 · `format` 41 · **`review` 36** · `edit` 31 · `file` 30（含 `accessibility`） · `outline` 26 · `references` 25 · `text` 24 · `mailings` 23 · `equation` 21 · `layout` 18 |
| FigCraft | `text` 63 · `view` 49 · `vector` 42 · `tool` 30 · `object` 28 · `file` 24 · **`collab` 22** · `select` 21 · **`component` 21 · `proto` 21 · `board` 21** · **`variable` 19 · `library` 19** · `pref` 17 · `comment` 14 · `plugin` 11 · `style` 10 |
| SolidCraft | `sketch` 126（2D 草绘与约束） · `render` 60 · `view` 40 · **`solid` 36**（拉伸/旋转/扫掠/放样） · `component` 32 · **`timeline` 22**（特征重放） · `construct` 20 · `surface` 19 · `inspect` 19 · **`joint` 18**（装配约束） · `file` 16 · `sheet` 13（钣金） · `parameters` 13 · `motion` 11 · `appearance` 10 · `material` 8 · `plastic` 7 |
| DesignCraft | `object` 60 · `type` 43 · `file` 41 · `table` 41 · `layout` 32 · **`style` 28** · `edit` 18 · `text` 17 · `path` 15 · `swatch` 13 · `book` 10 · `guide` 10 · `xml` 10 · 另有 `toc` / `footnote` / `xref` / `index` / `preflight` / `condition` / `flex` / `variables` / `spelling` / `hyperlink` |
| SoundCraft | `view` 97 · `edit` 94 · **`track` 66** · `event` 35（含 **`beat_detective`/`identify_beat`/`extract_chords`**） · `options` 35 · `clip` 33 · **`mix` 29** · `setup` 20 · `file` 17（**`bounce_mix`/`bounce_stems`**） · `transport` 13 · **`session` 11（含 `audio_health`）** · **`automation` 10** · `markers` 6 · `engine` 6 · `midi` 6 · `video` 3 · `audiosuite` 1 |
| CADCraft | **319 条扁平 id**（`line`/`circle`/`arc`/`text`/`hatch` 等直接命令） · `table` 11 · `arc` 10 · `zoom` 9 · `layout` 7 · **`dimstyle` 7 · `blocks` 7** · `vports` 6 · `grip` 6 · `circle` 5 · `dimtedit` 5 · `layerstate` 5 · `pan` 4 · `draworder` 4 |
| LightCraft | `library` 48 · `photo` 44 · **`mask` 31** · **`develop` 29（122 个控制 / 18 分区）** · `keyword` 23 · **`faces` 21** · `print` 20 · **`denoise` 16** · `album` 15 · `slideshow` 15 · `stack` 11 · `preset` 10 · `crop` 7 · `curve` 7 |
| GridCraft | `home` 64 · `data` 41 · **`formulas` 32** · `view` 30 · `edit` 26 · **`pivot` 22** · `review` 21 · `insert` 20 · `pageLayout` 16 · `table` 14 · `file` 13 · `chart` 12 · `sheet` 10 · `macro` 9 |
| DeckCraft | `format` 47 · `shape` 37 · `slide` 22 · `table` 21 · `file` 19 · `insert` 18 · `text` 17 · `arrange` 15 · `design` 14 · `smartArt` 13 · `edit` 12 · `picture` 12 · `review` 12 · **`animation` 11** · `transition` |
| PdfCraft | `edit` 14 · `page` 11 · **`measure` 7 · `a11y` 7** · `file` 5 · `ocr` 5 · `form` 5 · `export` 4 · `comment` 3 · `sign` 2 · `protect` 2 · `optimize` 2 · 另有 **200 个可 `run` 的工具**（`doc_open` / `a11y.check` / `a11y.report` / `measure.info` / `optimize.reduce` / `standards.pdfa` / `doc.compare` / `audit` 假性涂黑检测） |
| TextureCraft | `layer` 26（绘画层） · `tool` 20 · `camera` 17 · `effect` 16 · **`textureSet` 16** · **`bake` 13**（网格贴图烘焙） · `viewport` 11 · `file` 11 · `mask` 10 · **`material` 8**（智能材质） · `project` 5 · `export` 5 · `brush` 4 · `resource` 4 |
| MaterialCraft | **`graph` 61**（建图/加节点/连线/输出/参数） · `file` 13 · `edit` 13 · `view` 8 · `folder` 5 · `package` 3 · `explorer` 3 · `library` 3 · `session` 3 · 另有 **29 个节点**（`nodes --category` 过滤） |
| Craft Anything | **322 个 agent 工具**，17 个工具集：`core` 36 · **`native` 55**（PE/ELF/Mach-O） · **`formats` 36**（wasm/EVM/sbpf/固件/游戏包） · `projects` 29 · **`adb` 24** · `browser` 22 · `setup` 20 · `application` 17 · `apple` 14 · `android` 14 · `runtime` 14 · `javascript` 11 · `frida` 9 · `managed` 8 · `java` 6 · `build` 6 · `database` 1 |

## 自发现三件套

| 需求 | 命令 |
|---|---|
| 全部命令 | `commands [--json]`（部分成员支持 `--filter TEXT`；figcraft / solidcraft / craftanything 必须加 `--json` 才是完整清单） |
| 单命令参数与前置 | `describe <id>` → params / enabled / **disabled_reason** / where |
| 能力总览 | EffectCraft：`exec app.capabilities` → 命令数 / 效果数 / 导出格式 / 表达式；Craft Anything：`capabilities [--json]` → 工具集与外部引擎就绪情况 |
| 枚举型清单 | `transition.list`（DeckCraft）· `animation.list` · `lumetri.presets` · `presets.list` · `graphics.template.list` · `lut.list` · `roto.models`（EffectCraft）· `transcript.models` · `tts.voices` · `color.spaces` · `formulas.functions`（GridCraft）· `catalog.query`（LightCraft）· `nodes [--category]`（MaterialCraft） |
| 探针 | `probe`（FilmCraft）· `info`（PhotoCraft / VectorCraft / PdfCraft / WordCraft / DeckCraft / GridCraft / CADCraft / FigCraft / SoundCraft / **MaterialCraft(.sbs) / TextureCraft(.tcraft)**）· `eval`（SolidCraft：.sc/.step/.stp 设计求值）· `develop.controls`（LightCraft） |
| 批处理 | `run --script steps.json`（PdfCraft / 多数成员）· `batch <script.json>`（MaterialCraft / TextureCraft / Craft Anything）· `run <input> <cmd> [params] -o out`（MaterialCraft / TextureCraft / EffectCraft） |

## 使用的注意点

- **参数名随成员而异**：FilmCraft/EffectCraft 用 `params` JSON；SoundCraft 用 `key=value`；LightCraft 用 `control=<id> value=<v>`；GridCraft 用 `--cmd 'id={json}'`；MaterialCraft/TextureCraft 用 `run <输入> <command-id> '<params-json>'`。
- **前置条件是硬门槛**：先 `describe`，看到 `enabled:false` 就按 `disabled_reason` 先满足条件（建轨、开工程、做选择）。
- **端口**：控制通道默认 filmcraft 9876 / effectcraft 9877 / vectorcraft 7979 / lightcraft 7980，其余动态（`app --port` 后用 `port` 直连）。MaterialCraft / TextureCraft 走 `mcp --bridge <port>` 或 `serve --port`。
- **Craft Anything 不在创作链路里**：它的 322 条是研究工具（`triage` / `rebuild` / `report`），默认 clean-room，`--deep` 才读代码、`--allow-run` 才跑代码与改设备。别把它塞进视频/图像流水线。
- **家族软件搬家要同步配置**：整套换盘符后 `bins` 里的绝对路径会全部失效，改 `roots[]` 后跑一次 `artcraft_discover` 即可自动纠正（用户显式路径仍有效时不会被动）。
