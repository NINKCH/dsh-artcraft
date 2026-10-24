---
name: artcraft-director-lens
description: 导演透镜——把 20 位知名导演的工作方式（王家卫、张艺谋、诺兰、芬奇、毕赣、希区柯克、库布里克、黑泽明、王家卫、朴赞郁…）翻译成 ArtCraft 家族的可执行参数。当用户点名某位导演、要求"XX 风格"、项目美学圣经引用某个透镜，或需要为段落选择风格参照时加载。每次只挂一个透镜；透镜参数（镜长/转场偏好/光比/色板/颗粒）映射到 FilmCraft 时间线与 Lumetri、LightCraft develop、SoundCraft 混音、EffectCraft 机位。
---

# 导演透镜（Director Lenses）

**一次只用一个透镜。** 混用两位导演 = 风格不连贯。透镜优先级：**导演透镜 > 题材手册 > 项目基调 > 技能默认**——用户点名导演时，透镜覆盖其余一切风格默认值；用户点了两位，选更贴合本场戏剧核心的那位，一句话说明理由，并写明另一位会改掉什么。

## 一、路由：点名导演 → 读哪个文件

`references/director-styles/` 下 20 个模块，按导演加载（**一次只读一个**，不要全读）：

| 导演 | 文件 | 导演 | 文件 |
|---|---|---|---|
| 斯皮尔伯格 Spielberg | `01_spielberg.md` | 毕赣 Bi Gan | `14_bi_gan.md` |
| 希区柯克 Hitchcock | `02_hitchcock.md` | 张艺谋 Zhang Yimou | `15_zhang_yimou.md` |
| 库布里克 Kubrick | `03_kubrick.md` | 侯孝贤 Hou Hsiao-hsien | `16_hou_hsiao_hsien.md` |
| 黑泽明 Kurosawa | `04_kurosawa.md` | 朴赞郁 Park Chan-wook | `17_park_chan_wook.md` |
| 斯科塞斯 Scorsese | `05_scorsese.md` | 马力克 Malick | `18_malick.md` |
| 费里尼 Fellini | `06_fellini.md` | 迈克尔·曼 Michael Mann | `19_michael_mann.md` |
| 伯格曼 Bergman | `07_bergman.md` | 科恩兄弟 Coen Brothers | `20_coen_brothers.md` |
| 塔可夫斯基 Tarkovsky | `08_tarkovsky.md` | 两两对比选型 | `example_comparisons.md` |
| 王家卫 Wong Kar-wai | `09_wong_kar_wai.md` | 模块格式说明 | `README.md` |
| 诺兰 Nolan | `10_nolan.md` | 维伦纽瓦 Villeneuve | `11_villeneuve.md` |
| 芬奇 Fincher | `12_fincher.md` | 雷弗恩 Refn | `13_refn.md` |

**没有的导演不要默默替换**：一句话说明没有该模块，指出最近似模块与差异轴（如"王家卫：同为氛围但叙事碎片化"），然后按用户自己的参考临时拼一个透镜，**标注 ad-hoc**。静默替换比没有更糟。

每个模块的结构：**风格参数 YAML**（机器可读）→ 反例对比（"这不是什么"）→ 叙事/镜头/光影/剪辑/声音/表演方法 → 可迁移拍摄清单 → **ArtCraft 落点**（参数到家族命令的映射）。

## 二、风格参数 → ArtCraft 命令映射总表

读到任何透镜的 YAML 后，按下表落到命令。**逐参数落，不要只落影调**——透镜只到分镜不到调色，出片就"不像"。

