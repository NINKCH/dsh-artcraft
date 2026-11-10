# 新成员命令参考（SolidCraft · MaterialCraft · TextureCraft · Craft Anything）

> 本文是 `artcraft-ops` 的参考文件：**命令 id 全部从本机 CLI 直采**（`commands --json` / `capabilities`），
> 参数契约与坑来自 headless 实测（不是从文档抄的）。族级统计见 `command-families.md`。
> 采集版本：SolidCraft 0.30.1 · MaterialCraft 0.3.0 · TextureCraft 0.5.0 · Craft Anything 0.6.0（2026-11）。
> 版本升级后重采：`node scripts/harvest-commands.mjs --out harvest.json --diff <上次>.json`。

> **headless 通用规则（先看这条再抄例子）**
> `run <input> <id> '<json>'` 默认**不落盘**——要连续改同一个工程，每一步都加 `-o <file>`；
> 多步流程用 `batch script.json`（`{"open": in, "steps": [{id, params}...], "save": out}`），比 shell 里串 `-o` 稳。

## 一、SolidCraft —— 参数化三维 CAD（570 条）

定位：**特征树 + 参数驱动的实体建模**，和 CADCraft（2D 制图）互补，不是替代。文件：设计 `.sc`、交换 `step/stp`、导出 stl/3mf/obj。特征是时间线对象，改参数要重算时间线。

- 快探：`solidcraft-cli eval <design.sc|part.step>` 直接吐大 JSON（实体/面积/包围盒/时间线摘要）——**QC 探针用的就是它**，不需要 `--json-out`。
- 执行：`solidcraft-cli run <script.json|design.sc>`（脚本 = `[{id, params}...]`，见下方实测链路）；`--save` 存设计、`--results` 打每步结果、`--param-check strict` 按契约校验参数。
- 自省：`commands [--json]`（每条带 `params` 契约字符串与 `disabled_reason`）、脚本里跑 `engine.describe <id>` 拿 **JSON Schema**（`input.$defs` 里连 `LengthExpr` 都定义了）。
- 本例实测的契约样本：`solid.box → "length, width, height: expr; corner?: [x,y,z] | center?: [x,y,z] …"`、`file.export_step → "path; bodies?: [names] → {path, bytes, format}"`。

### SolidCraft headless 实测链路（可直接抄）
```bash
# build.json = [{"id":"file.new"},
#               {"id":"solid.box","params":{"length":40,"width":30,"height":20}},
#               {"id":"file.export_step","params":{"path":"box.step"}}]
solidcraft-cli run build.json --save built.sc --results
#   → [{"name":"Untitled"},{"feature":1,"name":"Box1","created_bodies":["Body1"],"ms":1.19},
#      {"path":"box.step","bytes":4980,"format":"Step"}]
solidcraft-cli eval built.sc                 # 复核实体/包围盒（QC 同一口径）
solidcraft-cli render built.sc --out shot.png --timeout 120   # 出效果图（默认参数最稳）
solidcraft-cli bench-agent --save demo.sc    # 造一个 100 步的样例设计，用来压测/冒烟
```

### SolidCraft 实测坑
- `solid.box` 的参数是 **`length` / `width` / `height`**；写 `width/depth/height` 会报「length must be a number or an expression」。拿不准就 `engine.describe`。
- **没有 `describe` 子命令**（那是 `engine.describe` 命令），直接 `solidcraft-cli describe x` 只会打印 usage。
- `render --progressive --samples N` 在本机构建上静默失败（无 stderr、无产物）；默认 `render <design> --out x.png --timeout 120` 稳定出图。
- `snapshot` 在本机 headless 下同样静默失败（疑似需要 GUI/显示）；要静帧就用 `render`。
- `script <design>` 对含组件的设计报 `not supported yet: a command script of a design with components (#886)`——导出可重放脚本只适用于纯零件设计。


