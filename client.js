// @ninkch/dsh-artcraft — client half.
// 不占侧栏/主面板：状态与「检查更新」挂在 插件页 → 本插件详情卡 上
// （plugins.detail.badge / plugins.detail.section）。
window.__ModuleLoader__.load({
  id: '@ninkch/dsh-artcraft',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useCallback, useRef } = React;

    const NS = 'artcraft';
    const API = '/artcraft/api';

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
.dshac-chip { display: inline-flex; align-items: center; border: 1px solid rgba(80,120,255,.5); color: inherit;
  background: rgba(80,120,255,.18); border-radius: 999px; padding: 1px 9px; font-size: 11px; }
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

    /** 详情页 subject 兼容提取：判断当前详情页是否本插件 */
    function isOurPage(props) {
      const sub = props && props.subject ? props.subject : props;
      if (!sub) return false;
      const name = sub.packageName ?? sub.name ?? sub.moduleName ?? sub.id ?? (typeof sub === 'string' ? sub : '');
      return typeof name === 'string' && name.includes('dsh-artcraft');
    }

    function Dot({ ok }) {
      return h('span', { className: 'dshac-dot ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'unknown') });
    }

    /** 详情页标题旁的徽标：有新版本时出现 */
    function UpdateBadge(props) {
      const [latest, setLatest] = useState(null);
      useEffect(() => {
        if (!isOurPage(props)) return;
        let ok = true;
        api('/update/check').then((u) => { if (ok && u?.updateAvailable) setLatest(u.latest); }).catch(() => {});
        return () => { ok = false; };
      }, []);
      if (!isOurPage(props) || !latest) return null;
      return h('span', { className: 'dshac-chip', title: 'npm 上有新版本，到本页一键更新' }, '有新版本 v' + latest);
    }

    /** 详情页内容区：工具链状态 + 更新 */
    function StatusSection(props) {
      const [status, setStatus] = useState(null);
      const [statusErr, setStatusErr] = useState(null);
      const [upd, setUpd] = useState(null);
      const [busy, setBusy] = useState('');
      const [out, setOut] = useState('');
      const [needRestart, setNeedRestart] = useState(false);
      const ours = isOurPage(props);
      const alive = useRef(true);
      useEffect(() => () => { alive.current = false; }, []);

      const loadStatus = useCallback(async () => {
        try {
          const s = await api('/status');
          if (!alive.current) return;
          setStatus(s); setStatusErr(null);
        } catch (e) { if (alive.current) setStatusErr(String(e.message || e)); }
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

      useEffect(() => {
        if (!ours) return;
        loadStatus(); checkUpdate();
      }, [ours, loadStatus, checkUpdate]);

      if (!ours) return null;

      const bins = status?.bins ?? {};
      const binRow = (key, label) => {
        const b = bins[key];
        return h('div', { className: 'dshac-row' },
          h(Dot, { ok: b ? b.found : null }),
          h('span', null, label),
          b?.found ? null : h('span', { className: 'dshac-muted' }, b?.note || '未配置'),
        );
      };

      return h('div', { className: 'dshac-card' },
        h('div', { className: 'dshac-title' }, 'ArtCraft 工具链与更新',
          h('button', { className: 'dshac-btn', onClick: loadStatus, disabled: busy !== '' }, '刷新')),
        statusErr
          ? h('div', { className: 'dshac-muted' }, '未连接：' + statusErr + '（插件可能未注册或 Harness 需要重启）')
          : h('div', null,
              binRow('photocraft', 'PhotoCraft (CLI)'),
              binRow('filmcraft', 'FilmCraft (CLI)'),
              binRow('effectcraft', 'EffectCraft (CLI)'),
              status?.dataRoot ? h('div', { className: 'dshac-row dshac-muted' },
                '数据目录：', h('span', { className: 'dshac-mono' }, status.dataRoot.path)) : null),
        h('div', { className: 'dshac-row', style: { marginTop: '10px' } },
          h('span', { className: 'dshac-muted' },
            '当前 v' + (status?.version ?? upd?.current ?? '?') +
            (upd ? ' · npm latest v' + (upd.latest ?? '—') : '') +
            (upd?.mode ? '（' + (upd.mode === 'git' ? 'git 仓库' + (upd.gitClean === false ? ' · 有本地改动' : '') : 'npm 安装') + '）' : '')),
          h('button', { className: 'dshac-btn primary', onClick: checkUpdate, disabled: busy !== '' },
            busy === 'check' ? '检查中…' : '检查更新'),
          h('button', {
            className: 'dshac-btn',
            onClick: applyUpdate,
            disabled: busy !== '' || !upd?.updateAvailable,
            title: upd?.updateAvailable ? '' : '有新版本时才可应用',
          }, busy === 'apply' ? '更新中…' : '一键更新')),
        needRestart ? h('div', { className: 'dshac-note' }, '更新已写入 —— 重启 DeepSeek Harness 后生效。') : null,
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
        // 插件页 → 本插件详情卡：标题旁徽标（有新版本时）
        ctx.slots.inject('plugins.detail.badge', () => ctx.slots.register({
          name: 'plugins.detail.badge',
          id: 'artcraft-update-badge',
          order: 50,
          label: () => 'ArtCraft 更新',
          locale: NS,
        }, UpdateBadge));
        // 插件页 → 本插件详情卡：内容区（工具链状态 + 检测更新 + 一键更新）
        ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({
          name: 'plugins.detail.section',
          id: 'artcraft-status',
          order: 50,
          label: () => 'ArtCraft 工具链与更新',
          locale: NS,
        }, StatusSection));
      },
    };
  },
});
