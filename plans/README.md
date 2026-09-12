# Component architecture plans

Split from `moraine-namespace-optimization-codex-plan-v2.md` on 2026-09-11 at commit `7d9633ca405c2bcf256481298486c7daee3e1456`. This directory is the execution index. No implementation or test execution was performed while authoring/revising these plans.

There are 37 bounded plans. TODO identifies selected work; DEFERRED requires explicit family selection before execution.

## Public API direction

The target API is **composition-first, namespace-rendered, Moraine-styled**, with **Kobalte-style `as` polymorphism** for replacing the element/component rendered by a part.

These rules are normative. If an individual plan conflicts with them, update the plan before implementation rather than preserving the conflicting API.

### 1. Namespace components render visible structure

- Callable roots own behavior/shared state. Named namespace parts describe visible structure.
- `children` is the actual content/structure of a part.
- Remove public JSX renderer props named `*Render` (`itemRender`, `optionRender`, `labelRender`, `emptyRender`, `statusRender`, `stepRender`, `virtualRender`, `leadingRender`, `trailingRender`, etc.). Do not rename them to `renderItem`, slots-as-functions, or another callback-rendering convention.
- A visible concept that needs customization should normally become a meaningful namespace component: e.g. `Select.ItemLabel`, `Progress.Status`, `CommandPalette.ItemTrailing`.
- Dynamic application data uses Solid `<For>` to create namespace parts.
- Do not add `*.Items` components whose only purpose is hiding a normal `<For>` loop.
- Renderer-only public context/types disappear with their renderer props. State required by a namespace part is obtained from its owning context or explicit semantic props.
- A function prop that computes **data/behavior rather than JSX** may remain (`getValueLabel`, filtering, serialization, event callbacks, imperative scrolling, etc.). The boundary is whether the callback returns/render-controls visible JSX.
- Do not scan/evaluate JSX as data or render children twice.

Representative migrations:

```text
optionRender                 -> Select.Item + ItemLeading/ItemLabel/ItemDescription/ItemTrailing
labelRender                  -> Select.Value / Select.ItemLabel
emptyRender                  -> Select.Empty
statusRender / stepRender    -> Progress.Status / Progress.Step
itemRender                   -> *.Item + application <For>
leadingRender/trailingRender -> *.ItemLeading / *.ItemTrailing
virtualRender                -> renderer-free virtual data/geometry + ordinary namespace parts
dividerRender                -> KbdGroup.Divider / SequenceDivider
```

### 2. `as` replaces the host; `children` remains content

- `as` is the only public host replacement mechanism.
- It accepts valid intrinsic elements or custom Solid components.
- Do not add host-level `render={(props) => <.../>}`.
- Target-specific props should remain type-checkable.
- Moraine-only behavior/variant props must not leak blindly to native DOM nodes.
- Required role/ARIA/state/ref/event semantics remain authoritative where correctness requires them.
- Custom `as` components are responsible for forwarding received host props to one appropriate DOM host; Moraine does not inspect returned JSX or add a compensating wrapper.
- Preserve useful ref/currentTarget types without `any` erasure.

```tsx
<Button as="a" href="/projects">Projects</Button>

<Dialog.Trigger as={Button} variant="outline">
  Edit project
</Dialog.Trigger>
```

### 3. Collection data is metadata, not rendering

- `items` / `options` may exist when complete logical data provides real capability: filtering unmounted entries, virtualization, selected-label lookup, etc.
- Metadata never becomes a JSX renderer.
- Declarative namespace items may register mounted semantic metadata when complete root data is absent.
- Mounted registration never becomes a competing controlled/form value authority.
- Virtualization must separate logical/visible entry calculation and geometry from JSX rendering. Remove `virtualRender`; visible entries still become ordinary namespace items.
- If a component only needs iteration, use application `<For>` rather than root data + renderer callback.

### 4. SSR does not discover hidden JSX

