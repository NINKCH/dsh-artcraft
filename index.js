/**
 * @ninkch/dsh-artcraft — DeepSeek Harness 插件（Host 半侧）
 *
 * 本插件只是【桥接】：把 ArtCraft 家族软件的自动化接口转接给 Harness，不持有任何数据目录。
 * 结果文件的位置由调用方决定 ——
 *   对话调用：当前对话工作空间下的绝对路径（或提示词指定的任意位置）
 *   画布调用：画布项目目录下的绝对路径（哪个项目使用就放哪个项目下）
 *
 * 两种形态：
 *   1) Agent Tools（对话内直接驱动）:
 *        artcraft_status  —— 检查 13 个家族 CLI 是否可用、配置目录、控制通道配置
 *        artcraft_cli     —— 运行 13 个家族 CLI 任意命令（cwd / 文件参数由调用方给绝对路径）
 *        artcraft_control —— 向运行中的 FilmCraft/EffectCraft/VectorCraft/LightCraft JSON 控制通道发一条命令
 *        artcraft_fs      —— 桥接文件操作（list/stat/readtext/write/mkdir，绝对路径）
 *        artcraft_update  —— 插件自身更新（检查/应用）
 *        artcraft_apps    —— 13 个家族应用的自动化能力目录（子命令/控制端口/MCP/仓库）
 *
 * 技能包（独立插件行 @ninkch/dsh-artcraft/skills，见 skills.js）：artcraft-ops / artcraft-shot-language /
 * artcraft-edit-rhythm / artcraft-color-light / artcraft-sound-design / artcraft-motion-vfx /
 * artcraft-delivery-qc —— 教 agent 怎么调得顺、何时用哪种效果、镜头语言怎么设计。
 *   2) HTTP API（同源 /artcraft/api/*，供无限画布等前端调用，无 CORS 问题）:
 *        GET  /artcraft/api/status     环境自检
 *        GET  /artcraft/api/fs         list / stat / readtext
 *        POST /artcraft/api/fs         write（JSON base64/text 或原始字节流）
 *        GET  /artcraft/api/file       下载产物（流式，raw 或 text）
 *        GET  /artcraft/api/job        查询任务（单个或列表）
 *        POST /artcraft/api/job        启动长任务（渲染/导出/批处理）
 *        POST /artcraft/api/job/cancel 取消任务
 *        POST /artcraft/api/control    控制通道同步调用（engine.execute / ui.*）
 *        GET  /artcraft/api/apps       家族能力目录（list / ?id= 单个）
 *
 * 安全约定：
 *   - 子进程只允许 13 个白名单键（家族 CLI），具体可执行文件由 artcraft.config.json 指定；
 *   - 控制通道只连 127.0.0.1，与 ArtCraft 官方协议一致（App 需以 --control 启动；
 *     已知默认端口：filmcraft 9876 / effectcraft 9877 / vectorcraft 7979 / lightcraft 7980；
 *     PhotoCraft 控制通道为令牌鉴权模式、PdfCraft 为文件式（--control FILE），均不代理；
 *     其余应用端口动态，用 port 参数直连）；
 *   - 本插件与 infinite-canvas 零代码耦合，仅通过 HTTP + 调用方给定路径协作。
 *
 * 信任模型：HTTP API 无鉴权，随 DSH Web GUI 仅监听回环；不要把 GUI 端口暴露到局域网。
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const NAME = 'artcraft';
const VERSION = '0.2.11';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const BINS = [
  'photocraft', 'vectorcraft', 'filmcraft', 'lightcraft', 'pdfcraft', 'effectcraft',
  'designcraft', 'wordcraft', 'deckcraft', 'gridcraft', 'cadcraft', 'soundcraft', 'figcraft',
];
const PKG_NAME = '@ninkch/dsh-artcraft';
const DEFAULT_PORTS = { filmcraft: 9876, effectcraft: 9877, vectorcraft: 7979, lightcraft: 7980 };

const BODY_CAP = 2 * 1024 * 1024;            // 普通 JSON 请求体上限
const WRITE_CAP = 320 * 1024 * 1024;         // 上传（写盘）上限
const READ_CAP = 2 * 1024 * 1024 * 1024;     // 读取/下载上限（流式传输，不占大内存）
const TEXT_CAP = 16 * 1024 * 1024;           // readtext / as=text 的上限
const TAIL_LINES = 400;                      // 任务输出环形缓冲（行）
const LINE_CAP = 4000;                       // 单行截断
const KEEP_JOBS = 64;                        // 已结束任务保留条数

const DEFAULT_CONFIG = {
  bins: {
    photocraft: 'photocraft-cli',
    vectorcraft: 'vectorcraft-cli',
    filmcraft: 'filmcraft-cli',
    lightcraft: 'lightcraft-cli',
    pdfcraft: 'pdfcraft-cli',
    effectcraft: 'effectcraft-cli',
    designcraft: 'designcraft-cli',
    wordcraft: 'wordcraft-cli',
    deckcraft: 'deckcraft-cli',
    gridcraft: 'gridcraft-cli',
    cadcraft: 'cadcraft-cli',
    soundcraft: 'soundcraft-cli',
    figcraft: 'figcraft-cli',
  },
  control: { ...DEFAULT_PORTS },
};

const APP_DISPLAY = {
  photocraft: 'PhotoCraft', vectorcraft: 'VectorCraft', filmcraft: 'FilmCraft',
  lightcraft: 'LightCraft', pdfcraft: 'PdfCraft', effectcraft: 'EffectCraft',
  designcraft: 'DesignCraft', wordcraft: 'WordCraft', deckcraft: 'DeckCraft',
  gridcraft: 'GridCraft', cadcraft: 'CADCraft', soundcraft: 'SoundCraft', figcraft: 'FigCraft',
};

/* ============================ 配置 ============================ */