| 族 | 条数 | 命令 id |
|---|---|---|
| `sketch` | 126 | `sketch.create` · `sketch.edit` · `sketch.finish` · `sketch.cancel` · `sketch.line` · `sketch.draw.dimensioned` · `sketch.rectangle.two_point` · `sketch.rectangle.three_point` · `sketch.rectangle.rounded` · `sketch.rectangle.center` · `sketch.circle.center` · `sketch.circle.two_point` · `sketch.circle.three_point` · `sketch.arc.three_point` · `sketch.arc.center_point` · `sketch.polygon.inscribed` · `sketch.polygon.circumscribed` · `sketch.polygon.edge` · `sketch.slot.center_to_center` · `sketch.slot.overall` · `sketch.point` · `sketch.dimension` · `sketch.constraint.horizontal_vertical` · `sketch.constraint.coincident` · `sketch.constraint.tangent` · `sketch.constraint.equal` · `sketch.constraint.parallel` · `sketch.constraint.perpendicular` · `sketch.constraint.fix` · `sketch.constraint.midpoint` · `sketch.constraint.concentric` · `sketch.constraint.collinear` · `sketch.constraint.symmetry` · `sketch.construction` · `sketch.delete` · `sketch.move_point` · `sketch.drag` · `sketch.drag_end` · `sketch.dimension_text` · `sketch.options` · `sketch.chain` · `sketch.solve` · `sketch.line.midpoint` · `sketch.arc.tangent` · `sketch.circle.two_tangent` · `sketch.circle.three_tangent` · `sketch.slot.center_point` · `sketch.slot.arc_three_point` · `sketch.slot.arc_center` · `sketch.ellipse` · `sketch.spline.fit_point` · `sketch.spline.control_point` · `sketch.spline.control_point_5` · `sketch.spline.insert_point` · `sketch.spline.remove_point` · `sketch.spline.reverse` · `sketch.conic` · `sketch.blend_curve` · `sketch.centerline` · `sketch.infinite` · `sketch.text` · `sketch.edit_text` · `sketch.construction_line` · `sketch.construction_line.horizontal` · `sketch.construction_line.vertical` · `sketch.construction_line.angle` · `sketch.construction_line.parallel` · `sketch.construction_line.perpendicular` · `sketch.construction_line.tangent_external` · `sketch.construction_line.tangent_at` · `sketch.construction_line.tangent_two` · `sketch.construction_line.bisector` · `sketch.equation_curve` · `sketch.equation_curve.edit` · `sketch.constraint.curvature` · `sketch.constraint.polygon` · `sketch.auto_constrain` · `sketch.auto_constrain_from_datum` · `sketch.finish_auto_constrain` · `sketch.constrainer` · `sketch.toggle_driven` · `sketch.toggle_diameter` · `sketch.glyphs` · `sketch.snap` · `sketch.insert_dxf` · `sketch.insert_svg` · `sketch.drawing_bounds` · `sketch.export_dxf` · `sketch.loose_ends` · `sketch.loose_ends.tie` · `sketch.line3d` · `sketch.spline3d` · `sketch.arc3d` · `sketch.point3d` · `sketch.move3d` · `sketch.fillet` · `sketch.chamfer.equal_distance` · `sketch.chamfer.distance_angle` · `sketch.chamfer.two_distance` · `sketch.offset` · `sketch.offset.break` · `sketch.trim` · `sketch.trim.path` · `sketch.extend` · `sketch.break` · `sketch.scale` · `sketch.transform` · `sketch.move` · `sketch.mirror` · `sketch.pattern.circular` · `sketch.pattern.rectangular` · `sketch.project` · `sketch.intersect` · `sketch.include_3d` · `sketch.project_to_surface` · `sketch.intersection_curve` · `sketch.spun_profile` · `sketch.isoparametric_curve` · `sketch.fit_curves_to_section` · `sketch.break_link` · `sketch.auto_project` · `sketch.redefine` · `sketch.copy` · `sketch.cut` · `sketch.paste` · `sketch.inspect` |
| `render` | 60 | `render.environment.set` · `render.lights.set` · `render.lights.add` · `render.lights.duplicate` · `render.lights.remove` · `render.lights.list` · `render.aging.describe` · `render.effects.describe` · `render.optics.bind` · `render.optics.unbind` · `render.result.regrade` · `render.camera.set` · `render.camera.get` · `render.camera.fit` · `render.preset.resolve` · `render.preset.apply` · `render.quality.prepare` · `render.shot.duplicate` · `render.shot.rename` · `render.shot.remove` · `render.library.preview` · `render.library.physical.prepare` · `render.stage.ground` · `render.stage.backdrop` · `render.stage.clear` · `render.library.surface.bind` · `render.library.surface.unbind` · `render.result.pin` · `render.library.targets` · `render.library.list` · `render.library.describe` · `render.library.appearance.apply` · `render.library.environment.apply` · `render.library.surface.prepare` · `render.library.studio.prepare` · `render.library.studio.apply` · `render.hdr.inspect` · `render.settings.capture_hdr` · `render.preflight` · `render.start` · `render.status` · `render.cancel` · `render.result.copy` · `render.export` · `render.backends` · `render.settings.get` · `render.settings.set` · `render.scene` · `render.settings.apply` · `render.preflight.copy` · `render.result.select` · `render.result.discard` · `render.output.size` · `render.result.view` · `render.result.close` · `render.lights.solo` · `render.lights.mute` · `render.compare` · `render.compare.divider` · `render.batch` |
| `view` | 40 | `view.save` · `view.rename` · `view.delete` · `view.list` · `view.apply` · `view.status_details` · `view.status_items` · `view.fit` · `view.home` · `view.tool` · `view.spin` · `view.visual_style` · `view.grid` · `view.ground_shadow` · `view.navigation_bar` · `view.render_focus` · `view.render_frame` · `view.render_browser` · `view.render_inspector` · `view.render_select` · `view.render_stage` · `view.shots_strip` · `view.render_dock` · `view.layout` · `view.history_layout` · `view.graphics_preset` · `view.ambient_occlusion` · `view.perspective` · `view.angle_readout` · `view.navigate` · `view.normal_to` · `view.front` · `view.back` · `view.left` · `view.right` · `view.top` · `view.bottom` · `view.isometric` · `view.next_tab` · `view.previous_tab` |
| `solid` | 36 | `solid.extrude` · `solid.revolve` · `solid.sweep` · `solid.loft` · `solid.box` · `solid.cylinder` · `solid.sphere` · `solid.torus` · `solid.cone` · `solid.fillet` · `solid.chamfer` · `solid.combine` · `solid.pattern.rectangular` · `solid.pattern.circular` · `solid.pattern.path` · `solid.mirror` · `solid.hole` · `solid.pipe` · `solid.bounding_solid` · `solid.scale` · `solid.offset_face` · `solid.thread` · `solid.shell` · `solid.draft` · `solid.split_face` · `solid.split_body` · `solid.press_pull` · `solid.move` · `solid.boundary_fill` · `solid.coil` · `solid.rib` · `solid.web` · `solid.emboss` · `solid.replace_face` · `solid.align` · `solid.remove` |
| `component` | 32 | `component.cycle_color` · `component.hide_history` · `component.show_history` · `component.create` · `component.from_bodies` · `component.activate` · `component.edit_in_place` · `component.finish_edit` · `component.list` · `component.properties` · `component.rename` · `component.delete` · `component.unlock` · `component.move_bodies` · `component.copy_bodies` · `component.paste_from_design` · `component.move_sketches` · `component.move_sketches.to_parts` · `component.move_features` · `component.paste_new` · `component.capture_position` · `component.revert_position` · `component.insert_design` · `component.update_links` · `component.relink` · `component.break_link` · `component.extract` · `component.copies` · `component.replace_with_link` · `component.links` · `component.metadata` · `component.metadata.set` |
| `timeline` | 22 | `timeline.compute_all` · `timeline.play` · `timeline.delete` · `timeline.rename` · `timeline.group` · `timeline.ungroup` · `timeline.rename_group` · `timeline.move_to_group` · `timeline.move_many` · `timeline.rollback` · `timeline.roll_to` · `timeline.reorder` · `timeline.reorder_many` · `timeline.redefine` · `timeline.dependents` · `timeline.suppress` · `timeline.edit` · `timeline.inspect` · `timeline.copy` · `timeline.paste` · `timeline.add` · `timeline.export_script` |
| `construct` | 20 | `construct.plane.offset` · `construct.plane.at_angle` · `construct.axis.through_cylinder` · `construct.axis.normal_to_face` · `construct.axis.two_planes` · `construct.axis.two_points` · `construct.axis.edge` · `construct.point.vertex` · `construct.point.two_edges` · `construct.point.three_planes` · `construct.point.center` · `construct.point.edge_plane` · `construct.point.along_path` · `construct.plane.midplane` · `construct.plane.two_edges` · `construct.plane.axis_point` · `construct.plane.three_points` · `construct.plane.tangent` · `construct.plane.along_path` · `construct.plane.perpendicular` |
| `inspect` | 19 | `inspect.curvature_comb` · `inspect.minimum_radius` · `inspect.isocurve` · `inspect.center_of_mass` · `inspect.zebra` · `inspect.draft` · `inspect.environment_map` · `inspect.accessibility` · `inspect.curvature_map` · `inspect.continuity` · `inspect.interference` · `inspect.clearance` · `inspect.parameter_sweep` · `inspect.colored_components` · `inspect.measure` · `inspect.compare` · `inspect.compare_picture` · `inspect.silhouette` · `inspect.section` |
| `surface` | 19 | `surface.boundary` · `surface.patch` · `surface.stitch` · `surface.thicken` · `surface.extend` · `surface.trim` · `surface.extrude` · `surface.revolve` · `surface.sweep` · `surface.loft` · `surface.offset` · `surface.ruled` · `surface.blend` · `surface.untrim` · `surface.unstitch` · `surface.reverse_normal` · `surface.fair` · `surface.fillet` · `surface.match` |
| `joint` | 18 | `joint.origin` · `joint.create` · `joint.as_built` · `joint.rigid_group` · `joint.drive` · `joint.reach` · `joint.motion_link` · `joint.gear` · `joint.rack_pinion` · `joint.screw` · `joint.cam` · `joint.limits` · `joint.edit` · `joint.delete` · `joint.list` · `joint.inspect` · `joint.solve` · `joint.sweep` |
| `file` | 16 | `file.new` · `file.insert_step` · `file.insert_mesh` · `file.save` · `file.save_as` · `file.export` · `file.export_step` · `file.export_stl` · `file.export_3mf` · `file.export_obj` · `file.export_urdf` · `file.save_mesh` · `file.send_to_slicer` · `file.open_in_easyprint` · `file.slicers` · `file.export_view_dxf` |
| `parameters` | 13 | `parameters.change` · `parameters.list` · `parameters.add` · `parameters.rename` · `parameters.delete` · `parameters.favorite` · `parameters.move` · `parameters.comment` · `parameters.users` · `parameters.graph` · `parameters.export` · `parameters.import` · `parameters.complete` |
| `sheet` | 13 | `sheet.flange` · `sheet.path_flange` · `sheet.perforate` · `sheet.hem` · `sheet.fold` · `sheet.unfold` · `sheet.refold` · `sheet.convert` · `sheet.manage_rules` · `sheet.rules` · `sheet.flat_pattern` · `sheet.export_dxf` · `sheet.export_bend_table` |
| `motion` | 11 | `motion.study` · `motion.play` · `motion.export` · `motion.export_animation` · `motion.trace` · `motion.trace.keep` · `motion.trace.edit` · `motion.plot` · `motion.interference` · `motion.list` · `motion.delete` |
| `appearance` | 10 | `appearance.assign` · `appearance.copy` · `appearance.paste` · `appearance.favorite` · `appearance.chain` · `appearance.replace` · `appearance.library` · `appearance.list` · `appearance.paint` · `appearance.pick_up` |
| `browser` | 9 | `browser.reparent` · `browser.group` · `browser.ungroup` · `browser.rename_group` · `browser.move` · `browser.order` · `browser.visibility` · `browser.expand_all` · `browser.collapse_all` |
| `config` | 8 | `config.configure` · `config.table` · `config.column` · `config.row` · `config.activate` · `config.preview` · `config.rule` · `config.rules` |
| `material` | 8 | `material.assign` · `material.list` · `material.create` · `material.edit` · `material.inspect` · `material.delete` · `material.properties.validate` · `material.properties.directional` |
| `contact` | 7 | `contact.enable_sets` · `contact.enable_all` · `contact.disable_all` · `contact.create` · `contact.edit` · `contact.list` · `contact.check` |
| `occurrence` | 7 | `occurrence.properties` · `occurrence.copy` · `occurrence.move` · `occurrence.drag` · `occurrence.align` · `occurrence.ground` · `occurrence.reparent` |
| `plastic` | 7 | `plastic.boss` · `plastic.lip` · `plastic.snap_fit` · `plastic.rest` · `plastic.manage_rules` · `plastic.assign_rule` · `plastic.rules` |
| `settings` | 7 | `settings.profile.list` · `settings.profile.save` · `settings.profile.apply` · `settings.profile.rename` · `settings.profile.delete` · `settings.profile.export` · `settings.profile.import` |
| `canvas` | 6 | `canvas.insert` · `canvas.decal` · `canvas.edit` · `canvas.calibrate` · `canvas.delete` · `canvas.to_sketch` |
| `document` | 6 | `document.units` · `document.metadata` · `document.metadata.set` · `document.metadata.remove` · `document.inspect` · `document.revision` |
| `edit` | 5 | `edit.undo` · `edit.redo` · `edit.repeat` · `edit.checkpoint` · `edit.restore_checkpoint` |
| `diagnostics` | 4 | `diagnostics.crash_reports` · `diagnostics.crash_report` · `diagnostics.crash_reports.clear` · `diagnostics.crash_test` |
| `doc` | 4 | `doc.open` · `doc.recovery_list` · `doc.recover` · `doc.recovery_discard` |
| `explode` | 4 | `explode.create` · `explode.show` · `explode.list` · `explode.delete` |
| `frame` | 4 | `frame.member` · `frame.profile.list` · `frame.profile.properties` · `frame.profile.insert` |
| `parts` | 4 | `parts.library` · `parts.fastener` · `parts.insert` · `parts.resize` |
| `pointcloud` | 4 | `pointcloud.insert` · `pointcloud.edit` · `pointcloud.delete` · `pointcloud.list` |
| `select` | 4 | `select.set` · `select.filter` · `select.clear` · `select.same_look` |
| `library` | 3 | `library.inspect` · `library.export` · `library.apply` |
| `model` | 3 | `model.edges` · `model.faces` · `model.threads` |
| `assembly` | 2 | `assembly.bom` · `assembly.mass_properties` |
| `body` | 2 | `body.rename` · `body.print_face` |
| `engine` | 2 | `engine.commands` · `engine.describe` |
| `expr` | 1 | `expr.evaluate` |
| `face` | 1 | `face.delete` |
| `mesh` | 1 | `mesh.convert` |
| `selection` | 1 | `selection.delete` |
| `ui` | 1 | `ui.assistant` |

