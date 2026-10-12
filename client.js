// @ninkch/dsh-artcraft — client half.
// 不占侧栏/主面板：状态与「检查更新 / 一键更新」挂在
// 插件页 → 本插件详情卡（plugins.bundle.config，按包名键控分发）。
//
// 更新语义（吸取画布侧教训）：
//   - 只做版本号对比（npm latest vs 本地），本地领先不算待更新；
//   - 更新完成后只显示提示文字，绝不自动刷新/重启页面 —— 何时生效由你决定
//     （本插件是 Host 半侧代码，生效需要重启 Harness 进程，刷新页面不够）。
window.__ModuleLoader__.load({
  id: '@ninkch/dsh-artcraft',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useCallback, useRef } = React;

    const NS = 'artcraft';
    const API = '/artcraft/api';
    const LABELS = { photocraft: 'PhotoCraft', vectorcraft: 'VectorCraft', filmcraft: 'FilmCraft', lightcraft: 'LightCraft', pdfcraft: 'PdfCraft', effectcraft: 'EffectCraft', designcraft: 'DesignCraft', wordcraft: 'WordCraft', deckcraft: 'DeckCraft', gridcraft: 'GridCraft', cadcraft: 'CADCraft', soundcraft: 'SoundCraft' };

    const CSS = `
.dshac-card { border: 1px solid var(--dsw-border-primary, rgba(128,128,128,.35)); border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.5; }
.dshac-title { font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.dshac-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; flex-wrap: wrap; }
.dshac-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; display: inline-block; }
.dshac-dot.ok { background: #34c759; } .dshac-dot.bad { background: #ff5f57; } .dshac-dot.unknown { background: #8e8e93; }
.dshac-mono { font-family: ui-monospace, Consolas, monospace; font-size: 12px; word-break: break-all; }
.dshac-muted { opacity: .65; font-size: 12px; }
.dshac-btn { border: 1px solid var(--dsw-border-primary, rgba(128,128,128,.4)); background: transparent; color: inherit;
  border-radius: 7px; padding: 3px 10px; font-size: 12px; cursor: pointer; }
.dshac-btn:hover:not(:disabled) { background: rgba(128,128,128,.15); }
.dshac-btn:disabled { opacity: .5; cursor: default; }
.dshac-btn.primary { background: rgba(80,120,255,.25); }
.dshac-out { white-space: pre-wrap; font-family: ui-monospace, Consolas, monospace; font-size: 11px;
  background: rgba(128,128,128,.12); border-radius: 7px; padding: 8px; margin-top: 8px; max-height: 160px; overflow: auto; }
.dshac-note { margin-top: 8px; color: var(--dsw-alias-state-warning-primary, #d69e2e); font-size: 12px; }
.dshac-ok { color: var(--dsw-alias-state-success-primary, #34c759); }
`;

    async function api(path, opts) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 30000) : null;
      try {
        const res = await fetch(API + path, { ...(opts || {}), signal: ctrl ? ctrl.signal : undefined });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || ('HTTP ' + res.status));
        return j;
      } finally { if (timer) clearTimeout(timer); }
    }

    function Dot({ ok }) {
      return h('span', { className: 'dshac-dot ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'unknown') });
    }

    function StatusCard() {
      const [status, setStatus] = useState(null);
      const [statusErr, setStatusErr] = useState(null);
      const [upd, setUpd] = useState(null);
      const [busy, setBusy] = useState('');
      const [out, setOut] = useState('');
      const [done, setDone] = useState(false);
      const alive = useRef(true);
      useEffect(() => () => { alive.current = false; }, []);

      const loadStatus = useCallback(async () => {
        setBusy('refresh');
        try {
          // 刷新 = 状态 + 顺带一次家族安装探测（后装软件/改安装目录后自动修正配置；
          // 探测端点在旧版插件上不存在时静默跳过）
          try {
            await api('/discover', {
              method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
            });
          } catch { /* 旧版无此路由 → 静默跳过 */ }
          const s = await api('/status');
          if (alive.current) { setStatus(s); setStatusErr(null); }
        } catch (e) { if (alive.current) setStatusErr(String(e.message || e)); }
        finally { if (alive.current) setBusy(''); }
      }, []);

      const checkUpdate = useCallback(async () => {
        setBusy('check'); setOut(''); setDone(false);
        try {
          const u = await api('/update/check');
          if (!alive.current) return;
          setUpd(u);
          // 待重启优先于"有新版本"：新包已在磁盘、运行中的还是旧代码，重启前不再误导
          setOut(u.pendingRestart
            ? `✅ 已更新到 v${u.pendingVersion ?? u.diskVersion ?? '?'}，请重启 Harness 完成更新（运行中的仍是 v${u.current}，页面刷新不够）`
            : u.updateAvailable
              ? `有新版本：v${u.latest}（当前 v${u.current}），安装方式：${u.mode === 'git' ? 'git 仓库' : 'npm 安装'}`
              : `已是最新${u.latest ? '（npm latest v' + u.latest + '）' : ''}${u.note ? ' · ' + u.note : ''}`);
        } catch (e) { if (alive.current) setOut('检查失败：' + String(e.message || e)); }
        finally { if (alive.current) setBusy(''); }
      }, []);

      const applyUpdate = useCallback(async () => {
        setBusy('apply'); setOut(''); setDone(false);
        try {
          const r = await api('/update/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
          if (!alive.current) return;
          setOut((r.output || String(r.message || '')));
          // 不自动刷新/重启任何东西：本插件是 Host 半侧代码，生效 = 重启 Harness 进程
          if (r.needRestart) {
            setDone(true);
            // 立即把"待重启"写进 upd（服务端事实），后续任何 checkUpdate/重挂载都会保持常驻横幅
            setUpd((u) => (u
              ? { ...u, pendingRestart: true, pendingVersion: r.latest ?? u.pendingVersion, diskVersion: r.latest ?? u.diskVersion, updateAvailable: false }
              : u));
            setOut((r.output || '') + '\n\n✅ 更新已写入磁盘（v' + (r.latest ?? '?') + '）。生效方式：重启 DeepSeek Harness（进程级重启，页面刷新不够）。何时重启由你决定。');
          }
        } catch (e) { if (alive.current) setOut('更新失败：' + String(e.message || e)); }
        finally { if (alive.current) setBusy(''); }
      }, []);

      useEffect(() => { loadStatus(); checkUpdate(); }, [loadStatus, checkUpdate]);

      const bins = status?.bins ?? {};
      const binRow = (key) => {
        const b = bins[key];
        const label = LABELS[key] || key;
        if (!b) return h('div', { className: 'dshac-row' }, h(Dot, { ok: null }), h('span', null, label), h('span', { className: 'dshac-muted' }, '未配置'));
        const unconfigured = b.configured === key + '-cli' && !b.found; // 从未配置过的默认裸名
        const ok = unconfigured ? null : b.found;
        return h('div', { className: 'dshac-row' },
          h(Dot, { ok }),
          h('span', null, label),
          b.found ? h('span', { className: 'dshac-ok' }, '就绪')
            : unconfigured ? h('span', { className: 'dshac-muted' }, '未安装（可选家族成员）')
            : h('span', { className: 'dshac-muted' }, b.note || '未找到'),
        );
      };

      return h('div', { className: 'dshac-card' },
        h('div', { className: 'dshac-title' }, 'ArtCraft 工具链与更新',
          h('button', { className: 'dshac-btn', onClick: loadStatus, disabled: busy !== '' }, '刷新')),
        statusErr
          ? h('div', { className: 'dshac-muted' }, '未连接：' + statusErr + '（插件可能未注册或 Harness 需要重启）')
          : h('div', null, Object.keys(LABELS).map(binRow),
              status?.config?.path ? h('div', { className: 'dshac-row dshac-muted' },
                '配置目录：', h('span', { className: 'dshac-mono' }, status.config.path)) : null),
        h('div', { className: 'dshac-row', style: { marginTop: '10px' } },
          h('span', { className: 'dshac-muted' },
            '当前 v' + (status?.version ?? upd?.current ?? '?') +
            (upd?.pendingRestart ? '（磁盘已是 v' + (upd.pendingVersion ?? upd.diskVersion ?? '?') + '，待重启）' : '') +
            (upd ? ' · npm latest v' + (upd.latest ?? '—') : '') +
            (upd?.mode ? '（' + (upd.mode === 'git' ? 'git 仓库' + (upd.gitClean === false ? ' · 有本地改动' : '') : 'npm 安装') + '）' : '')),
          h('button', { className: 'dshac-btn primary', onClick: checkUpdate, disabled: busy !== '' },
            busy === 'check' ? '检查中…' : '检查更新'),
          h('button', {
            className: 'dshac-btn',
            onClick: applyUpdate,
            disabled: busy !== '' || !upd?.updateAvailable || upd?.pendingRestart,
            title: upd?.pendingRestart ? '更新已写入磁盘，重启 Harness 后生效' : (upd?.updateAvailable ? '' : '有新版本时才可应用'),
          }, busy === 'apply' ? '更新中…' : '一键更新')),
        (upd?.pendingRestart || done) ? h('div', { className: 'dshac-note' },
          '✅ 新版已写入磁盘，请重启 DeepSeek Harness 以完成更新（进程级重启，页面刷新不够）。重启后这里会显示新版本，何时重启由你决定 —— 更新不会打断正在运行的任务。') : null,
        out ? h('div', { className: 'dshac-out' }, out) : null,
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: { artcraft: 'ArtCraft' }, en: { artcraft: 'ArtCraft' } }), 'artcraft: dictionaries');
        ctx.effect(() => {
          const el = document.createElement('style');
          el.id = 'dshac-styles';
          el.textContent = CSS;
          document.head.appendChild(el);
          return () => el.remove();
        }, 'artcraft: styles');
        // 键控分发：key = 包名 → 只渲染在 @ninkch/dsh-artcraft 自己的插件页详情卡上
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: '@ninkch/dsh-artcraft',
          locale: NS,
        }, StatusCard));
      },
    };
  },
});
