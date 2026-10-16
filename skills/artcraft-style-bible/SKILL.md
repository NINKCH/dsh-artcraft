---
name: artcraft-style-bible
description: 一致性锁（美学圣经）——为一部片/一个项目锁定影调、图形、排版、声音的"配方"，保证跨镜跨集像同一部作品。含七步定稿法（渲染域/命门句/视觉根脉/hex 色彩配方/差异化签名/分区应用表/跨集检查表）、每类资产该用哪种家族机制加锁（LightCraft 预设与版本、FilmCraft Lumetri 预设与 .fcgt 模板、PhotoCraft 动作、EffectCraft Essential Graphics、VectorCraft 符号与色板、FigCraft 变量与样式、DeckCraft 主题、WordCraft 样式），以及一致性检查清单。
---

# 一致性锁：美学圣经

**没有圣经，不动机位。** 一致性的敌人不是审美差，而是"每条镜头各调各的"。本技能把"风格"变成可复用的配方与可核对的锁。

## 一、七步定稿法（每个项目做一次，10–30 分钟）

| 步 | 产出 | 说明 |
|---|---|---|
| 1 | **渲染域声明** | 画幅/帧率/色彩空间/交付平台（例：9:16 · 30fps · Rec.709 · 抖音） |
| 2 | **命门句** | 一句话锁定创作意图（例："冷雨里的暖灯，规矩人的困局"） |
| 3 | **视觉根脉** | 3–5 个参考作品/画作/摄影集，写清"取它什么"（构图？色温？质感？） |
| 4 | **hex 锁死色彩配方** | 主色/辅色/点缀色给十六进制值 + 各自出现比例与位置（禁止"差不多暖"） |
| 5 | **差异化签名** | 本片独有的一个视觉动作（例：每次权力反转必有一次低机位仰拍） |
| 6 | **分区应用表** | 按场景类型分配配方（日戏/夜戏/回忆/高潮），每类给参数档位 |
| 7 | **跨集检查表** | 每集交付前逐项核对（见第五节） |

> 命门句与 hex 配方一旦定稿，**后续所有产出都长在它上面**；改配方=改全片，必须显式决策。

## 二、每类资产用哪种锁（家族机制对照）

| 资产 | 锁机制 | 命令落点 |
|---|---|---|
| 影调（视频） | Lumetri 预设 + 输入 LUT + Look | FilmCraft `lumetri.presets` · `lumetri.applyPreset` · `lumetri.setInputLut` · `lumetri.setLook` · `presets.save/apply` · `lut.import/export` |
| 影调（照片/RAW） | develop 预设 + 版本 | LightCraft `preset.create/apply` · `version.create` · `history.*` |
| 影调（批量图像） | 动作 + 批处理 | PhotoCraft `actions.record/save` · `file.automate.batch` · `batch --actions` |
| 图形/文字（片头、花字、下三分之一） | 图形模板（.fcgt）+ 参数控件 | FilmCraft `graphics.template.list/apply/export` · `graphics.template.set/controls`；EffectCraft `essential.*`（暴露控件供复用） |
| 矢量元素 | 符号 + 色板 + 数据驱动 | VectorCraft `symbol.new/place/update` · `swatch.*` · `dataset.*` |
| 界面/图文资产 | 变量 + 样式 + 组件 | FigCraft `variable.createCollection/setMode/bind` · `style.create/bind` · `component.create/combineVariants` |
| 演示模板 | 主题与设计 | DeckCraft `design.theme/themes/colors/fonts` · `slide.*` 母版式复用 |
| 排版出版物 | 样式与对象样式 | DesignCraft `style.*` · `object.attributes` · `library.*` |
| 文档 | 样式与参考文献规范 | WordCraft `styles.apply/create` · `references.*` |
| 声音 | 预设 + 类型化处理 | FilmCraft `essentialSound.savePreset/applyPreset` · `mixer.*`；SoundCraft `session.save_template` |
| 时间线结构 | 交换格式固定结构 | FilmCraft `file.exportInterchange`（otio/fcpxml）作为结构基线 |
| **文案与命名** | 命名与元数据规范 | FilmCraft `metadata.set`（Name/Label/Description/Scene） |

## 三、色彩配方怎么写（可直接执行）

```
主色   #1B2A38（夜戏基底，占比 ~60%）
辅色   #D4A854（暖光源/道具，占比 ~25%）
点缀   #E8E3D9（肤色高光/文字，占比 ~15%）
肤色线 保护：矢量示波器落在肤色线，允许 ±5°
禁止   中性灰大面积（发灰=廉价）；高饱和红绿同框（抢注意力）
```

落点：LightCraft `mixer.*`（8 色相定点）与 `grading.*`（分区）把配方写成数值；FilmCraft 把成品存成 `lumetri.presets` 并在每集复用；`lut.export` 把配方固化成 .cube 供其他成员/外部使用。

## 四、差异化签名的实现

签名 = **一条可执行规则**，例如：
- "每次权力反转：低机位仰拍 + 冷色偏移 −10"→ EffectCraft `camera.*` + `effect.*`（Color Correction）
- "每集开场：三秒内一次由暗到亮的曝光爬升"→ FilmCraft `effects.addKeyframe`（曝光参数）
- "回忆段落：颗粒 +8、饱和 −15、色温 +300K"→ LightCraft `grain.amount` · `color.saturation` · `wb.temp`

签名要**少而准**（1–2 条），且写进分区应用表，否则执行时必被遗忘。

## 五、跨集检查表（交付前逐项核对）

- [ ] 画幅/帧率/色彩空间与渲染域声明一致（`artcraft_qc` + `color.spaces`）
- [ ] 影调预设为同一版本（FilmCraft `lumetri.presets` 核对；LightCraft `version.*`）
- [ ] 主/辅/点缀色在示波器与矢量图上与配方一致（`scopes.read`）
- [ ] 字幕字体/字号/描边/位置全片统一（`captions.setStyle`）
- [ ] 图形模板版本一致（`graphics.template.list` 核对，模板改动要显式升级）
- [ ] 声音：对白处理链与响度目标一致（`essentialSound.inspect` + `autoMatch`）
- [ ] 元数据（标题/集号/场景标签）完整（`metadata.set`）
- [ ] 差异化签名在本集出现且不滥用

## 六、反模式（一致性杀手）

| 反模式 | 后果 | 纠正 |
|---|---|---|
| 每镜单独调色 | 跳色、拼接感 | 先 `lumetri.applyMatch` 再套预设 |
| 直接把 LUT 当风格 | 全片同质且不通用的"滤镜味" | LUT 只做技术转换（Log→709），风格靠参数配方 |
| 图形逐镜手搓 | 版本漂移、无法批量改 | 一律用模板（.fcgt / Essential Graphics） |
| 字体靠系统默认 | 跨机不一致、缺字形 | 显式字体 + 内置字体渲染（FigCraft `--no-system-fonts`） |
| 改配方不记录 | 已交付集与新集不一致 | 配方版本化（导出 LUT/预设并归档） |
| 声音每段独立处理 | 响度忽大忽小 | 统一 `autoMatch` + 预设复用 |

> 一句话：**把风格写成数值与模板，把一致性写成检查表**——这样"像同一部作品"才是可执行的，而不是靠记忆。
