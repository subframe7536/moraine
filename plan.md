# Tree Component Implementation Plan

## 1. Goal and Scope

Add a Moraine-owned Tree primitive in `src/components/tree/`, alongside `List` and `Accordion`.
Target the current Solid 1.x runtime and existing Moraine styling, reactivity, SSR, and test conventions.

### V1 inclusions

- Nested synchronous reactive data with stable string IDs.
- Controlled and uncontrolled expansion; built-in `expandAll()` / `collapseAll()`.
- Optional single and multiple selection, including range selection that preserves a pre-range snapshot.
- APG Tree keyboard navigation, typeahead, disabled-node skipping, roving `tabindex`, and focus recovery.
- Nested parent/child DOM with expand/collapse height animation via private `TreeGroup`.
- Flat virtual rows through `createListVirtualizer`, with key-stable measurements.
- Custom `itemRender`, SSR/hydration, and a consumer bundle that does not pull the virtualizer runtime.

### V1 exclusions

Checkbox propagation / cascade (entire package post-V1), child loaders, loading/cache state, search/filtering, rename, drag-and-drop, plugin authoring, virtual exit-row retention, sibling FLIP, virtual insert-range / visual-gap insert animation, and per-item insert motion.
Add no package dependency.

Virtual collapse is immediate in every phase. Nested height expand/collapse (Phase 3 / §9) is in V1; virtual insert animation is cut entirely (see Locked decisions).

---

## Locked decisions (Jerry)

Recorded 2026-10-23 (Beijing). These supersede earlier wording in this plan where they conflict.

1. **API:** only `createTree` (Decision 2A). No standalone `<Tree items={...}>` root.
2. **Path:** `src/components/tree/`.
3. **Checkbox / cascade:** entire package post-V1 (see V1 exclusions).
4. **Phase 1 virtualizer cache fix** ships **with** Tree (same PR series), not a standalone merge / “own commit” / “ships on its own”.
5. **AT browser matrix:** defer; match existing Moraine components.
6. **Animation:** keep nested height expand/collapse via `TreeGroup` / `createDisclosureState` (§9). Cut virtual insert-range / per-row insert reveal animation (former Decision 1B Phase 5 visual-gap, §10.2–10.3, Phase 5). If insert/expand animation means child items themselves rather than height, that feature is removed. Height-collapse only.
7. Earlier “V1 includes Phase 5 animation” is superseded: V1 includes nested height animation (Phase 3); virtual insert animation is cut entirely (not deferred).

---

## 2. Architectural Decisions

### Decision 1B — Phase 1 key-stable measurements only; no shared virtual insert animation

A Tree-owned motion block (`tree-virtual-motion.ts`) would be a second renderer beside virtual rows. It cannot push absolutely positioned siblings, desynchronizes `scrollToIndex` indices, and leaves the existing `measure()` cache wipe unsolved. That approach stays rejected.

Do this instead:

1. **Phase 1:** stop calling `virtualizer.measure()` on middle insert/delete. Keep TanStack's key-keyed `itemSizeCache`. Land in the same PR series as Tree (see Locked decisions).
2. **Cut:** the former Phase 5 visual-gap insert animation in `createListVirtualizer` (virtual insert-range / per-row insert reveal). Do not add `VirtualRenderProps.transition` for insert animation. Virtual inserts are immediate.
3. Nested height expand/collapse remains the Accordion / `TreeGroup` / `createDisclosureState` path (§9). `transition` on `tree.Tree` continues to gate that nested height animation only.

Do not interpolate item sizes inside virtual-core. Feeding a growing height into measurements fights `ResizeObserver`, reallocates measurements every frame, and stacks clipped rows on top of each other.

### Decision 2A — one factory entry

Do not ship both `<Tree items={...}>` and `createTree()`. Follow `createForm`:

```ts
const tree = createTree(options)
<tree.Tree aria-label="Project files" />
```

`TItem` is inferred once. Bound parts (`tree.Tree`, `tree.Item`, `tree.ItemIndicator`, `tree.ItemLabel`) share that instance. Do not export a standalone `Tree` root that accepts collection props.

---

## 3. Public API

```tsx
const tree = createTree({
  items: () => props.items,
  getItemId: item => item.id,
  getItemChildren: item => item.children,
  getItemText: item => item.name,
  isItemDisabled: item => Boolean(item.disabled),
  defaultExpandedItems: ['root-1'],
  selection: {
    mode: 'multiple',
    selectedItems: selected,
    onSelectedItemsChange: setSelected,
  },
})

<tree.Tree aria-label="Project files" />
```

