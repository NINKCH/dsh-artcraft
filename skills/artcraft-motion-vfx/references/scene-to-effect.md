# 场景意图 → 效果 id 速查（EffectCraft）

> 效果 id 来自官方注册表（`ec.<类别>.<名称>`），共 307 个；完整清单见同目录 `effect-catalogue.md`。
> 用法：`artcraft_cli { bin:"effectcraft", args:["exec","effect.apply","--params","{\"layer\":N,\"effect\":\"<id>\"}"] }`
> 参数走 **`prop.set`**（0.13.0 起 `effect.setParam` 已移除）：`artcraft_cli { bin:"effectcraft", args:["exec","prop.set","--params","{\"layer\":N,\"property\":\"effects/#1/<param>\",\"value\":…}"] }`；读用 `prop.get`，打点用 `prop.addKey`，表达式用 `prop.setExpression`。
> 表中 id 均为**已验证存在**；没有把握的不要写死，先 `describe` 或查目录。

## 一、光效与氛围

| 意图 | 效果 id | 备注 |
|---|---|---|
| 辉光 / 柔光扩散 | `ec.stylize.glow` | 高光发光最常用；过度会糊 |
| 体积光 / 光束 | `ec.generate.beam` | 配合遮罩做体积光 |
| 光扫 / 光带 | `ec.generate.cclightsweep` | 品牌片头扫光 |
| 光线放射 | `ec.generate.cclightrays` | 与 `glow` 叠加用 |
| 镜头光晕 | `ec.generate.lensflare` | 慎用：过时感强 |
| 闪电 | `ec.generate.advancedlightning` | 大场景；CPU 较慢 |
| 斑斓反射（水下/玻璃） | `ec.sim.caustics` | 水面焦散 |
| 渐变色块 | `ec.generate.fourcolor` / `ec.generate.gradientramp` | 背景与渐变过渡 |

## 二、质感与风格化

| 意图 | 效果 id | 备注 |
|---|---|---|
| 胶片颗粒 | `ec.noise.addgrain` / `ec.noise.matchgrain` | `matchGrain` 用于与实拍匹配（CPU） |
| 去颗粒 | `ec.noise.removegrain` | 与上者配对 |
| 噪点（数字） | `ec.noise.noise` / `ec.noise.fractal` | `fractal` 做云雾/纹理 |
| 卡通 / 描边 | `ec.stylize.cartoon` / `ec.stylize.findedges` | 风格化整段慎用 |
| 马赛克 | `ec.stylize.mosaic` | 打码/风格化 |
| 海报化 | `ec.stylize.posterize` | 与 `posterizeTime` 配合做定格感 |
| 边缘粗糙化 | `ec.stylize.roughenedges` | 手绘/做旧 |
| 画笔涂抹 | `ec.stylize.brushstrokes` | 油画感 |
| 玻璃折射 | `ec.stylize.ccglass` | 需要贴图配合 |
| 灼烧转场 | `ec.stylize.ccburnfilm` | 复古转场 |

## 三、变形与镜头语言

| 意图 | 效果 id | 备注 |
|---|---|---|
| 位移/缩放/旋转 | `ec.distort.transform` | 基础变换（等效 layer transform 的滤镜版） |
| 透视贴合（屏幕替换） | `ec.distort.cornerpin` | 与跟踪配合 |
| 网格变形 | `ec.distort.meshwarp` | 精修形状 |
| 液化 | `ec.distort.liquify` | 人脸/身体微调（慎用） |
| 波纹 / 水波 | `ec.distort.ripple` / `ec.distort.wavewarp` | 水下、热浪 |
| 湍流位移 | `ec.distort.turbulentdisplace` | 火焰/烟雾形态 |
| 球面化 | `ec.distort.spherize` / `ec.perspective.ccsphere` | 星球/镜头畸变 |
| 镜像 | `ec.distort.mirror` | 对称构图 |
| 置换贴图 | `ec.distort.displacementmap` | 用手绘贴图驱动变形 |
| 补偿镜头畸变 | `ec.distort.opticscompensation` | 广角素材修正 |
| 卷帘快门修复 | `ec.distort.rollingshutterrepair` | 手机/运动相机素材 |

