# 媒体 / 影视技能集成研究报告

> ⚠️ **存档标注（2026-10-16）**：本报告的方向已被否决 —— 不集成第三方后期工具，ArtCraft 家族自身即为目标能力面（见 `artcraft-01` 起源会话 2026-10-16 03:41 用户裁决）。以下内容**仅作研究存档，请勿据此实施**。
>
> 调研时间：2026-10-12 · 阶段：**仅研究探索，未改动任何插件代码**
> 目标：为 `@ninkch/dsh-artcraft` 寻找可集成的高星开源"剪辑 / 影片处理 / 视频特效"能力，强化桥接层
> 外网访问经本地代理 `127.0.0.1:10808`

---

## 0. 结论速览

1. **存在三条成熟集成路径**，且它们互补而非互斥：
   - **A 通用 CLI 桥接**（artcraft 现有范式）：白名单可执行文件 + 参数由 agent 组合
   - **B 策展型 typed tools**（`dsh-ffmpeg` 范式）：安全封装的高频操作，无需 shell 拼接
   - **C Agent Skills 技能包**（`SKILL.md` 范式）：教 agent 流程与纪律，按需加载
   - **D MCP 连接器**（`dsh-mcp-connector` 已装）：接外部重资产应用（Blender / DaVinci / ComfyUI）
2. **DSH 已原生支持技能包**，且有明确根目录优先级与插件级 provider 注册接口 → 第三方 agent skills 可直接落地，artcraft 还能升级为"技能提供者"。
3. **第一阻塞项不是代码而是二进制**：本机无 `ffmpeg`/`ffprobe`，导致已安装的 `dsh-ffmpeg@0.5.0` 当前完全不可用（`spawn ffmpeg ENOENT`）。任何 ffmpeg 系能力（占候选能力面的 60%+）都卡在这里。
4. **最佳定位建议**：artcraft 不要重复造 ffmpeg 封装，而应成为**媒体技能的注册中心 + 执行后端 + 能力目录**（把外部技能包的引擎登记进来，用统一的 `artcraft_cli` / HTTP / 控制通道执行，并把能力写进 `artcraft_apps` 目录）。

---

## 1. 现状盘点

### 1.1 artcraft 现有能力（v0.2.10 → 现状）

> 下列数字已按 0.3.1 口径更新；v0.2.10 时为 12 个 CLI / 8 个 Agent 工具（FigCraft 与 qc/live 均为 0.3.0 新增）。

