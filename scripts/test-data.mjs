#!/usr/bin/env node
/**
 * dsh-artcraft data test — 跨文件一致性断言。
 *
 * selftest.mjs 只管「注册侧」（工具 shape 能过 44.0.0 严格注册器）；本脚本管「数据侧」：
 * 同一个家族成员清单在 7 个地方各写了一遍，任何一处漏改都会让某个入口少一个成员
 * （issue #1 的教训：不一致的清单在宽松环境看不出来，在严格环境放大成故障）。
 *
 * 断言：
 *   1) package.json 版本 == index.js 的 VERSION（发版前必须一致，否则 tag 会打在错的提交上）
 *   2) BINS / DEFAULT_CONFIG.bins / APP_DISPLAY / client.js LABELS 四套键完全一致
 *   3) apps/catalog.json 的 apps[].id 与 capabilityStats.apps 键都覆盖同一套成员
 *   4) artcraft.config.json.example 的 bins 覆盖同一套成员
 *   5) catalog 每个成员都有 tagline/cli/stage，capabilityStats 每个成员都有 commands > 0
 *   6) 技能包目录数 == 12 且每个都有 SKILL.md + frontmatter name/description
 *   7) recipes.json 的 chains >= 14，每条 chain 的 steps 非空
 *   8) NOTICE.md 不含第三方项目名（DirectorSKILL / wangzhang-wu 等），只保留本仓库许可
 *   9) 公开文本无「N 个应用」残留旧数（13/14）
 *
 * 运行：npm run test:data（= node scripts/test-data.mjs）。退出码 0 = 全绿。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/* ---- 1) 版本一致 ---- */
const pkg = readJson('package.json');
const indexSrc = read('index.js');
const versionMatch = indexSrc.match(/const VERSION = '([^']+)'/);
const indexVersion = versionMatch ? versionMatch[1] : null;
if (indexVersion && indexVersion === pkg.version) pass(`版本一致：${pkg.version}`);
else fail(`版本不一致：package.json=${pkg.version} index.js=${indexVersion}`);

/* ---- 2) 成员键一致（index.js 内部 + client.js） ---- */
function grabBlock(src, startMarker, endMarker) {
  const i = src.indexOf(startMarker);
  const j = src.indexOf(endMarker, i);
  if (i < 0 || j < 0) throw new Error(`找不到片段 ${startMarker}`);
  return src.slice(i, j);
}

