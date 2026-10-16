# 平台规格与交付参数表

> 配合插件工具使用：`artcraft_qc { path:"<产物>", platform:"douyin" }` 会按本表核对画幅/帧率并给出修复命令。
> 响应值：`pass` / `pass-with-manual-checks` / `warn` / `fail`；`manual` 级项目需在应用内复核（响度、无障碍、印刷尺寸）。

## 一、视频平台

| platform id | 场景 | 画幅 | 目标分辨率 | 推荐帧率 | 建议码率 | 音频 | 响度目标 |
|---|---|---|---|---|---|---|---|
| `bilibili` | B 站 / 横屏 | 16:9 | 1920×1080（可 4K） | 24 / 25 / 30 / 50 / 60 | 1080p 8–12 Mbps · 4K 35–45 Mbps | AAC 192–320 kbps | −14 LUFS / TP −1 |
| `youtube` | YouTube / 横屏 | 16:9 | 1920×1080（可 4K） | 24 / 25 / 30 / 50 / 60 | 同上 | AAC 192–320 kbps | −14 LUFS / TP −1 |
| `douyin` | 抖音 / 竖屏 | 9:16 | 1080×1920 | 30 / 60 | 6–10 Mbps | AAC 128–192 kbps | −14 LUFS / TP −1 |
| `reels` | Instagram Reels | 9:16 | 1080×1920 | 30 / 60 | 6–10 Mbps | AAC 128–192 kbps | −14 LUFS / TP −1 |
| `shorts` | YouTube Shorts | 9:16 | 1080×1920 | 30 / 60 | 6–10 Mbps | AAC 128–192 kbps | −14 LUFS / TP −1 |
| `wechat` | 视频号 | 9:16 或 1:1 | 1080×1920 / 1080×1080 | 30 | 6–8 Mbps | AAC 128 kbps | −14 LUFS / TP −1 |
| `broadcast` | 广播 / 电视（EBU R128） | 16:9 | 1920×1080 | 25 / 50（PAL）· 29.97 / 59.94（NTSC） | 50 Mbps+ 或 ProRes | PCM | **−23 LUFS / TP −2** |
| `podcast` | 播客（纯音频） | — | — | — | — | WAV/AAC ≥ 44.1 kHz | **−16 LUFS / TP −1.5** |

## 二、编码与容器选择

| 场景 | 视频编码 | 备注 |
|---|---|---|
| 平台上传（通用） | H.264 (AVC) | 兼容性最好；码率按上表 |
| 画质优先 / 4K | H.265 (HEVC) | 同画质省 30–50% 体积；部分平台转码后反而降质 |
| 网页/开源编码 | AV1 | 体积最优，编码慢；EffectCraft 支持 `--webm-codec av1` |
| 中间/交付母版 | ProRes（422/4444） | 剪辑与合成交接；带 alpha 用 4444 |
| 广播/影院中间 | DNxHR / ProRes | 稳定、可多次编辑 |
| 静帧序列 | PNG / EXR / TIFF | EXR 保 HDR 与多通道；序列命名 `%04d` |
| 音频母版 | WAV 24-bit / 48 kHz | 分轨交付用 stems（`file.bounce_stems`） |

## 三、字幕与安全区

| 项 | 竖屏（9:16） | 横屏（16:9） |
|---|---|---|
| 底部避让（平台 UI） | 12–15% | 8–10% |
| 左右安全边距 | 5% | 5% |
| 单行字数（中文） | ≤ 15 | ≤ 20 |
| 最短停留 | 1 s | 1 s |
| 描边/底条 | 2–3 px 描边或半透明底条 | 同 |
| 全片一致性 | 一种字体、一套样式（`captions.setStyle`） | 同 |

## 四、文档与印刷

| 交付物 | 检查项 | 命令 |
|---|---|---|
| PDF（阅读） | 无障碍（标签/阅读顺序/替代文本） | `pdfcraft run a11y.check` · `a11y.report` · `a11y.alt_text` |
| PDF（印刷） | 出血、裁切标记、CMYK、尺寸 | FigCraft `export --bleed 3mm --crop-marks --cmyk`；DesignCraft `layout/type` |
| PDF（长期存档） | PDF/A 合规 | `pdfcraft run standards.pdfa` |
| PDF（传输） | 体积 | `pdfcraft run optimize.reduce`（或 `optimize.advanced`） |
| PDF（安全） | 口令/权限 | `pdfcraft protect.password` / `protect.remove` |
| Word 文档 | 无障碍、批注、修订、文献 | `wordcraft run --cmd file.accessibility` · `review.changes` · `references.bibliography` |
| 表格 | 数据校验、公式、图表 | `gridcraft data.validate` / `data.validation` · `formulas.evaluate` |
| 演示 | 转场/动画时长、备注 | `deckcraft transition.set` · `animation.timing` |

## 五、命名与目录约定

```
<project>/
  media/     素材（只读；帧表放 media/frames/）
  craft/     工程与中间产物（.fcproj/.ecproj/.pcraft/.scraft/.figcraft/表）
  out/       交付物：<name>_<平台>_<画幅>_<版本>.<ext>   例：ep01_douyin_9x16_v3.mp4
  reports/   质检证据（读数、抽帧图、QC 输出、报告）
```

**版本纪律**：改一版进一位（v1→v2→v3），不覆盖旧交付物；最终版标记 `_final`。

## 六、质检顺序建议

1. `artcraft_qc`（自动：规格/画幅/帧率/时长/结构）
2. 示波器（`scopes.read`：波形/矢量/直方）——画面电平
3. 音频（`essentialSound.inspect` / `session.audio_health` / bounce 返回的 LUFS 与真峰值）
4. 抽帧目检（agent 视觉复核构图/字幕/转场）
5. 文档类附加检查（a11y / measure / validate / review）
6. 记录到 `reports/`，结论可回溯到命令输出