| YAML 参数 | ArtCraft 落点 |
|---|---|
| `editing.avg_shot_length_s`（如 "1.5-4"） | **FilmCraft 时间线**：单镜目标时长 → `timeline.place` + `timeline.trim`；段落密度按 `artcraft-edit-rhythm` 的节奏档位 |
| `editing.transition_bias` | `sequence.applyVideoTransition {effect}`（偏好列表内的转场）；批量 `trim.applyDefaultTransition` |
| `editing.coverage_style` | 分镜设计约束（写入分镜表，不落单条命令） |
| `lighting.key_ratio`（如 "6:1-10:1"） | **LightCraft `light.contrast`** 目标区间 + `grading.shadows/highlights` 分离；FilmCraft `lumetri.setSection wheels` |
| `lighting.motivation`（如 practical） | 光源动机 → LightCraft 分区调色方向 + EffectCraft 光效层 |
| `lighting.signature` | 原文光线配方 → LightCraft `develop.set` 逐项 |
| `palette.dominant/accent` | LightCraft **`mixer.<色>.*`** 定点修色（通道映射：green/magenta/red/orange(暖金)/aqua(青)/blue/purple/yellow）+ `grading.*` 偏色 |
| `palette.saturation/contrast` | `color.saturation` + `light.contrast` 档位 |
| 质感词（颗粒/胶片） | LightCraft `grain.amount/size/roughness` |
| `camera.prefer/avoid` + `lens_kit_mm` | EffectCraft `camera.orbit/pan/dolly`、`view.3d.*` 机位；2D 素材 `layer.*`+`keys.easyEase*` |
| `aspect_bias` | FilmCraft `file.newSequence {width,height}` / `sequence.settings` |
| `sound.music/ambience/dialogue` | FilmCraft `essentialSound.setType` + `set`；SoundCraft `mix.*` |
| `negative_prompt_adds` | **`artcraft_qc` 复核项**：逐项确认画面/声音里"不应出现"的东西确实没出现 |
| `performance.register` | 剪辑选择导向（反应镜头停留时长、切点松紧） |

## 三、把透镜做成"锁"（与 artcraft-style-bible 衔接）

透镜定稿后必须**固化为可复用资产**，否则第三集就开始漂：

| 锁什么 | 固化机制 |
|---|---|
| 影调参数 | LightCraft `preset.create` / FilmCraft `presets.save` + `lut.export`（.cube 归档） |
| 跨镜匹配 | `lumetri.applyMatch {referenceTime}` 到参考镜头 |
| 图形/字幕风格 | FilmCraft `graphics.template.export`（.fcgt）/ EffectCraft `essential.*` |
| 界面与图文资产 | FigCraft `variable.createCollection` + `style.bind` + `component.*` |
| 声音链 | FilmCraft `essentialSound.savePreset`；SoundCraft `session.save_template` |
| 复用 | 下一集 `preset.apply` / `graphics.template.apply` → 全片一致性 |

一致性核对走 `artcraft-style-bible` 的跨集检查表。

## 四、使用示例（王家卫透镜剪一段）

1. 用户："这段按王家卫的感觉剪。"
2. 读 `references/director-styles/09_wong_kar_wai.md` 的风格参数：ASL 1.5–4s、跳接/硬切偏好、实用光 8:1 光比、霓虹绿×钨丝琥珀、一次慢动作长挂。
3. 落地：`timeline.place` 后按 1.5–4s 分配镜长；唯一慢动作段 `timeline.rateStretch`；`sequence.applyVideoTransition` 只在段落头用一次叠化（或全程硬切）；LightCraft `light.contrast` 拉到光比 8:1 档、`mixer.green/magenta` 定点霓虹色；`essentialSound.generateDucking` 让音乐避让旁白；`artcraft_qc` 复核示波器不越界。
4. 交付前过 `artcraft-style-bible` 跨集检查表。

## 五、边界

- 透镜教的是**方法与参数档位**，不复刻任何真实影片的具体镜头、台词、角色或情节。
- 透镜服务叙事：说不出"这场戏观众该感到什么"就先回 `artcraft-shot-language` 的判断层。
- 用户没点名导演时，不要主动挂透镜——让题材与基调定默认（见 `artcraft-edit-rhythm` 的节奏档位表）。