### SolidCraft 建模纪律
- **顺序固定**：`sketch.*` 画轮廓 → `solid.*` 成型（extrude/revolve/sweep/loft）→ `construct.*` 建基准 → `inspect.*` 验几何 → `file.export_step` 交付。
- 依赖选择上下文的命令（`solid.fillet`、`face.delete`、`selection.delete` 等）先用 `select.set` / `select.filter` 选定对象；失败先 `engine.describe <id>` 看它为什么被禁。
- 改尺寸走参数表：`parameters.list` → `parameters.change`，别直接改草图（下游特征会全红）。
- 装配体交付：`assembly.bom` 与 `assembly.mass_properties` 一起出。
- 可制造性：`sheet.manage_rules` / `plastic.manage_rules` 在出图前跑一遍。
- 运动验证：`motion.study` → `motion.play` → `motion.interference` 查干涉 → `motion.export_animation`。
- 与 FilmCraft/EffectCraft 衔接：`render.start` 出产品图、`render.export` 出序列，再进合成。

## 二、MaterialCraft —— 节点式材质设计（112 条命令 + 29 个节点）

定位：程序化材质包（`.sbs`），产出可移植材质 `.mcmat`。**它是"材质图"，不是"贴图"**——图里没有贴图文件，只有节点与输出通道。