## 四、合成与抠像

| 意图 | 效果 id | 备注 |
|---|---|---|
| 绿幕抠像 | `ec.keying.keylight`（"Key Light"） | 行业标准；56 参数 |
| 溢色抑制 | `ec.key.advancedspill` / `ec.key.spill` | **抠像最后一步** |
| 键控清理 | `ec.key.keycleaner` | 修补边缘 |
| 颜色范围抠像 | `ec.key.colorrange` / `ec.key.linearcolor` | 纯色背景 |
| 蒙版收边 | `ec.matte.simplechoker` / `ec.matte.mattechoker` | 收/放边缘 |
| 柔边精修 | `ec.matte.refinesoft` / `ec.matte.refinehard` | 发丝/硬边 |
| Roto Brush | `ec.matte.rotobrush` | 与 `roto.*` 命令族配合 |
| 通道运算合成 | `ec.channel.blend` / `ec.channel.compoundarithmetic` | 高级合成 |
| 去黑/去白底 | `ec.key.unmult` / `ec.channel.removecolormatting` | 预乘处理 |
| 投影 | `ec.perspective.dropshadow` / `ec.perspective.radialshadow` | 元素落地感 |

## 五、时间、动效与图形

| 意图 | 效果 id | 备注 |
|---|---|---|
| 时间重映射 | `ec.time.timedisplacement` | 与 `time.*` 命令配合 |
| 卡帧 / 定格感 | `ec.time.posterizetime` | 抽帧风格 |
| 音频驱动图形 | `ec.generate.audiospectrum` / `ec.generate.audiowaveform` | 音乐可视化 |
| 数字滚动 | `ec.text.numbers` | 计数器/数据动效 |
| 自动书写 | `ec.generate.writeon` | 手写标题 |
| 描边动画 | `ec.generate.stroke` | 描边生长 |
| 涂鸦线 | `ec.generate.scribble` | 手绘解释风 |
| 万花筒/织带 | `ec.generate.vegas` | 风格化线条 |
| 抖动 / 错位 | `ec.stylize.scatter` / `ec.stylize.motiontile` | 故障风（配合 `ec.vr.digitalglitch`） |
| 玻璃/扭曲转场 | `ec.stylize.ccglass` + `ec.distort.turbulentdisplace` | 组合做有机转场 |

## 六、模拟（重）与代价提示

| 意图 | 效果 id | 代价 |
|---|---|---|
| 粒子系统 | `ec.sim.ccparticlesystems2` / `ec.sim.ccparticleworld` | 中；先半分辨率预演 |
| 泡沫/气泡 | `ec.sim.foam` / `ec.sim.ccbubbles` | 中 |
| 破碎 | `ec.sim.shatter` | **重**（60 参数），务必先 `render-frame` |
| 雨雪 | `ec.sim.ccrainfall` / `ec.sim.ccsnowfall` | 中 |
| 粒子游乐场 | `ec.sim.particleplayground` | **最重**（92 参数） |
| 卡片舞动 | `ec.sim.carddance` | 重（53 参数） |

> 通用纪律：**先 `render-frame` 看单帧 → 半分辨率草稿 → 全质量**；3D/粒子类避免直接全片渲染（见 `../SKILL.md` 第九节）。

## 七、不要用效果做的事

| 想做的事 | 别用效果 | 应该用 |
|---|---|---|
| 变速 | 时间类效果 | 剪辑层 `timeline.rateStretch`（保音高、可预期） |
| 画面整体调色 | 逐个 `ec.color.*` | 优先 FilmCraft `lumetri.*` 或 LightCraft `develop.*`（见 artcraft-color-light） |
| 稳定 | `ec.distort.warpstabilizer` 单打 | 优先 `track.stabilize`（两遍、可补偿缩放） |
| 转场 | 叠加两个效果模拟 | 剪辑层 `sequence.applyVideoTransition`（见 artcraft-edit-rhythm） |
| 抠像遮罩初形 | 直接用键控 | 先 `mask.*`/`roto.*` 出遮罩，再键控收边 |