```ts
export namespace TreeT {
  export interface CreateOptions<TItem> {
    readonly items: readonly TItem[] | (() => readonly TItem[])
    getItemId(item: TItem): string
    getItemChildren(item: TItem): readonly TItem[] | undefined
    getItemText(item: TItem): string
    isItemDisabled?(item: TItem): boolean
    readonly expandedItems?: () => readonly string[]
    readonly defaultExpandedItems?: readonly string[]
    onExpandedItemsChange?(items: readonly string[]): void
    readonly selection?: SelectionOptions
  }

  export interface SelectionOptions {
    readonly mode?: 'single' | 'multiple'
    readonly selectedItems?: () => readonly string[]
    readonly defaultSelectedItems?: readonly string[]
    onSelectedItemsChange?(items: readonly string[]): void
  }
}
```

- Normalize `items` with `typeof options.items === 'function' ? options.items : () => options.items`.
- Controlled expansion and selection are accessors only. A static array passed as `expandedItems` would lock the tree forever because `createTree` options are not reactive. Static initials use `defaultExpandedItems` / `defaultSelectedItems`.
- `getItemId` returns a stable, globally unique string. Do not synthesize path or index IDs.
- `getItemText` is required for the default label and typeahead.
- Empty `getItemChildren` means a leaf (or an empty branch), not an unloaded branch.

`createTree` returns `TreeT.Instance<TItem>`:

```ts
export namespace TreeT {
  export interface Instance<TItem> {
    readonly visibleNodes: readonly Node<TItem>[]
    readonly expandedItems: readonly string[]
    readonly selectedItems: readonly string[]
    getNode(id: string): Node<TItem> | undefined
    getItemText(node: Node<TItem>): string
    expand(id: string): void
    collapse(id: string): void
    toggleExpansion(id: string): void
    expandAll(): void
    collapseAll(): void
    select(id: string): void
    toggleSelection(id: string): void
    selectRange(anchorId: string, targetId: string): void
    focus(id: string): void
    Tree: (props: Props<TItem>) => JSX.Element
    Item: Component<ItemProps<TItem>>
    ItemIndicator: Component<ItemIndicatorProps>
    ItemLabel: Component<ItemLabelProps>
  }
}
```

`tree.Tree` accepts presentation and rendering props only: required `aria-label` or `aria-labelledby`, `transition?: boolean` (default `true`), `itemRender?: Component<ItemRenderProps<TItem>>`, paired `virtualRender` / `scrollToIndex`, and family `classes` / `styles` / `class` / `style`. It does not accept data, expansion, or selection.

One instance mounts at most one `tree.Tree`. A second mount is a development warning. Binding APIs stay private.

`focus(id)` targets an existing visible enabled node and does not expand ancestors. With no mounted `tree.Tree`, it records the request; mounting must not autofocus the document.

Export `createTree`, `TreeT`, and `TreeProps` only. No `CreateTreeOptions` / `TreeController` aliases.

---

## 4. Collection and State

`tree-collection.ts` builds a node-by-ID map and a visible preorder.

```ts
export namespace TreeT {
  export interface Node<TItem> {
    readonly id: string
    readonly item: TItem
    readonly parentId: string | null
    readonly childIds: readonly string[]
    readonly level: number // 1-based
    readonly posInSet: number // 1-based, includes disabled siblings
    readonly setSize: number
    readonly isBranch: boolean
    readonly disabled: boolean
  }
}
```

Store hierarchy once on the node. Derive root IDs and visible-index lookup as needed. Do not keep parallel parent/children maps. Normalization is independent of visibility: expansion changes the visible preorder; focus and selection do not rebuild the node map.

`itemRender` index is the current visible index, not identity. It is `-1` for a retained normal-mode exit row that is no longer logically visible.

Use prototype-safe dictionaries (`Object.create(null)` or `Map`) so IDs such as `constructor` and `__proto__` work. Diagnose duplicate IDs, repeated parent ownership, and cycles in development. Traversal must terminate on cyclic input in production.

```ts
interface InternalTreeState {
  expanded: Record<string, true | undefined>
  focusRequest: { id: string; seq: number } | null
  selection?: {
    selected: Record<string, true | undefined>
    anchorId: string | null
    rangeSnapshot: Record<string, true | undefined>
  }
}
```

