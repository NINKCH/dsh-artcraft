# 发布流程与红线（必须遵守）

## 红线

1. **未经维护者（NINKCH）在对话中明确批准，不得打发布标签（`v*`）、不得触发 npm 发布。**
2. **npm `latest` 是正式渠道**：任何未经验证的版本不得进入。别人的机器会直接装到它。
3. 发布标签**只允许打在 main 分支上**；工作流内置守卫 —— 标签不在 main 上时自动拒绝发布。
4. 本插件是给别人用的产品：每个进入 npm 的版本都默认"别人要用"，按产品质量对待。
5. **GitHub 面向公众的文字一律英文、纯 ASCII**（Release 说明 / Issue / PR 描述）：中文在 PowerShell 发送链路里会被逐字符打成 `?`（见教训），公开文本一律英文书写。

## 分支模型

| 分支 | 用途 | 发布权限 |
|---|---|---|
| `dev` | 开发/测试分支：所有改动先进 dev，在这里自测 | 不发布（打标签也过不了守卫） |
| `main` | 稳定分支：dev 测试通过 + 维护者批准后合并进入 | 打 `vX.Y.Z` 标签 → 触发 OIDC 发布 |

**推送纪律**：开发者只推 `dev`，**不得推 `main`**；`main` 的合并与推送一律由维护者执行（见"标准发版流程"第 3 步）。

**版本号规则（维护者规定，2026-10-10）**：一律按小版本递增 —— `0.2.x → 0.2.x+1`。
**未经维护者明确批准，不得提升递增等级**（不得改成 0.3.0 / 0.4.0 / 1.0.0 等）。
无论改动多大（含破坏性 API 变更），都只走 patch +1；等级提升是维护者保留的显式动作。
**2026-10-16 留痕**：维护者首次明确批准等级提升（0.2.10 → 0.3.0，对话内授权）；本规则本身不变——未经批准仍只走 patch +1。

## 安装形态（2026-10-10 起：本机已切 npm 线上安装）

- 本机 profile（`~/.dsh/profiles/desktop`）的依赖是 `"@ninkch/dsh-artcraft": "^0.2.4"` —— **npm 实体安装**，profile 内有 `.npmrc` 钉死官方源。
- **用户侧更新路径**：插件页详情卡「一键更新」→ `pnpm add @ninkch/dsh-artcraft@latest`（强制官方源）→ 重启 Harness。
- **开发流程相应变化**：workspace 改动不再直接生效 —— 要么走完整发版后 `pnpm add`，要么临时把 profile 依赖换回 `"link:<本仓库路径>"` 调试（调试完切回）。
- 画布插件（`@ninkch/dsh-infinite-canvas`）暂为 link 安装：其 npm 0.17.1 落后本地两个提交，等它发新版后再切线上。
- **红线：禁止把本地/未发布的代码直接拷进 `node_modules` 安装副本**（"弗兰肯斯坦补丁"）—— 安装的必须是 npm registry 上的真实版本；本机调试一律用临时 `link:`，调试完立即还原。

## 标准发版流程

1. 在 `dev` 完成改动并自测：
   - `node --check index.js client.js skills.js`
   - 重启 Harness 后 `GET /artcraft/api/status` 探针（三盏灯、tools.errors 为空）
   - 涉及 UI 的：插件页详情卡人工确认
2. 向维护者汇报"改了什么 + 测了什么 + 结果"，**获得明确批准**。
3. `git switch main && git merge dev`（推送到 GitHub 由维护者自己执行：`git push origin main dev`）
4. GitHub → Releases → **Draft a new release** → 选/建 tag `vX.Y.Z`（必须与 package.json version 一致）→ **Publish release** ← 触发 npm 自动发布（OIDC，无令牌无 OTP）。
   Release 说明**英文、纯 ASCII**。若用 API 创建/修改：`Invoke-RestMethod` 的 body 必须发 UTF-8 字节 ——
   `-Body ([Text.Encoding]::UTF8.GetBytes($json)) -ContentType 'application/json; charset=utf-8'`（绝不直接传字符串 body）；
   创建后必须 **GET 回读 body**，确认无成串 `?` 乱码才算完成。
5. 发布后验证：Actions 绿 + `npm view @ninkch/dsh-artcraft version` 正确 + 本地重启探针正常 + Release 正文无乱码（英文纯 ASCII）。

## 已知教训（不要再犯）

- **Invoke-RestMethod 直接传字符串 body，非 ASCII 会按 Latin-1/ANSI 逐字符打成 `?`**（v0.2.8/v0.2.9 Release 说明中文全变问号的根因）：字符串在 .NET 内存里是 UTF-16 也没用，坏在 HTTP 编码层；API 照样返回 201，不回读根本发现不了。凡 body 含非 ASCII，一律 `[Text.Encoding]::UTF8.GetBytes()` + `charset=utf-8`，发完回读验证；GitHub 公开文字直接用英文纯 ASCII，一劳永逸。
- **PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 UTF-8 BOM** → DSH 加载器 `JSON.parse` 失败，整包"异常"。改文件一律用编辑工具（write/edit），或 PS7 的 `-Encoding utf8NoBOM`。发版前扫一遍 BOM。
- npm 经典令牌（含 Automation）**不能发布**（新政策）；发布走 Trusted Publishing（OIDC）或带 bypass-2FA 的 Granular 令牌（npm 已宣布 2027-01 停用 bypass 直发，届时迁 GitHub Actions 可信发布/环境审批 —— 本仓库已经用 OIDC，无感）。
- bypass-2FA 令牌**不能 unpublish** —— 删除已发布包只能维护者在 npmjs.com 网页操作。
- DSH 工具定义必须声明 `output: { schema, render?, presentationMeta? }`，缺了整个工具注册失败。
  **issue #1（2026-10-12）复盘**：`attempt()` 曾把兜底 `output` 算出来却**没传进 `register()`**——旧注册器宽松放行（维护者机器全绿），44.0.0 桌面端严格拒绝（10 个工具全灭，HTTP 却正常，极易误判为环境问题）。已修：两个 shape 均携带 `output`；自测加**注册侧断言**（假 ctx 捕获 shape，断言 `output.render` 为函数）。新增工具时若用定制渲染，`def.output` 直接写在 attempt 定义里。
- 改 registry/账号类配置前先确认默认 registry（本机默认是淘宝镜像，发布必须显式指定官方源）。
- **打标签前必须同步 package.json 的 version**：v0.2.4 首次打标签时 index.js 升了版本但 package.json 漏改 → `npm publish` 撞"不能覆盖已发布版本"而失败。现在工作流有守卫（tag ≠ package.json 版本 → 第一步就失败），但根上要在打标签前自查。
- 检查更新的语义：**只对比 npm 版本号**（本地领先不算待更新、版本相同即最新），绝不比较 SHA；更新完成后只提示 + 等用户决定何时重启，绝不自动刷新/重启页面。