| 族 | 条数 | 命令 id |
|---|---|---|
| `graph` | 61 | `graph.templates` · `graph.resource.add` · `graph.instance.reference` · `graph.instance.add` · `graph.node.info` · `graph.input.bind` · `graph.input.unbind` · `graph.function.edit` · `graph.pattern.edit` · `graph.open` · `graph.delete` · `graph.duplicate` · `graph.size` · `graph.seed` · `graph.format` · `graph.cook` · `graph.pin.add` · `graph.pin.delete` · `graph.exposed.add` · `graph.exposed.set` · `graph.exposed.delete` · `graph.preset.save` · `graph.preset.apply` · `graph.preset.delete` · `graph.select` · `graph.selectUpstream` · `graph.selectDownstream` · `graph.createFromSelection` · `graph.rename` · `graph.properties` · `graph.attributes` · `graph.align` · `graph.annotation.select` · `graph.frame.add` · `graph.frame.edit` · `graph.frame.delete` · `graph.frame.move` · `graph.function.set` · `graph.function.node.info` · `graph.function.variables` · `graph.context` · `graph.comment.add` · `graph.comment.edit` · `graph.comment.delete` · `graph.node.add` · `graph.node.move` · `graph.node.rename` · `graph.node.disable` · `graph.node.param` · `graph.node.reset` · `graph.node.base` · `graph.node.bind` · `graph.node.function` · `graph.node.edit` · `graph.pattern.set` · `graph.connect` · `graph.disconnect` · `graph.node.value_input` · `graph.wire.insertDot` · `graph.wire.delete` · `graph.wire.swap` |
| `edit` | 13 | `edit.copy` · `edit.cut` · `edit.paste` · `edit.duplicate` · `edit.pasteWithoutLinks` · `edit.duplicateWithoutLinks` · `edit.delete` · `edit.deleteRelink` · `edit.selectAll` · `edit.selectNone` · `edit.undo` · `edit.redo` · `edit.finish` |
| `file` | 13 | `file.new` · `file.newPackage` · `file.open` · `file.save` · `file.saveAs` · `file.export` · `file.importBitmap` · `file.importVector` · `file.reload` · `file.saveCopyAs` · `file.newAtomicSample` · `file.exportMaterial` · `file.sendToTextureCraft` |
| `view` | 8 | `view.2d` · `view.3d` · `view.3d.loadMesh` · `view.3d.reset` · `view.previewSize` · `view.3d.outputs` · `view.3d.assign` · `view.3d.clear` |
| `folder` | 5 | `folder.create` · `folder.rename` · `folder.remove` · `folder.properties` · `folder.attributes` |
| `explorer` | 3 | `explorer.move` · `explorer.copy` · `explorer.paste` |
| `library` | 3 | `library.functions` · `library.function.add` · `library.list` |
| `package` | 3 | `package.activate` · `package.close` · `package.closeAll` |
| `session` | 3 | `session.history` · `session.environment` · `session.inspect` |

