# Changelog

All notable changes to this project are documented in this file.
Format: `## [X.Y.Z] -- date`. Entries are rebuilt from git tags and commit
history; where the record is incomplete the entry says so instead of guessing.

Released versions are exactly the git tags listed below. Versions without a
tag (planned but never published) are **not** given entries.

## [0.3.1] -- 2026-10-17

### Fixed
- `fix(tools)`: pass the computed fallback `output` through to
  `ctx.tools.register()` -- fixes issue #1, where every agent tool failed to
  register on DSH 44.0.0 ("must declare output { schema, render,
  presentationMeta? }") while the HTTP API kept working.

## [0.3.0] -- 2026-10-16

First minor bump, explicitly approved by the maintainer (recorded in
RELEASING.md); includes everything accumulated since 0.2.10.

### Added
- `feat`: FigCraft as the 13th family member (bins whitelist, catalog card,
  capability stats) + the first bundled craft skill pack (7 skills).
- `feat(skills+chains)`: batch-pipeline and multicam skills, 3 more
  task-to-command chains, English skill index, frontend contract docs.
- `feat(qc-v2+refs)`: app-side QC checks and five deeper craft references.
- `feat(live)`: control-channel liveness probe (`artcraft_live` +
  `GET /artcraft/api/live`).
- `feat(ui+recipes)`: plugins-page card shows the bundled skill pack; 3 more
  orchestration chains.
- `feat(api)`: capability stats and bundled skill pack over HTTP.
- `feat(qc+skills)`: deterministic delivery QC tool (`artcraft_qc`) + 2 more
  craft skills + deep reference files.
- `chore(release)`: 0.3.0 release commit.

## [0.2.10] -- 2026-10-12

### Fixed
- `fix(update UX)`: persistent "restart Harness to finish update" state --
  `/update/check` reports disk-vs-running version mismatch
  (`pendingRestart`/`pendingVersion`/`diskVersion`); the client keeps the note
  across re-mounts and suppresses the misleading "update available" state
  while a restart is pending.
- `docs(RELEASING)`: GitHub-facing text must be English/ASCII-only --
  `Invoke-RestMethod` string bodies mangled non-ASCII into `?` (Latin-1
  fallback); always send UTF-8 bytes + charset and read the body back.

## [0.2.9] -- 2026-10-12

### Added
- `feat`: family expanded to 12 apps -- WordCraft, DeckCraft, GridCraft,
  CADCraft, SoundCraft (bins whitelist, CLI defaults, display labels, client
  card, auto-discovery, example config, docs).
- `feat`: capability catalog for all 12 family apps -- `apps/catalog.json`
  (subcommands / control ports / MCP / repos from official docs and local
  `--help`), `artcraft_apps` tool + `GET /artcraft/api/apps`, control channel
  extended to vectorcraft (7979) and lightcraft (7980) + port passthrough.

## [0.2.8] -- 2026-10-12

Note: 0.2.7 was planned during this cycle but never published (no tag) -- the
minor bump was reverted to patch-level increments; the number was reused for
this release.

### Added
- `feat!`: bridge semantics -- no `dataRoot`; callers decide paths (chat =
  conversation workspace, canvas = project dir); the plugins-page card shows
  the config directory instead. (Breaking API change, shipped as a patch per
  the versioning rule.)
- `feat(update)`: registry fallback chain (npmjs -> npmmirror) for update
  checks and tarball downloads -- unblocks machines without a proxy.
- `feat`: first-run auto-discovery of family CLI installs (bootstrap config)
  + `POST /artcraft/api/discover` + `artcraft_discover` tool.
- `feat`: the refresh button doubles as family-install discovery (creates /
  repairs the config); `/discover` auto-corrects stale paths.
- `feat`: built-in expert recipes -- 8 professional workflows with
  principles/steps/checks + the `artcraft_recipes` tool.

### Changed
- `ci`: publish via GitHub Release (OIDC) -- the maintainer pushes, no direct
  pushes from automation.
- `docs(RELEASING)`: forbid "Frankenstein patches" -- installed copies must
  come from npm only.

## [0.2.6] -- 2026-10-11

### Added
- `feat(update)`: deterministic tarball updater v2 (sha512 from
  `dist.integrity` + atomic swap, bypasses the pnpm age-gate); config now
  persists at `~/.dsh/artcraft.config.json`.

### Fixed
- `ci(guard)`: tolerate push-order races -- the main-ancestor check retries 3x
  before failing.

## [0.2.5] -- 2026-10-10

### Added
- `feat(update)`: npm-mode self-update pins the official registry; docs cover
  the install-mode switch to npm.

### Fixed
- `fix(tools)`: `output` declaration `{ schema, render }` -- matches the host
  requirement; verified through the poster/video integration session.

### Changed
- `ci`: new guard -- `package.json` version must match the release tag.
- `docs(RELEASING)`: record version/tag mismatch and update-semantics lessons.
- `fix(release)`: bump `package.json` 0.2.4 -> 0.2.5 (the version guard
  correctly intercepted the missing bump).

## [0.2.4] -- 2026-10-10

### Added
- `feat(ui)`: status card on the plugins page via the `plugins.bundle.config`
  keyed slot; 7-family bins; EffectCraft path resolution.
- `chore`: release governance -- dev/main branching, main-tag guard,
  RELEASING.md rules.

### Fixed
- `fix(release)`: bump `package.json` 0.2.3 -> 0.2.4 (tag/version mismatch
  had broken publishing).

## [0.2.3] -- 2026-10-10

### Fixed
- `fix`: strip the UTF-8 BOM from `package.json` (the DSH loader's
  `JSON.parse` rejects BOMs; the package loaded as broken).

## [0.2.2] -- 2026-10-10

### Fixed
- `fix(tools)`: declare the `output` schema (the registry requires
  `{ schema, render?, presentationMeta? }`).

## [0.2.1] -- 2026-10-10

### Changed
- `feat(ui)`: move status/update into the Plugins page detail card; the
  sidebar panel is dropped (the bridge does not belong in the main panel).

## [0.2.0] -- 2026-10-10

### Added
- `feat`: self-update (check/apply) + a sidebar panel with toolchain status.
- `ci`: npm Trusted Publishing workflow (OIDC, release-triggered).

## [0.1.1] -- 2026-10-10

### Added
- `feat`: initial plugin -- PhotoCraft / FilmCraft / EffectCraft automation
  via headless CLIs and JSON control channels (as `@local/artcraft 0.1.1`).
- `docs`: bilingual product README (English-first + zh-CN), npm metadata.
- `docs(license)`: Apache-2.0 for the plugin; ArtCraft apps are fair-source
  (verbatim notice in NOTICE.md).
- `chore!`: rename to `@ninkch/dsh-artcraft` for npm + profile registration.
