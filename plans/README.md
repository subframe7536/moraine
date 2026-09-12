# Component architecture plans

Split from `moraine-namespace-optimization-codex-plan-v2.md` on 2026-09-11 at commit `7d9633ca405c2bcf256481298486c7daee3e1456`. This directory is the execution index; each numbered file contains its own contract, scope and verification gates. No implementation or test execution was performed while authoring or revising these plans.

There are 34 bounded plans: six shared/evidence prerequisites and 28 component units. TODO identifies selected work, not permission to start it outside the requested execution session. DEFERRED retains candidate status and requires explicit family selection before execution.

## Public API direction

The target API is **composition-first, shadcn-style anatomy with Moraine-owned styling**, with **Kobalte-style `as` polymorphism** for replacing the element/component rendered by a part.

This is a normative contract for every component plan in this directory. If an older Anatomy example conflicts with these rules, the executor must update that plan before implementation rather than preserving the conflicting shape.

### 1. Structure is explicit

- Callable roots own behavior and shared state. Named parts describe structure.
- Do not add `.Root` aliases, namespace factories, runtime part registries or public `Extend` types.
- `children` describes the actual rendered content/structure. It is not a host-element factory and must not be repurposed to select a second implementation path.
- Do not use presence/absence of `children` as a hidden switch between a complete auto-assembled widget and a different manual implementation.
- Prefer the public granularity used by shadcn-style components: expose meaningful visual/semantic parts, while keeping stable technical infrastructure such as focus management, positioning plumbing and form adapters internal unless a real customization requires a public part.
- Convenience data props may reduce repeated metadata, but they do not define or replace the component tree.

### 2. Collection data is optional unless a feature truly needs a complete collection

- `items` / `options` are optional metadata sources, not mandatory structure descriptions.
- Without root data, declared item/trigger parts may register their own semantic metadata with the root behavior.
- With root data, the root may know ordering, disabled state, labels and unmounted entries before the matching parts mount.
- Do not scan JSX, eagerly evaluate labels/content, or render children twice to reconstruct a collection.
- Features that require knowledge of unmounted entries — especially virtualization, server-rendered selected labels, or filtering a complete dataset — may require `items` / `options` or another explicit data source. Document that feature boundary and emit actionable development diagnostics instead of silently degrading.
- Dynamic UI should normally use Solid `<For>` over the application's own data; do not add `*.Items` assemblers merely to avoid writing `<For>`.

### 3. SSR must not depend on hidden JSX discovery

- The first server render must be correct from explicit props/data and parts that actually render.
- If a declarative collection has no complete root data, initial selection that depends on discovering the first enabled item must use an explicit `value` / `defaultValue`, or follow a documented deterministic fallback that is valid during SSR.
- A selected label that must exist before popup content has ever mounted needs explicit root metadata or explicit `Value` content.
- Preserve node identity through hydration; do not fix server uncertainty by scanning/evaluating JSX twice.

### 4. Styling remains a Moraine capability

The structural change does **not** turn Moraine into an unstyled primitive library.

- Reuse `createComponentStyles`, Provider theme resolution, `cnConfig`, `classes`, `styles`, part `class` / `style`, reactive variants and `emptyTheme` semantics.
- Parts receive the same default Moraine presentation whether used in the documented anatomy or composed into a custom structure.
- Root `classes` / `styles` remain the convenient way to override named slots for a component instance. Part-local `class` / `style` remains the narrowest override.
- Preserve behavior geometry under `emptyTheme`; visual theme removal must not break focus, positioning, hit targets or required layout mechanics.
- Retain compatible existing slot names when their semantic target still exists. When a refactor changes the DOM target, migrate the slot intentionally and document the mapping rather than pretending the old target is unchanged.

### 5. Native controls target native elements