### 节点库（`library.list`，29 个 def —— `graph.node.add` 的 `def` 只能取这里）
- **Atomic nodes**（24）：`bitmap` · `blend` · `blur` · `channels_shuffle` · `curve` · `directional_blur` · `directional_warp` · `distance` · `emboss` · `fx_map` · `gradient_dynamic` · `gradient_map` · `grayscale_conversion` · `hsl` · `levels` · `normal` · `pixel_processor` · `svg` · `sharpen` · `text` · `transformation` · `uniform` · `value_processor` · `warp`
- **Graph items**（5）：`input_color` · `input_grayscale` · `input_value` · `output` · `dot`

> 没有 `noise` 节点（实测报 `unknown node "noise"`）：噪声类走 `fx_map` / `gradient_dynamic` / `pixel_processor`。

### 参数契约（实测，写错一个键就报错）
| 命令 | params |
|---|---|
| `graph.node.add` | `{def, at?: [x,y], snapToGrid?, params?: {id: value}, connectFrom?: {node, port?}, label?}` —— **`def` 必填**，写 `type` 报 `def is required`；成功返回 `{id}` |
| `graph.connect` | `{from, fromPort?, to, toPort?, detach?: {to, toPort}}` —— 端口类型不兼容会报 `the target has no compatible input`（`output` 收 Any，所以 `connectFrom` 指向它通常能过） |
| `graph.node.param` | `{id?, param, value}`（数字 / `[x,y]` / `"#rrggbb"` / 枚举序号）；注册表里 `enabled:false`，需图上下文 |
| `graph.cook` | `{full?: bool}` 返回每节点耗时与错误 |
| `file.exportMaterial` | `{path, graph?, size?, values?: {input: value}, inputs?: {identifier: image-path}}` → `.mcmat` |
| `file.sendToTextureCraft` | `{graph?}` → 写进 `Documents/TextureCraft/library/<name>.mcmat`（headless 可用） |

