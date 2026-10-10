# 发布流程与红线（必须遵守）

## 红线

1. **未经维护者（NINKCH）在对话中明确批准，不得打发布标签（`v*`）、不得触发 npm 发布。**
2. **npm `latest` 是正式渠道**：任何未经验证的版本不得进入。别人的机器会直接装到它。
3. 发布标签**只允许打在 main 分支上**；工作流内置守卫 —— 标签不在 main 上时自动拒绝发布。
4. 本插件是给别人用的产品：每个进入 npm 的版本都默认"别人要用"，按产品质量对待。

## 分支模型

| 分支 | 用途 | 发布权限 |
|---|---|---|
| `dev` | 开发/测试分支：所有改动先进 dev，在这里自测 | 不发布（打标签也过不了守卫） |
| `main` | 稳定分支：dev 测试通过 + 维护者批准后合并进入 | 打 `vX.Y.Z` 标签 → 触发 OIDC 发布 |

版本号遵循语义化：修 bug 递 patch（0.2.x）、加功能递 minor（0.x.0）、破坏性变更递 major（x.0.0）。

## 标准发版流程

1. 在 `dev` 完成改动并自测：
   - `node --check index.js client.js`
   - 重启 Harness 后 `GET /artcraft/api/status` 探针（三盏灯、tools.errors 为空）
   - 涉及 UI 的：插件页详情卡人工确认
2. 向维护者汇报"改了什么 + 测了什么 + 结果"，**获得明确批准**。
3. `git switch main && git merge dev && git push`
4. `git tag vX.Y.Z && git push origin vX.Y.Z` ← 这一步触发 npm 发布
5. 发布后验证：Actions 绿 + `npm view @ninkch/dsh-artcraft version` 正确 + 本地重启探针正常。

## 已知教训（不要再犯）

- **PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 UTF-8 BOM** → DSH 加载器 `JSON.parse` 失败，整包"异常"。改文件一律用编辑工具（write/edit），或 PS7 的 `-Encoding utf8NoBOM`。发版前扫一遍 BOM。
- npm 经典令牌（含 Automation）**不能发布**（新政策）；发布走 Trusted Publishing（OIDC）或带 bypass-2FA 的 Granular 令牌（npm 已宣布 2027-01 停用 bypass 直发，届时迁 GitHub Actions 可信发布/环境审批 —— 本仓库已经用 OIDC，无感）。
- bypass-2FA 令牌**不能 unpublish** —— 删除已发布包只能维护者在 npmjs.com 网页操作。
- DSH 工具定义必须声明 `output: { schema, render?, presentationMeta? }`，缺了整个工具注册失败。
- 改 registry/账号类配置前先确认默认 registry（本机默认是淘宝镜像，发布必须显式指定官方源）。
- **打标签前必须同步 package.json 的 version**：v0.2.4 首次打标签时 index.js 升了版本但 package.json 漏改 → `npm publish` 撞"不能覆盖已发布版本"而失败。现在工作流有守卫（tag ≠ package.json 版本 → 第一步就失败），但根上要在打标签前自查。
- 检查更新的语义：**只对比 npm 版本号**（本地领先不算待更新、版本相同即最新），绝不比较 SHA；更新完成后只提示 + 等用户决定何时重启，绝不自动刷新/重启页面。
