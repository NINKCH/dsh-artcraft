/**
 * @ninkch/dsh-artcraft — 技能提供者（独立插件行）
 *
 * 为什么单独一行：`inject: ['skills']` 是硬依赖。把它与主插件（tools/webServer）分开，
 * 即使某个环境没有 skills 服务，也只影响本行，不会拖垮 artcraft 的工具与 HTTP API。
 *
 * 技能来源：包内 skills/<name>/SKILL.md（YAML frontmatter: name + description）。
 * rank 600 与内置技能同级 —— 项目级（100/200）与用户级（400/500）技能可覆盖同名技能。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(HERE, 'skills');
const PROVIDER = 'artcraft';
const RANK = 600;

/** Cordis 插件名 */
export const name = 'artcraft-skills';
/** 需要技能服务 */
export const inject = ['skills'];

/** 解析 SKILL.md 的 YAML frontmatter（只取扁平的 name/description 标量，够用且不引入依赖） */
function parseSkill(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.+)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[kv[1]] = v;
  }
  if (!meta.name || !meta.description) return null;
  return { name: meta.name, description: meta.description, content: raw.slice(m[0].length).trim() };
}

/** 扫描包内技能目录，产出候选清单 */
async function loadCatalog() {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    return out; // 无 skills/ 目录 → 空目录（不报错）
  }
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const file = path.join(SKILLS_DIR, ent.name, 'SKILL.md');
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = parseSkill(raw);
      if (!parsed) continue;
      out.push({
        name: parsed.name,
        description: parsed.description,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER,
        source: 'bundled',
        rank: RANK,
        resourceBase: { kind: 'directory', path: path.dirname(file) },
        locator: file,
      });
    } catch { /* 单个技能读取失败不影响其余 */ }
  }
  return out;
}

export function apply(ctx) {
  const provider = {
    name: PROVIDER,
    list: () => loadCatalog(),
    async get(candidate, options) {
      const { rank: _rank, locator, ...summary } = candidate;
      const raw = await fs.readFile(locator, { encoding: 'utf8', signal: options?.signal });
      const parsed = parseSkill(raw);
      // 每次加载都重读文件：改技能正文无需版本号或缓存失效
      return { summary, content: parsed ? parsed.content : raw };
    },
  };
  ctx.skills.registerProvider(() => provider);
}