### 实测坑
- `export <input> <dir>` **没有 `--full`**（`unknown option`）；`--full` 只属于 `cook`，`--hq` 只属于 `render`。`export` 实际产出 6 张 PNG：basecolor / normal / roughness / metallic / height / ambientocclusion。
- `render <input> <out.png> --hq` 稳定出 1024×768 PNG（材质缩略图、评审图）。
- `new pbr x.sbs`（8055 bytes）自带一张 `uniform` 节点（id 1）；要出材质必须再加 `output` 节点并接线，否则 `exportMaterial` 无通道可写。

## 三、TextureCraft —— 3D 纹理绘制与烘焙（175 条）

定位：把材质/笔刷画到网格上，烘焙成贴图集再导出。工程 `.tcraft`；网格 glb/gltf/fbx/dae/usd/usdz/abc/obj/ply/stl。

| 族 | 条数 | 命令 id |
|---|---|---|
| `layer` | 26 | `layer.add.paint` · `layer.add.fill` · `layer.add.group` · `layer.remove` · `layer.duplicate` · `layer.group` · `layer.select` · `layer.rename` · `layer.visible` · `layer.move` · `layer.blend` · `layer.fill.set` · `layer.fill.projection` · `layer.colorTag` · `layer.list` · `layer.copy` · `layer.cut` · `layer.paste` · `layer.flatten` · `layer.instantiateAll` · `layer.instance` · `layer.pasteInstance` · `layer.set` · `layer.add.image` · `layer.add.decal` · `layer.decal.set` |
| `tool` | 20 | `tool.paint` · `tool.eraser` · `tool.projection` · `tool.polygonFill` · `tool.smudge` · `tool.clone` · `tool.colorPicker` · `tool.geometryMask` · `tool.select` · `tool.brush` · `tool.material` · `tool.stencil` · `tool.cloneSource` · `tool.fillMode` · `tool.fillSelection` · `tool.stroke` · `tool.strokeUv` · `tool.click` · `tool.state` · `tool.path` |
| `camera` | 17 | `camera.set` · `camera.get` · `camera.orbit` · `camera.list` · `camera.add` · `camera.select` · `camera.remove` · `camera.rename` · `camera.bookmark1` · `camera.bookmark2` · `camera.bookmark3` · `camera.bookmark4` · `camera.bookmark5` · `camera.bookmark6` · `camera.bookmark7` · `camera.bookmark8` · `camera.bookmark9` |
| `effect` | 16 | `effect.add.paint` · `effect.add.fill` · `effect.add.generator` · `effect.add.levels` · `effect.add.filter` · `effect.add.compare` · `effect.add.anchor` · `effect.set` · `effect.remove` · `effect.duplicate` · `effect.move` · `effect.histogram` · `effect.colorSelection.pick` · `effect.copy` · `effect.cut` · `effect.paste` |
| `textureSet` | 16 | `textureSet.select` · `textureSet.list` · `textureSet.inspect` · `textureSet.resolution` · `textureSet.channel.add` · `textureSet.channel.remove` · `textureSet.visible` · `textureSet.visibility` · `textureSet.rename` · `textureSet.settings` · `textureSet.parts` · `textureSet.meshMap.set` · `textureSet.meshMap.clear` · `textureSet.meshMap.import` · `textureSet.tile.resolution` · `textureSet.uvTiles` |
| `bake` | 13 | `bake.run` · `bake.settings` · `bake.highPoly.add` · `bake.highPoly.remove` · `bake.highPoly.list` · `bake.cage.set` · `bake.cage.clear` · `bake.skew.set` · `bake.skew.paint` · `bake.skew.clear` · `bake.cage.paint` · `bake.cage.reset` · `bake.tile.set` |
| `file` | 11 | `file.importMaterialX` · `file.new` · `file.open` · `file.save` · `file.saveAs` · `file.saveCopy` · `file.close` · `file.reimportMesh` · `file.exportTextures` · `file.exportMesh` · `file.removeUnused` |
| `viewport` | 11 | `viewport.frame` · `viewport.displayMaterial` · `viewport.nextChannel` · `viewport.previousChannel` · `viewport.nextMeshMap` · `viewport.previousMeshMap` · `viewport.view` · `viewport.focusAt` · `viewport.quickMask` · `viewport.quickMask.edit` · `viewport.quickMask.invert` |
| `mask` | 10 | `mask.add.white` · `mask.add.black` · `mask.add.colorSelection` · `mask.toggle` · `mask.invertBackground` · `mask.invert` · `mask.clear` · `mask.remove` · `mask.smart.apply` · `mask.smart.list` |
| `material` | 8 | `material.apply` · `material.list` · `material.save` · `material.load` · `material.link.set` · `material.link.preset` · `material.link.cook` · `material.link.saveSource` |
| `export` | 5 | `export.plan` · `export.presets` · `export.preset.get` · `export.preset.save` · `export.preset.remove` |
| `project` | 5 | `project.templates` · `project.template.save` · `project.new` · `project.sample` · `project.inspect` |
| `brush` | 4 | `brush.preset.list` · `brush.preset.apply` · `brush.preset.save` · `brush.preset.load` |
| `resource` | 4 | `resource.import` · `resource.list` · `resource.remove` · `resource.text` |
| `edit` | 3 | `edit.undo` · `edit.redo` · `edit.history` |
| `path` | 2 | `path.edit` · `path.remove` |
| `alpha` | 1 | `alpha.list` |
| `display` | 1 | `display.set` |
| `filter` | 1 | `filter.list` |
| `text` | 1 | `text.fonts` |

