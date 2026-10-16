---
name: artcraft-multicam
description: 多机位剪辑——用 FilmCraft 的 multicam 命令族（35 条）把 2–9 台机位的素材对齐、切换、成片：建多机位源、音频对齐、网格巡视（gridLayout/grid/page/nextPage/prevPage）、角度选择与切换（selectCamera1-9 巡视 vs cutToCamera1-9 切出）、实时切换录制（recordStart/recordStop）、audioFollowsVideo、声音与画面一致性（allSound 处理、lumetri.applyMatch 跨机位对齐）、以及切换节奏的镜头语言规则与质检要点。用于访谈、演出、直播切片、多机位短剧。
---

# 多机位剪辑

多机位的难点不是技术，而是**切换节奏**：切点错了，再多机位也只是"画面在跳"。

## 一、命令族（FilmCraft multicam，35 条，已验证）

| 命令 | 用途 |
|---|---|
| `multicam.inspect` | 查看当前多机位源与角度状态（**先 inspect**） |
| `multicam.editCameras` | 编辑机位（增删/排序机位源） |
| `multicam.grid` / `multicam.gridLayout` | 网格视图（同时看多路） |
| `multicam.page` / `multicam.nextPage` / `multicam.prevPage` | 网格分页（>4 路时分页巡视） |
| `multicam.selectCamera1…9` | **巡视**（只切预览，不落剪辑点） |
| `multicam.cutToCamera1…9` | **切出**（把当前机位切到时间线） |
| `multicam.switchAngle` / `multicam.cut` / `multicam.cutToCamera` | 通用角度切换 |
| `multicam.recordStart` / `multicam.recordStop` | **实时切换录制**（边看边切，自动落点） |
| `multicam.audioFollowsVideo` | 音频跟随视频机位（切换时同步换音源） |
| `multicam.selectionTopDown` | 选择顺序（从上到下） |
| `multicam.autoAdjustQuality` | 自动降低预览质量（多路预览卡顿时用） |
| `multicam.showPreviewMonitor` / `multicam.transmitView` | 预览监视器 / 输出监看 |

> `select*` = 看；`cutTo*` = 切。**混淆这两个是新手最常见的错误**（以为在看，其实已经切了）。

## 二、标准流程

```
1) 导入素材        file.import / mediaBrowser.import（各机位分别入箱）
2) 建多机位源      multicam.editCameras（把机位加入同一个源）
3) 对齐            multicam.inspect 核对角度与同步；必要时用音频对齐（见 artcraft-sound-design 的 sync 思路）
4) 巡视            multicam.grid / gridLayout → page/nextPage/prevPage 分页查看
5) 切换            selectCameraN 巡视 → cutToCameraN 落点；或 recordStart 实时切 → recordStop
6) 音频            multicam.audioFollowsVideo（切画面同时切音源）或统一用外部录音轨
7) 影调统一        各机位分别 lumetri.applyMatch 到同一参考（跨机位跳色是多机位最扎眼的问题）
8) 响度统一        essentialSound.setType("dialogue") → autoMatch（不同机位的电平差异必须先拉平）
9) 导出            见 artcraft-delivery-qc
```

## 三、切换节奏（把 multicam 当成剪辑来做）

| 原则 | 说明 |
|---|---|
| **切点落在动作中** | 与单机剪辑同理：动作进行中切最隐蔽 |
| **切点落在说话人变化** | 谁说话给谁（除非刻意给反应镜头） |
| **视线匹配** | 切到对方视角前，先给一个"看向"的镜头 |
| **不要机械交替** | A/B/A/B 交替=监控录像感；按叙事需要停留 |
| **反应镜头有价值** | 听话者的表情常比说话者更有信息 |
| **一次切换一个理由** | 说不出理由的切换就删掉 |
| **节奏与内容同向** | 争论加快、抒情放慢（见 artcraft-edit-rhythm） |

## 四、多机位一致性问题（多机位专属）

| 问题 | 原因 | 处理 |
|---|---|---|
| 画面跳色 | 各机位白平衡/曝光不同 | 逐机位 `lumetri.applyMatch {referenceTime}` 到同一参考 |
| 声音跳电平 | 各机位话放/距离不同 | 统一 `essentialSound.setType("dialogue")` + `autoMatch {target:-14}` |
| 相位/回声 | 多路同源音频叠加 | 只用一路主音（通常外录），其余静音或 `audioFollowsVideo` 但只留一路 |
| 音频不同步 | 各机位时钟漂移 | 先按音频对齐（长素材必须做漂移校正）；短片用拍手点对齐 |
| 预览卡顿 | 多路同时解码 | `multicam.autoAdjustQuality`、降低预览分辨率、用代理（`media.createProxies`） |

## 五、多机位素材的准备与代理

- 大素材（4K/多机位）**先建代理**：`media.createProxies` → `media.attachProxies` → 剪辑用代理 → 导出前 `media.reconnectFullRes`（否则交付代理画质）。
- 素材健康：`media.status` / `media.findMissing` / `media.autoRelink`（换机器后必备）。
- 素材变更：`media.refreshChanged`（源文件被重新转码后）或 `media.replaceFootage`（保留剪辑替换素材）。

## 六、质检清单

- [ ] 各机位影调统一（示波器/矢量读数接近）
- [ ] 对白响度统一，且只用一路主音（无回声/相位问题）
- [ ] 音画同步（长素材已做漂移校正）
- [ ] 切换有理由（无机械交替）
- [ ] 反应镜头与视线匹配到位
- [ ] 导出前已切回全分辨率（代理已断开）
- [ ] `artcraft_qc` 通过（规格/画幅/响度）