Use `createStore` + `produce()`. Instantiate `selection` only when configured. Do not copy source data or visible nodes into the store. One draft update per semantic interaction.

---

## 5. Controlled Values and Expansion

External accessors are the only truth in controlled mode. Compute the next IDs, invoke the callback once, and wait. Do not optimistically mirror controlled values.

Uncontrolled mode initializes defaults once and mutates the store. Empty arrays are valid. Keep value order deterministic. Suppress callbacks when membership does not change. Focus and anchor may update independently.

Unknown IDs stay in stored/external values across source refreshes. They are not rendered or targeted. Additive operations keep them. A replacing selection (`select`, Enter, or plain pointer activation) replaces the whole set, including unknown IDs. Collapsing a branch keeps descendant expansion and selection IDs.

A refused controlled collapse must not hide nodes or move focus. Animations observe committed expansion only.

`expandAll()` / `collapseAll()` change currently existing enabled branch IDs in one draft or one callback, preserve disabled flags and unknown IDs, and do not change selection. They do not take a special animation-suppression flag: nested groups expanding together match Accordion expanding several items.

---

## 6. Disabled Policy

Disabled applies to that node only and is not inherited.

- Render `aria-disabled`. The node is not selectable, focusable, or a typeahead target. Pointer actions and single-node commands are no-ops.
- User interaction and bulk commands cannot expand or collapse a disabled branch.
- External controlled/default expansion may still expose enabled children.
- Existing selected/expanded IDs remain when a node becomes disabled. Ranges skip disabled nodes; they never add them.
- Left Arrow skips disabled ancestors. Right Arrow skips disabled descendants inside the expanded node's visible subtree.
- A disabled selected node is not an initial focus candidate.

---

## 7. Selection

Omitting `selection` disables selection. When present, `mode` defaults to `'single'`. Values are readonly string arrays. Single mode uses at most one ID; diagnose larger supplied/default arrays in development and use the first ID. Do not emit automatic corrections.

When unconfigured or in single mode, `selectRange` is a no-op.

Focus and selection are independent.

### Single

Plain click, Enter, and Space select the enabled target and replace the previous ID. Repeat does not deselect. `toggleSelection(id)` deselects an already selected target or replaces selection with that target.

### Multiple

| Action                         | Selection                      | Anchor                       |
| ------------------------------ | ------------------------------ | ---------------------------- |
| Arrow / Home / End / typeahead | Move focus; keep selection     | Preserve                     |
| Space                          | Toggle focused node            | Update when adding           |
| Enter or plain click           | Select target alone            | Target; `rangeSnapshot = {}` |
| Ctrl/Meta + click              | Toggle target                  | Update when adding           |
| Shift + Up / Down              | Move focus; apply active range | Preserve resolved anchor     |
| Shift + Space / Shift + click  | Apply active range to target   | Preserve resolved anchor     |

Active range:

```text
rangeSnapshot ∪ enabledVisiblePreorder(anchor, target)
```

Capture `rangeSnapshot` when the current anchor is established (plain click, Enter, Space without Shift, or Ctrl/Meta+click that selected a node). Extending adds newly encompassed enabled nodes. Shrinking toward the anchor drops nodes that were only in the range and keeps snapshot members. Disabled nodes in the span are skipped. Hidden and unknown snapshot IDs stay selected.

If the stored anchor is missing, collapsed, or disabled, resolve to the current enabled focused node, else the target. For pointer range, resolve the fallback **before** moving focus. Write the resolved fallback back into the store.

`selectRange(a, b)` requires eligible visible endpoints, snapshots the current selection, applies the union formula, and sets `a` as the new anchor.

No Ctrl/Meta+A in V1. Range keys require Shift without Ctrl/Meta/Alt. Resolve commands before typeahead. Ignore `event.defaultPrevented`, `event.isComposing`, and `event.keyCode === 229` at the root keyboard entry. Do not add a shared composition helper.

This snapshot model is Tree's contract. Do not call it APG-standard; APG does not specify shrinking against a snapshot.

---

## 8. Keyboard and Pointer Isolation

Bind **one** keydown listener on `role="tree"` and dispatch against the effective focused node. Do not attach per-item keydown listeners.