### `bake --maps` 可用集（0.5.0 headless 逐个实测，**唯一权威**）
| map id | 结果 |
|---|---|
| `height` | ✅ 可用，写进 `baked.maps`（多次 bake 累积） |
| `id` | ✅ 可用，写进 `baked.maps`（多次 bake 累积） |
| `normal` | ✅ 可用，写进 `baked.maps`（多次 bake 累积） |
| `opacity` | ✅ 可用，写进 `baked.maps`（多次 bake 累积） |
| `position` | ✅ 可用，写进 `baked.maps`（多次 bake 累积） |
| `ao` | ❌ `bake.run: unknown mesh map "ao"` |
| `bent_normal` | ❌ `bake.run: unknown mesh map "bent_normal"` |
| `world_normal` | ❌ `bake.run: unknown mesh map "world_normal"` |
| `curvature` | 💥 进程崩溃（exit 0xC0000005 访问违例，无输出、无 stderr） |
| `thickness` | 💥 同上崩溃 |

> `bake.settings` 的 `model.maps` 列出全部十个键——**GUI 名 ≠ CLI 可用集**，别照它猜参数。
> 推荐：`--maps normal,height,id`（交付）或 `--maps normal,height,opacity,position`（要遮罩/流动图时）。
> 需要曲率/厚度做智能遮罩时，用 `mask.smart.apply {name}`（`mask.smart.list` 给 id：`edge_wear` / `edge_chipped` / `dirt_cavities` / `dust_top` / `ground_dirt` …），别走 `bake --maps curvature`。

### 实测链路（可直接抄）
```bash
# 1) 建工程：内置球 + 512 纹理集
texturecraft-cli new builtin:material_ball tex.tcraft --resolution 512
# 2) 烘焙（可多次，累积进 baked.maps）
texturecraft-cli bake tex.tcraft --resolution 1024 --maps normal,height,id
# 3) 先看清单（文件名/位深/警告），再导
texturecraft-cli run tex.tcraft export.plan '{}'
# 4) 导出：两种都行
texturecraft-cli export tex.tcraft texout                      # 简易：全通道 PNG
texturecraft-cli run tex.tcraft file.exportTextures '{"dir":"tex","preset":"glTF PBR Metal Roughness"}'
```
- `export` 产出 10 张 PNG（baseColor/metallic/roughness/height/normal × 各部件套）；`file.exportTextures` 走命名预设（`export.presets` 列出：glTF PBR Metal Roughness / Unreal Engine (Packed) / Document channels + Normal + AO …），可指定 `format/bitDepth/size/colorSpace/padding`，还能 `materialX: true` 额外写 `.mtlx`。
- `textureSet.inspect` 给 resolution、channels（baseColor sRGB8 / metallic L8 / roughness L8 / normal RGB16F / height L16F）、baked 状态。

## 四、Craft Anything —— 软件研究与重建（322 个工具）

**边界先说清：它不在创作链路里。** 定位是逆向/研究/重建（clean-room 复刻、协议分析、运行时 inspect），默认干净室、`--deep` 才读代码、`--allow-run` 才执行目标。做视频/图像/音频/文档时不要拉它进来。

- 产物是 `*.cany` 项目；子命令：`capabilities / commands / doctor / triage / report / chat / rebuild / setup / ai / mcp`。
- 工具集（17 组 / 322 个工具，`capabilities` 实测）：

| toolset | 主题 | 工具数 |
|---|---|---|
| `core` | Essentials | 36（clean-room 可用 28） |
| `native` | Programs (native code) | 55（clean-room 可用 0） |
| `apple` | Apple apps | 14（clean-room 可用 0） |
| `formats` | File formats | 36（clean-room 可用 1） |
| `managed` | .NET apps | 8（clean-room 可用 0） |
| `android` | Android apps | 14（clean-room 可用 2） |
| `java` | Java programs | 6（clean-room 可用 0） |
| `adb` | Connected phone | 24（clean-room 可用 11） |
| `browser` | Websites | 22（clean-room 可用 7） |
| `javascript` | Electron and JavaScript | 11（clean-room 可用 0） |
| `runtime` | Running programs | 14（clean-room 可用 5） |
| `frida` | Frida instrumentation | 9（clean-room 可用 0） |
| `application` | Comparing and rebuilding | 17（clean-room 可用 0） |
| `database` | Databases | 1（clean-room 可用 0） |
| `projects` | Projects | 29（clean-room 可用 28） |
| `setup` | Engines and settings | 20（clean-room 可用 20） |
| `build` | Building | 6（clean-room 可用 6） |

