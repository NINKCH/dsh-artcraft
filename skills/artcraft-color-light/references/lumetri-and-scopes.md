# Lumetri / LUT / 示波器接口（FilmCraft）

> 来源：官方 `docs/control-protocol.md`（已验证）+ 本机命令表实测。
> 调色的方法顺序与判据见 `../SKILL.md`；本文件只讲**精确接口**，避免写错参数。

## 一、Lumetri 与 LUT

| 命令 | 参数 | 说明 |
|---|---|---|
| `lumetri.setInputLut` | `{clip?, lut:"lib:<id>"\|"builtin:<id>"\|"", path?}` | **技术 LUT**（Log→709）；输入转换只应在这里做 |
| `lumetri.setLook` | `{clip?, lut:"lib:<id>"\|"builtin:<id>"\|"", path?}` | **创意 Look**（风格化）；与技术转换分离 |
| `lumetri.setSection` | `{clip?, section, on?}` | 展开/开关 Lumetri 分区（`basic` / `creative` / `curves` / `wheels` …） |
| `lumetri.applyMatch` | `{clip?, referenceTime\|referenceFrame\|referenceTimecode, faceDetection?}` | **跨镜匹配**：以参考镜头的某一时刻为基准（`faceDetection` 默认开） |
| `lumetri.presets` | `{folder?}` | 列出可用调色预设 |
| `lumetri.applyPreset` | `{name, clips?}` | 套用预设（一致性锁的关键动作） |
| `lumetri.presetThumbnails` | `{folder?, names?, width?, columns?, …}` | 生成预设缩略图（供视觉挑选） |
| `lut.import` / `lut.list` / `lut.remove` / `lut.export` | `{path, name?}` / `{}` / `{id}` / `{lut, path, format?}` | LUT 资产管理（`.cube` 等） |

**UI 面板 id**（`ui.set` 用）：`lumetri.input_lut` · `lumetri.look_lut` · `lumetri.switch.<section>` · `lumetri.section.<section>` · `lumetri.match.*`；
颜色对话框：`colorDialog.wideGamut` · `colorDialog.autoToneMap` · `colorDialog.ok` / `cancel`。

## 二、示波器（客观判据）

```
artcraft_control { app:"filmcraft", method:"scopes.read",
                   params:{ scopes:["waveform","parade","histogram","vectorscopeYuv"] } }
```

- `scopes.read` 返回所选示波器的读数；HDR 素材另有 **`scopes.hdrWaveform`**。
- 判读要点：
  - **Waveform（波形/亮度）**：黑位不贴底（否则暗部死）、白位不削顶（否则高光丢细节）。
  - **Parade（RGB 分量）**：三通道是否对齐——偏色会在分量上先暴露。
  - **Vectorscope（矢量）**：**肤色线**附近为正常肤色；越界即过饱和。
  - **Histogram（直方）**：分布是否堆积在两端（对比过猛/过平）。
- 示波器只是在运行中 App 里才能实时读；无头流程可用 `artcraft_qc`（读产物）+ 抽帧目检替代。

## 三、色域与 HDR

| 需求 | 接口 |
|---|---|
| 列出可用色彩空间 | `color.spaces` |
| HDR 交付 | `file.exportMedia {sdr:true}` 导出 SDR 版本；HDR 原样导出则不带该参数 |
| HDR→SDR 映射（照片/RAW 链路） | LightCraft `hdr.maxEv` / `hdr.sdrBrightness` / `hdr.sdrContrast` / `hdr.sdrHighlights` / `hdr.sdrShadows` / `hdr.sdrWhites` / `hdr.sdrClarity`（见 artcraft-color-light 的控制表） |
| LUT 交接给其他软件 | `lut.export {lut:"lib:<id>", path:"<out>.cube", format:"cube"}` |

## 四、跨镜一致性操作序列（可直接照抄）

```
1) 选参考：timeline.selectClipAtPlayhead / scopes.read 找曝光与白平衡最准的镜头
2) 匹配：  lumetri.applyMatch { clip:"<目标>", referenceTime:<参考时刻>, faceDetection:true }
3) 预设：  presets.save { name:"ep01-main" }（把定稿参数存成预设）
4) 复用：  lumetri.applyPreset { name:"ep01-main", clips:[…] }（其余镜头统一）
5) 核对：  scopes.read 逐镜比对（波形/矢量读数一致）
6) 固件：  lut.export（把 Look 导出为 .cube 交付/归档，供跨集与跨软件复用）
```

## 五、常见错误

| 错误 | 后果 | 纠正 |
|---|---|---|
| 把风格 LUT 塞进 `setInputLut` | 技术转换与风格混淆，后期无法回退 | 技术转换用 `setInputLut`，风格用 `setLook` |
| 逐镜手调而不 `applyMatch` | 跳色 | 先匹配再套预设 |
| 只看监视器不看示波器 | 不同显示器上片子颜色不一致 | 一律以 `scopes.read` 读数为准 |
| 忘了 `faceDetection` | 匹配把肤色带偏 | 保持默认开启；人像镜头尤其重要 |
| LUT 未归档 | 跨集/交接后无法复现 | `lut.export` 存档并写入 `craft/` |
