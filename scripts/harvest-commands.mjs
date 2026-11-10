#!/usr/bin/env node
/**
 * harvest-commands.mjs —— 家族命令面采集器（维护者工具，不进 npm test）
 *
 * 用途：家族软件更新后，一条命令重新实测 17 个成员的命令面，产出可直接回填
 * apps/catalog.json（capabilityStats）与 skills/artcraft-ops/references/
 * command-families.md（规模总览）的 JSON。
 *
 * 取数口径（与 catalog 一致，别随意改）：
 *   - 每个应用在 `commands` / `commands --json` / `tools` / `tools --json`
 *     四次调用里取「条目最多」的那次，JSON 精确、文本表按 id 正则扫描；
 *   - 注册表条目里哪个字段是身份 id 各家不同（PdfCraft 用 name，其余多用 id），
 *     取「唯一值最多」的字段，否则 PdfCraft 的 200 条会被 74 个 command 覆盖；
 *   - PdfCraft 没有 commands 子命令，注册表在 `tools`；
 *   - DesignCraft 的 `commands --json` 可能返回空数组，只能文本扫描（approx=true）；
 *   - 文本表正则必须允许大写：`layer.setProps` 这类 id 用小写正则会漏。
 *
 * 用法：
 *   node scripts/harvest-commands.mjs                 # 打印表格 + 写 harvest.json 到当前目录
 *   node scripts/harvest-commands.mjs --out out.json  # 指定输出文件
 *   node scripts/harvest-commands.mjs --diff old.json # 与旧 harvest 对比（新增/移除 id）
 *
 * 退出码：0 = 全部成员可用；1 = 有成员找不到 CLI 或取不到命令面。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const plugin = await import(new URL('../index.js', import.meta.url).href);
const { loadConfig, resolveBin, BINS, APP_DISPLAY } = plugin.__testables;

const argv = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const OUT = flag('--out', path.join(process.cwd(), 'harvest.json'));
const DIFF = flag('--diff');

/** 只收 stdout：多数 CLI 对不认识的子命令会往 stderr 刷整篇帮助文本 */
const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      timeout: 180000,
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    return String(err.stdout || '');
  }
};

const ID_RE = /^([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)\s/;

function pickIdField(entries) {
  const fields = ['id', 'tool', 'name', 'command', 'command_id'];
  let best = { field: null, unique: 0 };
  for (const field of fields) {
    const unique = new Set(entries.map((e) => e && e[field]).filter((v) => typeof v === 'string' && v));
    if (unique.size > best.unique) best = { field, unique: unique.size };
  }
  return best.field;
}

function parseRegistry(raw) {
  try {
    const j = JSON.parse(raw);
    const arr = Array.isArray(j) ? j : j.commands || j.tools || null;
    if (Array.isArray(arr) && arr.length) {
      const field = pickIdField(arr);
      if (field) {
        const ids = [...new Set(arr.map((e) => e[field]).filter((v) => typeof v === 'string' && v))];
        if (ids.length) return { ids, mode: 'json' };
      }
    }
  } catch { /* 不是整体 JSON，继续按 JSON-lines / 文本表处理 */ }
  const ids = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      const o = JSON.parse(t);
      const id = o.id || o.tool || o.name || o.command;
      if (id) ids.push(id);
    } catch { /* 该行不是 JSON */ }
  }
  if (ids.length) return { ids: [...new Set(ids)], mode: 'jsonl' };
  for (const line of raw.split(/\r?\n/)) {
    const m = ID_RE.exec(line.trim());
    if (m) ids.push(m[1]);
  }
  return { ids: [...new Set(ids)], mode: 'text' };
}

const familyOf = (id) => (id.includes('.') ? id.split('.')[0] : '(flat)');
const tally = (ids) => {
  const fam = {};
  for (const id of ids) fam[familyOf(id)] = (fam[familyOf(id)] || 0) + 1;
  return Object.fromEntries(Object.entries(fam).sort((a, b) => b[1] - a[1]));
};

const cfg = await loadConfig();
const roots = cfg.roots?.length ? `  roots: ${cfg.roots.join(', ')}` : '';
console.log(`config: ${cfg.configPath || '(none)'}${roots}\n`);

const result = { harvestedAt: new Date().toISOString(), config: cfg.configPath, apps: {}, extras: {} };
let missing = 0;

