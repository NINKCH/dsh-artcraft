---
name: artcraft-ops
description: ArtCraft 家族 13 个应用的调用基本功——用哪个成员、走哪条通道（无头 CLI / 控制通道 / HTTP 任务）、怎么自发现命令与前置条件、怎么探-改-验、长任务与批量怎么编排。任何要驱动 ArtCraft 家族完成视频/图像/音频/文档后期的任务，先读本技能再动手。
---

# ArtCraft 家族调用基本功

ArtCraft 是 13 个同源桌面应用的家族，**每个菜单项、滑块、对话框都是一条命令**；同一套命令既能从无头 CLI 调用，也能走运行中应用的 JSON 控制通道。本技能教你"怎么调得顺"，不涉及创作判断（创作判断见 artcraft-shot-language / edit-rhythm / color-light / sound-design / motion-vfx / delivery-qc）。

## 一、成员职责矩阵（先选对人）

| 需求 | 成员 | 关键命令族 |
|---|---|---|
| 图像编辑、批处理、动作 | **PhotoCraft** | `filter.*`(62 滤镜) `image.adjustments.*` `actions.*` `file.automate.*` |
| 矢量插画、透视作图、数据驱动图形 | **VectorCraft** | `object.*` `perspective.*` `dataset.*` `symbol.*` |
| 剪辑、字幕、转写、多机位、调色、混音 | **FilmCraft** | `timeline.*` `trim.*` `captions.*` `transcript.*` `graphics.*` `lumetri.*` `essentialSound.*` `multicam.*` `tts.*` |
| 照片库、RAW 冲洗、批量影调 | **LightCraft** | `develop.*`(122 控制) `preset.*` `mask.*` `crop.*` `denoise.*` |
| PDF 阅读/整理/保护/OCR/无障碍 | **PdfCraft** | `page.*` `edit.*` `ocr.*` `measure.*` `a11y.*` `protect.*` |
| 合成、动效、跟踪、抠像、3D 机位 | **EffectCraft** | `effect.*`(307 效果) `keys.*` `essential.*` `track.*` `roto.*` `camera.*` `puppet.*` |
| 页面排版、出版、表格排版 | **DesignCraft** | `object.*` `style.*` `type.*` `layout.*` `book.*` `article.*` |
| 写作、修订、文献引用 | **WordCraft** | `para.*` `format.*` `styles.*` `review.*` `references.*` |
| 演示、幻灯片、动效转场 | **DeckCraft** | `slide.*` `shape.*` `animation.*` `transition.*` `design.*` |
| 表格、数据、透视表、图表 | **GridCraft** | `formulas.*` `data.*` `pivot.*` `chart.*` `slicer.*` |
| 制图、标注、图纸布局 | **CADCraft** | `arc.*` `circle.*` `dimstyle.*` `layout.*` `vports.*` `blocks.*` |
| 音频录制/编辑/混音/母带 | **SoundCraft** | `mix.*` `automation.*` `track.*` `event.*` `file.bounce_*` |
| UI/设计系统、原型、Dev 交付 | **FigCraft** | `component.*` `instance.*` `variable.*` `style.*` `proto.*` `inspect.*` |

跨界组合是常态：**剪辑在 FilmCraft，合成元素在 EffectCraft，影调可走 LightCraft，声音在 SoundCraft，分镜图文用 DeckCraft/DesignCraft/FigCraft，数据用 GridCraft**。

## 二、三条通道怎么选（最关键的一步）

| 通道 | 何时用 | 入口 |
|---|---|---|
| **无头 CLI** | 一次性、可批处理、可脚本、要确定性产物 | `artcraft_cli { bin, args }` |
| **控制通道**（运行中的 App） | 要"边看边调"、要读界面状态、要截图验证 | `artcraft_control { app\|port, method, params }` |
| **HTTP 任务** | 长渲染（分钟~小时），不能占住请求 | `POST /artcraft/api/job` → 轮询 → `GET /artcraft/api/file` |

控制通道默认端口：`filmcraft 9876`、`effectcraft 9877`、`vectorcraft 7979`、`lightcraft 7980`。其余成员端口动态：以 `app --port PORT` 启动后，向 `artcraft_control` 传 `port` 直连。PhotoCraft 控制通道是令牌鉴权变体、PdfCraft 是文件式（`--control FILE`），两者走无头 CLI。

**判断口诀**：能一次跑完 → CLI；需要中途看/改 → 控制通道；超过 1 分钟 → HTTP 任务。

## 三、自发现三件套（不要背命令，要会查）

| 机制 | 用法 | 得到什么 |
|---|---|---|
| `commands [--json]` | `artcraft_cli { bin:"filmcraft", args:["commands","--json"] }` | 全量命令：id / label / 菜单路径 / params / 快捷键 |
| **`describe <id>`** | `artcraft_cli { bin:"soundcraft", args:["describe","file.bounce_stems"] }` | params + `enabled` + **`disabled_reason`** + `where:`（界面位置） |
| `exec app.capabilities` | EffectCraft 专用 | 命令数 / 效果数 / 导出格式 / 表达式支持 |

`describe` 是"顺畅"的关键：**先问能不能跑，再跑**。典型 `disabled_reason`：「make an edit selection first」「the session has no tracks」——看到就先满足前置条件，别硬跑。

枚举服务（要用哪个清单就调哪个）：