const binsBlock = grabBlock(indexSrc, 'const BINS = [', '];');
const bins = [...binsBlock.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
if (bins.length >= 13) pass(`BINS 有 ${bins.length} 个成员`);
else fail(`BINS 只解析出 ${bins.length} 个成员`);

const defaultBlock = grabBlock(indexSrc, 'const DEFAULT_CONFIG = {', 'control: {');
const defaultKeys = [...defaultBlock.matchAll(/^\s{4}([a-z]+):/gm)].map((m) => m[1]);
if (same(bins, defaultKeys)) pass('DEFAULT_CONFIG.bins 覆盖同一套成员');
else fail(`DEFAULT_CONFIG.bins 与 BINS 不一致：只在 DEFAULT=${defaultKeys.filter((k) => !bins.includes(k)).join(',')} 只在 BINS=${bins.filter((k) => !defaultKeys.includes(k)).join(',')}`);

const displayBlock = grabBlock(indexSrc, 'const APP_DISPLAY = {', '};');
const displayKeys = [...displayBlock.matchAll(/([a-z]+):\s*'/g)].map((m) => m[1]);
if (same(bins, displayKeys)) pass('APP_DISPLAY 覆盖同一套成员');
else fail(`APP_DISPLAY 与 BINS 不一致：缺 ${bins.filter((k) => !displayKeys.includes(k)).join(',')}`);
const displayNames = Object.fromEntries(
  [...displayBlock.matchAll(/([a-z]+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);
const displayName = (key) => displayNames[key];

const clientSrc = read('client.js');
const labelsBlock = grabBlock(clientSrc, 'const LABELS = {', '};');
const labelKeys = [...labelsBlock.matchAll(/([a-z]+):\s*'/g)].map((m) => m[1]);
if (same(bins, labelKeys)) pass('client.js LABELS 覆盖同一套成员');
else fail(`client.js LABELS 与 BINS 不一致：缺 ${bins.filter((k) => !labelKeys.includes(k)).join(',')}`);

/* ---- 3) catalog 卡片与统计 ---- */
const catalog = readJson('apps/catalog.json');
const catalogIds = catalog.apps.map((a) => a.id);
const statKeys = Object.keys(catalog.capabilityStats.apps);
if (same([...bins].sort(), [...catalogIds].sort())) pass(`catalog apps[] 覆盖 ${catalogIds.length} 个成员`);
else fail(`catalog apps[] 与 BINS 不一致：缺 ${bins.filter((k) => !catalogIds.includes(k)).join(',')}`);
if (same([...bins].sort(), [...statKeys].sort())) pass(`capabilityStats.apps 覆盖 ${statKeys.length} 个成员`);
else fail(`capabilityStats.apps 与 BINS 不一致：缺 ${bins.filter((k) => !statKeys.includes(k)).join(',')}`);

/* ---- 4) 配置示例 ---- */
const example = readJson('artcraft.config.json.example');
if (same([...bins].sort(), Object.keys(example.bins).sort())) pass('config example 覆盖同一套成员');
else fail(`config example 与 BINS 不一致：缺 ${bins.filter((k) => !Object.keys(example.bins).includes(k)).join(',')}`);
if (!Array.isArray(example.roots) || example.roots.length === 0) fail('config example 缺 roots[]（搬盘符后探测无从下手）');
else pass(`config example 带 roots[]：${example.roots.join(', ')}`);

/* ---- 5) 卡片字段与统计有效性 ---- */
const cardProblems = [];
for (const card of catalog.apps) {
  for (const field of ['id', 'tagline', 'cli', 'stage']) {
    if (!card[field]) cardProblems.push(`${card.id}.${field}`);
  }
  if (!Array.isArray(card.subcommands) || card.subcommands.length === 0) cardProblems.push(`${card.id}.subcommands`);
}
if (cardProblems.length === 0) pass('每张能力卡片都有 tagline/cli/stage/subcommands');
else fail(`卡片字段缺失：${cardProblems.join(', ')}`);

// 显示名必须与 catalog 卡片名字一致：discoverBinPaths 用它当目录名候选，
// 一旦写歪（如 'CraftAnything' 少了空格）新成员就永远扫不到。
const nameMismatch = catalog.apps
  .filter((card) => displayKeys.includes(card.id) && displayName(card.id) !== card.name)
  .map((card) => `${card.id}: APP_DISPLAY=${displayName(card.id)} vs catalog=${card.name}`);
if (nameMismatch.length === 0) pass('APP_DISPLAY 显示名与 catalog 卡片一致');
else fail(`显示名不一致（影响目录探测）：${nameMismatch.join(', ')}`);

const statProblems = [];
for (const [key, stat] of Object.entries(catalog.capabilityStats.apps)) {
  if (!(Number(stat.commands) > 0)) statProblems.push(`${key}.commands=${stat.commands}`);
}
if (statProblems.length === 0) pass('每个成员的能力统计 commands > 0');
else fail(`能力统计异常：${statProblems.join(', ')}`);

/* ---- 6) 技能包 ---- */
const skillsDir = path.join(ROOT, 'skills');
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const SKILL_COUNT = 12;
if (skillDirs.length === SKILL_COUNT) pass(`技能包 ${skillDirs.length} 个`);
else fail(`技能包 ${skillDirs.length} 个，期望 ${SKILL_COUNT}：${skillDirs.join(', ')}`);
const skillProblems = [];
for (const name of skillDirs) {
  const file = path.join(skillsDir, name, 'SKILL.md');
  if (!fs.existsSync(file)) { skillProblems.push(`${name}: 无 SKILL.md`); continue; }
  const body = fs.readFileSync(file, 'utf8');
  const front = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!front) { skillProblems.push(`${name}: 无 frontmatter`); continue; }
  if (!/^name:\s*\S+/m.test(front[1])) skillProblems.push(`${name}: frontmatter 缺 name`);
  if (!/^description:\s*\S+/m.test(front[1])) skillProblems.push(`${name}: frontmatter 缺 description`);
}
if (skillProblems.length === 0) pass('每个技能都有 SKILL.md + name/description');
else fail(`技能包问题：${skillProblems.join('; ')}`);

/* ---- 7) 配方与编排链 ---- */
const recipes = readJson('recipes/recipes.json');
const chains = recipes.chains ?? [];
if (chains.length >= 14) pass(`编排链 ${chains.length} 条`);
else fail(`编排链只有 ${chains.length} 条（期望 ≥ 14）`);
const chainProblems = chains.filter((c) => !Array.isArray(c.steps) || c.steps.length === 0).map((c) => c.id ?? c.task);
if (chainProblems.length === 0) pass('每条编排链都有 steps');
else fail(`编排链缺 steps：${chainProblems.join(', ')}`);

/* ---- 8) NOTICE 只讲本仓库 ---- */
const notice = read('NOTICE.md');
const bannedNotice = ['DirectorSKILL', 'wangzhang-wu', 'ArtCraft License (WIP)'];
const noticeHits = bannedNotice.filter((w) => notice.includes(w));
if (noticeHits.length === 0) pass('NOTICE 不含第三方项目名');
else fail(`NOTICE 出现了不该有的字样：${noticeHits.join(', ')}`);
if (/Apache-2\.0/.test(notice)) pass('NOTICE 标明本仓库许可');
else fail('NOTICE 未标明本仓库 Apache-2.0 许可');

/* ---- 9) 公开文本的成员数不残留旧值 ---- */
const publicDocs = ['README.md', 'README.zh-CN.md', 'skills/README.md', 'skills/artcraft-ops/SKILL.md'];
const stale = [];
for (const rel of publicDocs) {
  const body = read(rel);
  for (const bad of ['13 个应用', '14 个应用', '13 个成员', '14 个成员', 'all 13 apps', 'all 14 apps', 'thirteen', 'fourteen']) {
    if (body.includes(bad)) stale.push(`${rel}: "${bad}"`);
  }
}
if (stale.length === 0) pass('公开文档没有残留的旧成员数');
else fail(`旧成员数残留：${stale.join('; ')}`);

/* ---- 结果 ---- */
console.log('');
if (failures > 0) {
  console.error(`test-data: ${failures} failure(s) — DATA SIDE IS INCONSISTENT`);
  process.exit(1);
}
console.log(`test-data: all checks passed (${bins.length} members · ${skillDirs.length} skills · ${chains.length} chains)`);