| Key           | Behavior                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Right         | Expand a collapsed branch without moving focus; else move to the first enabled visible descendant; leaf is a no-op |
| Left          | Collapse an expanded branch without moving focus; else move to the nearest enabled visible ancestor                |
| Down / Up     | Next / previous enabled visible node                                                                               |
| Home / End    | First / last enabled visible node                                                                                  |
| Enter / Space | Selection if configured; otherwise Enter toggles a branch and Space is a no-op                                     |
| Printable     | Typeahead via `createTypeahead()` among enabled visible nodes                                                      |

Navigation does not wrap. Consume only recognized commands. Preserve Tab and browser shortcuts.

Pointer selection and expansion bind to `data-slot="tree-item-content"`, not the outer `role="treeitem"` that wraps child groups.

If `event.target.closest('button, a, input, select, textarea, [data-tree-interactive]')`, ignore the event for navigation and row selection.

`tree.ItemIndicator` calls `preventDefault()` on click so it can toggle expansion without selecting. Row handlers **must** honor `defaultPrevented`. Do not `stopPropagation()`.

Reuse `createTypeahead()` with visible nodes, disabled filtering, current visible index, and `getItemText`. Compose IME protection at the root handler; the typeahead helper does not.

---

## 9. Nested DOM and TreeGroup

Normal rendering uses recursive parent/child groups. Virtual rendering uses a flat `visibleNodes` list. Both share the same collection, effective expansion, and visible preorder. A parent is a `tree.Item` with children, not a separate public family.

```html
<div role="tree" aria-label="Project files">
  <div role="treeitem" aria-label="Source" aria-expanded="true" tabindex="0">
    <div data-slot="tree-item-content">
      <span data-slot="tree-item-indicator" aria-hidden="true"></span>
      <span data-slot="tree-item-label">Source</span>
    </div>
    <div role="group" data-slot="tree-group">
      <div data-slot="tree-group-body">
        <div role="treeitem" aria-label="index.ts" tabindex="-1">
          <div data-slot="tree-item-content">
            <span data-slot="tree-item-label">index.ts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Every treeitem sets `aria-label` from `getItemText(node)` unless the caller supplied `aria-label` / `aria-labelledby`. A parent's accessible name must not include descendant labels.

Private `TreeGroup` uses **only** `createDisclosureState()`. That helper already owns `createTransitionPresence`, height measurement, `inert`, `aria-hidden`, `shouldMount`, and `initialOpen`. Do not construct a second presence. Do not mount `Collapsible` or `Collapsible.Trigger`. Do not register a disclosure trigger and do not call `restoreTriggerFocus()`.

Follow Accordion/Collapsible geometry:

- Register the inner body with `registerMeasureElement` and the outer group with `registerPresenceElement`, so an animating ancestor is never the natural-height source.
- Reuse `--mo-collapsible-content-height` and `accordion-down` / `accordion-up`.
- Use Collapsible's `data-transition:` height wrapper so `transition={false}` unmounts immediately.
- Initially expanded groups use `height: auto` / `animation: none` via `initialOpen()` on the server and during hydration.
- After a user-driven open, keep the measured pixel height (Accordion's model). Do not add a post-animation `height: auto` state to `createDisclosureState`. Accept one-frame clipping while a nested child is measuring, and one `ResizeObserver` per open group.

On expand, mount children lazily, measure, and animate to content height.

On collapse, remove descendants from logical `visibleNodes` immediately. Keep mounted DOM until presence completes. During exit the group is `inert` and `aria-hidden`; descendants are ineligible for tab stops, typeahead, selection, and navigation. Render recursive `childIds` under the presence boundary; do not filter `visibleNodes` or the subtree unmounts before it can exit. Reopen during exit reuses retained content. Source removal disposes the group.

Focus must leave the exiting subtree before it becomes inert:

- Uncontrolled user collapse: move focus in the event handler **before** writing expansion.
- Controlled / external collapse: a layout effect may run after attributes commit. jsdom does not implement `inert`. Also recover on Tree `focusout` when `relatedTarget` is null. Verify the ordering in a real browser (Phase 3).

`transition` on `tree.Tree` defaults to `true`. Reduced motion uses `motion-reduce:animate-none` for CSS keyframes. No extra animation timer; presence completion is enough. Missing theme, cancelled animation, and `transition={false}` must not leave a stuck retained subtree.

---

## 10. Virtualization

Reuse `createListVirtualizer` and the List `virtualRender` contract. Require both `virtualRender` and `scrollToIndex` or neither. Entries are `TreeT.Node<TItem>` from `visibleNodes`, keyed by `node.id`. Ordinary Tree imports only types from that contract, never virtualizer implementation.

```tsx
const virtualizer = createListVirtualizer<TreeT.Node<FileNode>>({
  estimateSize: () => 32,
  getItemKey: node => node.id,
})