async function loadConfig() {
  const cfg = {
    bins: { ...DEFAULT_CONFIG.bins },
    control: { ...DEFAULT_PORTS },
    configPath: null, // 实际生效的配置文件（供界面显示"配置目录"）
    autoDiscovered: false, // 首次运行是否由自动探测生成了配置
  };
  // 配置查找顺序：~/.dsh（持久，推荐 —— 更新替换包目录也不丢）→ 包目录（旧版兼容）
  const candidates = [
    path.join(os.homedir(), '.dsh', 'artcraft.config.json'),
    path.join(HERE, 'artcraft.config.json'),
  ];
  for (const candidate of candidates) {
    try {
      const user = JSON.parse(await fs.readFile(candidate, 'utf8'));
      if (user && user.bins) {
        for (const k of BINS) {
          if (typeof user.bins[k] === 'string' && user.bins[k]) cfg.bins[k] = user.bins[k];
        }
      }
      if (user && user.control) {
        for (const k of Object.keys(DEFAULT_PORTS)) {
          const p = Number(user.control[k]);
          if (Number.isInteger(p) && p > 0 && p < 65536) cfg.control[k] = p;
        }
      }
      cfg.configPath = candidate;
      break; // 第一个可解析的配置生效
    } catch { /* 该候选不存在/非法 → 试下一个 */ }
  }
  // 首次运行（没有任何配置文件）：自动探测本机家族软件安装位置并生成持久配置
  if (!cfg.configPath) {
    try {
      const found = await discoverBinPaths();
      const target = path.join(os.homedir(), '.dsh', 'artcraft.config.json');
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify({ bins: { ...cfg.bins, ...found }, control: { ...cfg.control } }, null, 2) + '\n');
      for (const k of Object.keys(found)) cfg.bins[k] = found[k];
      cfg.configPath = target;
      cfg.autoDiscovered = Object.keys(found).length > 0;
    } catch { /* 自动探测失败不影响默认行为 */ }
  }
  return cfg;
}

/** 自动探测：扫描常见安装位置（Program Files 等）里的家族 CLI */
async function discoverBinPaths() {
  const isWin = process.platform === 'win32';
  const pf = process.env['ProgramFiles'] || (isWin ? 'C:\\Program Files' : '/usr/local/bin');
  const pf86 = process.env['ProgramFiles(x86)'] || '';
  const lap = process.env['LOCALAPPDATA']
    ? path.join(process.env['LOCALAPPDATA'], 'Programs')
    : path.join(os.homedir(), '.local');
  const roots = [pf, ...(pf86 ? [pf86] : []), lap];
  const found = {};
  for (const key of BINS) {
    const cliName = cliNameFor(key);
    const names = [APP_DISPLAY[key], key, key.toUpperCase(), key.toLowerCase()];
    outer: for (const root of roots) {
      for (const name of names) {
        const exe = path.join(root, name, cliName);
        try {
          if ((await fs.stat(exe)).isFile()) { found[key] = path.join(root, name); break outer; }
        } catch { /* 继续 */ }
      }
    }
  }
  return found;
}

/* ============================ 路径与进程 ============================ */

/**
 * 桥接语义：路径由调用方决定（本插件只是桥梁，不设数据目录）——
 *   对话调用：当前对话工作空间下的绝对路径（或提示词指定的任意位置）
 *   画布调用：画布项目目录下的绝对路径
 * 支持 ~ 展开；也接受 base(绝对目录) + rel(相对) 组合，方便批量调用。
 */
function resolveCallerPath(p) {
  let s = String(p ?? '').trim();
  if (!s) throw new Error('缺少路径参数');
  if (s === '~' || s.startsWith('~/') || s.startsWith('~\\')) s = path.join(os.homedir(), s.slice(1));
  const abs = path.resolve(s);
  if (!path.isAbsolute(abs)) {
    throw new Error('需要绝对路径 —— 对话调用传当前工作空间下的绝对路径，画布传项目目录下的绝对路径（或用 base + 相对路径组合）');
  }
  return abs;
}

function resolveBaseRel(base, rel) {
  if (base) {
    const b = resolveCallerPath(base);
    if (rel == null || String(rel) === '') return b;
    return path.resolve(b, String(rel));
  }
  return resolveCallerPath(rel);
}

async function ensureDir(p) {
  const abs = resolveCallerPath(p);
  await fs.mkdir(abs, { recursive: true });
  return abs;
}

function cliNameFor(key) {
  return process.platform === 'win32' ? `${key}-cli.exe` : `${key}-cli`;
}

/** 配置值三种形态：完整 exe 路径 / 目录（自动拼 <key>-cli[.exe]）/ 裸命令名（搜 PATH） */
async function resolveBin(cfg, key) {
  if (!BINS.includes(key)) throw new Error(`bin 必须是 ${BINS.join(' | ')} 之一`);
  const raw = String(cfg.bins[key] ?? '').trim();
  if (!raw) throw new Error(`artcraft.config.json 未配置 bins.${key}`);
  if (path.isAbsolute(raw)) {
    let st = null;
    try { st = await fs.stat(raw); } catch { /* fallthrough */ }
    if (st && st.isDirectory()) return path.join(raw, cliNameFor(key));
    return raw;
  }
  // 裸命令名 → PATH 查找
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const found = await new Promise((resolve) => {
    let out = '';
    let child;
    try {
      child = spawn(finder, [raw], { windowsHide: true });
    } catch { resolve(null); return; }
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (d) => { out += d; });
    child.on('error', () => resolve(null));
    child.on('close', (code) => {
      const first = String(out).split(/\r?\n/).find((l) => l.trim());
      resolve(code === 0 && first ? first.trim() : null);
    });
  });
  return found ?? raw; // 找不到也让 spawn 自己报错，错误信息更真实
}

function pushTail(arr, chunk) {
  // CLI 进度常用 \r 刷新同一行，按 \r\n|\r|\n 全部切开，环形缓冲自然保留最后几百行
  const lines = String(chunk).split(/\r\n|\r|\n/);
  for (const line of lines) {
    if (!line && lines.length === 1) continue;
    arr.push(line.length > LINE_CAP ? line.slice(0, LINE_CAP) + '…' : line);
  }
  if (arr.length > TAIL_LINES) arr.splice(0, arr.length - TAIL_LINES);
}

/** 运行子进程到结束；返回 {ok, code, signal, stdout, stderr, ms} */
function runProcess(exe, args, { cwd, timeoutMs = 15 * 60_000, shell = false } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const stdout = [];
    const stderr = [];
    let child;
    try {
      child = spawn(String(exe), (args ?? []).map(String), { cwd, windowsHide: true, shell });
    } catch (e) {
      resolve({ ok: false, code: -1, signal: null, stdout: '', stderr: String(e?.message ?? e), ms: 0 });
      return;
    }
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill(); } catch { /* ignore */ }
    }, Math.max(1000, Number(timeoutMs) || 15 * 60_000));

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (d) => pushTail(stdout, d));
    child.stderr?.on('data', (d) => pushTail(stderr, d));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({
        ok: false, code: -1, signal: null,
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n') + `\n[spawn] ${e?.message ?? e}`,
        ms: Date.now() - started,
      });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        code,
        signal: timedOut ? 'TIMEOUT' : signal,
        stdout: stdout.join('\n'),
        stderr: stderr.join('\n') + (timedOut ? `\n[timeout] 超过 ${timeoutMs}ms 已终止` : ''),
        ms: Date.now() - started,
      });
    });
  });
}