- 本机引擎自检：`craft-anything-cli doctor`（ghidra / adb / jadx / apktool / chromium / gdb / java / objdump —— 缺失项在 `capabilities.engines` 里是 `found:false`）。
- 唯一与创作沾边的用法：复盘第三方实现（例如"这个 LUT 怎么算的"），结论写回技能；不要进交付流水线。

## 五、材质 → 贴图 交接（MaterialCraft → TextureCraft）实测现状

**结论：0.5.0 的 TextureCraft 读不了 0.3.0 的 MaterialCraft 材质文件——版本门槛卡住了。**

```bash
# A. 材质侧：建图 → 加节点（def 来自 library.list）→ 接线 → cook → 出可移植材质
materialcraft-cli new pbr skin.sbs
materialcraft-cli run skin.sbs graph.node.add '{"def":"blur","at":[0,200]}'          # → {"id":13}
materialcraft-cli run skin.sbs graph.node.add '{"def":"output","at":[400,0],"connectFrom":{"node":1}}'
materialcraft-cli run skin.sbs graph.cook '{"full":true}'
materialcraft-cli run skin.sbs file.exportMaterial '{"path":"skin.mcmat","size":1024}'

# B. 贴图侧：试着载入——本机配对直接失败
texturecraft-cli run tex.tcraft material.load '{"path":"skin.mcmat"}'
#   → unsupported: MaterialCraft material version 2 (this version reads up to 1)
```

- `material.load` 在接口上**支持** `.mcmat` / `.tcmat` / `.mcraft` 三种；实际能不能读取决于版本号（MaterialCraft 0.3.0 写 v2，TextureCraft 0.5.0 上限 v1）。**两边升到配套版本前，别指望自动交接。**
- `file.sendToTextureCraft` 仍然可用（写进 `Documents/TextureCraft/library/`），GUI 书架能看到；能不能载入受同一个版本门槛限制。

### 可用替代路径：贴图图片桥（实测通过）
```bash
# 1) MaterialCraft 导出通道图（6 张 PNG）
materialcraft-cli export skin.sbs out
# 2) TextureCraft 把图导成资源（注意 -o，否则下一步看不到资源）
texturecraft-cli run tex.tcraft resource.import '{"path":"<abs>/out/Material_outputs_normal.png"}' -o tex.tcraft
texturecraft-cli run tex.tcraft resource.list '{}'
#   → [{"name":"Material_outputs_normal.png","width":1024,"height":1024,...}]
# 3) 绑到网格贴图槽（map 取 normal / ambientOcclusion / curvature / id / height …）
texturecraft-cli run tex.tcraft textureSet.meshMap.set '{"map":"normal","image":"Material_outputs_normal.png"}' -o tex.tcraft
#   → {"map":"normal","resolution":2048}
```
- `textureSet.meshMap.set` **会把贴图集分辨率拉齐到导入图**（实测 512 的 set 变成 2048）——导入前把图尺寸定对，别事后返工。
- `textureSet.meshMap.import {files:[{path,map?}]}` 在本机 0.5.0 上把文件全部判为 `unmatched`（相对/绝对路径、带/不带 `map`、带 `ts` 共 4 种传法都试过），暂时别当主路径。
- 改材质后贴图不会自动更新：重 `export` → 重 `resource.import` → 重 `meshMap.set`。QC 的 `texture.baked` 只说明"烘焙过"，不说明"烘的是哪一版"。

## 六、QC 挂钩（`artcraft_qc` 已内置）
| 类型 | 探针 | 检查项 |
|---|---|---|
| `solidcad`（`.sc/.step/.stp`） | `solidcraft-cli eval <file>` | 拓扑/时间线摘要解析 |
| `material`（`.sbs`） | `materialcraft-cli info <file>` | `material.graphs` / `material.cook`（>8s 警告）/ `material.warnings` / `material.outputs` |
| `texture`（`.tcraft`） | `texturecraft-cli info <file>` | `texture.sets` / `texture.resolution`（<1024 警告）/ `texture.baked` / `texture.layers` / `texture.uv` |

## 七、踩坑速查
1. `graph.node.add` 的类型键叫 `def`（取值来自 `library.list`），不是 `type`/`node`；没有 `noise`。
2. `bake --maps` 只认五个 id；`curvature`/`thickness` 直接把进程打崩（无 stderr），脚本要设防。
3. `run` 不落盘——连续操作必须 `-o`，或用 `batch`。
4. MaterialCraft `export` 没有 `--full`；出 `.mcmat` 用 `file.exportMaterial`。
5. SolidCraft 命令重度依赖选择/时间线上下文；headless 下先 `select.*`，失败看 `engine.describe`。
6. 家族软件搬家后（例如 `C:\Program Files` → `D:\Develop\ArtCraft`）：改 `artcraft.config.json` 的 `roots[]` 再跑 `artcraft_discover`，别逐个改 `bins`。
7. 跨应用交接先验版本：`material.load` 的报错已经把版本号写清楚了（`version 2 ... reads up to 1`）。
