<div align="center">

# ArtCraft Bridge

**用 DeepSeek Harness 在对话里、或在你的前端界面中，驱动开源创作套件 ArtCraft —— PhotoCraft · FilmCraft · EffectCraft**

[English](README.md) | [简体中文](README.zh-CN.md)

`@ninkch/dsh-artcraft` · DeepSeek Harness 插件 · Apache-2.0

</div>

---

## 为什么做这个

[ArtCraft](https://getartcraft.com/apps) 是一套用纯 Rust 从零重写的免费公平源代码（fair source）
Adobe 对标工具，共 **13 个应用**：**PhotoCraft**（Photoshop）、**VectorCraft**（Illustrator）、
**FilmCraft**（Premiere Pro）、**LightCraft**（Lightroom）、**PdfCraft**（Acrobat）、
**EffectCraft**（After Effects）、**DesignCraft**（InDesign）、**WordCraft**（Word）、
**DeckCraft**（PowerPoint）、**GridCraft**（Excel）、**CADCraft**（AutoCAD）、**SoundCraft**
（Pro Tools）、**FigCraft**（Figma）。它们有一个大多数桌面软件都不具备的共同基因：**每个菜单项、
滑块、对话框都是一条命令**，而同一套命令既能从无头 CLI 调用，也能走 JSON 控制通道或 MCP——
这些 App 从第一天起就是为 agent 设计的。

本插件把这套自动化面接进 DeepSeek Harness，让 AI 不只是"谈论"这些软件，而是真的**操作**它们：

- **对话里** —— 九个 Agent 工具，任何 Harness 会话都能检查工具链、执行 CLI 命令、向运行中的
  App 发控制通道命令、做桥接文件操作、跑交付质检、查每个应用的能力目录。
- **随插件分发的技能包** —— 十一个技能（`artcraft-ops`、`artcraft-shot-language`、
  `artcraft-edit-rhythm`、`artcraft-color-light`、`artcraft-sound-design`、`artcraft-motion-vfx`、
  `artcraft-delivery-qc`、`artcraft-style-bible`、`artcraft-film-study`、`artcraft-batch-pipeline`、
  `artcraft-multicam`）教 agent 怎么调得顺、什么时候用哪种效果、镜头语言与节奏怎么设计、
  影调/声音/交付怎么把关、跨集一致性怎么锁、怎么把一部片拆成可回溯的证据、怎么做批量流水线、
  怎么剪多机位。随包内置、按需加载（英文索引见 `skills/README.md`）。
- **浏览器里** —— 同源 HTTP API（`/artcraft/api/*`），任何 Harness 前端都能直接调用：无 CORS、
  无密钥。它为 [无限画布 / infinite-canvas](../dsh-infinite_canvas/README.md)（节点式 AI 短剧
  分镜画布）而建，但任何前端都可用。
- **路径由调用方决定** —— 本插件只是桥接，不持有数据目录：对话调用默认落在当前对话工作空间
  （或提示词指定的任意位置）；画布调用则写在自己项目目录下。

典型的 AI 短剧闭环：模型生成分镜图 → PhotoCraft 批量调色锐化 → EffectCraft 渲染动态片头 →
FilmCraft 剪辑、调色、混音、烧字幕 → 导出 H.264。"生成"之后的每一步都由本插件无头驱动。

## 整体结构

```
┌──────────────── DeepSeek Harness 网页端（浏览器）────────────────┐
│   以无限画布为例：① 上传资产  ② 发起任务  ③ 取回产物              │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼  同源 fetch，无 CORS
┌──────────────── DSH Host · @ninkch/dsh-artcraft ────────────────┐
│   HTTP 路由 /artcraft/api/*   +   Agent 工具 artcraft_*           │
│        → 子进程（各 CLI）        → TCP 控制通道                     │
└──────┬───────────────────────┬───────────────────────┬───────────┘
       ▼                       ▼                       ▼
  photocraft-cli          filmcraft-cli          effectcraft-cli
  批量调色、PSD 编辑       EDL/XML 进出、剪辑调色  .ecproj(JSON) 渲染、
  （无头）                 混音导出                Lottie 导出
       └───────────────────────┴───────────────────────┘
                               ▼
              产物位置由调用方决定（对话 → 当前工作空间 · 画布 → 项目目录）
```

全流程本地运行：不联网、无账号、无遥测。

## 环境要求

- **DeepSeek Harness** 桌面版（Harness 支持的任意平台）。
- **ArtCraft 应用** —— 从 [getartcraft.com](https://getartcraft.com/apps) 或
  [storytold GitHub Releases](https://github.com/storytold) 按需下载。Windows 与 Linux 的
  portable/安装包内置 CLI（`photocraft-cli.exe` 等）；macOS 的 CLI 是单独的公证 zip。
  已验证版本：PhotoCraft 0.6、FilmCraft 0.5、EffectCraft（早期构建）。
- 其他什么都不需要：无 Python、无 FFmpeg —— ArtCraft 自带编解码器。

## 安装

**1. 把本仓库放到磁盘任意位置**（放进 Harness 工作区、与其他本地插件平级是惯例）。

**2. 在 Harness profile 中注册。** profile 是一个 pnpm 包目录：
`C:\Users\<你>\.dsh\profiles\<profile>\`（桌面版默认 `desktop`）。改两处：

```jsonc
// profile 下的 package.json
{
  "dependencies": {
    // ...已有依赖...
    "@ninkch/dsh-artcraft": "^0.1.1",                                    // ← 来自 npm
    // 或者，本地开发时用 link 指向本仓库：
    // "@ninkch/dsh-artcraft": "link:D:/code/deepseek-plugin/dsh-artcraft"
  },
  "dsh": { "profile": { "bundles": [
    // ...已有 bundles...
    "@ninkch/dsh-artcraft"                                               // ← 加入白名单
  ] } }
}
```

然后建立链接并重启一次 Harness（Host 侧代码只在启动时加载）：

```sh
pnpm install --dir C:/Users/<你>/.dsh/profiles/desktop
```

> 若你的 Harness 版本带有"从文件夹安装插件"的管理界面，用它也行 —— 最终落盘的就是上面两行。

**3. 配置** `artcraft.config.json`（从 `artcraft.config.json.example` 复制）。推荐放
`C:\Users\<你>\.dsh\artcraft.config.json`（持久，更新插件不丢）；放在 `index.js` 旁也可（旧版兼容）。
文件已 gitignore，且每次请求都会重读 —— 改路径无需重启：

```jsonc
{
  "bins": {
    // 三种写法：目录（自动拼接 <名>-cli 可执行文件）、完整 exe 路径、或走 PATH 的裸命令名
    "photocraft":  "C:/craft/photocraft-0.6.0-windows-x64-portable",
    "filmcraft":   "C:/craft/filmcraft-0.5.0-windows-x64-portable",
    "effectcraft": "C:/Program Files/EffectCraft"
  },
  "control": { "filmcraft": 9876, "effectcraft": 9877 }
}
```

**4. 验证。** 在任意 Harness 对话里让 AI 执行 `artcraft_status`，`bins.*.found` 全绿即就绪。

## 在对话里驱动

插件注册四个工具，agent 自行编排，所以自然语言直接可用：

> *"把 `demo/media` 里的 PNG 都用柔和 S 曲线调色、智能锐化 80，结果放进 `demo/out/graded`。"*

这句话背后通常是：

```
artcraft_cli  { bin:"photocraft", args:["batch","--actions","demo/craft/grade.json",
                                        "--in","demo/media","--out","demo/out/graded"] }
```

| 工具 | 用途 |
|---|---|
| `artcraft_status` | 工具体检：12 个 CLI 是否找到、配置目录、控制端口、进行中的任务 |
| `artcraft_cli` | 同步执行任意 CLI 子命令（`photocraft-cli run/batch`、`wordcraft-cli convert` 等） |
| `artcraft_control` | 向**运行中**的 App 控制通道发一条命令（filmcraft 9876 / effectcraft 9877 / vectorcraft 7979 / lightcraft 7980，或 port 直连） |
| `artcraft_fs` | 桥接文件操作 —— list / stat / 读 / 写 / 建目录，路径由调用方绝对指定 |
| `artcraft_discover` | 家族安装自动探测：填充缺失路径、自动纠正失效路径 |
| `artcraft_apps` | 13 应用能力目录：每个应用的 CLI 子命令、控制端口、MCP、仓库/文档链接 + 实测命令族统计 |
| `artcraft_qc` | 交付质检：家族探针 + 平台规格核对，返回 ok/warn/fail/manual 与修复命令（video/audio/image/pdf/doc/sheet/deck/fig/cad） |
| `artcraft_live` | 控制通道活性探测：哪些 App 正开着（可直接"边看边调"） |
| `artcraft_recipes` | 内置专家配方（8 套）**与 14 条「任务→技能→命令链」编排**（短剧成片、剧本到分镜、RAW 冲洗、拉片分析、音频后期、合成镜头、设计系统、文档交付、批量横转竖、封面包装、多语言字幕、素材清理修复、社交分包、长素材切片） |
| `artcraft_update` | 插件自身更新（检查 / 应用） |

## 在浏览器里驱动

同源 HTTP，JSON 进出。核心模式是**任务生命周期**——发起、轮询、取回，长渲染不占用请求周期：

```
POST /artcraft/api/job      { "bin":"effectcraft",
                              "args":["render","--comp","Main",
                                      "--out","demo/out/intro.mp4","demo/craft/intro.ecproj"],
                              "outputs":["demo/out/intro.mp4"] }
                         →  { "id":"7f2c…" }

GET  /artcraft/api/job?id=7f2c…&tail=30
                         →  { "status":"running|done|failed|timeout",
                              "stdout":"…尾部日志…", "stderr":"…",
                              "outputs":[{"rel":"demo/out/intro.mp4","exists":true,"size":812345}] }

GET  /artcraft/api/file?rel=demo/out/intro.mp4        → 原始字节（流式）
POST /artcraft/api/job/cancel  { "id":"7f2c…" }
```

全部路由：

| 路由 | 用途 |
|---|---|
| `GET /artcraft/api/status` | 工具体检（与 `artcraft_status` 同数据） |
| `POST /artcraft/api/fs?action=write&path=…` | 写文件 —— 绝对 `path`，原始字节流（Blob 直传）或 JSON `{base, rel, text\|base64}` |
| `GET /artcraft/api/fs?op=list\|stat\|readtext&path=…` | 读目录、元数据、小文本 |
| `GET /artcraft/api/file?path=…` | 下载文件 —— 流式，上限 2 GB |
| `POST /artcraft/api/job` · `GET ?id=…` · `POST /artcraft/api/job/cancel` | 任务生命周期，含产物探测与日志尾部 |
| `POST /artcraft/api/control` | 控制通道同步调用（`app` 或 `port`） |
| `GET /artcraft/api/apps[?id=…]` | 家族能力目录（13 应用 + 命令族统计） |
| `GET /artcraft/api/qc?path=…[&platform=…][&kind=…]` | 交付质检：平台规格核对 + 修复建议 |
| `GET /artcraft/api/skills` | 内置技能包清单（11 技能 + 各自参考文件） |
| `GET /artcraft/api/live[?ports=app:port,…]` | 控制通道活性（哪些 App 正开着） |
| `POST /artcraft/api/discover` | 家族安装探测 + 配置自动修复 |
| `GET /artcraft/api/update/check` · `POST /artcraft/api/update/apply` | 插件自更新 |

上传单次上限 320 MB（原始路径 Blob 直传，无需 base64）；下载流式上限 2 GB。
所有路径参数为**绝对路径**（或 `base` 绝对目录 + 相对 `rel`）—— 位置由调用方决定：
对话调用指向当前工作空间，画布调用指向其项目目录。

## 控制通道：驱动正在运行的 App

CLI 是无头、一次性的。想边看边调 —— 调色、扒片 —— 就带控制通道启动桌面 App，实时对话：

```sh
filmcraft --control 9876      # 或设 FILMCRAFT_CONTROL_PORT；仅回环监听
```

```jsonc
POST /artcraft/api/control
{ "app": "filmcraft", "method": "engine.execute",
  "params": { "command": "timeline.place",
              "params": { "item": 1, "track": "V1", "seconds": 0, "duration": 1270080000000 } } }

// 给 87 号片段上一条 Lumetri 曲线……
{ "command": "effects.setParam",
  "params": { "clip": 87, "effect": "lumetri", "param": "curve_luma",
              "value": [[0,0],[0.25,0.21],[0.75,0.82],[1,1]] } }

// ……再看一眼 App 里长什么样
{ "method": "ui.screenshot", "params": { "path": "frame.png" } }
```

时间可传 `seconds` / `frame` / `timecode`（FilmCraft 内部以每秒 254,016,000,000 tick 计）。
`filmcraft-cli commands` 列出全部 650+ 引擎命令；协议详见
[filmcraft/docs/control-protocol.md](https://github.com/storytold/filmcraft/blob/main/docs/control-protocol.md)。
EffectCraft 同族协议，端口默认 9877；VectorCraft 默认 7979、LightCraft 默认 7980（`artcraft_control`
的 `app` 已内置）。其余应用端口动态：以 `app --port PORT` 启动后，`artcraft_control` 传 `port`
直连即可（协议同族）。每个应用的控制面详见 `artcraft_apps` 能力目录。

> PhotoCraft 的控制通道是带鉴权的变体、PdfCraft 是文件式（`--control FILE`），本插件**有意不代理**
> —— 两者走无头 CLI 足够。

## 与无限画布（infinite-canvas）协作

两个插件零代码耦合，只在 HTTP 和磁盘布局上会合。画布侧：

1. 把生成的资产（IndexedDB Blob）同步进 `<项目>/media/`；
2. 以 `<项目>/craft/` 里的工程文件发起 PhotoCraft / FilmCraft / EffectCraft 任务；
3. 从 `<项目>/out/` 取回成片入库。

如果你要做类似的前端，照此契约即可：项目名作文件夹名、保持 `media · craft · out` 三件套，
一切自然组合。

**前端可直接用的新端点**（画布/自建 UI 都能调）：

| 端点 | 用途 |
|---|---|
| `GET /artcraft/api/apps` | 13 应用能力目录 + 命令族统计（做"能力面板"） |
| `GET /artcraft/api/skills` | 内置 11 个技能清单（做"技能"区块） |
| `GET /artcraft/api/live` | 控制通道活性（哪些 App 正开着，决定"实时调"还是"无头跑"） |
| `GET /artcraft/api/qc?path=…&platform=…` | 产物质检（交付前自动把规格核对挂在导出流程后） |
| `POST /artcraft/api/job` + `GET ?id=` | 长任务生命周期（渲染/导出/批处理） |

建议的前端流程：导出完成 → 调 `/api/qc` 展示 PASS/WARN 徽标 → 不通过时把 `checks[].fix` 直接展示给用户。

## 常用配方

**分镜图统一调色** —— `demo/craft/grade.json`：

```json
{ "actions": [
  { "cmd": "layer.newAdjustmentLayer.curves", "params": { "points": [[0,0],[64,48],[192,212],[255,255]] } },
  { "cmd": "filter.sharpen.smartSharpen",     "params": { "amount": 80 } }
] }
```

```sh
photocraft-cli batch --actions demo/craft/grade.json --in demo/media --out demo/out/graded
```

**告别浏览器录屏的成片** —— 画布把分镜导出为 FCP7 XML（`xmeml`）或 CMX3600 EDL 写入
`demo/craft/timeline.xml`；FilmCraft 导入后自动关联 `demo/media/`，导出 H.264（Windows 走
NVENC 硬编）、ProRes、DNxHR，附 EBU R128 响度归一与字幕烧录。交换格式是 FilmCraft 自动化
最划算的地方 —— EDL/XML 是纯文本，你的流水线本来就会写。

**动画字幕即代码** —— EffectCraft 工程（`.ecproj`）是版本化 JSON，模型可以直接写、也可以填
模板。渲染成 MP4/ProRes —— 带 alpha 的 ProRes 4444 可直接叠进 FilmCraft 当图形层 —— 或导出
**Lottie**，在网页里内联播放。

## 排错

- **`bins.*.found: false`** —— 核对上面的路径写法；CLI 必须在 App 目录旁（或在 `PATH`）。
  改 `artcraft.config.json` 下一次请求即生效。
- **`/artcraft/api/*` 返回 404** —— bundle 没在 profile 注册（见"安装"），或注册后没重启。
  对话里调 `artcraft_status` 是最快探针。
- **控制通道连接失败** —— App 必须以 `--control <端口>` 启动；通道仅回环且无鉴权，端口上
  不会有别的应答者。
- **任务卡住** —— `GET /artcraft/api/job` 带日志列出全部任务，按 id 取消；插件重载会按设计
  终止所有子任务。
- **"需要绝对路径"报错** —— 传绝对路径即可：对话用当前工作空间下的路径，画布用项目目录下的
  路径（或 `base` 绝对目录 + 相对 `rel`）。

## 安全与信任模型

HTTP 面无鉴权，挂在 Harness Web 服务之下（仅回环监听）—— 把端口当本机可信处理，**不要暴露
到网络**；确需远程请加带鉴权的反向代理。子进程锁定 13 个白名单家族 CLI；控制通道只会拨
`127.0.0.1`。

## 发布

本插件已发布到 npm：**[`@ninkch/dsh-artcraft`](https://www.npmjs.com/package/@ninkch/dsh-artcraft)**
（带 scope 的包发布时需要 `npm publish --access public`）。使用时把包名加进 Harness profile 的
`dependencies` 与 `dsh.profile.bundles`（见"安装"），profile 里跑一次 `pnpm install` 即可。
本地开发则把依赖换成 `"link:<本仓库路径>"`。包名必须一致的三处：profile 的 `package.json`
（依赖 + bundles）、本仓库的 `cordis.patch.yml`。

GitHub 上传本仓库即可：`README.md` 英文优先，附
[简体中文](README.zh-CN.md) 对照。

**发版走 npm Trusted Publishing**（GitHub Actions OIDC —— 无令牌、无 OTP）：
发布由 **GitHub Release** 触发（tag `vX.Y.Z` 与 package.json version 一致）；`.github/workflows/publish.yml`
会校验发布提交在 main 上且版本对齐，然后自动发布。发版流程与红线见
[RELEASING.md](RELEASING.md)：改动先进 `dev` 测试，维护者明确批准后才合并 main 并发 Release。

## 许可

**本插件（`@ninkch/dsh-artcraft`）：Apache-2.0**（见 [LICENSE](LICENSE)）。不包含 ArtCraft 应用的任何代码 —— 只调用其公开自动化面
（无头 CLI + JSON 控制通道）。

**ArtCraft 各应用本身并非 OSI 开源**：它们采用 **ArtCraft License (WIP)** —— 一种 "fair source"
（公平源代码）许可（[全文见 NOTICE.md](NOTICE.md)）。给构建在其上的使用者划重点：

- ✅ 免费使用；可为私人目的备份、复制、修改、编译
- ✅ **用这些应用创作的所有媒体完全归你** —— 渲染出的短剧成片就是你的商业资产，没有附加条件
- ❌ 不得把应用当作自己的软件出售；不得用其代码开发竞品
- ❌ 不得在 fork 中移除社区/捐赠链接；未经许可不得用 ArtCraft 名称、Logo 或吉祥物做商业宣传
- 🤝 团队公开承诺：若业务终结，软件将转为 OSI 认可的开源许可

对 AI 短剧工作室的务实解读：本地随便用，别动应用里的社区链接，卖你的片子——而不是卖应用。
