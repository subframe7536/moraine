# Component architecture plans

Split from `moraine-namespace-optimization-codex-plan-v2.md` on 2026-09-11 at commit `7d9633ca405c2bcf256481298486c7daee3e1456`. The original plan is unchanged. This directory is the execution index; each numbered file contains its own contract, scope, source evidence and verification gates. No implementation or test execution was performed while splitting the plan.

There are 34 bounded plans: six shared/evidence prerequisites and 28 component units (Select has separate internal and public-structure units). TODO identifies work selected by the original plan, not permission to start it in this planning session. DEFERRED retains the original candidate status and requires an explicit family selection before execution.

## Execution order and status

| Plan | Priority | Depends on | Status |
| --- | --- | --- | --- |
| [001 Record the execution baseline and consumer boundaries](001-baseline.md) | P1 | — | TODO |
| [002 Add real-browser overlay and hydration regression coverage](002-browser-regressions.md) | P1 | 001 | TODO |
| [003 Extract one host-render and DOM-props merge protocol](003-host-render.md) | P1 | 001 | TODO |
| [004 Separate overlay ancestry from activation order per document](004-overlay-layers.md) | P1 | 002 | TODO |
| [005 Separate overlay focus, dismissal and resource lifecycles](005-overlay-lifecycle.md) | P1 | 004 | TODO |
| [006 Separate floating geometry from surface animation](006-floating-bindings.md) | P1 | 002 | TODO |
| [007 Add host rendering without changing Button behavior](007-button.md) | P2 | 003 | TODO |
| [008 Clarify Input host, ref and event targets](008-input.md) | P2 | 003 | TODO |
| [009 Make Card a manually assembled styled container](009-card.md) | P2 | 001 | TODO |
| [010 Expose Tabs parts backed by one complete item collection](010-tabs.md) | P2 | 002, 003 | TODO |
| [011 Separate Dialog default Panel from raw Content](011-dialog.md) | P2 | 002, 003, 005, 006 | TODO |
| [012 Separate Select behavior, form adaptation and presentation](012-select-internals.md) | P1 | 005, 006 | TODO |
| [013 Add a structural Select path on the existing behavior](013-select-parts.md) | P2 | 003, 012 | TODO |
| [014 Expose Modal assembly without adding another behavior kernel](014-modal.md) | P2 | 011 | DEFERRED |
| [015 Expose Sheet layout parts using shared dialog behavior](015-sheet.md) | P2 | 011 | DEFERRED |
| [016 Separate Popover positioning and custom content](016-popover.md) | P2 | 003, 005, 006 | DEFERRED |
| [017 Expose Tooltip positioning parts with descriptive semantics](017-tooltip.md) | P2 | 003, 005, 006 | DEFERRED |
| [018 Expose DropdownMenu parts and explicit submenu ownership](018-dropdown-menu.md) | P2 | 003, 005, 006 | DEFERRED |
| [019 Expose ContextMenu parts while retaining pointer anchors](019-context-menu.md) | P2 | 018 | DEFERRED |
| [020 Expose Accordion parts with root-owned expansion data](020-accordion.md) | P2 | 010 | DEFERRED |
| [021 Refine existing Collapsible parts without duplicating state](021-collapsible.md) | P2 | 003 | DEFERRED |
| [022 Add optional manual FormField layout without rebinding fields](022-form-field.md) | P2 | 003, 010 | DEFERRED |
| [023 Add CheckboxGroup.Item with shared form state](023-checkbox-group.md) | P2 | 003 | DEFERRED |
| [024 Add RadioGroup.Item with one selection authority](024-radio-group.md) | P2 | 003 | DEFERRED |
| [025 Expose CommandPalette layout backed by complete groups](025-command-palette.md) | P2 | 012, 003 | DEFERRED |
| [026 Add MultiSelect parts without weakening array semantics](026-multi-select.md) | P2 | 013 | DEFERRED |
| [027 Expose Avatar image and fallback with shared load state](027-avatar.md) | P2 | 001 | DEFERRED |
| [028 Expose numeric input controls without changing parsing contracts](028-input-number.md) | P2 | 003 | DEFERRED |
| [029 Expose Slider geometry parts with stable thumb indices](029-slider.md) | P2 | 002, 003 | DEFERRED |
| [030 Expose file selection parts with original File identity](030-file-upload.md) | P2 | 003 | DEFERRED |
| [031 Expose Breadcrumb links without requiring duplicate data](031-breadcrumb.md) | P2 | 003 | DEFERRED |
| [032 Expose Pagination controls that derive targets from root state](032-pagination.md) | P2 | 003 | DEFERRED |
| [033 Expose SidebarFrame.Trigger through the existing toggle state](033-sidebar-frame.md) | P2 | 003 | DEFERRED |
| [034 Improve Resizable host customization without renaming parts](034-resizable.md) | P2 | 002, 003 | DEFERRED |

Statuses: TODO, DEFERRED, IN PROGRESS, DONE, BLOCKED (reason), REJECTED (reason). Update the table and individual plan together.

## Dependency notes

