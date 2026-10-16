---
name: artcraft-batch-pipeline
description: 批量与流水线——把"一条一条手工做"变成可复跑的生产线：无头批处理（PhotoCraft batch/droplet、FilmCraft run script.jsonl、DeckCraft/DesignCraft/SoundCraft run|script、FigCraft run、GridCraft --script）、HTTP 任务队列（POST /artcraft/api/job 轮询/取消）、应用内队列（jobs.list/jobs.cancel、renderQueue、export --queue）、代理与缓存（media.createProxies/attachProxies/reconnectFullRes、mediaCache.info/clean）、媒体健康与重链（media.status/findMissing/autoRelink/relink/replaceFootage）、增量与断点续跑、失败重试与产物质检挂钩。用于成批素材、整季剧集、批量导出与长任务管理。
---

# 批量与流水线

**批量的价值不在"快"，而在"可复跑、可校验、可续跑"。** 一次跑 500 个文件却没有校验，等于制造 500 个待排查问题。

## 一、四种批量形态（按规模与时长选）

| 形态 | 适用 | 入口 |
|---|---|---|
| **无头批处理** | 同构操作、分钟级 | PhotoCraft `batch --actions` / `droplet`；FilmCraft `run <script.jsonl>`；DeckCraft·DesignCraft·SoundCraft `run [--cmd …]` / `script <file>`；FigCraft `run <script.json|jsonl>`；GridCraft `--script FILE.jsonl` |
| **HTTP 任务队列** | 单个长任务（渲染/导出），分钟到小时 | `POST /artcraft/api/job {bin,args,outputs}` → 轮询 `GET /job?id=` → `GET /artcraft/api/file` 取产物；`POST /artcraft/api/job/cancel` |
| **应用内队列** | 已在 App 里的导出/渲染 | FilmCraft `jobs.list` / `jobs.cancel`、导出 `--queue`；EffectCraft `render … --queue` 与 `renderQueue.*` |
| **外部编排** | 跨成员的长链路 | 由 agent 逐步驱动：每步 CLI + 每步验证（推荐配合 `artcraft_qc`） |

**选择口诀**：同一操作 × 多个文件 → 无头批处理；单个文件 × 很久 → HTTP 任务；多条链路 → 外部编排。

## 二、写批处理脚本（三种家族格式）

```
# 1) PhotoCraft 动作列表（JSON 数组；也可用 droplet .pcdroplet）
[{"cmd":"layer.newAdjustmentLayer.curves","params":{"points":[[0,0],[64,48],[192,212],[255,255]]}},
 {"cmd":"filter.sharpen.smartSharpen","params":{"amount":80}}]
→ photocraft-cli batch --actions <craft/grade.json> --in <media> --out <out> [--format png] [--in-place]

# 2) FilmCraft 脚本（JSONL，一行一条，可注释）
# 调色一批剪辑点
{"id":"lumetri.applyPreset","params":{"name":"ep01-main"}}
{"id":"export.presets.list","params":{}}
→ filmcraft-cli run <craft/pass.jsonl>

# 3) 通用：run --cmd 序列（DeckCraft / DesignCraft / SoundCraft / GridCraft / FigCraft）
→ designcraft-cli run --in <in> --cmd 'style.cell.apply={…}' --cmd 'layout.pages.insert={…}' --export <out>
→ soundcraft-cli run --in <session.scraft> --cmd 'mix.setStrip={…}' --bounce <out.wav>
→ figcraft-cli run <script.jsonl> --in <file.figcraft> --out <out>
```

**纪律**：脚本进 `craft/`、产物进 `out/`、日志进 `reports/`；**输入目录与输出目录必须不同**（家族多数工具默认新文件名，`--in-place` 只在明确要覆盖时用）。

## 三、增量与断点续跑

| 需求 | 做法 |
|---|---|
| 只处理新增/变更 | 比对源文件 mtime/size 与 `reports/` 清单，生成待处理列表后再跑 |
| 跳过已完成 | 产物存在且 `artcraft_qc` 通过 → 跳过；否则重跑 |
| 断点续跑 | 脚本按行执行，失败行单独存 `craft/failed.jsonl`，修好后只重跑该文件 |
| 分段渲染 | EffectCraft `render --start/--end` 分段；失败只重跑该段 |
| 缓存复用 | `mediaCache.info` 查看缓存；`mediaCache.clean` 释放空间；EffectCraft `render --cache DIR` 复用未变阶段 |

## 四、媒体健康与代理（长项目必备）

| 命令 | 用途 |
|---|---|
| `media.status` / `media.findMissing` | 体检：哪些素材丢失/离线 |
| `media.autoRelink` / `media.relink` / `media.linkMedia` | 重链素材（换机器/换盘后） |
| `media.refreshChanged` / `media.replaceFootage` | 源文件已更新 / 替换素材（保留剪辑） |
| `media.search` | 在素材库里检索 |
| `media.createProxies` / `media.attachProxies` / `media.toggleProxies` / `media.detachProxies` / `media.reconnectFullRes` | **代理流程**：大素材剪辑用代理，导出前切回全分辨率 |
| `media.proxyPresets` | 查看代理预设 |
| `state.inspect` / `history.list` / `events.list` / `events.clear` | 工程状态、历史、事件（排查"为什么变了"） |

**代理铁律**：导出前必须 `media.reconnectFullRes`（否则交付的是代理画质）。

## 五、失败与重试

1. **先探后跑**：批处理前对**一个样本**跑通全链路（含质检），再全量。
2. **失败隔离**：单个文件失败不要终止全批；记录文件+错误+时间，继续下一条。
3. **重试策略**：区分"可重试"（超时、临时占用）与"不可重试"（素材损坏、路径不存在）；后者直接报给调用方。
4. **产物校验**：每条产物跑 `artcraft_qc { path, platform }`，把 `reports/` 里存 QC 输出。
5. **超时**：CLI 侧 `--timeoutMs`（本插件工具）/ HTTP 任务自带超时与取消；不要无限等待。

## 六、目录与命名（批处理尤其重要）

```
<project>/
  media/            源素材（只读）
  craft/            脚本与工程：grade.json · pass.jsonl · failed.jsonl
  out/<批次>/       产物：<name>_<平台>_<版本>.<ext>
  reports/<批次>/   清单.json · qc/*.json · 日志
```

**批次号进目录名**（`out/2026-10-16-batch1/`），便于回滚与对比。

## 七、反模式

| 反模式 | 后果 | 纠正 |
|---|---|---|
| 全量直接跑、无样本 | 500 个文件一起错 | 先样本，再全量 |
| 输出目录 = 输入目录 | 覆盖原片（不可逆） | 目录分离；`--in-place` 需显式且先备份 |
| 无质检 | "跑完了"但对不上规格 | 每条产物 `artcraft_qc` |
| 忘了切回全分辨率 | 交付代理画质 | 导出前 `media.reconnectFullRes` |
| 反复全量重渲染 | 浪费时间与电 | 缓存/分段/增量 |
| 失败即终止全批 | 一个坏文件阻塞全部 | 失败隔离 + 清单 |
