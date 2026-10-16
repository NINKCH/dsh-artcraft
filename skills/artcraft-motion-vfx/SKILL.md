---
name: artcraft-motion-vfx
description: 动效与特效选择——何时在剪辑内做效果（FilmCraft effects/graphics）何时必须开合成层（EffectCraft）、307 个效果按类别的选用场景、关键帧与缓动（Easy Ease/速度/插值）、文字动效与图形模板、跟踪/稳定/抠像/Roto 的取舍、3D 相机与透视、Puppet 角色动画、时间重映射，以及渲染成本控制（分辨率/质量/renderQueue）。用于动效设计、合成、VFX 与特效决策。
---

# 动效与特效选择

先判断"该在哪一层做"，再选具体效果。**层级选错，后面全是返工。**

## 一、层级判断：剪辑内 vs 合成层

| 情况 | 层级 | 理由 |
|---|---|---|
| 单个片段加模糊/锐化/调色/简单变换 | **FilmCraft `effects.*`** | 留在剪辑里，渲染快、参数跟着片段 |
| 多元素叠加、遮罩合成、跟踪、3D、粒子 | **EffectCraft** | 需要图层树与时间线独立控制 |
| 文字/图形（片头、字幕条、角标） | FilmCraft `graphics.*`（简单）→ EffectCraft `text.*/shape.*`（复杂动效） | 模板可复用 vs 自由动画 |
| 需要跨软件复用 | **图形模板**（FilmCraft `graphics.template.*` .fcgt）或 EffectCraft `essential.*` | 参数化复用 |

**判断口诀**：**一层能做完就别开第二层**；需要"元素之间的关系"（遮挡、跟踪、透视、景深）才上合成。

## 二、效果选择表（EffectCraft 306 效果 / 21 类）

| 类别 | 数量 | 典型用途 | 何时别用 |
|---|---|---|---|
| Color Correction | 40 | 调色、LUT、肤色、曲线 | 已在 LightCraft/FilmCraft 调过就别重复 |
| Distort | 39 | 变形、液化、置换、网格变形 | 人脸变形慎用 |
| Generate | 26 | 渐变、噪波、描边、写-on 动画 | 需要真实素材时 |
| Stylize | 25 | 发光、马赛克、查找边缘、卡通 | 风格冲突时 |
| Simulation | 18 | 粒子、碎片、泡沫 | 渲染极慢，先低分辨率预演 |
| Transition | 17 | 图层间转场（合成内） | 剪辑层已有转场，别叠加 |
| Blur & Sharpen | 16 | 景深虚化、方向模糊、锐化 | 别用模糊掩盖素材问题 |
| Audio | 13 | 合成内音频处理 | 混音交给 FilmCraft/SoundCraft |
| Channel / Noise & Grain / Keying | 13/13/12 | 通道运算、颗粒、抠像（含 Keylight 类） | 抠像前先做干净遮罩 |
| Immersive Video | 12 | 360/VR | 普通项目不需要 |
| Perspective | 10 | 3D 变换、边角定位 | 与跟踪配合才稳 |
| Time | 8 | 时间重映射、残影、像素运动模糊 | 变速优先在剪辑层做 |
| 3D Channel / Expression Controls / Matte / Text / Utility / Obsolete | 8/9/6/2/9/9 | 深度合成、表达式控制、遮罩工具 | Obsolete 类避免新项目使用 |

**查询**：`artcraft_cli { bin:"effectcraft", args:["commands","--json"] }` 取全部 id；`exec app.capabilities` 看效果总数与导出格式；`effect.apply {layer, effect}` 施加；`effect.setParam` 调参。

## 三、关键帧与缓动（动效"贵不贵"就看这里）

| 手法 | 命令 | 说明 |
|---|---|---|
| 关键帧开关 | `keys.toggleTransform` | 给变换打点 |
| **缓入缓出** | `keys.easyEase` / `keys.easyEaseIn` / `keys.easyEaseOut` | **默认就该加**，线性运动是"AI 味"来源 |
| 保持帧 | `keys.toggleHold` | 阶梯式变化（如数字跳变） |
| 插值/速度 | `keys.interpolation` / `keys.velocity` | 精细控制曲线与冲量 |
| 移动/选择/删除 | `keys.move` / `keys.select` / `keys.delete` | 批量整理 |

**运动三律**：① 有加速度（缓动）② 有到达感（落幅）③ 有预期（预备动作 anticipation）。**避免**：匀速直线运动、无意义的缩放弹跳。

## 四、文字与图形动效