- Start with 001. Shared host rendering (003) does not need the browser harness; Card (009) needs neither host rendering nor overlays. Do not turn numbering into a linear dependency chain.
- Overlay ancestry (004) precedes lifecycle extraction (005); floating bindings (006) can proceed independently after the browser harness. Select internals (012) then stand alone without any Card/Tabs/Dialog public API migration.
- Button/Input (007–008) validate host rendering; Tabs (010) validates complete collections and initial SSR; Dialog (011) validates Panel versus Content. Select parts (013) require Select internals and host rendering, not completion of other overlay candidates.
- Candidate families can be selected individually. ContextMenu (019) follows the shared menu work demonstrated by DropdownMenu (018); MultiSelect parts (026) follow Select parts. CheckboxGroup and RadioGroup are separate deliverables. SidebarFrame.Trigger does not depend on Sheet parts.
- Shared base files and declaration fixtures are conflict hotspots. Execute overlapping edits serially or reconcile them before the next unit. Reconcile expected prerequisite drift; never blindly reject or overwrite it.
- M7 is folded into each component plan: types, docs, generated API, direct callers and regression evidence ship with that component. There is no final all-library migration task.

## Coverage of the original component matrix

| Directory / entry | Delivery |
| --- | --- |
| `src/elements/accordion` | [020](020-accordion.md) |
| `src/elements/avatar` | [027](027-avatar.md) Standalone AvatarGroup and its types/recipe remain unchanged. |
| `src/elements/badge` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/elements/button` | [007](007-button.md) Standalone ButtonGroup and its types/recipe remain unchanged. |
| `src/elements/card` | [009](009-card.md) |
| `src/elements/collapsible` | [021](021-collapsible.md) |
| `src/elements/icon` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/elements/kbd` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. Standalone KbdGroup and its types/recipe remain unchanged. |
| `src/elements/list` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/elements/progress` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/elements/resizable` | [034](034-resizable.md) |
| `src/elements/separator` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/forms/checkbox` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/forms/checkbox-group` | [023](023-checkbox-group.md) |
| `src/forms/file-upload` | [030](030-file-upload.md) |
| `src/forms/form` | [022](022-form-field.md) Bound form.Form stays single; no global Form runtime. |
| `src/forms/input` | [008](008-input.md) |
| `src/forms/input-number` | [028](028-input-number.md) |
| `src/forms/radio-group` | [024](024-radio-group.md) |
| `src/forms/select` | [012](012-select-internals.md), [013](013-select-parts.md), [026](026-multi-select.md) |
| `src/forms/slider` | [029](029-slider.md) |
| `src/forms/switch` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. |
| `src/forms/textarea` | UNCHANGED — retain the current leaf API; no namespace wrappers or blanket render retrofit. Existing ref JSDoc discrepancy is deferred until this family is touched. |
| `src/navigation/breadcrumb` | [031](031-breadcrumb.md) |
| `src/navigation/command-palette` | [025](025-command-palette.md) |
| `src/navigation/pagination` | [032](032-pagination.md) |
| `src/navigation/sidebar-frame` | [033](033-sidebar-frame.md) |
| `src/navigation/stepper` | Independent future design task; existing behavior unchanged. No new parts, completion model, Prev/Next, validation or ARIA redesign is selected. |
| `src/navigation/tabs` | [010](010-tabs.md) |
| `src/overlays/context-menu` | [019](019-context-menu.md) |
| `src/overlays/dialog` | [011](011-dialog.md) |
| `src/overlays/dropdown-menu` | [018](018-dropdown-menu.md) |
| `src/overlays/modal` | [014](014-modal.md) |
| `src/overlays/popover` | [016](016-popover.md) |
| `src/overlays/sheet` | [015](015-sheet.md) |
| `src/overlays/tooltip` | [017](017-tooltip.md) |

The Select directory contains separate Select and MultiSelect plans; FormField is planned within the form directory. This table covers all 36 public component directories, without generating empty implementation tasks for unchanged leaves.

## Ablation: considered and rejected

- Group renaming and parent aliases add migration cost without structural capability; preserve independent exports and theme keys.
- Card mode switches, default assembly, Panel/Layout and automatic body wrapping are removed. Card has only explicit manual parts; native title remains distinct from visible Card.Title.
- Tabs.Items is removed because tabs pair a trigger list with a separate panel tree. Other Items parts emit repeated rows only, never an outer list or overlay assembly.
- FileUpload.Name/Size are removed; native markup inside itemRender is enough. Preserve File identity and selection-only semantics.
- A universal collection, namespace factory, global environment/provider rewrite, broad callback renaming and blanket host-render rollout are excluded. Reuse only abstractions with real consumers.
- New Stepper design is deferred; splitting the current plan does not select it. Unchanged components receive coverage rows, not speculative refactor plans.
- Existing SSR infrastructure, stale-positioning protection and API extraction are retained. Add missing verification and targeted boundaries instead of rebuilding working systems.

## Verification baseline and limitations

Package scripts and existing test infrastructure were inspected, not executed. `nub run test:browser` is a proposed script owned by 002; downstream plans must not claim it already exists. Production checks may generate artifacts or format source, so they belong to implementation execution, not this planning session. Upstream references in the umbrella were not re-audited over the network during this split.
