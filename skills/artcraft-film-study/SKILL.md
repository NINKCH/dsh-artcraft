---
name: artcraft-film-study
description: 拉片与影片分析（影评处理）——把一部片变成可回溯的证据而不是观后感：全片参数、逐秒帧表、对白时间轴、镜头切分、结构树、情绪曲线、母题追踪，并映射到 FilmCraft probe/transcript/captions/markers、PhotoCraft 抽帧、GridCraft 数据统计与图表、DeckCraft/DesignCraft 报告、FigCraft 结构图。含拉片表字段定义、情绪值的判据、结论可回溯规则与报告模板。
---

# 拉片与影片分析（影评处理）

**纪律：结论必须能回溯到时间码与画面证据。** 只写"我觉得节奏很好"不算拉片，写"第 12 分钟起平均镜长从 6.2s 降到 2.1s，与配乐重拍同步，对应主角失控"才算。

## 一、八步流程

| 步 | 做什么 | 家族落点 |
|---|---|---|
| 1 | **全片参数** | FilmCraft `probe <media>`（时长/帧率/分辨率/音轨） |
| 2 | **逐秒帧表** | PhotoCraft `batch` 或 FilmCraft `render --seconds N --out f.png`；建议 1 秒 1 帧，关键段加密到 4 帧/秒 |
| 3 | **对白时间轴** | FilmCraft `transcript.generate`（内置 whisper）→ `transcript.inspect`；导出底稿 `captions.export {format:"srt"}` |
| 4 | **镜头切分** | 有工程时用 `timeline.*` 读剪辑点；无工程时按帧表人工切分 + `markers.*` 标点 |
| 5 | **结构树** | 场 → 段 → 镜三级；用 GridCraft 表 + 缩进列，或 FigCraft 画层级图 |
| 6 | **情绪曲线** | 按镜头给 0–1 情绪值（判据见第三节），GridCraft `insert.chart` 出曲线 |
| 7 | **母题追踪** | 反复出现的物件/颜色/机位/台词，逐次记录时间码（`markers.add` 打标） |
| 8 | **报告成稿** | DeckCraft `slide.*` 出演示；或 DesignCraft `book/article` 出图文册；导出 PDF |

## 二、拉片表字段（建议固定，便于跨片比较）

| 列 | 类型 | 说明 |
|---|---|---|
| 时间码 | 秒 / hh:mm:ss | 镜头入点（必填） |
| 时长 | 秒 | 出点−入点 |
| 场次 | 文本 | 场号或地名 |
| 景别 | 枚举 | ELS/LS/FS/MS/MCU/CU/ECU |
| 角度 | 枚举 | 平/仰/俯/斜/过肩/主观 |
| 运动 | 枚举+幅度 | 固定/推/拉/摇/移/跟/升降/手持/环绕 |
| 主体 | 文本 | 画面主体与人 |
| 声音 | 文本 | 对白/音乐/音效/静默 |
| 情绪值 | 0–1 | 见第三节判据 |
| 转场 | 枚举 | 切/叠化/闪/划/匹配/隐藏 |
| 母题 | 标签 | 该镜出现的母题标记 |

**统计列**（GridCraft `pivot.*` + `formulas.*` 自动算）：镜数、平均镜长、镜长标准差、景别分布、运动占比、对白密度、每场情绪均值/峰值。

## 三、情绪值判据（避免"凭感觉"）

给每个镜头按下列**可观察**因素打分再取均值：

| 因素 | 权重 | 高分特征 |
|---|---|---|
| 镜长 | 0.2 | 越短越高（≤1s 记 1.0，≥8s 记 0.1） |
| 景别 | 0.2 | 越近越高（ECU 1.0 → ELS 0.1） |
| 运动 | 0.15 | 手持/快速运动高，固定低 |
| 声音 | 0.2 | 音乐强度、音效冲击、静默前的紧张 |
| 构图张力 | 0.15 | 失衡/斜角/遮挡/极浅景深高 |
| 表演/事件 | 0.1 | 冲突、反转、信息揭露 |

> 分值意义不在绝对值，而在**曲线形状**：峰值位置、上升斜率、平台长度、回落方式。

## 四、家族命令映射（可直接执行）

```
# 1) 参数与转写
artcraft_cli { bin:"filmcraft", args:["probe", "<片源>"] }
artcraft_cli { bin:"filmcraft", args:["commands","transcript"] }        # 看可用转写命令
artcraft_cli { bin:"filmcraft", args:["exec","transcript.generate","--params","{\"language\":\"auto\"}"] }

# 2) 抽帧（1 秒 1 帧；关键段加密）
artcraft_cli { bin:"filmcraft", args:["render","--seconds","12","--out","<项目>/media/f012.png"] }
# 批量：PhotoCraft convert 或 batch（配合 actions 做统一缩放/水印）

# 3) 拉片表与统计（GridCraft）
artcraft_cli { bin:"gridcraft", args:["run","--in","<项目>/craft/shots.xlsx","--cmd","data.sort {…}","--save","<项目>/craft/shots.xlsx"] }
artcraft_cli { bin:"gridcraft", args:["run","--in","<项目>/craft/shots.xlsx","--cmd","pivot.fields {…}","--cmd","insert.chart {…}"] }
artcraft_cli { bin:"gridcraft", args:["eval","=AVERAGE(C2:C400)","--in","<项目>/craft/shots.xlsx"] }

# 4) 报告
artcraft_cli { bin:"deckcraft", args:["run","--in","<项目>/craft/report.pptx","--cmd","slide.delete {…}","--export","<项目>/out/report.pdf"] }
#   或 DesignCraft 图文册：book/article/type 系列
```

结构化输出建议放 `craft/`，报告放 `out/`，帧表放 `media/frames/`，证据图放 `reports/`。

## 五、结论可回溯规则

1. 每条结论后附**证据**：时间码区间 + 帧号/帧图路径 + 数据出处（哪张表哪一列）。
2. 区分**事实**与**判断**：事实（"此段 47 个镜头，平均 1.8s"）与判断（"此处刻意制造窒息感"）分开标注。
3. 反例也要记：与结论矛盾的镜头必须列出（避免选择性举证）。
4. 数值优先：能用统计量说明的，不写形容词。

## 六、报告模板（最小可用）

```
1. 基本信息     片名/时长/画幅/帧率/年代（probe 事实）
2. 结构总览     场次表 + 结构树（幕/场/段）
3. 节奏分析     镜长分布 + 情绪曲线 + 三个峰值段落的时间码与手法
4. 镜头语言     景别/角度/运动分布统计 + 2–3 个代表性设计及其实例帧
5. 声画关系     对白密度、音乐进入点、静默使用、J/L cut 实例
6. 母题与主题   母题出现时间码序列 + 演变说明
7. 结论         3–5 条可回溯的判断（每条带证据）
8. 附录         拉片表全文 + 帧图表 + 数据文件路径
```

## 七、常见错误

| 错误 | 纠正 |
|---|---|
| 只有观后感没有数据 | 至少给出镜长分布与情绪曲线 |
| 抽帧密度不足 | 常规段 1 帧/秒，关键段 4 帧/秒 |
| 情绪值凭印象 | 用第三节六因素打分 |
| 结论不带时间码 | 每条结论必须可定位 |
| 只看画面不听声音 | 对白/音乐/静默是节奏的一半 |
| 报告与数据脱节 | 报告中的每个数字都能在附表中找到 |