for (const key of BINS) {
  const display = APP_DISPLAY[key] ?? key;
  let exe;
  try {
    exe = await resolveBin(cfg, key);
  } catch {
    result.apps[key] = { error: 'CLI not found' };
    missing += 1;
    console.log(`${display.padEnd(15)} MISSING`);
    continue;
  }

  const rec = { cli: exe, version: (run(exe, ['--version']).split(/\r?\n/)[0] || '').trim() };
  const sources = [];
  for (const args of [['commands'], ['commands', '--json'], ['tools'], ['tools', '--json']]) {
    const parsed = parseRegistry(run(exe, args));
    if (parsed.ids.length) sources.push({ args: args.join(' '), ...parsed });
  }
  sources.sort((a, b) => b.ids.length - a.ids.length);
  const best = sources[0] || { args: 'none', ids: [], mode: 'none' };
  if (!best.ids.length) missing += 1;

  Object.assign(rec, {
    count: best.ids.length,
    bestSource: best.args,
    mode: best.mode,
    approx: best.mode !== 'json',
    families: tally(best.ids),
    allSources: sources.map((s) => `${s.args}=${s.ids.length}`),
    ids: best.ids,
  });
  result.apps[key] = rec;
  console.log(
    `${display.padEnd(15)} ${String(rec.count).padStart(4)}  src=${best.args.padEnd(18)} `
    + `mode=${best.mode.padEnd(5)} ${rec.version}`,
  );
}

/* 成员专属扩展面：LightCraft 的 develop 控制、MaterialCraft 的节点库、Craft Anything 的 toolsets */
const extras = [];
const exeOf = async (key) => {
  try { return await resolveBin(cfg, key); } catch { return null; }
};
const lc = await exeOf('lightcraft');
if (lc) {
  const parsed = parseRegistry(run(lc, ['controls', '--json']));
  result.extras.lightcraftDevelopControls = { count: parsed.ids.length, mode: parsed.mode, ids: parsed.ids };
  extras.push(`lightcraft controls=${parsed.ids.length} (${parsed.mode})`);
}
const mc = await exeOf('materialcraft');
if (mc) {
  const parsed = parseRegistry(run(mc, ['nodes']));
  result.extras.materialcraftNodes = { count: parsed.ids.length, mode: parsed.mode };
  extras.push(`materialcraft nodes=${parsed.ids.length}`);
}
const ca = await exeOf('craftanything');
if (ca) {
  try {
    const caps = JSON.parse(run(ca, ['capabilities']));
    const stats = caps.stats || caps;
    result.extras.craftAnythingTools = stats.tools ?? null;
    result.extras.craftAnythingToolsets = stats.toolsets ?? stats.toolSets ?? null;
    extras.push(`craftanything tools=${result.extras.craftAnythingTools}`);
  } catch { extras.push('craftanything capabilities: not JSON'); }
}

const total = Object.values(result.apps).reduce((sum, a) => sum + (a.count || 0), 0);
result.total = total;
fs.writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`, 'utf8');

console.log(`\nTOTAL ${total} commands across ${BINS.length} members${missing ? ` — ${missing} problem(s)` : ''}`);
if (extras.length) console.log(`EXTRAS ${extras.join(' | ')}`);
console.log(`written: ${OUT}`);

if (DIFF) {
  const old = JSON.parse(fs.readFileSync(DIFF, 'utf8'));
  console.log('\n=== diff vs previous harvest ===');
  for (const key of BINS) {
    const before = new Set(old.apps?.[key]?.ids ?? []);
    const after = new Set(result.apps[key]?.ids ?? []);
    if (!before.size && !after.size) continue;
    const added = [...after].filter((id) => !before.has(id));
    const removed = [...before].filter((id) => !after.has(id));
    if (!added.length && !removed.length) continue;
    console.log(`${key.padEnd(15)} +${added.length} -${removed.length}`);
    for (const id of added.slice(0, 12)) console.log(`   + ${id}`);
    if (added.length > 12) console.log(`   + ... ${added.length - 12} more`);
    for (const id of removed.slice(0, 12)) console.log(`   - ${id}`);
    if (removed.length > 12) console.log(`   - ... ${removed.length - 12} more`);
  }
}

process.exit(missing ? 1 : 0);