- `Input` and `Textarea` become native editing controls: `ref`, `class`, `style`, `id`, `aria-*`, native attributes and native events target the actual `<input>` / `<textarea>`.
- Wrapper composition moves to `InputGroup`; do not make a leaf input secretly own an extra layout wrapper.
- `InputGroup` owns group layout/presentation only. It must not introduce a second value/form state authority.

### 6. Polymorphism uses `as`; `children` remains content

Moraine uses one host-replacement model, modeled after Kobalte's polymorphic components.

- `as` is the **only public host replacement/composition prop**. Do not add a second host-level `render` API.
- `as` accepts the default intrinsic element, another intrinsic tag where semantically valid, or a custom Solid component.
- `children` remains the actual content passed to the selected host/component. Replacing the host must not require recreating the element tree in a callback.
- Component-specific behavior options are consumed by Moraine and must not leak to the DOM as invalid attributes.
- Forwardable common props (`id`, `class`, `style`, `classList`, `data-*`, `aria-*`, events and refs) and target-specific props are passed to the selected `as` component with useful TypeScript inference.
- Props that Moraine must own for behavioral/accessibility correctness (`role`, required `aria-*`, state data attributes, disabled/tab-index semantics where applicable) remain authoritative after prop merging. Document any intentionally user-overridable exceptions.
- User event handlers run before internal cancellable behavior. `preventDefault()` only cancels behavior explicitly defined as cancellable; disabled/lifecycle invariants remain protected.
- A custom component supplied to `as` is responsible for forwarding the received host/ARIA/event/ref props to one appropriate DOM host. Moraine must not render a wrapper merely to compensate for a component that does not forward them.
- Keep precise `currentTarget` and ref types wherever the selected host type makes them knowable. Do not erase types to `any` merely to support custom components.
- Existing **content** renderer APIs such as `optionRender`, `itemRender`, `virtualRender`, or stateful render-prop children are a separate concept. Removing host-level `render` does not automatically remove those APIs.

Representative composition:

```tsx
<Button as="a" href="/projects">Projects</Button>

<Dialog.Trigger as={Button} variant="outline">
  Edit project
</Dialog.Trigger>
```

When an application needs a preconfigured target, it should use an ordinary Solid component and pass that component through `as` rather than receiving a Moraine-owned element factory callback.

### 7. Documentation should teach progressive composition

For public structure changes, documentation should show in this order:

1. the minimum anatomy;
2. data-driven/dynamic rendering with `<For>` when relevant;
3. one localized structural customization;
4. one boundary case such as SSR metadata, search/virtualization or `as`-based custom-host composition.

Do not make users read a complete low-level primitive anatomy to add one heading, icon or action.

## Execution order and status

