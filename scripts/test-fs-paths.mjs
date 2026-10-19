#!/usr/bin/env node
/**
 * AC-06 — /fs and /file must reject relative paths without an explicit base.
 *
 * 背景：`resolveCallerPath()` 曾用 `path.resolve()`（恒返回绝对路径）先解析再判断
 * `isAbsolute`，守卫是死代码；无 base 的 `rel=` 被静默按进程 cwd 解析 —— HTTP 200
 * 但文件落错目录（BLK-02 静默错位的机制）。修复后：相对路径且无 base 一律显式报错。
 *
 * 七条断言（对 resolveCallerPath/resolveBaseRel 的纯函数断言，零依赖、不需 shell 外环境）：
 *  1) resolveCallerPath('projects')            抛「需要绝对路径」
 *  2) resolveCallerPath('D:/x')                返回规范化绝对路径
 *  3) resolveCallerPath('~/x')                 落在 homedir 下
 *  4) resolveBaseRel('D:/base','a/b')          = <base>\a\b
 *  5) resolveBaseRel('', 'rel')                抛错（无 base 的相对路径必须失败）
 *  6) resolveBaseRel(undefined, 'D:/abs')      原样返回绝对路径
 *  7) 源码契约：resolveCallerPath 函数体内不再出现 path.resolve(
 *
 * statOutputs 的 reason 契约（PM 2026-10-19 裁决）：reason 只标「调用方违反路径
 * 契约」（解析失败）；「stat 失败 = 文件不存在」是正常业务态，不加 reason。
 */
import path from 'node:path';
import os from 'node:os';
import { readFileSync } from 'node:fs';

const here = new URL('../index.js', import.meta.url).href;
const mod = await import(here);
const { resolveCallerPath, resolveBaseRel } = mod.__testables ?? {};

let failures = 0;
const fail = (m) => { failures += 1; console.error(`  FAIL  ${m}`); };
const ok = (m) => console.log(`  ok    ${m}`);

if (!resolveCallerPath) { console.error('  FAIL  index.js 未导出 __testables.resolveCallerPath'); process.exit(1); }

// 1) relative without base must throw with the migration hint
try {
  resolveCallerPath('projects');
  fail('resolveCallerPath("projects") 应抛错（相对路径无 base）');
} catch (e) {
  if (String(e.message).includes('需要绝对路径') && String(e.message).includes('base')) ok('relative "projects" rejected with migration hint');
  else fail(`resolveCallerPath("projects") 抛错但文案不对: ${e.message}`);
}

// 2) absolute path normalizes
const abs = resolveCallerPath('D:/x');
if (path.isAbsolute(abs) && abs === path.normalize('D:/x')) ok('absolute path returns normalized absolute');
else fail(`absolute path result unexpected: ${abs}`);

// 3) ~ expansion stays inside homedir
const home = resolveCallerPath('~/x');
if (home.startsWith(os.homedir())) ok('~/x resolves under homedir');
else fail(`~/x resolved outside homedir: ${home}`);

// 4) base + rel composes
const joined = resolveBaseRel('D:/base', 'a/b');
if (joined === path.normalize('D:/base/a/b')) ok('base+rel joins');
else fail(`base+rel unexpected: ${joined}`);

// 5) empty base + relative must throw
try {
  resolveBaseRel('', 'rel');
  fail('resolveBaseRel("", "rel") 应抛错');
} catch {
  ok('empty base + relative rejected');
}

// 6) absolute rel without base passes through
const pass2 = resolveBaseRel(undefined, 'D:/abs');
if (pass2 === path.normalize('D:/abs')) ok('absolute rel without base passes through');
else fail(`absolute rel unexpected: ${pass2}`);

// 7) source contract: no path.resolve( left inside resolveCallerPath
const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const fnBody = src.slice(src.indexOf('function resolveCallerPath'), src.indexOf('function resolveBaseRel'));
if (!fnBody.includes('path.resolve(')) ok('resolveCallerPath no longer uses path.resolve (cwd untouched)');
else fail('resolveCallerPath 仍使用 path.resolve（cwd 泄漏风险）');

console.log('');
if (failures > 0) { console.error(`AC-06 unit: ${failures} failure(s)`); process.exit(1); }
console.log('AC-06 unit: 7/7 assertions pass');