<tree.Tree
  aria-label="Large file tree"
  class="h-72 overflow-y-auto"
  virtualRender={virtualizer.virtualRender}
  scrollToIndex={virtualizer.scrollToIndex}
/>
```

### 10.1 Key-stable measurements (Phase 1)

`itemSizeCache` in virtual-core 3.19 is already `Map<Key, number>`. The defect is local: `createListVirtualizer` calls `virtualizer.measure()` when a shared-prefix key changes (`src/shared/list-virtualizer.tsx`). `measure()` clears the whole cache.

Fix:

- When the key sequence changes, replace the `getItemKey` function identity passed into `setOptions` so `getMeasurementOptions` rebuilds from index 0 and reads sizes by key.
- Do not call `measure()`. Drop the microtask remeasure loop that exists only to recover from that wipe.
- After each entries sync, delete cache keys that are not in the current key set so collapsed or removed rows cannot grow the map without bound. Re-expansion remounts and remeasures.

Do not reset a key because its estimate changed: a measured key already ignores the estimate.

Cover middle insert, middle delete, and mixed measured/estimated rows in `list-virtualizer.test.tsx`. This change helps List and Combobox and lands in the same PR series as Tree (see Locked decisions).

### 10.2 Insert animation model — CUT

**Cut.** Former Phase 5 visual-gap / virtual insert-range / per-row insert reveal animation in `createListVirtualizer` is removed entirely (not deferred). See Locked decisions (Jerry). Do not implement the steps that used to live here.

### 10.3 Interruption — CUT

**Cut.** Insert-animation interruption / snap-on-input belonged to the removed Phase 5 model. See Locked decisions (Jerry). Virtual inserts are immediate; there is nothing to interrupt.

### 10.4 Virtual collapse and SSR

Virtual collapse is immediate: descendants leave `visibleNodes` and the virtualizer at once. If Tree holds DOM focus, recover to the collapsing parent (or nearest enabled visible ancestor) and scroll only as needed. If focus is outside Tree, do not focus or scroll to the parent; keep a surviving row's id and viewport offset, or the nearest survivor, clamped to the new scroll range.

Virtual SSR matches List today: the server emits an empty virtual shell, and rows mount after the client measurement microtask (`list.ssr.test.tsx`). The Tab entry on the server is therefore the root. After hydration, transfer to the logical target once its row registers. Do not try to paint virtual treeitems on the server.

---

## 11. Focus

Exactly one Tab stop at every settled state:

- Eligible target mounted: that item `tabindex=0`; root and other items `-1`.
- Target unmounted, empty, or all disabled: root `tabindex=0`; mounted items `-1`.

Effective focus is `createMemo(previous => …)`. `focusRequest` is `{ id, seq }`. Consume a request only when `seq` changes and that id is currently eligible. Afterwards recover from `previous`, not from a stale requested id (a removed-then-restored node must not snap back).

Recovery order after the request is ineligible or absent:

1. Nearest surviving enabled visible ancestor.
2. Previous nearby survivor from the previous derived order.
3. Next nearby survivor.
4. First enabled visible node.
5. `null`.

On first entry (`previous` is unset): first enabled visible **selected** node (skipping disabled selected nodes), else first enabled visible node.

Retain only the previous derived order/ancestry needed for recovery. Do not write derived focus back from an effect. User navigation and `tree.focus` increment `seq`. Effects sync DOM focus from the resolved target and registered elements.

Update the logical tab stop on every collection change. Move **DOM** focus only if Tree held focus when recovery became necessary. Leaving Tree cancels pending focus work. Never focus a row merely because it mounted or received data.

User Tab (or click) onto the root: request the logical target, `scrollToIndex`, and transfer after the row registers. Internal transfer to the root because a virtual row unmounted is **not** user entry and must not scroll back. After keyboard input or a new user focus-entry, resume row focus.

For an unmounted target:

1. Record the latest `focusRequest`.
2. `scrollToIndex` after collection/DOM settle.
3. Focus only a connected, registered row that still matches that id and `seq`.
4. Cancel when focus leaves Tree or the target becomes ineligible.

Stale refs, delayed scrolls, and recycled indices cannot claim focus. No TanStack focus adapter.

---

## 12. DOM, ARIA, and Recipe

Slots: `root`, `item`, `itemContent`, `group`, `itemIndicator`, `itemLabel`. `data-slot` is kebab-case. No Branch/Leaf public API. Group body classes stay private in `tree.recipe.ts`.

- Root: `role="tree"`, required `aria-label` or `aria-labelledby`, `aria-multiselectable="true"` only for multiple selection.
- Item: `role="treeitem"`, `aria-level`, `aria-posinset`, `aria-setsize` (hierarchy, including disabled siblings, not the virtual window).
- `aria-expanded` only on branches.
- `aria-selected` only when selection is configured; omit on unselected disabled nodes; keep `true` for an existing selected disabled id.
- Default accessible name is `getItemText(node)`; caller `aria-label` / `aria-labelledby` win.

Check nested and flat virtual DOM with a real screen reader. Do not add `aria-owns` just to match a diagram.

Recipe `Variants = never`. Register `tree: TreeStyleConfig` on `MoraineStyleSchema`. Resolve with `useRecipe()`. Parts inherit family presentation from context.

Declare `'--tree-indent': '1rem'` on recipe `base`. Inject `--tree-level` on `itemContent` through `vars`. Indent with a utility on `itemContent` (for example `ps-[calc(var(--tree-level)*var(--tree-indent))]`) so nested groups do not double-indent. Hover, selected, disabled, and focus visuals apply only to `tree-item-content`. `data-focused` means actual DOM focus, not a remembered tab stop.

Merge virtual positioning through `enforced` / `slotWith` so user styles cannot replace transforms or measurement refs. No file/folder icons or checkboxes. Rotating indicator on `data-expanded`.

Indicator is a `span`, no button role or tab stop. Focusing an indicator action focuses its item. Leaf indicators reserve alignment space only.

```tsx
<tree.Tree
  aria-label="Files"
  itemRender={(props) => (
    <tree.Item node={props.node} {...props.props}>
      <tree.ItemIndicator />
      <tree.ItemLabel>{props.node.item.name}</tree.ItemLabel>
    </tree.Item>
  )}
