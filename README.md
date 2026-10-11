<div align="center">

# ArtCraft Bridge

**Drive the open-source ArtCraft studio apps — PhotoCraft, FilmCraft, EffectCraft — from DeepSeek Harness, in chat or from your own UI.**

[English](README.md) | [简体中文](README.zh-CN.md)

`@ninkch/dsh-artcraft` · a [DeepSeek Harness](https://github.com/deepseek-ai) plugin · Apache-2.0

</div>

---

## Why this exists

[ArtCraft](https://getartcraft.com/apps) is a family of free, fair-source reinventions of Adobe's
studio tools, written from scratch in pure Rust: **PhotoCraft** (Photoshop), **FilmCraft**
(Premiere Pro), **EffectCraft** (After Effects) and more. They share one superpower that most
desktop apps don't have: **every menu item, slider and dialog is a command**, and the exact same
commands can be driven from a headless CLI, a JSON control channel, or an MCP server. The apps
were built for agents from day one.

This plugin brings that surface into DeepSeek Harness, so an AI agent can *operate* the apps —
not just talk about them:

- **In chat** — four agent tools let any Harness session check the toolchain, run CLI commands,
  send control-channel commands to a running app, and do bridged file operations.
- **In the browser** — a same-origin HTTP API (`/artcraft/api/*`) that any Harness web UI can call,
  no CORS, no keys. It was built for [无限画布 / infinite-canvas](../dsh-infinite_canvas/README.md),
  a node-based AI short-drama storyboard canvas, but any front end can use it.
- **Paths belong to the caller** — this plugin is a bridge and owns no data directory. Files read
  or written go wherever the caller points: chat invocations default to the current conversation
  workspace (or any path named in the prompt); the canvas writes under its own project folder.

A typical AI short-drama loop looks like this: generate storyboard frames with a model →
batch color-grade and sharpen them in PhotoCraft → render an animated title in EffectCraft →
assemble the final cut in FilmCraft with grading, mixing and burned-in subtitles → export H.264.
Every step after "generate" runs through this plugin, headless.

## How it fits together

```
┌──────────────── DeepSeek Harness web UI (browser) ────────────────┐
│   e.g. infinite-canvas: ① upload assets  ② start jobs  ③ fetch   │
└─────────────────────────────┬─────────────────────────────────────┘
                              ▼  same-origin fetch, no CORS
┌──────────────── DSH Host · @ninkch/dsh-artcraft ────────────────┐
│   HTTP routes /artcraft/api/*   +   agent tools artcraft_*        │
│        → child processes (the CLIs)  →  TCP control channel       │
└──────┬───────────────────────┬───────────────────────┬───────────┘
       ▼                       ▼                       ▼
  photocraft-cli          filmcraft-cli          effectcraft-cli
  batch grading, PSD      EDL/XML in-out,        .ecproj (JSON) render,
  headless edits          cut · grade · mix      Lottie export
       └───────────────────────┴───────────────────────┘
                               ▼
              caller-decided locations (chat → conversation
              workspace · canvas → its project folder)
```

Everything runs locally. No cloud round-trips, no accounts, no telemetry.

## Requirements

- **DeepSeek Harness** (desktop), any platform the Harness supports.
- **ArtCraft apps** — grab what you need from [getartcraft.com](https://getartcraft.com/apps)
  or the [storytold GitHub releases](https://github.com/storytold). The portable/installer builds
  ship the CLI binaries on Windows and Linux (`photocraft-cli.exe` …); macOS ships them as a
  separate notarized zip. Versions tested: PhotoCraft 0.6, FilmCraft 0.5, EffectCraft (early).
- Nothing else. No Python, no FFmpeg — the ArtCraft apps bring their own codecs.

## Setup

**1. Get the plugin onto disk** (this repository). Any folder works; keeping it inside the Harness
workspace next to your other local plugins is the convention.

**2. Register it with your Harness profile.** A Harness profile is a pnpm package at
`C:\Users\<you>\.dsh\profiles\<profile>\` (desktop profile by default). Two edits:

```jsonc
// package.json in the profile
{
  "dependencies": {
    // ...existing deps...
    "@ninkch/dsh-artcraft": "^0.1.1",                                    // ← from npm
    // or, for local development, a link into this repository:
    // "@ninkch/dsh-artcraft": "link:D:/code/deepseek-plugin/dsh-artcraft"
  },
  "dsh": { "profile": { "bundles": [
    // ...existing bundles...
    "@ninkch/dsh-artcraft"                                               // ← add the name
  ] } }
}
```

Then link and restart the Harness once (Host-side code loads at startup):

```sh
pnpm install --dir C:/Users/<you>/.dsh/profiles/desktop
```

> If your Harness build ships a plugin manager UI that installs from a folder, that works too —
> it ends up writing exactly the two lines above.

**3. Configure** `artcraft.config.json` (copy from
`artcraft.config.json.example`). Recommended location: `C:\Users\<you>\.dsh\artcraft.config.json`
(persists across plugin updates); placing it next to `index.js` also works (legacy). The file is
re-read on every request — no restart needed for path changes:

```jsonc
{
  "bins": {
    // three accepted forms: a directory (the <name>-cli binary is appended),
    // a full path to the executable, or a bare name looked up on PATH
    "photocraft":  "C:/craft/photocraft-0.6.0-windows-x64-portable",
    "filmcraft":   "C:/craft/filmcraft-0.5.0-windows-x64-portable",
    "effectcraft": "C:/Program Files/EffectCraft"
  },
  "control": { "filmcraft": 9876, "effectcraft": 9877 }
}
```

**4. Verify.** In any Harness chat, ask your agent to run `artcraft_status`. Green lights across
`bins.*.found` and you're done.

## Driving it from chat

The plugin registers four tools. The agent composes them, so plain language works:

> *"Color-grade every PNG in `demo/media` with a soft S-curve and smart sharpening at 80, put the
> results in `demo/out/graded`."*

Behind that sentence the agent will typically do:

```
artcraft_cli  { bin:"photocraft", args:["batch","--actions","demo/craft/grade.json",
                                        "--in","demo/media","--out","demo/out/graded"] }
```

| Tool | What it does |
|---|---|
| `artcraft_status` | Toolchain health check: which CLIs resolved, config location, control ports, running jobs |
| `artcraft_cli` | Run any CLI subcommand synchronously (`photocraft-cli run/batch`, `filmcraft-cli commands`, …) |
| `artcraft_control` | One command over the JSON control channel of a *running* FilmCraft / EffectCraft |
| `artcraft_fs` | Bridged file ops — list / stat / read / write / mkdir at caller-decided absolute paths |

## Driving it from the browser

Same-origin HTTP, JSON in and out. The workhorse pattern is the **job lifecycle** — start, poll,
fetch — which keeps long renders off the request cycle:

```
POST /artcraft/api/job      { "bin":"effectcraft",
                              "args":["render","--comp","Main",
                                      "--out","demo/out/intro.mp4","demo/craft/intro.ecproj"],
                              "outputs":["demo/out/intro.mp4"] }
                         →  { "id":"7f2c…" }

GET  /artcraft/api/job?id=7f2c…&tail=30
                         →  { "status":"running|done|failed|timeout",
                              "stdout":"…last lines…", "stderr":"…",
                              "outputs":[{"rel":"demo/out/intro.mp4","exists":true,"size":812345}] }

GET  /artcraft/api/file?rel=demo/out/intro.mp4        → raw bytes (streamed)
POST /artcraft/api/job/cancel  { "id":"7f2c…" }
```

Full route list:

| Route | Purpose |
|---|---|
| `GET /artcraft/api/status` | Toolchain health (same payload as `artcraft_status`) |
| `POST /artcraft/api/fs?action=write&path=…` | Write a file — absolute `path`, raw body (Blob upload) or JSON `{base, rel, text\|base64}` |
| `GET /artcraft/api/fs?op=list\|stat\|readtext&path=…` | Read directories, metadata, small text files |
| `GET /artcraft/api/file?path=…` | Download a file — streamed, up to 2 GB |
| `POST /artcraft/api/job` · `GET ?id=…` · `POST /artcraft/api/job/cancel` | Job lifecycle with output statting and tail logs |
| `POST /artcraft/api/control` | Synchronous control-channel call |

Uploads are capped at 320 MB per request (Blob direct, no base64 needed for the raw path);
downloads stream up to 2 GB. All path arguments are **absolute** (or `base` absolute directory +
relative `rel`) — the caller decides where files live: chat calls point at the conversation
workspace, the canvas points at its project folder.

## The control channel: drive a running app

CLI runs are headless and one-shot. When you'd rather watch and fine-tune — grading a scene,
scrubbing a cut — start the desktop app with its control channel and speak to it live:

```sh
filmcraft --control 9876      # or set FILMCRAFT_CONTROL_PORT; loopback only
```

```jsonc
POST /artcraft/api/control
{ "app": "filmcraft", "method": "engine.execute",
  "params": { "command": "timeline.place",
              "params": { "item": 1, "track": "V1", "seconds": 0, "duration": 1270080000000 } } }

// a Lumetri curve on clip 87 …
{ "command": "effects.setParam",
  "params": { "clip": 87, "effect": "lumetri", "param": "curve_luma",
              "value": [[0,0],[0.25,0.21],[0.75,0.82],[1,1]] } }

// …and a look at what the app shows
{ "method": "ui.screenshot", "params": { "path": "frame.png" } }
```

Time accepts `seconds`, `frame` or `timecode` (internally FilmCraft counts ticks at
254,016,000,000/s). `filmcraft-cli commands` lists the 650+ engine commands; the protocol is
documented in [filmcraft/docs/control-protocol.md](https://github.com/storytold/filmcraft/blob/main/docs/control-protocol.md).
EffectCraft listens the same way on its own port (default 9877).

> PhotoCraft's control channel is an authenticated variant and is deliberately **not** proxied
> here — for PhotoCraft the headless CLI covers everything this plugin needs.

## Working with 无限画布 (infinite-canvas)

The two plugins are decoupled — they meet only on HTTP and the disk layout. The canvas:

1. syncs its generated assets (IndexedDB blobs) into `<project>/media/`,
2. starts PhotoCraft/FilmCraft/EffectCraft jobs with per-project files in `<project>/craft/`,
3. fetches finished renders from `<project>/out/` back into its asset library.

If you're building a similar front end, mirror that contract: project slug as folder name, keep
the `media · craft · out` triad, and everything composes.

## Recipes

**Uniform grading across storyboard frames** — `demo/craft/grade.json`:

```json
{ "actions": [
  { "cmd": "layer.newAdjustmentLayer.curves", "params": { "points": [[0,0],[64,48],[192,212],[255,255]] } },
  { "cmd": "filter.sharpen.smartSharpen",     "params": { "amount": 80 } }
] }
```

```sh
photocraft-cli batch --actions demo/craft/grade.json --in demo/media --out demo/out/graded
```

**Final cut without a browser recorder** — the canvas exports its storyboard as a
Final Cut Pro 7 XML (`xmeml`) or CMX3600 EDL into `demo/craft/timeline.xml`; FilmCraft imports
it, links media from `demo/media/`, and exports H.264 (hardware NVENC on Windows), ProRes, DNxHR
with EBU R128 loudness normalization and burned-in captions. Interchange is where FilmCraft's
automation really pays off — EDL/XML are plain text your pipeline already knows how to write.

**Animated titles as code** — EffectCraft projects (`.ecproj`) are versioned JSON, so a model can
write one outright or fill a template. Render to MP4/ProRes — ProRes 4444 with alpha drops
straight onto a FilmCraft track as a graphics layer — or export **Lottie** and play it inline in
a web UI.

## Troubleshooting

- **`bins.*.found: false`** — check the path forms above; the CLI must exist next to the app
  (or be on `PATH`). Changes to `artcraft.config.json` apply on the next request.
- **404 on `/artcraft/api/*`** — the bundle isn't registered with the profile (see Setup) or the
  Harness hasn't been restarted since registration. `artcraft_status` from chat is the quick probe.
- **Control channel refused** — the app must be running with `--control <port>`; the channel is
  loopback-only and unauthenticated, so nothing else will answer on that port.
- **A job hangs** — `GET /artcraft/api/job` lists everything with logs; cancel by id. Plugin
  reloads kill all child jobs by design.
- **"需要绝对路径" errors** — pass absolute paths (chat: the conversation workspace; canvas: the
  project folder), or a `base` absolute directory + relative `rel`.

## Security & trust model

The HTTP surface has **no authentication** and rides on the Harness web server, which listens on
loopback only — treat the port as trusted-local and don't expose it to a network; put a reverse
proxy with auth in front if you must. Child processes are locked to the seven allow-listed
family CLIs; the control channel only ever dials `127.0.0.1`.

## Publishing

This plugin is published to npm as **`@ninkch/dsh-artcraft`** (scoped packages publish with
`npm publish --access public`). To consume it, add the package name to your Harness profile's
`dependencies` and `dsh.profile.bundles` (see Setup) — `pnpm install` in the profile does the
rest. For local development, swap the dependency for a `"link:<path-to-this-repo>"` instead.
The three places that must agree on the package name are the profile `package.json`
(dependency + bundles) and this repo's `cordis.patch.yml`.

GitHub: this repository is self-contained; `README.md` is English-first with a
[简体中文](README.zh-CN.md) companion.

**Releases run through npm Trusted Publishing** (GitHub Actions OIDC — no tokens, no OTP):
publishing is triggered by **creating a GitHub Release** (tag `vX.Y.Z` matching `package.json`);
`.github/workflows/publish.yml` verifies the release commit is on `main` and the versions align,
then publishes. Release flow and rules live in [RELEASING.md](RELEASING.md) — in short: changes
land on `dev`, get tested there, and are only merged to `main` and released with the maintainer's
explicit approval.

## License

**This plugin (`@ninkch/dsh-artcraft`): Apache-2.0** — see [LICENSE](LICENSE). It ships none of the
ArtCraft apps' code — it only drives their public automation surfaces (headless CLI + JSON
control channel).

**The ArtCraft apps themselves** are *not* OSI open source: they are distributed under the
**ArtCraft License (WIP)**, a "fair source" license ([verbatim text](NOTICE.md)). The short
version for anyone building on them:

- ✅ free to use; back up, copy, modify and compile for private purposes
- ✅ **every piece of media you create with the apps is yours** — your rendered episodes are
  commercial assets, full stop
- ❌ no selling the apps as your own software, no competing products built from their code
- ❌ no stripping community/donation links from a fork; no using the ArtCraft name, logo or
  mascots to promote a business without permission
- 🤝 the team's public promise: if the business ever ends, the software transitions to an
  OSI-approved open-source license

Practical reading for an AI short-drama studio: run the apps locally, leave their community
links alone, and sell your films — not the apps.
