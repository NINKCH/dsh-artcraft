#!/usr/bin/env node
/**
 * dsh-artcraft selftest — registration-side assertions (AC-03).
 *
 * 背景：issue #1 —— attempt() 算出了兜底 output 却没传进 ctx.tools.register()，
 * 旧注册器宽松放行，DSH 44.0.0 严格注册器直接拒绝（`tool "X" must declare
 * output { schema, render, presentationMeta? }`）→ 10 个工具全灭而 HTTP 正常。
 * 本脚本用假 ctx 复刻 44.0.0 的严格注册器，断言：
 *   1) 10 个 artcraft_* 工具全部被捕获（名字与 index.js 注册清单一致）；
 *   2) 每个捕获的 shape 都带 output 且 output.render 是函数；
 *   3) 每个捕获的 shape 都带 output.schema；
 *   4) 注册零失败（toolErrors 为空）、工具名不重复。
 *
 * 44.0.0 注册器行为（从 app.asar 挖出，逐字复刻）：
 *   register(definition) {
 *     const output = definition.output;
 *     if (output === void 0 || typeof output !== "object"
 *         || typeof output.render !== "function"
 *         || output.presentationMeta !== void 0 && typeof output.presentationMeta !== "function")
 *       throw new TypeError(`tool "${name}" must declare output { schema, render, presentationMeta? }`);
 *   }
 *
 * 运行：npm run selftest（= node scripts/selftest.mjs）。退出码 0 = 全绿。
 * 反向验证：临时把 index.js attempt() 里某个 shape 的 output 去掉 → 本脚本必须
 * 报红、退出码非 0、并指出是哪个工具 → 还原后重跑恢复全绿。
 */

const EXPECTED_TOOLS = [
  'artcraft_status', 'artcraft_cli', 'artcraft_control', 'artcraft_fs',
  'artcraft_update', 'artcraft_discover', 'artcraft_recipes', 'artcraft_apps',
  'artcraft_qc', 'artcraft_live',
];

/* ---- 假 ctx：复刻 DSH 44.0.0 严格注册器 ---- */
const registered = [];   // 捕获 { name, shape, output }
const rejected = [];     // 严格注册器拒绝的（模拟 44.0.0 行为）

function strictRegister(shape) {
  const output = shape.output;
  if (
    output === undefined || typeof output !== 'object' ||
    typeof output.render !== 'function' ||
    (output.presentationMeta !== undefined && typeof output.presentationMeta !== 'function')
  ) {
    rejected.push(shape?.name);
    throw new TypeError(
      `tool "${shape?.name}" must declare output { schema, render, presentationMeta? }`,
    );
  }
  registered.push({ name: shape.name, shape, output });
}

const ctx = {
  effect(fn) { fn(); },                       // 立即执行注册回调（与宿主一致）
  tools: { register: strictRegister },
  webServer: { register: () => () => {} },    // 路由注册只收 disposer，不校验
  skills: { registerProvider: () => {} },     // skills.js 走同一 apply 入口时兜底
};

/* ---- 载入插件（index.js 顶层只做定义，apply() 才注册） ---- */
const mod = await import(new URL('../index.js', import.meta.url).href);
if (typeof mod.apply !== 'function') failMsg('index.js 未导出 apply()');
else mod.apply(ctx);

/* ---- 断言 ---- */
let failures = 0;
const failMsg = (msg) => { failures += 1; console.error(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

// 断言 1：工具数量与名单
const names = registered.map((r) => r.name);
if (names.length === EXPECTED_TOOLS.length) pass(`捕获 ${names.length} 个工具`);
else failMsg(`捕获 ${names.length} 个工具，期望 ${EXPECTED_TOOLS.length}`);
const missing = EXPECTED_TOOLS.filter((n) => !names.includes(n));
if (missing.length === 0) pass('工具名单与预期一致');
else failMsg(`缺失工具: ${missing.join(', ')}`);

// 断言 2：output.render 必须是函数（issue #1 的直接回归断言）
const badRender = registered.filter((r) => typeof r.output.render !== 'function');
if (badRender.length === 0) pass('所有工具的 output.render 都是函数');
else failMsg(`output.render 非函数: ${badRender.map((r) => r.name).join(', ')}`);

// 断言 3：output.schema 存在
const badSchema = registered.filter((r) => r.output.schema == null || typeof r.output.schema !== 'object');
if (badSchema.length === 0) pass('所有工具都有 output.schema');
else failMsg(`output.schema 缺失/非法: ${badSchema.map((r) => r.name).join(', ')}`);

// 断言 4：零注册失败 + 无重名
if (rejected.length === 0) pass('严格注册器零拒绝（44.0.0 行为下全部可注册）');
else failMsg(`被严格注册器拒绝: ${rejected.join(', ')}`);
const dup = names.filter((n, i) => names.indexOf(n) !== i);
if (dup.length === 0) pass('工具名无重复');
else failMsg(`重复注册: ${[...new Set(dup)].join(', ')}`);

/* ---- 结果 ---- */
console.log('');
if (failures > 0 || rejected.length > 0) {
  console.error(`selftest: ${failures + rejected.length} failure(s) — REGISTRATION SIDE IS BROKEN`);
  process.exit(1);
}
console.log(`selftest: all ${registered.length}/${EXPECTED_TOOLS.length} tools pass strict registration`);