/>
```

`itemRender` is `Component<ItemRenderProps<TItem>>` (multi-instance). `tree.Item` merges virtual props, refs, and registration. Children fill `itemContent` only. In normal mode `tree.Item` renders its child group with the root's same renderer; custom renderers must not recurse or own transitions. Create child render boundaries only inside group presence, keep their owner through exit, and release on final unmount. Style props are `JSX.CSSProperties`.

---

## 13. Solid 1.x

Every `createEffect` uses `on()` with explicit dependencies. Derivations (`visibleNodes`, effective focus) are memos or accessors, never effect-to-store mirrors. Use `produce()` for interaction state. Do not add `createComputed`, resource/load state, `flush()`, or Solid 2 imports. Do not `untrack()` source reads.

The data contract stays synchronous. Async consumers resolve outside Tree.

Do not read newly visible children, scroll indices, or focus elements immediately after a store write; carry transition targets and sync DOM after committed visibility.

---

## 14. Files and Exports

```text
src/
├── components/
│   ├── list/list.types.ts
│   └── tree/
│       ├── index.ts
│       ├── tree.tsx
│       ├── tree-group.tsx
│       ├── tree-context.ts
│       ├── tree.types.ts
│       ├── tree.style-types.ts
│       ├── tree.recipe.ts
│       ├── tree-collection.ts
│       ├── tree-controller.ts
│       ├── tree-selection.ts
│       ├── tree-controller.test.tsx
│       ├── tree.test.tsx
│       ├── tree.ssr.fixture.tsx
│       └── tree.ssr.test.tsx
└── shared/
    ├── list-virtualizer.tsx
    └── list-virtualizer.test.tsx