| Plan | Priority | Depends on | Status |
| --- | --- | --- | --- |
| [001 Record the execution baseline and consumer boundaries](001-baseline.md) | P1 | — | TODO |
| [002 Add real-browser overlay and hydration regression coverage](002-browser-regressions.md) | P1 | 001 | TODO |
| [003 Extract one polymorphic host and DOM-props merge protocol](003-host-render.md) | P1 | 001 | TODO |
| [004 Separate overlay ancestry from activation order per document](004-overlay-layers.md) | P1 | 002 | TODO |
| [005 Separate overlay focus, dismissal and resource lifecycles](005-overlay-lifecycle.md) | P1 | 004 | TODO |
| [006 Separate floating geometry from surface animation](006-floating-bindings.md) | P1 | 002 | TODO |
| [007 Validate `as` polymorphism through Button without changing behavior](007-button.md) | P2 | 003 | TODO |
| [008 Make Input/Textarea native controls and extract InputGroup](008-input.md) | P1 | 003 | TODO |
| [009 Make Card a manually assembled styled container](009-card.md) | P2 | 001 | TODO |
| [010 Make Tabs composition-first with optional collection data](010-tabs.md) | P1 | 002, 003 | TODO |
| [011 Make Dialog.Content the primary styled composition surface](011-dialog.md) | P1 | 002, 003, 005, 006 | TODO |
| [012 Separate Select behavior from optional collection metadata and presentation](012-select-internals.md) | P1 | 005, 006 | TODO |
| [013 Make Select composition-first with optional collection data](013-select-parts.md) | P1 | 003, 012 | TODO |
| [014 Expose Modal assembly without adding another behavior kernel](014-modal.md) | P2 | 011 | DEFERRED |
| [015 Expose Sheet layout parts using shared dialog behavior](015-sheet.md) | P2 | 011 | DEFERRED |
| [016 Separate Popover positioning and custom content](016-popover.md) | P2 | 003, 005, 006 | DEFERRED |
| [017 Expose Tooltip positioning parts with descriptive semantics](017-tooltip.md) | P2 | 003, 005, 006 | DEFERRED |
| [018 Expose DropdownMenu parts and explicit submenu ownership](018-dropdown-menu.md) | P2 | 003, 005, 006 | DEFERRED |
| [019 Expose ContextMenu parts while retaining pointer anchors](019-context-menu.md) | P2 | 018 | DEFERRED |
| [020 Expose Accordion parts with one expansion authority](020-accordion.md) | P2 | 010 | DEFERRED |
| [021 Refine existing Collapsible parts without duplicating state](021-collapsible.md) | P2 | 003 | DEFERRED |
| [022 Add optional manual FormField layout without rebinding fields](022-form-field.md) | P2 | 003, 010 | DEFERRED |
| [023 Add CheckboxGroup.Item with shared form state](023-checkbox-group.md) | P2 | 003 | DEFERRED |
| [024 Add RadioGroup.Item with one selection authority](024-radio-group.md) | P2 | 003 | DEFERRED |
| [025 Expose CommandPalette layout backed by one behavior model](025-command-palette.md) | P2 | 012, 003 | DEFERRED |
| [026 Align MultiSelect composition with Select without weakening array semantics](026-multi-select.md) | P2 | 013 | DEFERRED |
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

- Start with 001. Shared polymorphic-host support (003) does not need the browser harness; Card (009) needs neither polymorphism nor overlays.
- Overlay ancestry (004) precedes lifecycle extraction (005); floating bindings (006) can proceed independently after the browser harness.
- Button (007) validates native-tag and custom-component `as` inference plus behavior/ref/event forwarding. Input/Textarea/InputGroup (008) validates native-control targets and grouped presentation.
- Tabs (010) validates declarative collection registration plus optional root metadata and SSR boundaries.
- Dialog (011) validates a single primary styled Content anatomy and `Dialog.Trigger as={Button}` over the shared overlay behavior.
- Select internals (012) establish one behavior model that can consume either complete root metadata or declarative item registration; Select parts (013) then expose the composition-first public API.
- Candidate families can be selected individually. MultiSelect (026) follows Select so it reuses the same collection/composition rules.
- Shared base files and declaration fixtures are conflict hotspots. Execute overlapping edits serially or reconcile them before the next unit.
- Types, docs, generated API, direct callers, migration notes and regression evidence ship with each component plan; there is no final all-library migration task.

## Coverage of the original component matrix

