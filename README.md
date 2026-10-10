# @local/artcraft — ArtCraft 工具链插件（dsh-artcraft）

DeepSeek Harness 插件：把 [ArtCraft](https://getartcraft.com/apps) 家族的
**PhotoCraft**（Photoshop 对标）、**FilmCraft**(Premiere 对标)、**EffectCraft**（After Effects 对标）
的自动化接口封装成 DSH 的 **Agent Tools** 和 **同源 HTTP API**，供「无限画布」等前端工作流调用。

- 三个工具均为纯 Rust 本地程序，官方自动化面：headless CLI、JSON 控制通道（TCP）、MCP
- 本插件封装前两种（CLI + 控制通道），零 AI 依赖，MIT/Apache-2.0

> **更新 Host 半侧后需要重启一次 DeepSeek Harness**（Host 代码仅随重启加载）。

## 工作区布局与协作架构

DSH 本地插件约定：工作区根目录下**每个插件一个目录、各自带 `cordis.patch.yml`**；
**git 仓库也放在各插件目录内**，根目录不留任何元文件：

```
D:\code\deepseek-plugin\
├─ dsh-infinite_canvas/   @local/infinite-canvas   无限画布（浏览器侧 · 独立 git 仓库）
└─ dsh-artcraft/          @local/artcraft          本插件（Host 侧 · 独立 git 仓库）
```

数据工作目录在仓库**之外**（渲染产物不进 git）：`<dataRoot>/<项目名>/{media,craft,out}`，
由本插件 `artcraft.config.json` 的 `dataRoot` 配置（推荐与仓库平级，如 `D:/craft-workspace`）。

两插件零代码耦合，协作 = 同源 HTTP + 磁盘目录约定：

```
┌──────────────── 浏览器：无限画布 client.js ────────────────┐
│   ① 资产 Blob 落盘   ② 发任务/控制命令   ③ 取回产物入库      │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────── DSH Host：@local/artcraft ─────────────────┐
│   /artcraft/api/*  路由  +  artcraft_* Agent Tools          │
│        → 子进程（三个 CLI） / TCP 控制通道（--control）       │
└─────┬───────────────────┬────────────────────┬────────────┘
      ▼                   ▼                    ▼
 photocraft-cli       filmcraft-cli       effectcraft-cli
 批量调色/PSD          EDL/XML 导入导出     .ecproj 渲染/Lottie
```

## 安装

1. 下载三个 App 的 Windows portable zip，解压到固定目录（如 `C:\craft\filmcraft-0.5.0-windows-x64-portable`）。
2. 复制 `artcraft.config.json.example` 为 `artcraft.config.json`（本文件已 gitignore），按机器改路径：
   - `bins.*` 支持三种写法：**目录**（自动拼 `<名>-cli.exe`）、**完整 exe 路径**、**裸命令名**（搜 PATH）
   - `dataRoot`：所有素材/工程/产物的根目录，画布按 `<dataRoot>/<项目名>/` 隔离
   - 配置**无需重启**：每次请求都会重读
3. 重启 Harness（加载插件本身）。

## Agent Tools（对话内直接可用）

| 工具 | 用途 |
|---|---|
| `artcraft_status` | 自检：三个 CLI 是否找到、dataRoot、控制通道端口、任务列表 |
| `artcraft_cli` | 跑任意 CLI 子命令，如 `photocraft-cli batch --actions grade.json --in raw --out graded` |
| `artcraft_control` | 向运行中的 FilmCraft/EffectCraft 控制通道发一条命令（`engine.execute`、`ui.screenshot`…） |
| `artcraft_fs` | dataRoot 内 list/stat/readtext/write/mkdir（准备 actions.json、取回产物） |

## HTTP API（同源 `/artcraft/api/*`，画布 fetch 直接调）

| 方法+路径 | 说明 |
|---|---|
| `GET /artcraft/api/status` | 同 artcraft_status |
| `GET /artcraft/api/projects` | 列出 dataRoot 下的项目目录 |
| `GET /artcraft/api/fs?op=list\|stat\|readtext&rel=…` | 读目录/元数据/文本（xml、edl、srt…） |
| `POST /artcraft/api/fs?action=write&rel=…` | 写文件：raw body（Blob 直传）或 JSON `{rel, base64\|text}` |
| `GET /artcraft/api/file?rel=…` | 下载产物（raw 字节，按扩展名给 content-type） |
| `GET /artcraft/api/job?id=…&tail=…` | 任务状态（stdout/stderr 尾部 + outputs 存在性/大小） |
| `POST /artcraft/api/job` | 启动长任务 `{bin, args, cwdRel?, outputs?:[rel…], timeoutMs?}` |
| `POST /artcraft/api/job/cancel` | `{id}` 取消 |
| `POST /artcraft/api/control` | `{app\|port, method, params}` 同步控制通道调用 |

`outputs` 里的相对路径会在每次轮询时 stat，画布据此判断渲染完成并取回。

## 目录约定（与无限画布的协作契约）

```
<dataRoot>/
  <项目名>/
    media/          画布资产落盘（图/视频/音频，文件名用资产 id）
    craft/          中间产物（actions.json、timeline.xml、.ecproj、edl…）
    out/            渲染输出（成片 mp4、片头 mp4、调色后图片…）
```

画布与 artcraft 插件之间**零代码耦合**：画布只做三件事 ——
1) 资产 Blob → `POST /artcraft/api/fs` 落盘；2) 发任务/控制命令；3) `GET /artcraft/api/file` 取回入库。

