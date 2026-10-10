// @ninkch/dsh-artcraft — client half.
// 侧栏 "ArtCraft" 按钮 + 面板：工具链状态 / 自更新（检查 + 一键应用）。
window.__ModuleLoader__.load({
  id: '@ninkch/dsh-artcraft',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useCallback, useRef } = React;

    const NS = 'artcraft';
    const PANEL_ID = 'artcraft';
    const API = '/artcraft/api';

    const CSS = `
.dshac-panel { padding: 14px; font-size: 13px; line-height: 1.5; overflow: auto; height: 100%; box-sizing: border-box; }
.dshac-h { font-size: 14px; font-weight: 600; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
.dshac-card { border: 1px solid var(--dsw-border-primary, rgba(128,128,128,.35)); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
.dshac-title { font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.dshac-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
.dshac-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.dshac-dot.ok { background: #34c759; } .dshac-dot.bad { background: #ff5f57; } .dshac-dot.unknown { background: #8e8e93; }
.dshac-mono { font-family: ui-monospace, Consolas, monospace; font-size: 12px; word-break: break-all; }
.dshac-muted { opacity: .65; font-size: 12px; }
.dshac-btn { border: 1px solid var(--dsw-border-primary, rgba(128,128,128,.4)); background: transparent; color: inherit;
  border-radius: 7px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
.dshac-btn:hover:not(:disabled) { background: rgba(128,128,128,.15); }
.dshac-btn:disabled { opacity: .5; cursor: default; }
.dshac-btn.primary { background: rgba(80,120,255,.25); }
.dshac-out { white-space: pre-wrap; font-family: ui-monospace, Consolas, monospace; font-size: 11px;
  background: rgba(128,128,128,.12); border-radius: 7px; padding: 8px; margin-top: 8px; max-height: 180px; overflow: auto; }
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

    function PanelIcon() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none' },
        h('rect', { x: 3, y: 3, width: 14, height: 14, rx: 3, stroke: 'currentColor', 'stroke-width': 1.5 }),
        h('path', { d: 'M6.5 10h4M8.5 8v4', stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
        h('circle', { cx: 13.5, cy: 13, r: 1.6, fill: 'currentColor' }),
      );
    }

    function ArtCraftPage() {
      const [status, setStatus] = useState(null);
      const [statusErr, setStatusErr] = useState(null);
      const [upd, setUpd] = useState(null);
      const [busy, setBusy] = useState('');
      const [out, setOut] = useState('');
      const [needRestart, setNeedRestart] = useState(false);
      const alive = useRef(true);
      useEffect(() => () => { alive.current = false; }, []);

      const loadStatus = useCallback(async () => {
        try {
          const s = await api('/status');
          if (!alive.current) return;
          setStatus(s); setStatusErr(null);
        } catch (e) {
          if (!alive.current) return;
          setStatusErr(String(e.message || e));
        }
      }, []);
      const checkUpdate = useCallback(async () => {
        setBusy('check'); setOut('');
        try {
          const u = await api('/update/check');
          if (!alive.current) return;
          setUpd(u);
          setOut(u.updateAvailable
            ? `有新版本：${u.latest}（当前 ${u.current}），安装方式：${u.mode === 'git' ? 'git 仓库' : 'npm 安装'}`
            : `已是最新${u.latest ? '（npm latest ' + u.latest + '）' : ''}${u.note ? ' · ' + u.note : ''}`);
        } catch (e) { if (alive.current) setOut('检查失败：' + String(e.message || e)); }
        finally { if (alive.current) setBusy(''); }
      }, []);
      const applyUpdate = useCallback(async () => {
        setBusy('apply'); setOut('');
        try {
          const r = await api('/update/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
          if (!alive.current) return;
          setOut((r.output || String(r.message || '')) + (r.needRestart ? '\n\n✅ 更新完成 —— 请重启 DeepSeek Harness 后生效。' : ''));
          if (r.needRestart) setNeedRestart(true);
        } catch (e) { if (alive.current) setOut('更新失败：' + String(e.message || e)); }
        finally { if (alive.current) setBusy(''); }
      }, []);

      useEffect(() => { loadStatus(); checkUpdate(); }, [loadStatus, checkUpdate]);

      const bins = status?.bins ?? {};
      const binRow = (key, label) => {
        const b = bins[key];
        return h('div', { className: 'dshac-row' },
          h(Dot, { ok: b ? b.found : null }),
          h('span', null, label),
          b?.found ? null : h('span', { className: 'dshac-muted' }, b?.note || '未配置'),
        );
      };

      return h('div', { className: 'dshac-panel' },
        h('div', { className: 'dshac-h' }, 'ArtCraft Bridge',
          status ? h('span', { className: 'dshac-muted' }, 'v' + status.version) : null),

        statusErr
          ? h('div', { className: 'dshac-card' },
              h('div', { className: 'dshac-title' }, '未连接'),
              h('div', { className: 'dshac-muted' }, statusErr + ' —— 插件可能未注册或 Harness 需要重启。'))
          : h('div', { className: 'dshac-card' },
              h('div', { className: 'dshac-title' }, '工具链',
                h('button', { className: 'dshac-btn', onClick: loadStatus, disabled: busy !== '' }, '刷新')),
              binRow('photocraft', 'PhotoCraft (CLI)'),
              binRow('filmcraft', 'FilmCraft (CLI)'),
              binRow('effectcraft', 'EffectCraft (CLI)'),
              status?.dataRoot ? h('div', { className: 'dshac-row dshac-muted' },
                '数据目录：', h('span', { className: 'dshac-mono' }, status.dataRoot.path)) : null),

          h('div', { className: 'dshac-card' },
            h('div', { className: 'dshac-title' }, '插件更新',
              h('button', { className: 'dshac-btn primary', onClick: checkUpdate, disabled: busy !== '' },
                busy === 'check' ? '检查中…' : '检查更新')),
            upd
              ? h('div', { className: 'dshac-row' },
                  h('span', null, '当前 v' + (upd.current ?? '?')),
                  h('span', { className: 'dshac-muted' }, '→'),
                  h('span', { className: upd.updateAvailable ? 'dshac-ok' : 'dshac-muted' },
                    'npm latest v' + (upd.latest ?? '—')),
                  upd.mode ? h('span', { className: 'dshac-muted' },
                    '（' + (upd.mode === 'git' ? 'git 仓库 · ' + (upd.branch || '?') + (upd.gitClean === false ? ' · 有本地改动' : ' · 工作区干净') : 'npm 安装') + '）') : null)
              : h('div', { className: 'dshac-muted' }, '尚未检查'),
            h('div', { style: { marginTop: '8px' } },
              h('button', {
                className: 'dshac-btn primary',
                onClick: applyUpdate,
                disabled: busy !== '' || !upd?.updateAvailable,
                title: upd?.updateAvailable ? '' : '先检查更新，有新版本才可应用',
              }, busy === 'apply' ? '更新中…' : '一键更新')),
            needRestart ? h('div', { className: 'dshac-note' }, '更新已写入 —— 重启 DeepSeek Harness 后生效。') : null,
            out ? h('div', { className: 'dshac-out' }, out) : null),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: { panel: 'ArtCraft' }, en: { panel: 'ArtCraft' } }), 'artcraft: dictionaries');
        ctx.effect(() => {
          const el = document.createElement('style');
          el.id = 'dshac-styles';
          el.textContent = CSS;
          document.head.appendChild(el);
          return () => el.remove();
        }, 'artcraft: styles');
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 101,
          label: () => 'ArtCraft',
          locale: NS,
        }, PanelIcon));
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, ArtCraftPage));
      },
    };
  },
});