| Directory / entry | Delivery |
| --- | --- |
| `src/elements/accordion` | [020](020-accordion.md) |
| `src/elements/avatar` | [027](027-avatar.md); standalone AvatarGroup remains unchanged. |
| `src/elements/badge` | UNCHANGED — retain the current leaf API. |
| `src/elements/button` | [007](007-button.md); standalone ButtonGroup remains unchanged. |
| `src/elements/card` | [009](009-card.md) |
| `src/elements/collapsible` | [021](021-collapsible.md) |
| `src/elements/icon` | UNCHANGED — retain the current leaf API. |
| `src/elements/kbd` | UNCHANGED — retain the current leaf API; standalone KbdGroup remains unchanged. |
| `src/elements/list` | UNCHANGED — retain the current leaf API. |
| `src/elements/progress` | UNCHANGED — retain the current leaf API. |
| `src/elements/resizable` | [034](034-resizable.md) |
| `src/elements/separator` | UNCHANGED — retain the current leaf API. |
| `src/forms/checkbox` | UNCHANGED — retain the current leaf API. |
| `src/forms/checkbox-group` | [023](023-checkbox-group.md) |
| `src/forms/file-upload` | [030](030-file-upload.md) |
| `src/forms/form` | [022](022-form-field.md); bound form.Form stays single. |
| `src/forms/input` | [008](008-input.md) — native control target. |
| `src/forms/input-group` | [008](008-input.md) — new grouped composition surface. |
| `src/forms/input-number` | [028](028-input-number.md) |
| `src/forms/radio-group` | [024](024-radio-group.md) |
| `src/forms/select` | [012](012-select-internals.md), [013](013-select-parts.md), [026](026-multi-select.md) |
| `src/forms/slider` | [029](029-slider.md) |
| `src/forms/switch` | UNCHANGED — retain the current leaf API. |
| `src/forms/textarea` | [008](008-input.md) — native control target; grouped composition moves to InputGroup. |
| `src/navigation/breadcrumb` | [031](031-breadcrumb.md) |
| `src/navigation/command-palette` | [025](025-command-palette.md) |
| `src/navigation/pagination` | [032](032-pagination.md) |
| `src/navigation/sidebar-frame` | [033](033-sidebar-frame.md) |
| `src/navigation/stepper` | Independent future design task; existing behavior unchanged. |
| `src/navigation/tabs` | [010](010-tabs.md) |
| `src/overlays/context-menu` | [019](019-context-menu.md) |
| `src/overlays/dialog` | [011](011-dialog.md) |
| `src/overlays/dropdown-menu` | [018](018-dropdown-menu.md) |
| `src/overlays/modal` | [014](014-modal.md) |
| `src/overlays/popover` | [016](016-popover.md) |
| `src/overlays/sheet` | [015](015-sheet.md) |
| `src/overlays/tooltip` | [017](017-tooltip.md) |

The matrix still covers every original public component directory; plan 008 additionally creates InputGroup as a deliberate new composition family.

## Ablation: considered and rejected

- Reject a second parallel API where roots auto-assemble an entire widget only when `children` is omitted. The target anatomy is explicit composition.
- Reject mandatory root `items` / `options` for static declarative structure. Keep them as optional complete-collection metadata when they provide real capability.
- Reject `Tabs.Items` and equivalent collection assemblers whose only job is to hide a normal `<For>` loop.
- Reject keeping an Input/Textarea layout wrapper merely to preserve old ref/class targets. Group composition belongs in InputGroup; leaf control props target the native element.
- Reject Dialog `Panel` versus raw `Content` as two primary composition modes. `Dialog.Content` is the documented styled surface; stable portal/overlay/focus plumbing remains internal or configurable through actual public needs.
- Reject a second host-level `render` prop. Host replacement belongs to `as`; `children` stays the content channel.
- Preserve independent ButtonGroup/AvatarGroup/KbdGroup exports and theme keys; do not introduce parent aliases just for visual namespace symmetry.
- Card remains explicit manual structure; no mode prop, automatic body wrapping or duplicate convenience assembly.
- FileUpload.Name/Size remain unnecessary; native markup inside the item rendering path is sufficient.
- Reject a universal collection abstraction, public primitive package, global environment/provider rewrite, broad callback rename and blanket polymorphic retrofit.
- New Stepper design remains deferred.
- Existing SSR infrastructure, stale-positioning protection, theme replacement and API extraction are retained.

## Verification baseline and limitations

Package scripts and existing test infrastructure were inspected, not executed while revising these plans. `nub run test:browser` is owned by plan 002; downstream plans must not claim it exists until 002 lands. Production checks may generate artifacts or format source, so they belong to implementation execution. Upstream source reuse must record exact source revisions and license obligations when code is actually adapted.