/* ============================ 控制通道（JSON lines over TCP） ============================ */

/**
 * FilmCraft/EffectCraft 官方协议：127.0.0.1:<port>，一行请求一行回复。
 * 请求：{"id":1,"method":"engine.execute","params":{...}}
 * 回复：{"id":1,"ok":true,"result":{...}} 或 {"ok":false,"error":"..."}
 */
function controlCall(port, method, params, { timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const id = 1;
    const sock = net.connect({ host: '127.0.0.1', port: Number(port) });
    let buf = '';
    let settled = false;
    const finish = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { sock.destroy(); } catch { /* ignore */ }
      fn(v);
    };
    const timer = setTimeout(
      () => finish(reject, new Error(`控制通道 ${port} 响应超时（${timeoutMs}ms）`)),
      Math.max(1000, Number(timeoutMs) || 30_000),
    );
    sock.on('connect', () => {
      sock.write(JSON.stringify({ id, method, params: params ?? {} }) + '\n');
    });
    sock.on('data', (d) => {
      buf += d.toString('utf8');
      const i = buf.indexOf('\n');
      if (i < 0) {
        if (buf.length > 4 * 1024 * 1024) finish(reject, new Error('控制通道单行回复超过 4MiB'));
        return;
      }
      const line = buf.slice(0, i).trim();
      if (!line) return;
      let reply;
      try { reply = JSON.parse(line); } catch {
        finish(reject, new Error(`控制通道返回非 JSON: ${line.slice(0, 200)}`));
        return;
      }
      if (reply && reply.ok === false) finish(reject, new Error(String(reply.error ?? '控制通道错误')));
      else finish(resolve, reply?.result !== undefined ? reply.result : reply);
    });
    sock.on('error', (e) => {
      finish(reject, new Error(
        `控制通道 127.0.0.1:${port} 连接失败（${e?.message ?? e}）——目标 App 是否已用 --control ${port} 启动？`,
      ));
    });
  });
}

/* ============================ 长任务（渲染/批处理） ============================ */

const jobs = new Map(); // id -> job

/**
 * 桥接语义：产物路径由调用方给定 ——
 *   绝对路径直接使用；也可传 cwd（绝对目录）让 outputs 以它为基准。
 */
async function statOutputs(outputs, cwd) {
  const out = [];
  const base = cwd ? resolveCallerPath(cwd) : null;
  for (const item of outputs ?? []) {
    const spec = String(item.rel ?? item.path ?? item);
    let abs;
    try {
      abs = base ? path.resolve(base, spec) : resolveCallerPath(spec);
    } catch {
      out.push({ rel: spec, exists: false, dir: false, size: null, mtime: null });
      continue;
    }
    try {
      const st = await fs.stat(abs);
      out.push({ rel: spec, path: abs, exists: true, dir: st.isDirectory(), size: st.size, mtime: st.mtimeMs });
    } catch {
      out.push({ rel: spec, path: abs, exists: false, dir: false, size: null, mtime: null });
    }
  }
  return out;
}

function jobSnapshot(job, tailLines = 60) {
  const tail = Math.max(1, Math.min(TAIL_LINES, Number(tailLines) || 60));
  return {
    id: job.id,
    bin: job.bin,
    args: job.args,
    cwd: job.cwd,
    status: job.status, // running | done | failed | timeout
    code: job.code,
    signal: job.signal,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    durationMs: (job.endedAt ?? Date.now()) - job.startedAt,
    stdout: job.stdout.slice(-tail).join('\n'),
    stderr: job.stderr.slice(-tail).join('\n'),
    outputs: job.outputs,
  };
}

function pruneJobs() {
  const finished = [...jobs.values()]
    .filter((j) => j.status !== 'running')
    .sort((a, b) => a.startedAt - b.startedAt);
  while (jobs.size > KEEP_JOBS && finished.length) {
    const oldest = finished.shift();
    jobs.delete(oldest.id);
  }
}

async function startJob(cfg, { bin, args, cwd, outputs, timeoutMs }) {
  if (!BINS.includes(bin)) throw new Error(`bin 必须是 ${BINS.join(' | ')} 之一`);
  if (args != null && !Array.isArray(args)) throw new Error('args 必须是字符串数组');
  const exe = await resolveBin(cfg, bin);
  // 桥接语义：cwd 由调用方给绝对路径（对话=工作空间下的目录，画布=项目目录）；不传则继承 Host 进程
  const cwdAbs = cwd ? await ensureDir(cwd) : null;
  const id = crypto.randomUUID();
  const job = {
    id,
    bin,
    exe,
    args: (args ?? []).map(String),
    cwd: cwdAbs,
    status: 'running',
    code: null,
    signal: null,
    startedAt: Date.now(),
    endedAt: null,
    stdout: [],
    stderr: [],
    outputs: (outputs ?? []).map((o) => ({ rel: String(o.rel ?? o.path ?? o) })),
    child: null,
    timer: null,
  };
  const child = spawn(job.exe, job.args, { cwd: cwdAbs ?? undefined, windowsHide: true });
  job.child = child;
  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');
  child.stdout?.on('data', (d) => pushTail(job.stdout, d));
  child.stderr?.on('data', (d) => pushTail(job.stderr, d));
  let timedOut = false;
  job.timer = setTimeout(() => {
    timedOut = true;
    try { child.kill(); } catch { /* ignore */ }
  }, Math.max(1000, Number(timeoutMs) || 60 * 60_000));
  child.on('error', (e) => {
    clearTimeout(job.timer);
    job.status = 'failed';
    job.code = -1;
    job.endedAt = Date.now();
    pushTail(job.stderr, `[spawn] ${e?.message ?? e}`);
    pruneJobs();
  });
  child.on('close', (code, signal) => {
    clearTimeout(job.timer);
    job.code = code;
    job.signal = timedOut ? 'TIMEOUT' : signal;
    job.status = timedOut ? 'timeout' : (code === 0 ? 'done' : 'failed');
    job.endedAt = Date.now();
    pruneJobs();
  });
  jobs.set(id, job);
  return { id, bin, exe, args: job.args, status: job.status };
}

/* ============================ 状态自检 ============================ */

async function fileExists(p) {
  try { return (await fs.stat(p)).isFile(); } catch { return false; }
}