- **FilmCraft**：`graphics.newText/newShape` → `graphics.set`（字体/样式）→ `graphics.setCharStyle`（逐字样式）→ `graphics.setRoll`（滚动/爬行字幕）→ `graphics.setResponsiveTime {introFrames, outroFrames}`（**响应式设计：片长变化时自动伸缩**）→ `graphics.pin`（钉住图层位置）。
- **模板化**：`graphics.template.list` → `apply {template, values}` 用参数生成同风格图形；`template.export` 存成 .fcgt 复用；`template.thumbnail` 出缩略图核对。
- **EffectCraft**：`essential.setPrimary/setName/addProperty/addGroup/linkProperty` 把图层属性暴露为**可复用控件**（Essential Graphics），一次设计、多次套用。
- **字幕动效**：FilmCraft `graphics.upgradeCaption`（字幕升级为图形，可做花字/卡拉 OK 动效）。

## 五、跟踪 / 稳定 / 抠像 / Roto

| 任务 | 命令 | 顺序要点 |
|---|---|---|
| 运动跟踪 | `track.motion` · `track.new` · `track.setTarget` · `track.analyze` | 先选特征清晰、无遮挡的参考点 |
| **稳定** | `track.stabilize` | 稳定后要**缩放补偿**（稳定会留下黑边） |
| 属性跟踪 | `track.property` | 把跟踪数据绑定到属性（如贴纸跟随） |
| 遮罩抠像 | FilmCraft `masks.add/track` · EffectCraft `mask.*`（顶点/羽化） | 羽化 2–6 px 更自然；硬边显假 |
| **Roto Brush** | `roto.models` → `roto.model.download` → `roto.stroke` → `roto.propagate` → `roto.freeze` | 模型可下载；先少量 strokes 再传播 |
| 键控抠像 | EffectCraft Keying 类（12 个，含 Key Light 等价） | 绿幕不均先用 Matte/Key Cleaner 类修 |

**抠像铁律**：**先遮罩、后键控、最后调边**（Spill 抑制），顺序颠倒必然返工。

## 六、3D 机位与透视（"电影感"的重要来源）

| 目标 | 命令 |
|---|---|
| 建立机位 | `camera.fromView`（从 3D 视图创建）· `camera.fromModel`（按 3D 模型建机位） |
| 运镜 | `camera.orbit` / `camera.pan` / `camera.dolly` |
| 环绕控制 | `camera.orbitNull`（生成环绕空对象，机位绕其旋转） |
| 立体 | `camera.stereoRig`（立体 3D 机架） |
| 焦点 | `camera.setFocusToLayer` / `camera.linkFocusToLayer` / `camera.linkFocusToPoi` |
| 视图 | `view.3d.*`（30 条：前/后/左/右/顶/底/自定义视角） |

**透视要点**：焦距越短越"广"（空间夸张）、越长越"平"（压缩）；运镜与景别配合（见 artcraft-shot-language）。

## 七、角色与形变

EffectCraft `puppet.*`（10 条）：木偶针控制角色弯曲/摆动，适合 2D 角色与图形角色动画。配合 `keys.*` 做循环动作；幅度宁小勿大（过度变形最显廉价）。

## 八、时间与速度

| 目标 | 落点 |
|---|---|
| 变速（剪辑层） | FilmCraft `timeline.rateStretch {clip, edge, delta}` |
| 时间重映射 / 残影 / 像素运动模糊 | EffectCraft Time 类（8 个）与 `time.*`（17 条定位/步进） |
| 慢动作素材补帧观感 | 优先在拍摄端做；合成端用 Time 类 + 运动模糊掩盖 |

## 九、渲染成本控制（不做这一步会等到崩溃）

| 手段 | 命令/参数 |
|---|---|
| 低分辨率预演 | EffectCraft render `--resolution half|third|quarter` |
| 草稿质量 | `--quality draft` |
| 只渲一帧检查 | `render-frame --time S --out F.png`（先看静帧再渲全片） |
| 队列化 | `render … --queue` · `renderQueue.*`（20 条） |
| 分段渲染 | `--start/--end` 分段，失败只重跑一段 |

**正确姿势**：**先渲单帧 → 再渲 3 秒 → 最后全片**。任何"直接渲全片"都是赌博。

## 十、质检清单

- [ ] 动画**有缓动**，非线性生硬
- [ ] 合成元素与实拍**光比/颗粒/景深匹配**（不匹配即"贴图感"）
- [ ] 跟踪无滑移、稳定无黑边、抠像无残留边
- [ ] 文字在安全区内，跨镜头风格一致（模板/变量锁）
- [ ] 动效**服务叙事**，无炫技
- [ ] 渲染前已低分辨率预演，产物已抽帧复核