- First server HTML is derived from explicit props/data and parts that actually render.
- Do not scan/evaluate child JSX to discover collections, labels, hosts or default selection.
- Selected labels needed before popup mount require explicit metadata, explicit Value children, or a deterministic fallback.
- Preserve node identity through hydration.

### 5. Styling remains a Moraine capability

- Reuse `createComponentStyles`, Provider theme resolution, `cnConfig`, `classes`, `styles`, part `class/style`, reactive variants and `emptyTheme` semantics.
- Namespace parts receive normal Moraine presentation when composed manually.
- Root `classes/styles` override named slots; part-local `class/style` is narrowest.
- `emptyTheme` may remove visual presentation but must not break required behavior geometry/focus/positioning.
- Migrate slot targets intentionally when DOM anatomy changes.

### 6. Native controls target native elements

- Input/Textarea `ref`, class/style, id, ARIA, native attributes/events target the actual native editing element.
- Wrapper composition belongs to InputGroup.
- InputGroup owns presentation only, not another value/form authority.

### 7. Documentation teaches composition

Show, in order: minimum anatomy; dynamic `<For>` where relevant; localized structural customization; one boundary case such as SSR/virtualization/`as` composition. Do not teach renderer props in new docs.

## Execution order and status

| Plan | Priority | Depends on | Status |
| --- | --- | --- | --- |
| [001 Baseline](001-baseline.md) | P1 | — | TODO |
| [002 Browser regressions](002-browser-regressions.md) | P1 | 001 | TODO |
| [003 Polymorphic host protocol](003-host-render.md) | P1 | 001 | TODO |
| [004 Overlay layers](004-overlay-layers.md) | P1 | 002 | TODO |
| [005 Overlay lifecycle](005-overlay-lifecycle.md) | P1 | 004 | TODO |
| [006 Floating bindings](006-floating-bindings.md) | P1 | 002 | TODO |
| [007 Button `as`](007-button.md) | P2 | 003 | TODO |
| [008 Input/Textarea/InputGroup](008-input.md) | P1 | 003 | TODO |
| [009 Card](009-card.md) | P2 | 001 | TODO |
| [010 Tabs](010-tabs.md) | P1 | 002, 003 | TODO |
| [011 Dialog](011-dialog.md) | P1 | 002, 003, 005, 006 | TODO |
| [012 Select internals](012-select-internals.md) | P1 | 005, 006 | TODO |
| [013 Select parts](013-select-parts.md) | P1 | 003, 012 | TODO |
| [014 Modal](014-modal.md) | P2 | 011 | DEFERRED |
| [015 Sheet](015-sheet.md) | P2 | 011 | DEFERRED |
| [016 Popover](016-popover.md) | P2 | 003, 005, 006 | DEFERRED |
| [017 Tooltip](017-tooltip.md) | P2 | 003, 005, 006 | DEFERRED |
| [018 DropdownMenu](018-dropdown-menu.md) | P2 | 003, 005, 006 | DEFERRED |
| [019 ContextMenu](019-context-menu.md) | P2 | 018 | DEFERRED |
| [020 Accordion](020-accordion.md) | P2 | 010 | DEFERRED |
| [021 Collapsible](021-collapsible.md) | P2 | 003 | DEFERRED |
| [022 FormField](022-form-field.md) | P2 | 003, 010 | DEFERRED |
| [023 CheckboxGroup](023-checkbox-group.md) | P2 | 003 | DEFERRED |
| [024 RadioGroup](024-radio-group.md) | P2 | 003 | DEFERRED |
| [025 CommandPalette](025-command-palette.md) | P2 | 012, 003, 035 | DEFERRED |
| [026 MultiSelect](026-multi-select.md) | P2 | 013 | DEFERRED |
| [027 Avatar](027-avatar.md) | P2 | 001 | DEFERRED |
| [028 InputNumber](028-input-number.md) | P2 | 003 | DEFERRED |
| [029 Slider](029-slider.md) | P2 | 002, 003 | DEFERRED |
| [030 FileUpload](030-file-upload.md) | P2 | 003 | DEFERRED |
| [031 Breadcrumb](031-breadcrumb.md) | P2 | 003 | DEFERRED |
| [032 Pagination](032-pagination.md) | P2 | 003 | DEFERRED |
| [033 SidebarFrame](033-sidebar-frame.md) | P2 | 003 | DEFERRED |
| [034 Resizable](034-resizable.md) | P2 | 002, 003 | DEFERRED |
| [035 List](035-list.md) | P2 | 003 | DEFERRED |
| [036 Progress](036-progress.md) | P2 | 003 | DEFERRED |
| [037 KbdGroup](037-kbd-group.md) | P2 | 003 | DEFERRED |

