# Essential Sound 接口与参数键（FilmCraft）

> 来源：官方 `docs/control-protocol.md`（已验证）+ 本机 `commands --json` 实测。
> 所有命令都接受 `clips`（默认作用于**当前选中的音频片段**），因此**先选片段再执行**。
> 不适合在 CLI 一次跑完时，可用 `describe <id>` 看 `enabled` 与 `disabled_reason` 确认前置条件。

## 一、命令面

| 命令 | 参数 | 用途 |
|---|---|---|
| `essentialSound.inspect` | `{clips?}` | 读取当前音频类型与各分区设置（**先 inspect 再 set** 是最稳的姿势） |
| `essentialSound.setType` | `{clips?, type:"dialogue\|music\|sfx\|ambience"}` | 给片段打类型 → 决定默认处理链 |
| `essentialSound.clearType` | `{clips?}` | 清除类型 |
| `essentialSound.set` | `{clips?, key, value}` 或 `{clips?, values:{key:value,…}}` | 设置单个/多个键 |
| `essentialSound.applyPreset` | `{clips?, preset, type?}` | 套用预设 |
| `essentialSound.savePreset` / `deletePreset` | `{clips?, name}` / `{name, type?}` | 预设的存/删（**一致性锁**用这个） |
| `essentialSound.autoMatch` | `{clips?, target?}`（target 为目标 LUFS） | **一键响度匹配**（-14 流媒体 / -23 广播 / -16 播客） |
| `essentialSound.generateDucking` | `{clips?}` | 为音乐生成避让对白的自动闪避关键帧 |

## 二、已验证的参数键

| 键 | 说明 |
|---|---|
| `volume.levelDb` | 片段音量（dB） |
| `mute` | 静音开关 |
| `<section>.enabled` | 任意分区总开关（如 `repair.enabled`） |
| `repair.noise.on` | 降噪开关 |
| `repair.noise.amount` | 降噪强度 |
| `repair.humHz.<i>` | 交流声（hum）抑制频率项 |
| `ducking.against.<Type>` | 闪避依据的素材类型（如 `ducking.against.Dialogue`） |

> 分区名（`<section>`）可由 `essentialSound.inspect` 的返回键得知；键与 UI 行一一对应，UI id 形如
> `essentialSound.repair.noise.on`、`essentialSound.volume.levelDb`、`essentialSound.section.<Name>[.toggle]`。
> **未在本表列出的键不要凭记忆写死**——先 inspect，再按返回的键名设置。

## 三、UI 面板 id（控制通道 `ui.set` 用）

| id | 作用 |
|---|---|
| `essentialSound.tab.<Browse\|Edit>` | 切换 Browse / Edit 页 |
| `essentialSound.type.<Dialogue\|Music\|SFX\|Ambience>` | 点击类型按钮 |
| `essentialSound.preset[.save\|.delete\|.name\|.ok]` | 预设操作 |
| `essentialSound.section.<Name>[.toggle]` | 分区展开/开关 |
| `essentialSound.autoMatch` / `generateDucking` | 对应按钮 |
| `essentialSound.ducking.against.<Type>` | 闪避目标 |
| `essentialSound.volume.on` / `volume.levelDb` / `mute` | 音量行 |
| `essentialSound.browse.<Type>.<preset>` | Browse 页预设 |
| `mixer.<A1\|S1\|Mix>.<fader\|value\|pan\|panValue\|mode\|mute\|solo\|…>` | 调音台推子/声像/模式（自动化写入用 `mixer.touch/release/recordStart/recordStop`） |

## 四、处理链与顺序（实践）

```
1  setType            dialogue / music / sfx / ambience（分类是前提）
2  inspect            读回当前键值，确认起点
3  repair.*           降噪 / 去 hum（先去底噪，否则后续放大噪声）
4  EQ / 动态          applyPreset 或 set（分区键）
5  volume.levelDb     片段级增益（对白清晰度）
6  autoMatch          {target:-14|-23|-16} 统一响度
7  generateDucking    音乐避让对白（对白段落必做）
8  inspect 复核       键值与目标一致；跨片段一致
```

## 五、响度与真峰值

- 目标：**-14 LUFS**（流媒体）· **-23 LUFS**（广播 EBU R128）· **-16 LUFS**（播客）；真峰值 ≤ -1 dBTP（广播 -2）。
- `autoMatch` 给出集成响度对齐；**真峰值**要在导出后复核（`file.exportMedia` 产出再次探查）。
- SoundCraft 侧可作为**独立验证**：`file.bounce_mix` / `file.bounce_stems` 的返回里带 `lufs`、`peak_db`、`true_peak_db`——用它交叉验证 FilmCraft 的处理结果。

## 六、常见错误

| 错误 | 症状 | 纠正 |
|---|---|---|
| 没打类型就设键 | 设置无效或行为不符 | 先 `setType` |
| 直接 `set` 猜键名 | 命令报错或静默无效 | 先 `inspect` 取真实键名 |
| 忘记选片段 | 作用于错误片段/无作用 | 命令前先在时间线选中目标音频 |
| 对白段落音乐有歌词 | 台词被抢 | 换纯器乐铺底 + `generateDucking` |
| 只做 autoMatch 不做动态 | 小声仍听不清 | 先压缩/EQ，再 autoMatch |