| 维度 | 现状 |
|---|---|
| 执行 | 13 个家族 CLI 白名单 + 子进程；`artcraft.config.json` 决定实际可执行文件 |
| 实时 | JSON-lines 控制通道：filmcraft 9876 / effectcraft 9877 / vectorcraft 7979 / lightcraft 7980，动态端口走 `port` 直连 |
| 接口 | 10 个 Agent 工具（status / cli / control / fs / discover / apps / qc / live / recipes / update）+ 同源 HTTP API（/artcraft/api/*） |
| 知识 | `apps/catalog.json`（13 应用能力卡）、`recipes/recipes.json`（8 套专家配方） |

### 1.2 本机环境实测

| 组件 | 状态 |
|---|---|
| DSH 自带运行时 | Python 3（含 numpy/pandas/Pillow 等）、Node 24.12、pnpm 11.7 ✅ |
| ffmpeg / ffprobe | ❌ 不在 PATH；ArtCraft 家族目录内也未捆绑 |
| melt / blender / whisper / scenedetect / auto-editor / yt-dlp / magick / gst-launch | ❌ 均未安装 |
| 包管理器 | `winget` ✅（scoop / choco ❌） |
| 同类插件 | `dsh-ffmpeg@0.5.0` 已装但 **health 失败**：`ffmpeg ENOENT`、`ffprobe ENOENT` |

---

## 2. DSH 侧集成机制（决定可行性的关键）

### 2.1 技能根目录优先级（来自技能文件系统 provider 文档）

| Rank | Source | 路径 |
|---|---|---|
| 100 | `project-dsh` | `<项目根>/.dsh/skills` |
| 200 | `project-agents` | `<项目根>/.agents/skills` |
| 300 | `custom` | `Config.customSkillDirs` |
| 400 | `user-dsh` | `<dshHome>/skills`（跳过其 `.system` 子目录） |
| 500 | `user-agents` | `<agentsHome>/skills` |
| 600 | bundled | `bundledSkillDir` / `$DSH_BUNDLED_SKILL_DIR` |

- 项目根 = 最近的含 `.git` 的祖先目录；无则用 cwd。
- **同名时文件系统技能优先于内置技能。**

### 2.2 技能文件契约

`SKILL.md` = YAML frontmatter（`name`、`description` 必填）+ 正文：

```markdown
---
name: office-docx
description: Create, read, edit, and check Word documents (.docx)...
---

# Word documents
...
```

- 发现阶段解析 frontmatter 建目录；**每次加载都重读正文**（改技能无需版本号/缓存失效）。
- 与 Claude Code / Codex 的 agent skills **格式一致** → 生态技能可跨工具复用。

### 2.3 插件也能注册技能

```js
const inject = ['skills'];
function apply(ctx) {
  ctx.skills.registerProvider(() => provider);   // provider.get(entry) → { summary, content }
}
```

内置技能的 `assetRoot` 可被 profile patch 替换，说明**插件把技能随包分发**是官方支持的形态。

---

## 3. 候选项目全景（按能力域）

> 星数为本次抓取时点数据；许可证列用于分发包决策。

### A. 通用媒体引擎与 ffmpeg 系技能

| 项目 | ★ | 许可 | 要点 |
|---|---|---|---|
| `FFmpeg/FFmpeg` | 65,250 | LGPL/GPL | 一切的地基 |
| `BtbN/FFmpeg-Builds` | 11,831 | MIT | Windows 静态构建分发源（解阻塞首选） |
| **`kajisho5/ffmpeg-skill`** | **1,964** | **MIT** | **42 个工具 + MCP + 机器可读契约；纯 Python 标准库；`npx ffmpeg-skill`** |
| `WyattBlue/auto-editor` | 5,529 | Unlicense | 静音/jump-cut 自动剪除（CLI） |
| `kkroening/ffmpeg-python` | 11,010 | Apache-2.0 | 复杂滤镜图的 Python 封装 |
| `Lake1059/FFmpegFreeUI` | 8,410 | MIT | Windows GUI 外壳（参数参考价值） |

**`ffmpeg-skill` 深度（最值得集成的单体）**：probe / scenes（切换、节拍、镜头运动、音频峰值）/ look（联络表）/ cut / join / silence（含 filler）/ fit（时长·画幅·变速）/ crop / cropdetect / deinterlace / denoise / redact / sphere / straighten / insert / background / reverse / stabilize / sequence / waveform / freeze / pad / speedramp / loop / broll / metadata（章节）/ grid / audio（人声清理·闪避）/ sync（多机位音频同步，1ms）/ loudness（EBU R128）/ caption（SRT·ASS·卡拉OK）/ overlay / graphics（下三分之一·标题·贴纸）/ color（HDR→SDR·LUT·一级校色）/ export（平台预设）/ proxy / check（平台合规）/ report（HTML 交付报告）/ render（project.json 整片渲染）/ batch / multicam / verify。

设计纪律与 artcraft 高度同构：`--dry-run`/`--plan`、**不改写输入**、结构化 JSON、`look.py` 联络表交给 **agent 自己的视觉**判断、拒绝从调用方接受 shell 串。姊妹技能（MIT）：`media-analysis-skill`、`transcription-skill`、`subtitle-skill`、`color-grading-skill`、`motion-graphics-skill`、`qc-skill`、`thumbnail-skill`（目前 2–8★，尚幼）。

### B. NLE / 时间线自动化

| 项目 | ★ | 许可 | 集成面 |
|---|---|---|---|
| `mltframework/shotcut` | 15,432 | GPL-3.0 | MLT 的 `melt` CLI 可脚本化 |
| `olive-editor/olive` | 9,135 | GPL-3.0 | GUI 为主 |
| `OpenShot/openshot-qt` | 6,633 | GPL-3.0 | libopenshot Python API |
| `KDE/kdenlive` | 5,871 | GPL-3.0 | MLT 生态 |
| `heygen-com/hyperframes` | 64,660 | Apache-2.0 | **HTML→确定性 MP4**，Node≥22，为 agent 设计（动效/片头利器） |
| `jub0t/concat` | 6,855 | AGPL-3.0 | CapCut 替代 |
| `0xsline/OpenChatCut` | 2,398 | AGPL-3.0 | 对话式本地剪辑 |
| `cartesiancs/cartcut` | 814 | MIT | 面向 agent 的编辑器（macOS 偏重） |
| `ronak-create/FableCut` | 730 | MIT | JSON 时间线 + MCP |
| `WeftCut/WeftCut` | 226 | MIT | 全时间线可驱动 |
| `AcademySoftwareFoundation/OpenTimelineIO` | 2,022 | Apache-2.0 | **OTIO 交换格式**（跨编辑器合成） |
| `ninkch/dsh-artcraft` 家族 | — | Apache-2.0 | FilmCraft（NLE）/EffectCraft（合成）已是原生桥接对象 |

### C. Agent 技能包（`SKILL.md` 生态）

| 项目 | ★ | 许可 | 要点 |
|---|---|---|---|
| `calesthio/OpenMontage` | 68,636 | AGPL-3.0 | 三层知识架构：`tools/` → `skills/{core,creative,meta,pipelines}` → `.agents/skills/`（47 技能）；AGENT_GUIDE 强制先读技能再动手 |
| `kangarooking/cangjie-skill` | 11,361 | MIT | 把书/长视频/播客蒸馏成可执行技能 |
| `luoluoluo22/jianying-editor-skill` | 4,090 | 待核 | 剪映（CapCut 国内版）草稿生成 + Windows UI 自动化 |
| `FireRedTeam/FireRed-OpenStoryline` | 3,492 | Apache-2.0 | CLI + FastAPI 的剪辑 agent |
| `Agentchengfeng/chengfeng-videocut-skills` | 3,077 | Apache-2.0 | Claude Code Skills 做的视频剪辑 agent |
| `JimLiu/baocut` | 1,016 | 待核 | CLI 与 MCP **同一份工具目录**（`baocut <名词> <动词>` ↔ `<名词>_<动词>`）；可编辑视频为中心 |
| `diffusionstudio/skills` | — | MPL-2.0 | `npx skills add diffusionstudio/skills`；`editor`/`watch` 两技能；`diffusion` CLI + MCP 同名 |
| `zenstory-ai/video-recap-skills` | 575 | MIT | 视频解说（中文旁白recap）技能 |
| `chengyi-ai/native-subtitle-quote-image` | 2,685 | MIT | 保留内嵌字幕取帧生成社交长图（Agent Skill） |
| `arjun988/blender-skills` | 311 | MIT | 94 个 Blender 专项技能（MCP 驱动） |

### D. MCP 服务器（重资产应用接入）

| 项目 | ★ | 许可 | 目标 |
|---|---|---|---|
| `ahujasid/mcp-for-blender` | 30,988 | MIT | Blender 控制 |
| `samuelgursky/davinci-resolve-mcp` | 3,559 | MIT | DaVinci Resolve（另有 6+ 同类实现） |
| `ATH-MaaS/Pixelle-MCP` | 1,128 | MIT | ComfyUI + MCP 多模态 AIGC |
| `artokun/comfyui-mcp` | 828 | MIT | ComfyUI 本地控制面 |
| `joenorton/comfyui-mcp-server` | 410 | Apache-2.0 | 轻量 ComfyUI MCP |
| `hyepartners-gmail/vibevideo-mcp` | 217 | 待核 | ffmpeg 的 MCP 封装 |
| `kajisho5/ffmpeg-skill`（内置 MCP） | 1,964 | MIT | 42 工具的 MCP 面（契约派生，默认只暴露 12 个核心工具省上下文） |

> 注：`punkpeye/awesome-mcp-servers`（96,416★）为目录索引；宽泛的"media MCP"搜索结果多为社媒抓取类，与影视后期无关。

### E. AI 后期：字幕 / 配音 / 口型 / 音源分离

| 项目 | ★ | 许可 | 能力 |
|---|---|---|---|
| `SYSTRAN/faster-whisper` | 25,883 | MIT | ASR 主力（CTranslate2） |
| `modelscope/FunASR` | 20,711 | MIT | 中文 ASR 强项，VAD/标点/流式 |
| `QwenAudio/SenseVoice` | 9,515 | MIT | 多语种 ASR |
| `modelscope/FunClip` | 6,399 | MIT | 转写 + 字幕 + LLM 辅助切片 |
| `buxuku/SmartSub` | 5,715 | MIT | 一站式：转写/翻译/配音/克隆/烧录 |
| `tmoroney/auto-subs` | 4,373 | MIT | 直连 DaVinci/Premiere |
| `smacke/ffsubsync` | 7,902 | MIT | 字幕自动对齐 |
| `YaoFANGUK/video-subtitle-remover` | 13,313 | Apache-2.0 | **硬字幕/水印去除**（本地） |
| `YaoFANGUK/video-subtitle-extractor` | 9,599 | Apache-2.0 | 硬字幕 OCR 提取成 SRT |
| `rhasspy/piper` | 11,303 | MIT | 轻量本地 TTS |
| `index-tts/index-tts` | 24,504 | 待核 | 零样本 TTS |
| `k2-fsa/sherpa-onnx` | 15,307 | Apache-2.0 | ASR/TTS/说话人/增强/分离 全栈 |
| `Rudrabha/Wav2Lip` | 13,243 | 待核 | 口型同步（老牌） |
| `bytedance/LatentSync` | 6,143 | Apache-2.0 | 扩散式口型同步 |
| `DanielSWolf/rhubarb-lip-sync` | 2,654 | 待核 | **命令行**生成 2D 口型动画 |
| `Anjok07/ultimatevocalremovergui` | 26,636 | MIT | 人声/伴奏分离 |
| `nadermx/backgroundremover` | 8,093 | MIT | 图像/视频去背（CLI 友好） |

### F. 修复 / 超分 / 插帧

| 项目 | ★ | 许可 | 备注 |
|---|---|---|---|
| `k4yt3x/video2x` | 22,265 | AGPL-3.0 | 超分 + 插帧一体框架 |
| `hzwer/ECCV2022-RIFE` | 5,612 | MIT | 实时插帧（学术实现） |
| `nihui/rife-ncnn-vulkan` | 1,111 | MIT | **免 CUDA 的 ncnn/Vulkan 构建，CLI 直接可用** |
| `google-research/frame-interpolation` (FILM) | 3,154 | Apache-2.0 | 大位移插帧 |
| `chaiNNer-org/chaiNNer` | 6,077 | GPL-3.0 | 节点式图像处理（链式任务） |
| `EutropicAI/Final2x` | 7,380 | BSD-3-Clause | 跨平台超分工具 |
| `XPixelGroup/BasicSR` | 8,395 | Apache-2.0 | 修复/去噪/去模糊工具箱 |
| `AaronFeng753/Waifu2x-Extension-GUI` | 17,116 | 待核 | 超分+插帧 GUI（Windows 生态） |

### G. 特效 / 合成 / 3D

| 项目 | ★ | 许可 | 备注 |
|---|---|---|---|
| `NatronGitHub/Natron` | 5,583 | GPL-2.0 | 节点合成，可 `natron -b` 批渲染 |
| `AcademySoftwareFoundation/OpenImageIO` | 2,386 | Apache-2.0 | 图像 IO 工具链（`oiiotool` CLI） |
| `3b1b/manim` | 95,132 | MIT | 程序化数学动画（解说/图表动效） |
| `chflame163/ComfyUI_LayerStyle` | 3,185 | MIT | 图层/蒙版合成节点 |
| `Fannovel16/ComfyUI-Frame-Interpolation` | 1,084 | MIT | ComfyUI 插帧节点 |

### H. 分析与质检（对应"影评 / 影片处理"）

| 项目 | ★ | 许可 | 能力 |
|---|---|---|---|
| `Breakthrough/PySceneDetect` | 5,248 | BSD-3-Clause | **镜头切换检测（CLI + 库）**，分镜/剪辑点分析基石 |
| `Netflix/vmaf` | 5,530 | 待核 | 感知画质评估（编码决策） |
| `chaofengc/IQA-PyTorch` | 3,419 | 待核 | PSNR/SSIM/LPIPS 等 IQA 工具箱 |
| `QwenLM/Qwen2.5-Omni` / `Qwen3-Omni` | 4,081 / 4,058 | Apache-2.0 | 端到端全模态（视频理解/描述） |
| `DAMO-NLP-SG/Video-LLaMA` | 3,140 | BSD-3-Clause | 视听语言模型 |
| `OpenGVLab/Ask-Anything` | 3,360 | MIT | VideoChatGPT 系 |
| `jordanrendric/claude-video-vision` | 1,370 | MIT | **感知层**：ffmpeg 抽帧 + ASR/字幕，让 agent "看"视频（MCP + 插件） |
| `wendy7756/AI-Video-Transcriber` | 3,344 | Apache-2.0 | 转写 + 摘要 |
| `NVIDIA-AI-Blueprints/video-search-and-summarization` | 1,931 | 待核 | GPU 视频检索/摘要蓝图 |
| `ffmpeg-skill` 的 `scenes.py --beats/--shots/--speech` | — | MIT | 节拍网格、镜头运动分类、语音/音乐比 |

---

## 4. 集成架构建议

### 路径 A：通用 CLI 桥接（延续 artcraft 范式，**执行后端**）

把"家族 13 应用"泛化为 **toolchain registry**：`artcraft.config.json` 的 `bins` 之外增设 `skills`（或复用同一结构），登记外部引擎（`ffmpeg`、`ffprobe`、`melt`、`auto-editor`、`scenedetect`、`rife-ncnn-vulkan`、`piper`、`baocut`、`diffusion`、`npx ffmpeg-skill` 等）。

- 优点：零耦合、许可干净（只调用不打包）、复用现有 `artcraft_cli` / job / HTTP 全套。
- 注意：需为"裸命令 + 参数数组"补齐 PATH 解析（`resolveBin` 已支持裸命令名 → 现成）。

### 路径 B：策展型 typed tools（`dsh-ffmpeg` 范式，**高频能力固化**）

对 5–10 个最高频且易错的操作做安全封装（如 `artcraft_cut` / `artcraft_normalize` / `artcraft_subtitle` / `artcraft_qc`）：

- 学 `dsh-ffmpeg` 的纪律：输入存在性校验、输出防覆写（`_1` 后缀）、拒绝 `output == input`、超时与宽限、类型化时间参数。
- 参考 `ffmpeg-skill` 的 `--dry-run` / `--plan` / `--json` / 不改写输入。
- 优点：模型不易写错、无需 shell 引号、可加"验证后置"（probe 产物 + 联络表）。

### 路径 C：Agent Skills 技能包（**知识与流程**，推荐主力）

- **随插件分发**：把精选技能目录放进包内，`ctx.skills.registerProvider()` 注册（`inject: ['skills']`）。
- **或装入技能根**：`<dshHome>/skills`（用户级 rank 400）、项目 `.dsh/skills`（rank 100）、`.agents/skills`（rank 200，跨工具通用）。
- 候选首批：`ffmpeg-skill`（MIT，42 工具契约）、`media-analysis-skill`、`subtitle-skill`、`qc-skill`、`color-grading-skill`、`video-recap-skills`（MIT）、`blender-skills`（MIT）。
- 许可提示：`OpenMontage`（AGPL-3.0）**不可随包分发**，但可作为"用户自行安装的外部技能源"。

### 路径 D：MCP 连接器（**重资产应用**）

`dsh-mcp-connector` 已在 profile 中。用 MCP 接 Blender / DaVinci Resolve / ComfyUI，避免把它们塞进 artcraft 的白名单（这类应用启动重、状态长驻、有 GUI 依赖）。

### 推荐组合

```
技能层（C，SKILL.md 流程与纪律）
   ↓ 调用
桥接层（A，artcraft 的 toolchain registry + 控制通道）    ← 本插件的核心价值
   ↓ 高频能力
固化层（B，5-10 个 typed tools，安全封装）                ← 学 dsh-ffmpeg
   ↓ 可选
外部应用（D，Blender / Resolve / ComfyUI 走 MCP）
```

---

## 5. 优先级路线图

### 阶段 0：解除阻塞（无此步，60%+ 能力为死代码）

1. 装 ffmpeg/ffprobe：`winget install Gyan.FFmpeg`（或 `BtbN/FFmpeg-Builds` 静态包放固定目录）。
2. 让 `dsh-ffmpeg` 可用：设 `DSH_FFMPEG_PATH`/`DSH_FFPROBE_PATH` 或插件配置 `ffmpegPath`/`ffprobePath`；再跑 `ffmpeg_health`。
3. artcraft 侧：把 `ffmpeg`/`ffprobe` 登记进 toolchain registry，并在 `artcraft_status` 里报可用性。

### 阶段 1：低风险高价值（纯技能 + 已有引擎）

- 字幕流水线：ASR（faster-whisper/FunASR）→ SRT 对齐（ffsubsync）→ 样式烧录（`caption.py` 思路）
- 基础剪辑：无损 cut / join / 画幅重排 / 响度归一（EBU R128）/ 静音剪除（auto-editor）
- 交付 QC：黑帧·冻结帧·静音·响度·平台合规（YouTube/Shorts/Reels/TikTok/B 站）
- 分镜分析：PySceneDetect 镜头切分 + 联络表（agent 用视觉复核）

### 阶段 2：技能包与批量

- 接入 `ffmpeg-skill` 全套（42 工具 + contract + MCP）
- 多机位音频同步、代理生成（给下游 AI 分析/预览）、章节标记、HTML 交付报告

### 阶段 3：重能力（GPU 依赖，按需安装）

- 超分/插帧/去噪/去字幕/抠像（video2x、RIFE-ncnn、video-subtitle-remover、backgroundremover）
- 配音/口型（piper、LatentSync）+ 音源分离（UVR）
- 视频理解与解说（Qwen-Omni 系本地 VLM、video-recap-skills）

### 阶段 4：外部应用与交换格式

- MCP：Blender / DaVinci Resolve / ComfyUI
- 交换格式：OTIO / FCPXML / EDL 与 FilmCraft·DesignCraft 工程互转

---

## 6. 风险与许可证

| 风险 | 说明 | 对策 |
|---|---|---|
| **许可传染** | GPL/AGPL（Natron、concat、video2x、OpenMontage）**不可打包进 Apache-2.0 插件**；调用用户自行安装的独立程序一般无碍 | 打包仅限 MIT/Apache/BSD；GPL 系走"外部已安装"或用户自装技能 |
| **模型许可** | 部分权重为 CC-BY-NC 等非商用；另有"开源但需云 key" | 只选可商用本地权重；技能内显式标注 |
| **GPU/体积** | CUDA-only、数 GB 权重、模型首次下载 | 阶段 3 起按需安装；技能内先 `doctor` 自检再运行 |
| **供应链** | `npx <pkg>` 会执行远端代码；Python 依赖污染 | 固定版本 + 完整性校验；用 DSH 自带 Python 虚拟环境隔离 |
| **安全模型** | 现有护栏是"白名单 + 绝对路径 + 不回显 shell" | 新引擎同样进白名单；typed tools 不接受 shell 串（学 `ffmpeg-skill` 拒绝滤镜图字符串） |

---

## 7. 无需改代码即可验证的动作清单

1. `winget install Gyan.FFmpeg` → 重启后 `ffmpeg_health` 应为 ✅（验证二进制供给路径）
2. 把任一 MIT 技能（如 `ffmpeg-skill`）放到 `<dshHome>/skills/ffmpeg-skill/SKILL.md` → 会话里用 `skill` 工具看能否发现（验证技能根 rank 400）
3. 用现有 `artcraft_cli`（bin=filmcraft/effectcraft）跑一遍"probe→cut→导出"，确认桥接链路健康
4. 用 `artcraft_apps` 目视为新引擎预留的分类位（验证能力目录扩展方式）

---

## 8. 深挖报告（并行 agent）：NLE 时间线 · 影片分析 · MCP 与技能生态

### 8.1 时间线引擎与交换格式（结论：`melt` + OTIO 是唯一务实组合）

**`melt`（MLT，LGPL-2.1，1863★）是本领域唯一真正可脚本化的多轨渲染引擎。** Shotcut(15432★)/Kdenlive(5871★)/OpenShot(6633★)/Olive(9135★)/Pitivi **全部没有受支持的 headless 入口** —— GUI 编辑器不是集成对象，`melt` 才是。

```bash
# 渲染现成工程（Shotcut / Kdenlive / MLT XML 通吃）
melt project.mlt -consumer avformat:out.mp4 vcodec=libx264 acodec=aac crf=18 -silent
# 无头搭时间线
melt clipA.mp4 in=00:00:05.000 out=00:00:12.500 clipB.mp4 \
     -mix 25 -mixer luma -consumer avformat:out.mp4 vcodec=libx264 acodec=aac
# 把 argv 固化成可复用工程文件
melt clipA.mp4 clipB.mp4 -mix 25 -mixer luma -consumer xml:project.mlt
```

- Shotcut 开发者的官方无头路径：在 Shotcut 里起一次导出 → 停止 → 作业右键 View XML → 存 `.mlt` → **只**跑 `melt <file>.mlt`，且必须用该 Shotcut 自带的 melt（版本不能混）。
- MLT 官方文档自承命令行解析"错误检查薄弱" → **永远从序列化 `.mlt` 驱动，不要手拼 argv**。
- 需要设 `MLT_REPOSITORY` / `MLT_DATA` 指向对应安装；Windows 上的具体路径需本地实测（未验证）。

**交换格式裁决**：

| 格式 | 裁决 | 依据 |
|---|---|---|
| **OTIO `.otio`** | ✅ **采用为枢纽** | 唯一有真正开放 API 的格式；适配器已拆到独立 PyPI 包 `OpenTimelineIO-Plugins`（裸装 opentimelineio 只有 JSON/bundle） |
| FCP7 XML / FCPXML | ✅ 采用（交付给人的 NLE） | 通往 Premiere/Resolve 的实务桥梁；PySceneDetect `save-fcp`、auto-editor `--export premiere\|resolve` |
| CMX3600 EDL | ⚠️ 仅作剪辑清单 | 单轨、无特效、reel 名脆弱，不可往返 |
| MLT XML | ✅ 作渲染目标（有 melt 时） | 唯一"可被无头引擎真正渲染"的格式；非 OTIO 核心适配器 |
| AAF | ⚠️ 仅 Avid 交付 | OTIO 明确不支持 markers/effects，"仍在进行中" |
| `.xges` / kdenlive | ⚠️ 社区适配器，信任度低 | contrib |
| **`.prproj`** | ❌ 死路 | 不存在开源读写实现 |
| Olive `.osp` | ❌ 死路 | 无 CLI，代码 2023-09-24 冻结 |
| OpenShot `.osp` | ❌ 死路 | 只能经 libopenshot Python API，且拖入 **GPL-3.0 的 libopenshot-audio** |

### 8.2 自动剪辑与影片分析（可直接落地的命令面）

```bash
# 自动剪除（auto-editor：单二进制、Unlicense、可导出成编辑器工程）
auto-editor in.mp4 --edit audio:-19dB --margin 0.2s -o out.mp4
auto-editor in.mp4 --export shotcut -o out.mlt      # 也支持 kdenlive/premiere/resolve/clip-sequence

# 镜头切分（PySceneDetect：BSD-3-Clause，一条命令产出全套产物）
scenedetect -i in.mp4 -o out/ detect-adaptive list-scenes save-images save-otio save-edl split-video
# 产出：*-Scenes.csv / *.otio / *.edl / *-keyframes.txt + 切好的片段

# 无参考质检（原片没有基准，VMAF/PSNR 无意义 → 用无参考滤镜；检测器输出在 stderr）
ffmpeg -hide_banner -i in.mp4 -vf blackdetect=d=1:pix_th=0.1 -f null -
ffmpeg -hide_banner -i in.mp4 -vf freezedetect=n=0.001:d=0.5   -f null -
ffmpeg -hide_banner -i in.mp4 -af silencedetect=noise=-30dB:d=0.5 -f null -
ffmpeg -hide_banner -i in.mp4 -vf "scdet=s=1:t=10" -f null -
# 有参考时走结构化指标（MIT，需 FFmpeg ≥7.1 且编译了 libvmaf）
ffmpeg-quality-metrics dist.mp4 ref.mp4 -m psnr ssim vmaf -o qc.json
```

- **VMAF 的两个前提**：需要基准 + 需要 ffmpeg 编译进 `libvmaf` 与模型文件（精简版 Homebrew/发行版构建常常没有）→ 必须放进 `doctor` 式能力自检。
- 元数据：`ffprobe -print_format json` + `mediainfo --Output=JSON`（MXF/容器内部信息更全，BSD-2）。
- 字幕 OCR（硬字幕→SRT）：`vidocr`/`timminator/VideOCR` 提供 `videocr-cli.exe`，需 PaddleOCR，建议 GPU。

### 8.3 MCP 与技能生态补遗

| 项目 | ★ | 许可 | 价值 / 教训 |
|---|---|---|---|
| **`browser-use/video-use`** | **27,657** | MIT | "用编码 agent 剪视频"（ffmpeg + Remotion），此前遗漏的重量级选手 |
| **`KyaniteLabs/kinocut`** | 206 | **Apache-2.0** | **许可最契合**：203 个 MCP 工具 / 177 CLI，带 preflight、`--dry-run` 计划、每次渲染的 hash "Video Receipts"；`kino doctor` 正是能力自检范式。风险：面太宽（建议只暴露精选子集）、项目尚年轻（1.16.x 起） |
| `artokun/comfyui-mcp` | 828 | MIT | ComfyUI 控制面 178 工具/36 技能，TS（与 DSH 同生态），需可达的 ComfyUI + GPU |
| `0xsline/OpenChatCut` | ~2,398 | **AGPL-3.0** | 最有能力的**时间线**集成：Streamable-HTTP MCP `:5199`，草稿-审核模型（`begin_edit_session → review_edit_session`）正是安全形状；但 AGPL §13 网络条款对我们自建的 HTTP API 有传染风险 |
| `ATH-MaaS/Pixelle-MCP` | 1,128 | MIT | ComfyUI 工作流零代码变 MCP 工具 |
| `scenario-labs/skills` | 1,020 | MIT | 71 技能 + DCC 团队（Blender/Maya/Unreal/Unity…），走远程 OAuth MCP |
| `Comfy-Org/comfy-mcp` | 282 | **AGPL 或商业** | 官方 Comfy MCP；双许可，不可打包 |
| `haidrrrry/claude-remotion-skill` | 457 | MIT | Remotion 动效设计技能，强制"渲染→检查→修"循环 |
| `joenorton/comfyui-mcp-server` | 410 | Apache-2.0 | 轻量 ComfyUI MCP（streamable-http :9000） |
| `lordhoell/davinci-resolve-mcp` | 16 | MIT | Resolve 需 `fusionscript.dll` + 常驻应用；同类多为 16-700★ 重复品 |
| `hetpatel-11/Adobe_Premiere_Pro_MCP` | 703 | MIT | **默认开启匿名遥测** → 回避 |
| `ismoshushi/awesome-opus-video-skills` | — | 索引 | 编录 118 个视频 agent 技能（渲染栈/许可/安装命令）—— 持续发现的入口 |

### 8.4 许可证红线（补充）

- **Blender 生态不可打包**：任何 import `bpy` 的 addon 必须 GPL 兼容（这是 Blender 的官方许可立场）→ 桥接代码（插件侧）可保持 Apache-2.0，**跑在 Blender 内的部分不可随包分发**。
- **AGPL §13 网络条款**：OpenChatCut / Nomi / comfyui_LLM_party 等 AGPL 项目，只能作为"用户自行安装的本地服务"经 HTTP 调用；我们的同源 HTTP API 若成为其"网络交互"通道会引入风险。
- **`NOASSERTION` ≠ 无许可、更 ≠ 宽松**：GitHub 无法分类不等于可自由使用 → 一律按 all-rights-reserved 处理，必须读 LICENSE 原文。
- **libopenshot-audio 是 GPL-3.0**（而 libopenshot 是 LGPL-3.0）→ 两者链接即整体 GPL，且 OpenShot 安装包会默认带上它，容易误链。
- **不要碰**（本次深挖明确排除）：Adobe/DaVinci GUI 自动化类 MCP（需常驻应用 + 面板 + 特定页面，Premiere 还默认遥测）；来源不明的薄 ffmpeg MCP 封装（多为 2025 停更、无 dry-run/校验）；托管计费型生成 MCP（引入 OAuth/按次计费/外网依赖）；0–50★ 的重复技能仓库；**Natron 无任何可信 MCP 或技能**且上游实际停滞 → 不建桥。

### 8.6 VFX / 修复 / 合成深挖（结论：只用"已在手"的 + 两个 ncnn 二进制）

**能力/成本前三**

1. **`oiiotool`（OpenImageIO，Apache-2.0，2.4k★）——合成引擎最佳 ROI**
   单二进制、真 CLI、确定性、纯 CPU、内置帧序列通配符，等于"节点式图像栈合成器"：
   ```bash
   oiiotool fg.exr bg.exr --over -o comp.1-50%04d.exr
   ```
   与 artcraft 的"绝对路径 + 子进程"模型天然契合，许可干净，**最该先接**。

2. **ncnn-Vulkan 双件套——零 Python、零 CUDA 的超分与插帧**
   `realesrgan-ncnn-vulkan`（MIT）+ `rife-ncnn-vulkan`（MIT），均为免安装便携包、真 CLI、文件进文件出：
   ```bash
   realesrgan-ncnn-vulkan.exe -i in.png -o out.png -n realesrgan-x4plus -s 4
   rife-ncnn-vulkan -i frames_in -o frames_out -m models/rife-v4.6
   ```
   这是"视频特效/画质修复"里集成成本最低的一条实路（避开 PyTorch/CUDA 地狱）。

3. **FFmpeg 自身作为调色/稳定织体**
   `lut3d`（LUT）、`colorspace`/`zscale`（色彩管理）、`vidstabdetect`+`vidstabtransform`（两遍稳定）、`libplacebo`（Anime4K GLSL）。注意 `vidstab`/`libplacebo` 在 **GPL 构建**里。

**睁眼看清楚再用**

| 项目 | 许可 | 判决 |
|---|---|---|
| `Natron` / `NatronRenderer` | GPL-2.0 | 无头 CLI 确实存在（`NatronRenderer -w MyWriter out.1-100.exr 1-100 proj.ntp`、`--onload script.py`），节点合成最强之一，**但维护者 2026-05 公开表示"Natron is not really maintained anymore"**，最后发布 v2.5.0（2022-11），2.6 分支未发布 → **不可作为核心依赖** |
| `video2x` 6.x | **AGPL-3.0** | 单命令整片流水线（Real-ESRGAN + Real-CUGAN + RIFE + Anime4K，Vulkan）；能力强但 AGPL + 仅 Vulkan |
| Blender `--background --python` | GPL-2.0 | 3D/VFX/2D 合成最强，但重量级 + GPL（见 §8.4） |

**陷阱（务必避开）**

- **`CodeFormer`：NTU S-Lab License 1.0 = 仅限非商用**（已核 LICENSE 原文）；`GFPGAN` 代码虽 Apache-2.0，但**捆绑 StyleGAN2 衍生权重（NVIDIA 来源）**，同属法律风险。
- `chaiNNer`：GPL-3.0，且 CLI 被官方标注为 **experimental**，只能跑"必须先在 GUI 里手工搭好"的 `.chn` 链（链与输入覆盖 ID 来自 GUI 右键）→ 半 GUI 依赖，不适合无头桥接。
- **停更名单**：DAIN（2023-02 起）、Squirrel-RIFE（2023-05）、Real-ESRGAN py / GFPGAN / BasicSR（2024 年中）→ 不要押注。
- `gmic`：许可是 **CeCILL-2.0**（法国版 copyleft，GPL 兼容）→ 不是宽松许可，不能当"顺手打包"的组件。
- **Real-ESRGAN 上游 README 自承"部分 PC 会输出全黑图"** → 桥接侧必须校验产物帧（正是 `ffmpeg-skill` 的 `look.py`/`probe.py` 验证纪律的必要性）。

**战略结论**：用**已在手**的工具覆盖无聊的 80%（ffmpeg 滤镜图 + OIIO 做合成/OCIO），只额外引入**两个可选外部二进制**（ncnn 超分 + ncnn 插帧）。因为它们只被"调用"而非随包分发，**使用侧风险为零**，分发侧风险仅在打包二进制时才出现。

**增量补充（完整报告要点）**

- **几乎免费的第四件**：**OpenColorIO CLI**（`ocioconvert`/`ociobakelut`/`ociowrite`/`ociomakeclf`/`ociochecklut`，**BSD-3-Clause**，2.1k★）——把"色彩管理"从手搓矩阵变成 `OCIO=<config> ocioconvert in.exr out.exr <src> <dst>`；已有 FFmpeg + OIIO 的前提下边际成本近乎为零。
- 其他可选项：`ImageMagick`（`magick`/`compare`，17.7k★，Apache-2.0 派生许可，通用格式/合成/形态学）；`VapourSynth` + `vspipe`（LGPL-2.1，2.1k★，脚本化帧服务器，2-pass 滤镜管线）。
- **许可证判定的关键区分（写入集成原则）**：插件只 **spawn 用户自行安装的独立二进制** → GPL/AGPL/CeCILL **全都可以自由调用**，不产生 copyleft 义务（"at-arms-length execution 不是衍生作品"）；风险只在**打包分发**时出现。唯一例外需谨慎的是 **AGPL §13**：若把这些程序包装成网络服务对外提供才会触发。插件自身只允许携带**命令行模板与 JSON schema**，绝不拷贝上游代码/头文件/滤镜字符串。
- **最常被忽略的分发风险**：**NVIDIA CUDA 运行时受 CUDA EULA 约束，不是开源许可问题**——这正是优先选 **ncnn/Vulkan 变体**（而非 PyTorch/CUDA 版）的技术外理由。
- **建议接入顺序**：`oiiotool`（合成/IO 核心）→ FFmpeg 能力探测 + 调色/稳定模板 → `realesrgan-ncnn-vulkan` → `rife-ncnn-vulkan` → OCIO CLI → *可选、用户自装* 的 `NatronRenderer` 与 Blender 后端（藏在"检测到二进制才启用"的门后）。
- **待实测（不可凭报告下结论）**：Blender `--background/--python` 在目标版本的确切参数名；`video2x` 6.x 插帧参数拼写；Natron 的 `WriteFFmpeg` 视频写出参数面（安全设计为"序列输出 + FFmpeg 封装"）；本机 13 个家族应用里是否有 OFX host（若有，`openfx-misc` 就是免费能力扩展）。

### 8.7 待补充的深挖方向

- **AI 后期工具链选型（字幕/配音/口型/音源分离）** 的 agent 完整报告 —— 落地后并入 §3.E
- `melt` 在 Windows 上的实际二进制可得性与 `MLT_REPOSITORY`/`MLT_DATA` 路径实测
- FilmCraft / EffectCraft 工程格式与 OTIO / MLT XML 的互操作验证（决定"时间线交换"可行性）
- 与 `dsh-ffmpeg` 的能力边界划分（谁拥有 probe/cut/concat/frames 面）——**两者已知重叠，需先定归属再写代码**