Statuses: TODO, DEFERRED, IN PROGRESS, DONE, BLOCKED (reason), REJECTED (reason).

## Dependency notes

- Start with 001. Plans 002–006 establish browser/overlay/shared-host prerequisites.
- Button validates `as`; Input/Textarea validate native-control targeting.
- Tabs validates composition-first collection registration.
- Dialog validates namespace structure plus `Dialog.Trigger as={Button}`.
- Select internals establish one behavior authority; Select parts then remove renderer props and expose namespace presentation.
- List 035 defines renderer-free generic collection/virtualization boundaries used by CommandPalette and applicable shared internals.
- MultiSelect follows Select's renderer-free contract.
- Candidate families remain independently selectable; completing a dependency does not automatically activate them.

## Component coverage

| Directory / entry | Delivery |
| --- | --- |
| `src/elements/accordion` | 020 |
| `src/elements/avatar` | 027; AvatarGroup remains independent |
| `src/elements/badge` | UNCHANGED |
| `src/elements/button` | 007; ButtonGroup remains independent |
| `src/elements/card` | 009 |
| `src/elements/collapsible` | 021 |
| `src/elements/icon` | UNCHANGED |
| `src/elements/kbd` | 037 for KbdGroup renderer removal; Kbd leaf remains independent |
| `src/elements/list` | 035 |
| `src/elements/progress` | 036 |
| `src/elements/resizable` | 034 |
| `src/elements/separator` | UNCHANGED |
| `src/forms/checkbox` | UNCHANGED |
| `src/forms/checkbox-group` | 023 |
| `src/forms/file-upload` | 030 |
| `src/forms/form` | 022 |
| `src/forms/input`, `textarea`, `input-group` | 008 |
| `src/forms/input-number` | 028 |
| `src/forms/radio-group` | 024 |
| `src/forms/select` | 012, 013, 026 |
| `src/forms/slider` | 029 |
| `src/forms/switch` | UNCHANGED |
| `src/navigation/breadcrumb` | 031 |
| `src/navigation/command-palette` | 025 |
| `src/navigation/pagination` | 032 |
| `src/navigation/sidebar-frame` | 033 |
| `src/navigation/stepper` | independent future design task |
| `src/navigation/tabs` | 010 |
| `src/overlays/context-menu` | 019 |
| `src/overlays/dialog` | 011 |
| `src/overlays/dropdown-menu` | 018 |
| `src/overlays/modal` | 014 |
| `src/overlays/popover` | 016 |
| `src/overlays/sheet` | 015 |
| `src/overlays/tooltip` | 017 |

## Rejected directions

- Host-level `render` alongside `as`.
- Public JSX `*Render` props alongside namespace components.
- Renaming renderer callbacks instead of removing the rendering pattern.
- `*.Items` assemblers whose only job is hiding `<For>`.
- JSX scanning/eager evaluation to reconstruct collections.
- Virtualization APIs that take ownership of row JSX.
- Mandatory root `items/options` for ordinary static declarative structure.
- Hidden alternate widget implementations selected by whether children is omitted.
- Universal public primitive/slot/registry factories.
- Global Provider/environment rewrites unrelated to these component contracts.

## Verification baseline

Package scripts and existing test infrastructure were inspected, not executed while revising these plans. `nub run test:browser` is owned by plan 002. Production checks and generated API changes belong to implementation execution. When upstream source is directly adapted, record exact source revision and license obligations.