| 要什么 | 调什么 |
|---|---|
| 转场清单 | DeckCraft `transition.list`；FilmCraft `sequence.applyVideoTransition`（params 内枚举） |
| 动画预设 | FilmCraft `animation.list`(DeckCraft 同名) |
| 调色预设 | FilmCraft `lumetri.presets` / `presets.list`；LightCraft `preset.*` |
| LUT | FilmCraft `lut.list`；LightCraft `develop.controls` |
| 图形模板 | FilmCraft `graphics.template.list`（.fcgt，支持 `values` 传参渲染） |
| 语音模型 / 音色 | FilmCraft `transcript.models` / `tts.voices` |
| 抠像模型 | EffectCraft `roto.models`（可 `roto.model.download`） |
| 色彩空间 | FilmCraft `color.spaces` |
| 示波器 | FilmCraft `scopes.read`（waveform/parade/histogram/vectorscope…） |
| 表格函数 | GridCraft `formulas.functions` |
| 素材目录检索 | LightCraft `catalog.query` / `catalog.stats` |

## 四、纪律：探 → 改 → 验

1. **探**：任何媒体在动手前先探——`photocraft info`、`filmcraft probe`、`pdfcraft info`、`soundcraft info`、`lightcraft run app.info`、`vectorcraft info`、`wordcraft info`、`deckcraft info`、`gridcraft info`、`cadcraft info`、`figcraft info`。用**实测事实**（时长/帧率/分辨率/色彩/音轨布局）决定策略，不要凭文件名猜。
2. **改**：
   - **无损优先**：能流拷贝就流拷贝（`-c copy` 类操作），只在必须时重编码（精确到帧的剪切、滤镜、格式变换）。
   - **关键帧对齐**：流拷贝剪切会落到最近的关键帧；要求精确到帧就显式要求重编码。
   - **一次一步**：改一步、验一步；不要连续叠三步无法定位的重编码。
3. **验**：产物必须复核——`probe`/`info` 看客观参数；画面类改动用 `ui.screenshot`（EffectCraft/FilmCraft 控制通道）或 `photocraft render`/`deckcraft render` 出图，**由你（多模态）亲眼确认**，而不是相信退出码 0。

## 五、长任务与批量

- **长渲染**：`POST /artcraft/api/job { bin, args, outputs }` 拿到 `id` → `GET /artcraft/api/job?id=…&tail=30` 轮询 `status`（running/done/failed/timeout）与 `outputs[].exists` → `GET /artcraft/api/file` 取回。不要用 CLI 同步阻塞几十分钟。
- **批处理**：
  - PhotoCraft：`batch --actions <actions.json> --in <dir> --out <dir>`；或 `droplet <file.pcdroplet>`
  - FilmCraft：`run <script.jsonl>`（每行一条 `{"id","params"}`，`#` 可注释）
  - DeckCraft/DesignCraft/SoundCraft：`run [--cmd 'id={json}']…` 或 `script <file>`
  - FigCraft：`run <script.json|jsonl>`
  - GridCraft：`--script FILE.jsonl`
- **批量共通**：先在一份样本上跑通，再全量；输入/输出目录分开，**绝不覆盖原片**（家族多数工具默认新文件名，如需覆盖要显式授权）。

## 六、路径与产物约定（本插件只是桥）

- 路径由调用方决定，**必须绝对路径**；对话调用落在当前工作空间，画布调用落在项目目录。
- 推荐三件套布局：`media/`（素材）· `craft/`（工程文件与中间产物）· `out/`（成片与交付物）。
- 工程文件随成员而异：`.pcraft`（PhotoCraft）· `.fcproj`（FilmCraft）· `.ecproj`（EffectCraft）· `.scraft`（SoundCraft）· `.figcraft`（FigCraft）· `.mlt` 类交换走 FilmCraft `file.exportInterchange`。
- 跨成员交付用交换格式：**FilmCraft `file.exportInterchange` 支持 edl / xml / fcpxml / otio / aaf / omf**；音频交接用 `file.exportAaf`/`file.exportOmf`（含 handles、breakoutToMono）。

## 七、常见失败与对策

| 症状 | 原因 | 对策 |
|---|---|---|
| 命令报 unknown command | 版本差异或写错 id | 先 `commands [--json]` 或 `commands <filter>` 核对 |
| `enabled:false` | 前置条件未满足 | 读 `disabled_reason`，先做选择/建轨/开工程 |
| 剪切点偏移 | 流拷贝对齐关键帧 | 要求帧精确（重编码）或接受关键帧吸附 |
| 手机/录屏素材时间轴错乱 | 可变帧率(VFR) | 先探 VFR，必要时先统一恒定帧率 |
| 路径错误 | 传了相对路径 | 一律绝对路径（或 base + rel 组合） |
| 控制通道连不上 | App 未以 `--control` 启动 | 先启动带控制通道的实例，或改用无头 CLI |
| 产物"看起来没生效" | 只信退出码 | 探产物 + 出图复核 |

## 八、最小工作流模板

```
1) 探    artcraft_cli { bin:"<app>", args:["info"|"probe", "<file>"] }
2) 查    artcraft_cli { bin:"<app>", args:["commands","--json"] }        # 找到族
         artcraft_cli { bin:"<app>", args:["describe","<id>"] }          # 看 params/前置
3) 干    短任务 → artcraft_cli；要看/要改 → artcraft_control；长任务 → HTTP job
4) 验    probe/info + 出图复核（ui.screenshot / render）
5) 交    out/ 下命名规范产物；需要跨软件 → file.exportInterchange
```
