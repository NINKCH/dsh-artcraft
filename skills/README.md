# ArtCraft craft skill pack (bundled with @ninkch/dsh-artcraft)

Twelve skills ship inside this plugin. They are registered through the plugin's own skill
provider (`@ninkch/dsh-artcraft/skills`) and load on demand — you never install them separately.

Skill bodies are written in Chinese (the maintainer's language and the language of the rest of the
plugin's knowledge base). Models read both languages natively; this index gives the English summary
so you know which skill to open.

| Skill | What it teaches | Open it when |
|---|---|---|
| `artcraft-ops` | Which family member to use, the three execution channels (headless CLI / control channel / HTTP job), self-discovery via `commands` · `describe` · `exec app.capabilities`, probe→change→verify discipline, batching, long jobs, failure playbook | Any task that drives the suite; read first |
| `artcraft-shot-language` | Shot language: shot sizes, camera positions, movement, composition, lighting, 180° axis, coverage and storyboards, each with "when to use / when not to", mapped to family commands | Designing shots, storyboards, framing |
| `artcraft-edit-rhythm` | Editing rhythm: shot duration vs emotion curve, five reliable cut points, match cuts, J/L cuts, jump cuts, montage, transition dictionary ("the cut is the default"), beat cutting, auto rough-cut via `transcript.*` | Cutting, pacing, transitions |
| `artcraft-color-light` | Grade order (unify → correct → stylise), primary/secondary, skin-tone priority, cross-shot matching (`lumetri.applyMatch`), scopes as objective evidence, Log/HDR→delivery, look recipes per genre | Grading, matching shots, look development |
| `artcraft-sound-design` | Dialogue-first audio: cleanup chain, Essential Sound types, loudness targets (−14/−23/−16 LUFS), true peak, music in/out points, ducking, mixing, stems | Mixing, loudness, dialogue repair |
| `artcraft-motion-vfx` | Which layer to work in (clip effect vs composite), 307 effects by category with usage, keyframes and easing, graphics templates, tracking/stabilising/keying/roto order, 3D cameras, render-cost control | Motion design, compositing, VFX |
| `artcraft-delivery-qc` | Platform specs, export presets, interchange formats (EDL/XML/FCPXML/OTIO/AAF/OMF), objective QC (scopes, audio health, a11y, validation), subjective review, naming/versioning, delivery checklist | Before handing anything over |
| `artcraft-style-bible` | Consistency locks: the 7-step look bible, which family mechanism locks which asset (presets, .fcgt templates, symbols, variables, themes), cross-episode checklist, anti-patterns | Starting a project or series; keeping 60 episodes coherent |
| `artcraft-film-study` | Shot-by-shot film study: 8-step method, shot-table schema, emotion-score criteria, traceable conclusions, report template | Analysing an existing film (review/research) |
| `artcraft-batch-pipeline` | Batch and pipeline work: headless batch formats, HTTP job queue, in-app queues, proxies and cache, media health/relink, incremental and resumable runs, retries, QC hook-up | Dozens/hundreds of files, a whole season |
| `artcraft-multicam` | Multicam: build sources, align, grid browsing, `selectCamera*` vs `cutToCamera*`, live switching, audio-follows-video, cross-camera matching, switching rhythm | Interviews, concerts, live cuts |
| `artcraft-director-lens` | 20 director lenses (Spielberg…Wong Kar-wai, Zhang Yimou, Bi Gan…): each maps a director's working method to ArtCraft parameters — ASL targets, transition bias, light ratio, palette→mixer channels, sound rules, QC hooks. Adapted from DirectorSKILL (MIT) | "Cut/grade this like <director>", style bible references a lens |

## Reference files (loaded with a skill)

| File | Contents |
|---|---|
| `artcraft-ops/references/command-families.md` | Measured command families of all 13 apps |
| `artcraft-color-light/references/develop-controls.md` | All 122 LightCraft develop controls by section |
| `artcraft-color-light/references/lumetri-and-scopes.md` | Lumetri/LUT/scopes interface (verified) |
| `artcraft-motion-vfx/references/effect-catalogue.md` | All 307 EffectCraft effects with `ec.*` ids |
| `artcraft-motion-vfx/references/scene-to-effect.md` | Intent → effect-id lookup |
| `artcraft-sound-design/references/essential-sound.md` | Essential Sound commands and verified parameter keys |
| `artcraft-edit-rhythm/references/transitions.md` | Transition interface + selection decision table |
| `artcraft-shot-language/references/shot-vocabulary.md` | Shot/angle/movement/composition/lighting glossary |
| `artcraft-delivery-qc/references/platform-specs.md` | Platform, codec, subtitle, print and QC specs |

## Want them outside the plugin?

Any `SKILL.md`-style pack can also be installed as an ordinary filesystem skill: drop the folder
into `<dshHome>/skills` (user level), `<project>/.dsh/skills`, or `<project>/.agents/skills`.
Filesystem skills of the same name take precedence over the bundled ones, so you can fork and
override any of these without touching the plugin.