async function statusInfo(cfg, meta) {
  const bins = {};
  for (const key of BINS) {
    let exe = null;
    let found = false;
    let note = '';
    try {
      exe = await resolveBin(cfg, key);
      found = exe ? await fileExists(exe) : false;
      if (!found) note = '未找到可执行文件——请检查 artcraft.config.json 的 bins 路径或 PATH';
    } catch (e) {
      note = String(e?.message ?? e);
    }
    bins[key] = { configured: cfg.bins[key], exe, found, note };
  }
  let configPath = null;
  try { configPath = cfg.configPath && (await fs.stat(cfg.configPath)).isFile() ? cfg.configPath : null; } catch { /* 不存在 */ }
  return {
    plugin: NAME,
    version: VERSION,
    platform: process.platform,
    config: { path: configPath, found: !!configPath, autoDiscovered: !!cfg.autoDiscovered },
    bins,
    control: cfg.control,
    jobs: {
      total: jobs.size,
      running: [...jobs.values()].filter((j) => j.status === 'running').length,
    },
    tools: meta,
  };
}

/* ============================ HTTP 基础设施 ============================ */

function sendJson(res, code, obj) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.statusCode = code;
  res.end(JSON.stringify(obj));
}

async function readBody(req, cap = BODY_CAP) {
  const chunks = [];
  let n = 0;
  for await (const chunk of req) {
    n += chunk.length;
    if (n > cap) throw new Error(`请求体超过上限（${cap} 字节）`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req, cap = BODY_CAP) {
  const raw = await readBody(req, cap);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

const CONTENT_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.bmp': 'image/bmp', '.tif': 'image/tiff', '.tiff': 'image/tiff',
  '.psd': 'image/vnd.adobe.photoshop',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  '.json': 'application/json', '.xml': 'application/xml', '.edl': 'text/plain',
  '.srt': 'text/plain', '.vtt': 'text/vtt', '.txt': 'text/plain', '.md': 'text/plain',
  '.cube': 'text/plain', '.ecproj': 'application/json', '.fcproj': 'application/json',
};

function makeRoute(path, handler) {
  return {
    kind: 'exact',
    path,
    async handler(req, res) {
      try {
        await handler(req, res);
      } catch (e) {
        // 流式响应中途出错时头部已发出，只能断开连接
        try {
          if (res.headersSent) { res.destroy(); return; }
          sendJson(res, 400, { error: String((e && e.message) || e) });
        } catch { try { res.destroy(); } catch { /* ignore */ } }
      }
    },
  };
}

/* ============================ 自更新（检查 / 应用） ============================ */

function semverGt(a, b) {
  const p = (s) => String(s ?? '').trim().replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [a1, a2, a3] = p(a), [b1, b2, b3] = p(b);
  return a1 !== b1 ? a1 > b1 : a2 !== b2 ? a2 > b2 : a3 > b3;
}

/** 探测本插件的安装形态：git 仓库（link 开发）还是 npm 安装 */
async function detectInstall() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const real = await fs.realpath(here);
  let dir = real;
  let repoDir = null;
  while (true) {
    try {
      const st = await fs.stat(path.join(dir, '.git'));
      if (st.isDirectory() || st.isFile()) { repoDir = dir; break; }
    } catch { /* 继续 */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  let profileDir = null;
  if (!repoDir) {
    dir = path.dirname(here);
    while (true) {
      try {
        const txt = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
        if (txt.includes('"dsh"')) { profileDir = dir; break; }
      } catch { /* 继续 */ }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  let gitClean = null;
  let branch = null;
  if (repoDir) {
    const st = await runProcess('git', ['status', '--porcelain'], { cwd: repoDir, timeoutMs: 20000 });
    gitClean = st.ok && st.stdout.trim() === '';
    const b = await runProcess('git', ['branch', '--show-current'], { cwd: repoDir, timeoutMs: 20000 });
    branch = (b.stdout || '').trim() || null;
  }
  return { mode: repoDir ? 'git' : 'npm', here, real, repoDir, profileDir, gitClean, branch };
}

const REGISTRIES = ['https://registry.npmjs.org', 'https://registry.npmmirror.com'];

async function fetchLatestVersion() {
  const slug = PKG_NAME.replace('/', '%2f');
  const errors = [];
  // 回退链：官方源 → npmmirror 镜像（国内无代理机器也能完成检查与更新）
  for (const reg of REGISTRIES) {
    try {
      const res = await fetch(`${reg}/${slug}/latest`, { signal: AbortSignal.timeout(12000) });
      if (res.status === 404) { errors.push(`${reg}: 404`); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (!j.version) { errors.push(`${reg}: 无版本数据`); continue; }
      return {
        latest: j.version ?? null,
        tarball: j.dist?.tarball ?? null,
        integrity: j.dist?.integrity ?? null,
        source: reg,
      };
    } catch (e) {
      errors.push(`${reg}: ${String(e?.cause?.message || e?.message || e)}`);
    }
  }
  return { latest: null, note: '查询失败（官方源与 npmmirror 均不可达）—— ' + errors.join('；') };
}

async function updateCheck() {
  const current = VERSION;
  const { latest, note } = await fetchLatestVersion();
  const info = await detectInstall();
  // 磁盘版本 vs 运行版本：apply 已把新包写进磁盘（换目录 / git pull），但运行中的进程还是旧代码 ——
  // 只对比 npm 版本号会让"一键更新后"看起来又回到有新版本。把"待重启"作为服务端事实返回，
  // 前端据此常驻提示，卡片重挂载/页面刷新都不丢，真重启后（磁盘=运行）自动消失。
  let diskVersion = null;
  try {
    const pj = JSON.parse(await fs.readFile(path.join(HERE, 'package.json'), 'utf8'));
    diskVersion = typeof pj?.version === 'string' ? pj.version : null;
  } catch { /* 非关键 */ }
  const pendingRestart = !!(diskVersion && diskVersion !== current);
  return {
    current,
    latest,
    diskVersion,
    updateAvailable: !!(latest && semverGt(latest, current)),
    pendingRestart,
    pendingVersion: pendingRestart ? diskVersion : null,
    mode: info.mode,
    repoDir: info.repoDir,
    gitClean: info.gitClean,
    branch: info.branch,
    note,
  };
}

async function updateApply() {
  const info = await detectInstall();
  const meta = await fetchLatestVersion();
  const latest = meta.latest;
  if (!latest) throw new Error('npm 上没有可用的发布版本');
  if (!semverGt(latest, VERSION)) return { ok: true, message: `已是最新（${VERSION}）`, needRestart: false };

  if (info.mode === 'git') {
    if (info.gitClean === false) {
      throw new Error('插件目录有未提交的本地改动，为避免覆盖请先 git commit / stash，再执行更新');
    }
    const r = await runProcess('git', ['pull', '--ff-only'], { cwd: info.repoDir, timeoutMs: 120000 });
    return { ok: r.ok, output: (r.stdout + '\n' + r.stderr).trim(), needRestart: r.ok, latest };
  }

  // npm 安装模式：直下官方 tarball → sha512 校验 → 原子换目录。
  // 不经 pnpm 解析器 —— 规避供应链年龄门槛 / link 依赖联动 / 镜像同步延迟。
  if (!meta.tarball || !meta.integrity) throw new Error('registry 元数据缺少 tarball/integrity，无法安全更新');
  const here = info.here;
  const tmp = path.join(os.tmpdir(), 'artcraft-up-' + crypto.randomUUID());
  await fs.mkdir(tmp, { recursive: true });
  try {
    const tgzPath = path.join(tmp, 'pkg.tgz');
    // 下载：优先元数据自带的官方地址；失败时回退 npmmirror 镜像（sha512 校验保证内容一致）
    let res;
    try {
      res = await fetch(meta.tarball, { signal: AbortSignal.timeout(180000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (e) {
      const slug = PKG_NAME.replace('/', '%2f');
      const mirrorUrl = `https://registry.npmmirror.com/${slug}/-/${PKG_NAME.split('/')[1]}-${meta.latest}.tgz`;
      WriteMirrorRetry: {
        res = await fetch(mirrorUrl, { signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        break WriteMirrorRetry;
      }
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 64 * 1024 * 1024) throw new Error('tarball 超过 64MB 上限，已终止');
    const digest = crypto.createHash('sha512').update(buf).digest('base64');
    if (digest !== String(meta.integrity).replace(/^sha512-/, '')) {
      throw new Error('sha512 校验失败 —— 下载内容与 registry 元数据不符，已终止');
    }
    await fs.writeFile(tgzPath, buf);
    const extract = await runProcess('tar', ['-xzf', tgzPath, '-C', tmp], { timeoutMs: 60000 });
    if (!extract.ok) throw new Error('解压失败: ' + (extract.stderr || '系统 tar 不可用'));
    const extractedPkg = JSON.parse(await fs.readFile(path.join(tmp, 'package', 'package.json'), 'utf8'));
    if (extractedPkg.name !== PKG_NAME || extractedPkg.version !== latest) {
      throw new Error(`tarball 内容与预期不符（${extractedPkg.name}@${extractedPkg.version}）`);
    }
    // 原子换目录：rename 失败（跨卷等）时回退为整目录复制
    const backup = here + '.old-' + Date.now();
    try {
      await fs.rename(here, backup).catch(() => { throw new Error('rename-busy'); });
      await fs.rename(path.join(tmp, 'package'), here).catch(async () => {
        await fs.cp(path.join(tmp, 'package'), here, { recursive: true, force: true });
      });
      await fs.rm(backup, { recursive: true, force: true }).catch(() => {});
    } catch {
      // 兜底：直接覆盖复制（不影响运行中的进程 —— 旧模块已在内存）
      await fs.cp(path.join(tmp, 'package'), here, { recursive: true, force: true });
    }
    // 同步 profile package.json 的版本规格，防止未来 pnpm install 回滚
    if (info.profileDir) {
      try {
        const pjPath = path.join(info.profileDir, 'package.json');
        const pj = JSON.parse(await fs.readFile(pjPath, 'utf8'));
        if (pj.dependencies && pj.dependencies[PKG_NAME] !== undefined) {
          pj.dependencies[PKG_NAME] = latest;
          await fs.writeFile(pjPath, JSON.stringify(pj, null, 2) + '\n');
        }
      } catch { /* 非关键 */ }
    }
    return { ok: true, output: `已更新到 v${latest}（sha512 校验通过，tarball 直装）`, needRestart: true, latest };
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

/* ============================ 插件入口 ============================ */

const toolNames = [];
const toolErrors = [];

export const inject = ['tools', 'webServer'];

export function apply(ctx) {
  /* ---- Agent Tools（防御式注册：形状不匹配也不影响 HTTP API） ---- */
  ctx.effect(() => {
    const disposers = [];
    const attempt = (def) => {
      const output = def.output ?? {
        schema: { type: 'object', additionalProperties: true },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      };
      for (const shape of [
        { name: def.name, description: def.description, parameters: def.schema, execute: def.execute },
        { name: def.name, description: def.description, inputSchema: def.schema, handler: def.execute },
      ]) {
        try {
          const d = ctx.tools.register(shape);
          if (typeof d === 'function') disposers.push(d);
          toolNames.push(def.name);
          return;
        } catch (e) {
          def.lastError = String((e && e.message) || e);
        }
      }
      toolErrors.push(`${def.name}: ${def.lastError ?? '注册失败'}`);
    };

    attempt({
      name: 'artcraft_status',
      description: '检查 ArtCraft 家族 13 个 CLI 是否可用，报告配置目录、控制通道端口与任务状态。本插件只是桥接，产物路径由调用方决定。',
      schema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        const cfg = await loadConfig();
        return statusInfo(cfg, { registered: [...toolNames], errors: [...toolErrors] });
      },
    });

    attempt({
      name: 'artcraft_cli',
      description: '运行 ArtCraft 家族 CLI 的任意子命令（photocraft-cli / wordcraft-cli / figcraft-cli 等 13 个，bin 参数的 enum 即完整清单）。长渲染请改用 HTTP POST /artcraft/api/job 后台执行。',
      schema: {
        type: 'object',
        properties: {
          bin: { type: 'string', enum: [...BINS], description: '工具键' },
          args: { type: 'array', items: { type: 'string' }, description: '命令行参数（不含程序名）' },
          cwd: { type: 'string', description: '工作目录（绝对路径，可选）：对话=当前工作空间下的目录，画布=项目目录；不传则继承 Host 进程' },
          timeoutMs: { type: 'number', description: '超时毫秒，默认 900000' },
        },
        required: ['bin', 'args'],
        additionalProperties: false,
      },
      async execute(args) {
        const cfg = await loadConfig();
        if (args.args != null && !Array.isArray(args.args)) throw new Error('args 必须是字符串数组');
        const exe = await resolveBin(cfg, String(args.bin));
        const cwd = args.cwd ? await ensureDir(args.cwd) : null;
        const r = await runProcess(exe, args.args ?? [], { cwd, timeoutMs: args.timeoutMs });
        return { bin: args.bin, exe, cwd, ...r };
      },
    });

    attempt({
      name: 'artcraft_control',
      description: '向运行中的 ArtCraft JSON 控制通道发送一条命令（同族 JSON-lines 协议：engine.execute / engine.commands / ui.inspect / ui.screenshot…）。已知默认端口：filmcraft(--control 9876) / effectcraft(9877) / vectorcraft(7979) / lightcraft(7980)；其余应用端口动态，可传 port 直连。PhotoCraft 控制通道为令牌鉴权模式、PdfCraft 为文件式，不在代理范围。',
      schema: {
        type: 'object',
        properties: {
          app: { type: 'string', enum: ['filmcraft', 'effectcraft', 'vectorcraft', 'lightcraft'], description: '目标应用（决定默认端口）' },
          port: { type: 'number', description: '可选：直接指定端口（覆盖 app 默认；用于端口动态的应用）' },
          method: { type: 'string', description: '如 engine.execute / engine.commands / ui.inspect / ui.screenshot' },
          params: { type: 'object', description: '命令参数' },
          timeoutMs: { type: 'number' },
        },
        required: ['method'],
        additionalProperties: false,
      },
      async execute(args) {
        const cfg = await loadConfig();
        const port = Number(args.port) > 0 ? Number(args.port) : cfg.control[String(args.app ?? '')];
        if (!(Number(port) > 0)) throw new Error('需要 app (filmcraft|effectcraft|vectorcraft|lightcraft) 或 port');
        const result = await controlCall(port, String(args.method), args.params ?? {}, { timeoutMs: args.timeoutMs });
        return { app: args.app ?? null, port, method: args.method, result };
      },
    });

    attempt({
      name: 'artcraft_fs',
      description: '桥接文件操作：list / stat / readtext / write / mkdir。路径由调用方决定 —— 对话调用传当前工作空间下的绝对路径，画布调用传项目目录下的绝对路径（或 base + rel 组合）。',
      schema: {
        type: 'object',
        properties: {
          op: { type: 'string', enum: ['list', 'stat', 'readtext', 'write', 'mkdir'] },
          path: { type: 'string', description: '绝对路径（或 ~/ 展开）' },
          base: { type: 'string', description: '可选：绝对基准目录，rel 相对它解析' },
          rel: { type: 'string', description: '可选：相对 base 的路径（需同时给 base）' },
          text: { type: 'string', description: 'op=write 时的文本内容' },
          base64: { type: 'string', description: 'op=write 时的二进制内容（base64）' },
        },
        required: ['op'],
        additionalProperties: false,
      },
      async execute(args) {
        const op = String(args.op);
        const P = () => resolveBaseRel(args.base, args.path ?? args.rel);
        if (op === 'list') {
          const dir = P();
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const out = [];
          for (const ent of entries) {
            const st = await fs.stat(path.join(dir, ent.name)).catch(() => null);
            out.push({ name: ent.name, dir: ent.isDirectory(), size: st?.size ?? null, mtime: st?.mtimeMs ?? null });
          }
          return { path: dir, entries: out };
        }
        if (op === 'stat') {
          const st = await fs.stat(P());
          return { path: P(), size: st.size, mtime: st.mtimeMs, dir: st.isDirectory() };
        }
        if (op === 'readtext') {
          const p = P();
          const st = await fs.stat(p);
          if (st.size > TEXT_CAP) throw new Error('文件超过 16MB，请用 GET /artcraft/api/file 取回');
          const buf = await fs.readFile(p);
          return { path: p, text: buf.toString('utf8') };
        }
        if (op === 'mkdir') {
          const p = await ensureDir(P());
          return { path: p };
        }
        if (op === 'write') {
          const p = P();
          await fs.mkdir(path.dirname(p), { recursive: true });
          let data;
          if (typeof args.base64 === 'string') data = Buffer.from(args.base64, 'base64');
          else if (typeof args.text === 'string') data = Buffer.from(args.text, 'utf8');
          else throw new Error('write 需要 text 或 base64');
          await fs.writeFile(p, data);
          return { path: p, size: data.length };
        }
        throw new Error(`未知 op: ${op}`);
      },
    });

    attempt({
      name: 'artcraft_update',
      description: '检查/应用 @ninkch/dsh-artcraft 插件自身的更新：action=check 对比本地与 npm latest；action=apply 执行更新（git pull 或官方 tarball 直装 + sha512 校验，按安装形态自动选择），完成后需重启 Harness 生效。',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['check', 'apply'] },
        },
        required: ['action'],
        additionalProperties: false,
      },
      async execute(args) {
        if (String(args.action) === 'apply') return updateApply();
        return updateCheck();
      },
    });

    attempt({
      name: 'artcraft_discover',
      description: '自动探测本机 ArtCraft 家族软件安装位置（Program Files / LocalAppData\\Programs 等），写入/修复配置：填充默认空缺项，并自动纠正已失效的路径（改安装目录、卸载重装到别处）；用户显式配置仍有效则不动。',
      schema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        const cfg = await loadConfig();
        const found = await discoverBinPaths();
        const applied = {};
        for (const k of BINS) {
          if (!found[k]) continue;
          let effective = null;
          try { effective = await resolveBin(cfg, k); } catch { /* 未配置 */ }
          const ok = effective ? await fileExists(effective) : false;
          if (ok) continue; // 现有配置仍有效 → 不动
          applied[k] = found[k];
        }
        if (!Object.keys(applied).length) {
          return { applied: {}, configPath: cfg.configPath, note: '家族程序路径均已就绪，无需更新' };
        }
        const target = cfg.configPath || path.join(os.homedir(), '.dsh', 'artcraft.config.json');
        let obj = {};
        try { obj = JSON.parse(await fs.readFile(target, 'utf8')); } catch { /* 新文件 */ }
        obj.bins = { ...(obj.bins ?? {}), ...applied };
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, JSON.stringify(obj, null, 2) + '\n');
        return { applied, configPath: target, note: '已写入配置，立即生效' };
      },
    });

    attempt({
      name: 'artcraft_recipes',
      description: '内置专家处理方案库（v2）：8 套专业配方（短剧海报、分镜批量调色、横转竖、响度标准化、字幕生成与烧录、动态片头、多平台分发包、先探测后验证纪律）+ 8 条「任务 → 技能 → 命令链」编排模板（竖屏短剧成片、剧本到分镜、RAW 批量冲洗、拉片分析、音频后期、合成镜头、设计系统交付）。action=list 列配方；action=get + id 取配方详情；action=chains 列编排链；action=chain + id 取完整命令链。配方中的 skills 字段指名应先读的技能包。',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'chains', 'chain'] },
          id: { type: 'string', description: 'action=get / chain 时的 id' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      async execute(args) {
        const recipesPath = path.join(HERE, 'recipes', 'recipes.json');
        const catalog = JSON.parse(await fs.readFile(recipesPath, 'utf8'));
        const action = String(args.action);
        const chains = Array.isArray(catalog.chains) ? catalog.chains : [];
        if (action === 'get') {
          const r = catalog.recipes.find((x) => x.id === String(args.id ?? ''));
          if (!r) throw new Error('配方不存在: ' + args.id + '（可用: ' + catalog.recipes.map((x) => x.id).join(', ') + '）');
          return r;
        }
        if (action === 'chain') {
          const c = chains.find((x) => x.id === String(args.id ?? ''));
          if (!c) throw new Error('编排链不存在: ' + args.id + '（可用: ' + chains.map((x) => x.id).join(', ') + '）');
          return c;
        }
        if (action === 'chains') {
          return {
            version: catalog.version,
            chains: chains.map((c) => ({ id: c.id, title: c.title, skills: c.skills, when: c.when, steps: c.steps?.length ?? 0 })),
            hint: 'action=chain + id 取完整命令链（每步 app + cmd + 说明 + 验证项）',
          };
        }
        return {
          version: catalog.version,
          recipes: catalog.recipes.map((r) => ({ id: r.id, title: r.title, apps: r.apps, skills: r.skills, goal: r.goal })),
          chains: chains.map((c) => ({ id: c.id, title: c.title, skills: c.skills })),
          hint: 'action=get + id 取配方（原则 + 步骤 + 验证）；action=chain + id 取编排链；技能包见 artcraft-ops 等 7 个技能',
        };
      },
    });

    attempt({
      name: 'artcraft_apps',
      description: 'ArtCraft 家族 13 应用的自动化能力目录：每个应用的定位、对标软件、CLI 子命令用法、控制通道端口、MCP 可用性与仓库/文档链接，另含各成员实测命令族统计。action=list 列出全部；action=get + id 取单个应用的完整能力卡。要拿某应用的实时命令注册表，用 artcraft_cli 跑该应用的 commands 子命令。',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get'] },
          id: { type: 'string', description: 'action=get 时的应用 id（如 wordcraft）' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      async execute(args) {
        const catalogPath = path.join(HERE, 'apps', 'catalog.json');
        const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
        if (String(args.action) === 'get') {
          const a = catalog.apps.find((x) => x.id === String(args.id ?? ''));
          if (!a) throw new Error('应用不存在: ' + args.id + '（可用: ' + catalog.apps.map((x) => x.id).join(', ') + '）');
          return a;
        }
        return {
          version: catalog.version,
          controlProtocol: catalog.controlProtocol,
          apps: catalog.apps.map((a) => ({ id: a.id, name: a.name, tagline: a.tagline, ref: a.ref, cli: a.cli, control: a.control, mcp: a.mcp, stage: a.stage })),
          hint: 'action=get + id 取完整能力卡（子命令用法 + 控制端口 + 仓库/文档链接）',
        };
      },
    });

    return () => {
      for (const d of disposers) { try { d(); } catch { /* ignore */ } }
    };
  }, `${NAME}: agent tools`);

  /* ---- HTTP API ---- */
  ctx.effect(() => {
    const routes = [
      makeRoute(`/${NAME}/api/status`, async (req, res) => {
        const cfg = await loadConfig();
        sendJson(res, 200, await statusInfo(cfg, { registered: [...toolNames], errors: [...toolErrors] }));
      }),

      makeRoute(`/${NAME}/api/fs`, async (req, res) => {
        const url = new URL(req.url, 'http://x');
        const base = url.searchParams.get('base'); // 可选：绝对基准目录（画布=项目目录，对话=工作空间下目录）
        const P = () => resolveBaseRel(base, url.searchParams.get('path') ?? url.searchParams.get('rel'));
        if (req.method === 'GET') {
          const op = url.searchParams.get('op') ?? 'list';
          if (op === 'list') {
            const dir = P();
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const out = [];
            for (const ent of entries) {
              const st = await fs.stat(path.join(dir, ent.name)).catch(() => null);
              out.push({ name: ent.name, dir: ent.isDirectory(), size: st?.size ?? null, mtime: st?.mtimeMs ?? null });
            }
            sendJson(res, 200, { path: dir, entries: out });
            return;
          }
          if (op === 'stat') {
            const st = await fs.stat(P());
            sendJson(res, 200, { path: P(), size: st.size, mtime: st.mtimeMs, dir: st.isDirectory() });
            return;
          }
          if (op === 'readtext') {
            const p = P();
            const st = await fs.stat(p);
            if (st.size > TEXT_CAP) throw new Error('文件超过 16MB，请改用 GET /artcraft/api/file');
            const buf = await fs.readFile(p);
            sendJson(res, 200, { path: p, text: buf.toString('utf8') });
            return;
          }
          throw new Error(`未知 op: ${op}`);
        }
        if (req.method === 'POST') {
          const action = url.searchParams.get('action') ?? 'write';
          if (action === 'mkdir') {
            const body = await readJson(req);
            const p = await ensureDir(resolveBaseRel(body.base ?? url.searchParams.get('base'), body.path ?? body.rel ?? url.searchParams.get('rel')));
            sendJson(res, 200, { ok: true, path: p });
            return;
          }
          // write：JSON {path 或 base+rel, base64|text} 或原始字节流（路径走查询串）
          const isJson = String(req.headers['content-type'] ?? '').includes('json');
          let target;
          let data;
          if (isJson) {
            const body = await readJson(req, WRITE_CAP);
            if (typeof body.base64 === 'string') data = Buffer.from(body.base64.replace(/\s+/g, ''), 'base64');
            else if (typeof body.text === 'string') data = Buffer.from(body.text, 'utf8');
            else throw new Error('write 需要 base64 或 text 字段');
            target = resolveBaseRel(body.base ?? url.searchParams.get('base'), body.path ?? body.rel ?? url.searchParams.get('rel'));
          } else {
            data = await readBody(req, WRITE_CAP);
            target = resolveBaseRel(url.searchParams.get('base'), url.searchParams.get('path') ?? url.searchParams.get('rel'));
          }
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, data);
          sendJson(res, 200, { ok: true, path: target, size: data.length });
          return;
        }
        throw new Error('仅支持 GET/POST');
      }),

      makeRoute(`/${NAME}/api/file`, async (req, res) => {
        if (req.method !== 'GET') throw new Error('仅支持 GET');
        const url = new URL(req.url, 'http://x');
        const p = resolveBaseRel(url.searchParams.get('base'), url.searchParams.get('path') ?? url.searchParams.get('rel'));
        const st = await fs.stat(p);
        if (!st.isFile()) throw new Error('不是常规文件');
        if (st.size > READ_CAP) throw new Error(`文件超过读取上限（${Math.round(READ_CAP / 1048576)}MB）`);
        if (url.searchParams.get('as') === 'text') {
          if (st.size > TEXT_CAP) throw new Error('文本模式上限 16MB，请直接下载原始文件');
          const buf = await fs.readFile(p);
          sendJson(res, 200, { path: p, text: buf.toString('utf8') });
          return;
        }
        // 流式传输：产物可能是几百 MB 的视频，不整读进内存
        res.setHeader('content-type', CONTENT_TYPES[path.extname(p).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('content-length', st.size);
        await pipeline(createReadStream(p), res);
      }),

      makeRoute(`/${NAME}/api/job`, async (req, res) => {
        const cfg = await loadConfig();
        const url = new URL(req.url, 'http://x');
        if (req.method === 'GET') {
          const id = url.searchParams.get('id');
          const tail = Number(url.searchParams.get('tail') ?? 60);
          if (id) {
            const job = jobs.get(id);
            if (!job) throw new Error('任务不存在或已被回收');
            job.outputs = await statOutputs(job.outputs, job.cwd);
            sendJson(res, 200, jobSnapshot(job, tail));
            return;
          }
          const list = [];
          for (const job of [...jobs.values()].reverse()) {
            job.outputs = await statOutputs(job.outputs, job.cwd);
            list.push(jobSnapshot(job, 5));
          }
          sendJson(res, 200, { jobs: list });
          return;
        }
        if (req.method === 'POST') {
          const body = await readJson(req);
          const started = await startJob(cfg, body);
          sendJson(res, 200, started);
          return;
        }
        throw new Error('仅支持 GET/POST');
      }),

      makeRoute(`/${NAME}/api/job/cancel`, async (req, res) => {
        if (req.method !== 'POST') throw new Error('仅支持 POST');
        const { id } = await readJson(req);
        const job = jobs.get(String(id ?? ''));
        if (!job) throw new Error('任务不存在或已被回收');
        if (job.status === 'running') {
          try { job.child?.kill(); } catch { /* ignore */ }
          sendJson(res, 200, { ok: true, id: job.id, status: 'cancelling' });
        } else {
          sendJson(res, 200, { ok: false, id: job.id, status: job.status });
        }
      }),

      makeRoute(`/${NAME}/api/update/check`, async (req, res) => {
        sendJson(res, 200, await updateCheck());
      }),

      makeRoute(`/${NAME}/api/update/apply`, async (req, res) => {
        if (req.method !== 'POST') throw new Error('仅支持 POST');
        sendJson(res, 200, await updateApply());
      }),

      makeRoute(`/${NAME}/api/discover`, async (req, res) => {
        if (req.method !== 'POST') throw new Error('仅支持 POST');
        const cfg = await loadConfig();
        const found = await discoverBinPaths();
        // 只填充默认空缺项；显式配置仅在已失效（改安装目录/卸载重装）时自动纠正，有效则不动
        const applied = {};
        for (const k of BINS) {
          if (!found[k]) continue;
          let effective = null;
          try { effective = await resolveBin(cfg, k); } catch { /* 未配置 */ }
          const ok = effective ? await fileExists(effective) : false;
          if (ok) continue;
          applied[k] = found[k];
        }
        if (Object.keys(applied).length) {
          const target = cfg.configPath || path.join(os.homedir(), '.dsh', 'artcraft.config.json');
          let obj = {};
          try { obj = JSON.parse(await fs.readFile(target, 'utf8')); } catch { /* 新文件 */ }
          obj.bins = { ...(obj.bins ?? {}), ...applied };
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, JSON.stringify(obj, null, 2) + '\n');
        }
        sendJson(res, 200, {
          discovered: found,
          applied,
          configPath: cfg.configPath,
          note: Object.keys(applied).length ? '已探测并写入配置，立即生效' : '没有需要更新的家族程序',
        });
      }),

      makeRoute(`/${NAME}/api/apps`, async (req, res) => {
        if (req.method !== 'GET') throw new Error('仅支持 GET');
        const url = new URL(req.url, 'http://x');
        const id = url.searchParams.get('id');
        const catalog = JSON.parse(await fs.readFile(path.join(HERE, 'apps', 'catalog.json'), 'utf8'));
        if (id) {
          const a = catalog.apps.find((x) => x.id === id);
          if (!a) throw new Error('应用不存在: ' + id + '（可用: ' + catalog.apps.map((x) => x.id).join(', ') + '）');
          sendJson(res, 200, a);
          return;
        }
        sendJson(res, 200, {
          version: catalog.version,
          controlProtocol: catalog.controlProtocol,
          apps: catalog.apps.map((a) => ({ id: a.id, name: a.name, tagline: a.tagline, ref: a.ref, cli: a.cli, control: a.control, mcp: a.mcp, stage: a.stage })),
        });
      }),

      makeRoute(`/${NAME}/api/control`, async (req, res) => {
        if (req.method !== 'POST') throw new Error('仅支持 POST');
        const cfg = await loadConfig();
        const body = await readJson(req);
        const port = body.port ?? cfg.control[String(body.app ?? '')];
        if (!(Number(port) > 0)) throw new Error('需要 app (filmcraft|effectcraft|vectorcraft|lightcraft) 或 port');
        const result = await controlCall(
          Number(port),
          String(body.method),
          body.params ?? {},
          { timeoutMs: body.timeoutMs },
        );
        sendJson(res, 200, { ok: true, port: Number(port), method: body.method, result });
      }),
    ];

    const disposers = routes.map((r) => ctx.webServer.register(r));
    return () => {
      for (const d of disposers) { try { d(); } catch { /* ignore */ } }
    };
  }, `${NAME}: api routes`);

  /* ---- 清理：插件重载/停用时终止所有子任务 ---- */
  ctx.effect(() => () => {
    for (const job of jobs.values()) {
      try { job.child?.kill(); } catch { /* ignore */ }
      try { clearTimeout(job.timer); } catch { /* ignore */ }
    }
  }, `${NAME}: job cleanup`);
}