```

No `tree-virtual-motion.ts`. Start cohesive; split only if a second responsibility appears.

Public: `createTree`, `TreeT`, `TreeProps`. Re-export from `src/components/index.ts` and `src/index.ts`. Add `tree: TreeStyleConfig` to `src/theme/types.ts`.

---

## 15. Tests

Do not spy on `produce()` or count setters. Assert one callback per changed operation, no intermediate visible state, and selection/focus independence.

### Controller and collection

Hierarchy, 1-based ARIA metadata, prototype IDs, cycle termination, controlled/uncontrolled expansion, unknown ID preservation, collapse keeping nested flags, bulk commands, disabled policy.

### Selection and keyboard

Single replacement and toggle. Multiple table, range extend/shrink against `rangeSnapshot`, disabled skipping, fallback anchor persistence, unknown IDs. Every navigation key, typeahead, IME/`defaultPrevented` guards. Row activation only on `tree-item-content`. Embedded controls ignored. Indicator click expands without selecting and without `stopPropagation`.

### Nested animation

Lazy mount and natural-height measure. Collapse removes logical descendants immediately and retains DOM until exit. Exit is inert/aria-hidden with no descendant tab stops. Focus recovers before inaccessibility, including external controlled collapse and `focusout` with null `relatedTarget`. Refused controlled changes start no exit. `transition={false}` and reduced motion settle without an animation event. Reopen during exit reuses nodes. Source removal disposes the group. Do not duplicate the presence helper's full matrix.

### Virtualizer (Phase 1, then Phase 4)

Phase 1: middle insert/delete keeps measured sizes for remaining keys; absent keys are dropped.

Phase 4: real `createListVirtualizer`, thousands of descendants, constrained viewport. Arrow/Home/End/typeahead to unmounted rows. Expansion changes indices/keys. Rejected controlled expansion changes nothing. Virtual collapse, scroll anchors, root fallback, wheel-unmount without scroll-back, recycled rows cannot take the wrong focus. Server empty shell; client rows after hydration. Virtual inserts are immediate (no insert-reveal animation).

### SSR

Hydration reuses nodes and boundaries. Nested initially expanded groups are natural height; collapsed groups do not construct hidden descendants. Virtual fixture matches List's empty shell then client rows. No `window` / `document` / idle timers on the server.

### Types and packaging

Instance inference including `tree.Item` generics. Required accessible name. Paired virtual props. `transition` accepted in both paths. Namespace exports in default and simple consumer fixtures. Non-virtual Tree resolves without `@tanstack/virtual-core` installed.

### Browser checks (not jsdom)

Record browser and AT. Report skipped checks; do not claim success:

- Nested height animation, reduced motion, `inert` vs focus recovery.
- Virtual scroll anchors, Tab entry, wheel-unmount.
- Screen-reader hierarchy on nested DOM and flat virtual rows.

---

## 16. Documentation and Phases

Add `docs/pages/components/tree/index.mdx` with `group: Display`. Cover `createTree` / `tree.Tree`, nested animation, `transition={false}`, selection, controlled expansion, custom items, disabled behavior, bulk commands, virtualization, keyboard, accessibility, and API.

The API generator reads component props, not factory methods. Document `CreateOptions` and instance methods on the page and verify llms output. Do not turn the generator into an export scanner.

Document key-stable measurements in `docs/pages/docs/(guides)/virtualization.mdx` if Tree docs touch virtualization. Do not document visual-gap insert animation (cut). Examples must not introduce a rendering-mode prop. No Solid 2-only async examples.

### Phase 1 — virtualizer cache

Key-stable measurements only. Tests in `list-virtualizer.test.tsx`. Lands in the same PR series as Tree (may be the first commits in that series); not a standalone merge.

### Phase 2 — collection and controller

`tree-collection.ts`, `tree-selection.ts`, `tree-controller.ts`, `createTree`, `TreeT`. Tests in `tree-controller.test.tsx`.

### Phase 3 — recipe and nested Tree

Recipe, `TreeGroup` via `createDisclosureState` only, `tree.tsx` parts, keyboard, focus. Interaction and nested height animation tests. Browser `inert` / AT checks (AT matrix deferred; match existing Moraine components — see Locked decisions).

### Phase 4 — virtual Tree (immediate inserts)

Wire `virtualRender` / `scrollToIndex`. Root fallback, scroll anchors, SSR empty shell. Integration tests. Virtual inserts are immediate. `transition` on `tree.Tree` gates nested height animation only (§9), not virtual insert motion.

### Phase 5 — docs and packaging

Docs, consumer fixtures, `pnpm run lint`, `format`, `typecheck`, `test:lib`, `test:docs`, `docs:build`, `git diff --check`, then `pnpm run qa` before any commit. Do not edit `dist` by hand.

One source for application data, one source for each controlled value, one owner for DOM focus.