## 常用配方

### PhotoCraft 批量调色（分镜图统一风格）

`craft/grade.json`（命令 ID 参考 `photocraft-cli` 文档/命令面板，500+ 命令）：

```json
{ "actions": [
  { "cmd": "layer.newAdjustmentLayer.curves", "params": { "points": [[0,0],[64,48],[192,212],[255,255]] } },
  { "cmd": "filter.sharpen.smartSharpen",     "params": { "amount": 80 } }
] }
```

```
POST /artcraft/api/job
{ "bin": "photocraft",
  "args": ["batch", "--actions", "<项目>/craft/grade.json", "--in", "<项目>/media", "--out", "<项目>/out/graded"],
  "outputs": ["<项目>/out/graded"] }
```

### FilmCraft 成片（两条路）

**A. 文件交换（headless，推荐）**：画布把分镜顺序/时长/字幕生成为 FCP7 XML（xmeml）
或 CMX3600 EDL 写入 `craft/timeline.xml`，媒体落盘 `media/`，然后：

```
POST /artcraft/api/job
{ "bin": "filmcraft",
  "args": ["--project", "<项目>/craft/drama.fcproj", "--import", "<项目>/craft/timeline.xml", "--export", ...],
  "outputs": ["<项目>/out/final.mp4"] }
```

> 具体子命令以 `artcraft_cli {bin:"filmcraft", args:["commands"]}` 实测为准（650+ 引擎命令可列）。

**B. 控制通道（GUI 开着 `filmcraft --control 9876`，可视化微调）**：

```jsonc
POST /artcraft/api/control
{ "app": "filmcraft", "method": "engine.execute",
  "params": { "command": "timeline.place",
              "params": { "item": 1, "track": "V1", "seconds": 0, "duration": 1270080000000 } } }
```

时间可给 `seconds` / `frame` / `timecode`；调色走 `effects.setParam {effect:"lumetri",...}`；
截图 `ui.screenshot {path}`；字幕走 caption 轨（SRT/VTT 导入+烧录）；导出走 `file.exportMedia`。

### EffectCraft 片头/花字（AI 可直接写工程）

`.ecproj` 是版本化 JSON —— LLM 生成或模板替换文本即可；渲染：

```
POST /artcraft/api/job
{ "bin": "effectcraft",
  "args": ["render", "--comp", "Main", "--out", "<项目>/out/intro.mp4", "<项目>/craft/intro.ecproj"],
  "outputs": ["<项目>/out/intro.mp4"] }
```

也可 `POST /artcraft/api/control {app:"effectcraft", method:"engine.execute", ...}` 驱动 GUI，
或 `exec file.exportLottie` 导出 Lottie 供画布网页内直接预览。

## 边界与信任模型

- **API 无鉴权**：路由挂在 DSH Web GUI（仅回环 127.0.0.1）之下，本机可信；**不要把 GUI 端口暴露到局域网**，如需远程请加反代 + 鉴权。
- **PhotoCraft 控制通道不代理**：官方 `photocraft --control` 是鉴权模式（与 FilmCraft/EffectCraft 的无鉴权回环不同），故 `artcraft_control` 仅支持 filmcraft/effectcraft；PhotoCraft 用 CLI 足够。
- **大小限制**：上传 320MB/次（视频资产 Blob 直传够用）；下载/取回流式传输、上限 2GB；`readtext`/文本模式 16MB。
- **进程树终止**：`kill` 只终止 CLI 直接进程；三个 CLI 均为自包含 Rust 单体进程，无孤儿问题。
- **EffectCraft 控制协议**假定与 FilmCraft 同族（`engine.execute`/`ui.*`），首次使用时先用 `artcraft_control {app:'effectcraft', method:'engine.commands'}` 验证。

## 排错

- **CLI not found**：`artcraft_status` 看 `bins.*.note`；改 `artcraft.config.json`（无需重启）。
- **控制通道连接失败**：确认目标 App 以 `--control <port>` 启动且仅本机访问（官方协议无鉴权）。
- **任务卡住**：`GET /artcraft/api/job`（不带 id）看全部任务；`POST /artcraft/api/job/cancel` 终止。
- **插件没加载**：确认本目录与 `dsh-infinite_canvas` 平级、各自带 `cordis.patch.yml`，然后重启 Harness；
  加载后对话里应能调 `artcraft_status`。
