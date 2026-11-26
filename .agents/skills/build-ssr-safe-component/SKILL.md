---
name: build-ssr-safe-component
description: Design, review, and refactor Moraine Solid 2 components for JSX ownership, reactive updates, and SSR hydration safety. Use when creating components, changing JSX slots or render props, or reviewing existing SSR adaptations.
---

# Build an SSR-Safe Component

Validate JSX ownership, lazy mounting, and hydration behavior against the installed Solid 2 runtime
when creating or changing a component. Solid 2 is not Solid 1.x and is not React; do not import
patterns from either without checking them here.

Authoritative references, in order:

1. the installed runtime in `node_modules/solid-js` and `node_modules/@solidjs/web`;
2. `node_modules/solid-js/CHEATSHEET.md`;
3. the Solid 2 SSR-safe-code guide and API docs;
4. Moraine's current helpers and tests.

Apply the gates relevant to the change; an example's syntax is not a universal implementation
requirement. Match coverage to the requested scope. A full-library review includes public exports,
attached components, bound components, and shared rendering infrastructure; a focused change follows
only the affected rendering paths.

## Establish Runtime Evidence

For a suspected regression, reproduce observable behavior before choosing a fix. Inspect the
installed Solid runtime when ownership, hydration ids, or evaluation timing is unclear. Use getter,
mount, and cleanup counters as probes alongside DOM identity, reactive updates, and real
SSR/hydration assertions. Remove a candidate change in isolation to establish whether it is
necessary; restore temporary instrumentation afterward.

Compare baseline and candidate behavior with the same probe. Verify that the candidate reached both
server and client execution paths and that the relevant tests ran; unused transforms or skipped
tests cannot establish that an adaptation is unnecessary.

Do not infer a hydration bug from a getter-count assertion alone. Ordinary scalar props such as
`orientation`, `disabled`, or numeric values may be read by multiple consumers. Do not add memos
or single-read tests for those props unless an explicit API contract or measured computation cost
requires it. Test their observable semantics and reactive updates instead. JSX-producing getters
differ because reading them can instantiate nodes and owned computations.

Treat Solid diagnostics as evidence, not noise. Dev diagnostics have stable codes; consult
`node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md` and fix the cause. Never suppress
`STRICT_READ_UNTRACKED` with `untrack` merely to silence it.

## Gate 1: Inventory the JSX API

Before implementation, list every prop that can contain JSX, a component, or a render function.
Classify each value exactly once:

| Kind                                  | Examples                                                                        | Resolution rule                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Actual children                       | `children`                                                                      | Render directly in a stable, single consumer; resolve when inspected, normalized, reused, retained, or mounted with render props |
| Arbitrary JSX slot                    | `title`, `header`, `footer`, `label`, `description`, `content`, `error`, `icon` | Cache repeated reads in the mounting scope; do not apply `children()` indiscriminately to component-capable values             |
| Reusable / multi-instance render prop | `itemRender`, `tagRender`, `separatorRender`, `linkRender`                      | Type strictly as `Component<*RenderProps>` (never static `JSX.Element`). Preserves component boundary across loop items.       |
| Single-usage contextual render slot   | `topRender`, `bottomRender`, `emptyRender`, `leadingRender`, `trailingRender`   | Type as `JSX.Element \| Component<*RenderProps>`. Do not duplicate the part name (e.g. `topRender`, not `contentTopRender`).   |
| Preconstructed item data              | `items[].label`, `items[].content`                                              | Do not resolve globally unless a reactive getter is repeatedly evaluated by the owning component                              |

Reject the API design if a value has ambiguous semantics. A function must not sometimes mean a
component and sometimes mean ordinary data. Reusable collection renderers must never accept static
`JSX.Element` because evaluating JSX creates one element instance that cannot be cloned across
multiple items.

Follow Moraine's namespace and public type rules from `AGENTS.md` while defining the API.

## Gate 2: Resolve JSX in the Correct Owner

Solid 2 memo semantics are precise and easy to confuse:

- `createMemo(fn)` computes immediately by default. An owned non-lazy memo lives for its owner's
  lifetime and does not autodispose.
- `createMemo(fn, { lazy: true })` defers the first compute, but opts into autodisposal: after its
  last subscriber is gone, a later read computes again. That can recreate JSX and owned state.
- `children(fn)` is lazy in Solid 2. Creating it does not evaluate `fn`, but on the client its lazy
  memos have the same autodisposal hazard when reads are unobserved.
- Moraine's `createLazyMemo` (`src/shared/create-lazy-memo.ts`) is the lazy-but-retained
  primitive: it defers creation until first read, creates the real memo under the declaration owner,
  and reserves the hydration child id at declaration time under the ambient owner. Do not replace it
  with `createMemo(..., { lazy: true })`. `useRecipe` slot bindings rely on this reservation
  because server attribute serialization and hydration spread effects can first read the same slot
  at different times.
- Moraine's `resolvePropsChildren` (`src/shared/utils.ts`) is the canonical way to resolve a
  component's `children` prop. It reads the own `children` descriptor rather than a `pick`/`omit`
  props-view read, then pins the lazy children memo after first use so Solid 2 autodisposal cannot
  recreate the subtree.

### Actual children

A stable native container that neither inspects nor reuses children can render `props.children`
directly. Once children are inspected, normalized, reused, retained, or mounted with render props,
resolve them once with `resolvePropsChildren` and never read the original prop again:

```tsx
const resolvedChildren = resolvePropsChildren(local)
const hasChildren = () => hasContent(resolvedChildren())

<Show when={hasChildren()}>
  <div data-slot="content">{resolvedChildren()}</div>
</Show>
```

Pass the object whose own `children` descriptor would otherwise be read (`props` or the picked
props view). Do not call `resolvePropsChildren` twice for the same prop. Existing raw `children()`
call sites may predate the helper; migrate them when touching that ownership path, and keep evidence
if a raw call is intentionally retained.

A single source-level rendering site can execute again when a polymorphic root changes. Retain
children outside that replaceable root when their nodes and owned state must survive the change.
Verify identity, reactive updates, and cleanup before removing a resolver.

Children that may be either JSX or a render function use two stages, in this order:

```tsx
const child = resolvePropsChildren(local)
const resolvedChildren = createMemo(() =>
  renderWithProps(child(), {
    get loading() {
      return isLoading()
    },
  }),
)
```

`resolvePropsChildren` invokes zero-argument functions through Solid's `children` resolution.
`renderWithProps` (`src/shared/render-with-props.ts`) treats every function as a component and
mounts it with `createComponent`. Passing unresolved `local.children` to it can therefore mount a
control-flow accessor as if it were a user component and produce different server/client ownership.
Keep the resolution stage first.

The outer `createMemo` is eager. Creating these two stages in a closed overlay branch still reads
and mounts content immediately; for conditional content, create both stages inside the mounting
scope described in Gate 4.

A render function must declare one required, non-rest parameter, even an unused one, so its `length`
stays above zero. Resolution then leaves it in place and `renderWithProps` mounts it once through
`createComponent`. A zero-argument function is only an accessor: children resolution calls it and
also unwraps zero-argument functions in its return value. Do not create memos or nested control flow
there. A parameter with a default or a rest parameter also produces length zero and is treated as an
accessor.

`renderWithProps` calls `createComponent` directly rather than using a JSX boundary. Props passed in
its object therefore must be getters when the child needs later updates; a plain value is fixed at
mount. This is a deliberate exception to Solid 2's normal "pass values, not accessors" JSX rule.

State the parameter requirement on each public children prop. The SSR guide records the same
contract.

Use each resolution for one job:

| Resolution                                      | Use for                                                                           | Do not use for                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| `resolvePropsChildren`, then `renderWithProps`  | `children` typed as JSX or `(props) => JSX.Element`                               | Named `*Render` props                               |
| `renderWithProps`                               | A value that is already resolved, or a `*Render` component prop                   | An unresolved `children` accessor                   |
| `resolvePropsChildren`                          | Plain JSX children that are inspected, normalized, reused, or retained            | Render functions that still need props              |
| `createLazyMemo`                                | JSX props and item fields whose first evaluation should happen at the consuming read | Unconditional values that can be read directly      |
| `createMemo`                                    | Repeated reads of values that must exist now and must live for the owner          | Conditional JSX whose initial creation must be deferred |

`Field` remains an intentional exception: it reads `local.children` in one memo, then calls a
function value with its state inside a second memo, regardless of arity. The first memo keeps
mounted components from being recreated; the tracked call in the second keeps client `Show`
accessors reactive and matches the server. Do not generalize that exception without tests.

Do not use only `createMemo(() => local.children)` as a children resolver. Do not call the state
render prop directly. Do not special-case child resolution by size, variant, or visual child type.

Allow a falsy render result to omit its optional wrapper instead of creating an empty label/content
element. Keep resolution in the existing owner unless component ownership or context requires
another boundary. Do not introduce an internal component only to manipulate hydration ids; that
component adds another owner boundary and can hide the actual asymmetry.

### Arbitrary JSX props

When a JSX prop is consumed repeatedly, cache it in its mounting scope before condition checks,
normalization, classes, or rendering. Use `createLazyMemo` when the value may never be read or
first-read timing must follow the consuming branch; a single immediate rendering site may read the
prop directly. An existence check such as `<Show when={title()}>` is itself a read, so
`createLazyMemo` does not make that JSX lazy—it only caches the value created while deciding whether
the branch exists:

```tsx
const title = createLazyMemo(() => props.title)

<Show when={title()}>
  <div data-slot="title">{title()}</div>
</Show>
```

Do not use `children()` here. It recursively resolves functions and arrays and may invoke component
or render-prop values.

Cache the raw value before null/false normalization:

```tsx
const error = createLazyMemo(() => props.error)
const resolvedError = createMemo(() => {
  const value = error()
  if (value === false) return false
  if (value != null) return value
  return fieldError()
})
```

## Gate 3: Preserve Hydration Ownership Order

Solid 2 hydration is positional by owner child id. Server-rendered template roots carry `_hk`;
async answers and boundary data are keyed from the same owner tree. Memos, effects, control-flow
allocations, `createUniqueId`, `onSettled`, and portals can each consume a child-id slot. Ordinary
component owners are transparent and do not consume a slot themselves, but the order of id-consuming
primitives inside and around them still matters. The server does not run an `onSettled` callback,
but `onSettled` still reserves its hydration id.

Require server and client execution to allocate the same hydration-visible owners, primitives, and
keyed elements in the same order. Eventual DOM nesting is not sufficient evidence. Do not impose
parent-first creation as a universal rule; resolving children before a root `Dynamic`/`dynamic()`
component is valid when both environments follow the same sequence. Focus on asymmetric primitive
creation, asymmetric values, and helpers that interpret those values as components in only one
environment.

A client-only memo, effect, or owner with no server counterpart must use an explicit hydration
policy rather than accidentally shifting later ids:

- `transparent: true` is the narrow escape for client-only bookkeeping created while hydrating: it
  consumes no hydration id on the client, while SSR still allocates an id if the server creates the
  primitive. Do not use it to hide a real server/client structure difference.
- `ssrSource: "client"` defers a source until hydration completes. Declare `loadingValue` when a
  provisional value must render; otherwise a bare read suspends on the server to the nearest
  `Loading` fallback.
- `createLazyMemo` already reserves the eventual memo's id at declaration time. Keep that call in
  the same owner position on both sides.

During hydration, adopted async computes run once only to track reads while `Promise` and `fetch`
are replaced with stand-ins that never settle. Do not cache promises or `import()` results created
inside a compute in a cache that outlives that run. Never resolve an async memo or async iterable
source to rendered JSX on the server: elements cannot serialize for adoption and the memo rejects
with `ASYNC_MEMO_ELEMENT`. Return serializable data and render the JSX synchronously in the
component.

Resolve children inside a provider when they depend on that provider's context, then reuse the
resolved value for every branch. Do not add DOM wrappers or helper components only to alter
hydration order. Preserve existing owners and intentional `createComponent` boundaries.

### Normalize server and client values consistently

Child normalization must account for both opaque server render output and client DOM nodes. Do not
parse serialized HTML or depend on private render-object fields. In Solid 2 a server `Portal`
returns `undefined`, evaluates no children, emits no portal markup, and consumes the matching owner
slot; HTML comment markers are hydration structure, not renderable child content. Verify fragments,
conditional children, zero, empty strings, arrays, and portals against observable DOM behavior.

### Keep reactive JSX accessors live

A JSX accessor needs reactive insertion, while a component needs its component boundary. Invoking an
accessor through an untracked component path can freeze its initial value. Distinguish these paths
using the prop's contract and installed runtime semantics; function arity alone is insufficient for
every API because default parameters also produce zero-length functions. Preserve prop forwarding
and verify conditional replacement, updates, mounting, and cleanup.

Flow-callback bodies (`<For>`, `<Show>`, `<Match>`) are owners, not tracking scopes. Read
item/index/narrowed accessors in JSX, a memo, or an effect inside the callback, not at its top.

### Render deterministic structure and values

When a value decides which elements exist, server and client must use the same input. Compute
`Date.now()`, `Math.random()`, `crypto.randomUUID()`, `navigator.language`, and similar per-run
values once on the server and pass them as data, or keep the initial browser render equal and update
from `onSettled`. Text content is not compared during hydration, but structure is; do not use that
loophole to hide meaningful mismatches.

Use `createUniqueId`/`createId` for ids that link elements. On the server and during hydration
they derive from the same owner child ids; client-only renders use the client id namespace.

### Respect browser HTML parsing

The browser parser can rewrite valid-looking JSX before hydration: `<div>` inside `<p>`, rows
directly under `<table>` without `<tbody>`, nested links, and nested forms. The compiler cannot
catch nesting split across components. Write parser-preserving markup (`<tbody>` explicitly, flow
containers instead of `<p>` for blocks, no interactive ancestors inside links or forms). Treat
`INVALID_HTML_NESTING` and parser-related key misses as structural errors.

### Verify native boolean attributes

Use Solid 2's native attribute spelling at the DOM boundary, including forwarded props: lowercase
HTML attribute names, camelCase event props, and no `attr:`/`bool:`/`on:` namespaces. Boolean
attributes are presence/absence: `false` removes the attribute, and a string value of `"false"` is
still present.

`value={x()}`/`checked={x()}` writes when the binding re-runs; it does not compare with the DOM.
Typing is not reverted when the signal is unchanged, and unrelated binding re-runs can overwrite
uncommitted text. For editable controls, verify browser typing, transformation/rejection behavior,
SSR attributes, hydration, and true/false updates.

## Gate 4: Control Conditional Trees

For overlays and other presence-controlled components:

- Determine presence from open/transition state without reading a JSX-producing content getter.
- Initialize content resolvers only inside the present branch, including in public wrappers.
  Delaying the base component cannot undo a wrapper's earlier `createMemo()` or child resolution.
- A prop returning a component function can be read without mounting that function, but a raw JSX
  getter can create nodes immediately. Laziness of `children()` does not help once an eager memo
  reads it.
- Solid 2 portals are client-only islands: the server returns no children or markup. This does not
  make wrapper-side resolution lazy; moving a resolver inside the `Portal` expression only helps
  when evaluation of that expression is also deferred.

```tsx
<Show when={contentPresence.present()}>
  {(_present) => {
    const child = resolvePropsChildren(props)
    const content = createMemo(() =>
      renderWithProps(child(), {
        close: () => context.setOpen(false),
      }),
    )
    return <div>{content()}</div>
  }}
</Show>
```

In Solid 2, `Show` still recognizes a render callback using
`typeof child === 'function' && child.length > 0`. Keep a required parameter even when unused. A
zero-argument function is treated as an ordinary JSX accessor, which can acquire dependencies and
recreate content during unrelated updates. The client invokes a non-keyed function child untracked
with a narrowed accessor; the server invokes it with the current value's accessor. Test node
identity across trigger replacement and positioning updates.

A named function passed as the callback is equivalent to an inline callback when invoked in the same
owner and at the same time. Choose the clearer local form; do not add helpers or force inlining
merely to satisfy this skill. Moving resolver construction into a function only helps if its
invocation is also deferred.

### Browser-only state and client-only trees

`onMount` does not exist in Solid 2. Put browser-only setup in an effect's apply function or
`onSettled`; both are browser-only, while the server still reserves the primitive's hydration id.
Return cleanup from `onSettled` rather than registering component lifecycle cleanup separately.

Keep the first client render identical to the server. Seed browser-dependent state with the
server-safe value during hydration, then update it from `onSettled`:

```tsx
const [compact, setCompact] = createSignal(
  isServer || isHydrating() ? false : window.matchMedia('(max-width: 40rem)').matches,
)

onSettled(() => {
  const query = window.matchMedia('(max-width: 40rem)')
  setCompact(query.matches)
  const update = (event: MediaQueryListEvent) => setCompact(event.matches)
  query.addEventListener('change', update)
  return () => query.removeEventListener('change', update)
})
```

`isHydrating()` is not reactive; read it only where the initial value is created. `isServer`
prevents a server crash but does not make the two renders agree, so do not branch element existence
on `isServer` in JSX.

`createEffect` is split in Solid 2. Its compute runs on the server; its apply function does not.
Never put a browser-only read in the compute merely because the side effect is browser-only.

For a whole component that cannot run on the server, use `clientOnly` from `@solidjs/web` with a
server-rendered fallback. Use `ssrSource: "client"` for a client-only computation whose provisional
server value is explicit. Use `NoHydration` only for a subtree intentionally excluded from
hydration, understanding that the server can still emit its markup while hydration leaves that DOM
untouched; it is not a general replacement for matching server and client structure.

A hydrating `ref` runs before attachment and must not synchronously set state that reveals
SSR-absent nodes. Assign the element in the ref, then measure from an effect apply function,
observer, `onSettled`, or microtask according to the required timing.

## Gate 5: Test Observable Behavior and JSX Ownership

For JSX-producing props consumed from multiple paths, use a getter-backed test to detect duplicate
instantiation within one mount. Do not apply this assertion to ordinary scalar props:

```tsx
let reads = 0

render(() =>
  createComponent(NewComponent, {
    get children() {
      reads += 1
      return <span>Content</span>
    },
  }),
)

expect(reads).toBe(1)
```

Solid 2 writes are not visible synchronously. Use `flush()` before assertions after direct signal
writes, and prefer the repository testing-library wrapper that flushes after events.

Add applicable coverage for:

- Plain JSX children and slot props are not instantiated repeatedly within one mount.
- Lazy children do not recreate a subtree after becoming unobserved.
- Render-prop components are created once and remain reactive to state changes.
- Falsy render results omit optional wrappers.
- Empty, fallback, and reactive replacement behavior.
- Closed overlay content is not instantiated; opening mounts it, closing releases owned resources,
  and reopening may create a fresh instance. Force-mounted content retains its instance across
  open-state changes.
- Client-only or measured nodes match SSR during the first client render and change only after the
  documented post-hydration point.
- Responsive branches at mobile, tablet, and desktop widths start from the same server state.

JSDOM can detect hydration-key mismatches when tests hydrate actual SSR output; client-only
`render()` tests cannot. Production browser checks additionally cover build differences, layout,
visibility, and browser HTML parsing.

Create fixture JSX in its render or hydration owner. Defer inactive content so constructing input
data does not request hydration ids for nodes absent from the server output.

Capture server elements and their parents before hydration, then assert reuse; post-hydration
lookups and fixed key values cannot prove it. Isolate both bootstrap globals (`_$HY`) and runtime
hydration state for each test, since prior events or failures can switch later tests to client
rendering. Register cleanup before hydration, and keep version-specific state handling in test
infrastructure.

Development hydration diagnostics are specific. Treat every one as failure unless it is the explicit
subject of the test:

- `Hydration structure mismatch: expected <X> ...`
- `Hydration tag mismatch for key "..."`
- `Hydration key miss for "..."`
- `Hydration completed with N unclaimed server-rendered node(s)`
- `Hydration Mismatch. Unable to find DOM nodes for hydration key`
- `INVALID_HTML_NESTING`

Hydration can leave a mismatched server node in the document without attaching behavior, or create
the client node detached. For critical JSX, also assert in a production browser that the intended
node exists under its intended parent and remains interactive.

## Gate 6: Validate Production SSG

Run:

```sh
pnpm vitest run <focused-test-files>
pnpm run qa
pnpm run test
pnpm run docs:preview
```

Run a focused test file after building when it reads `dist/`. Use a real browser against the
production preview. Listen for uncaught exceptions, Solid diagnostics, and error-level console
messages. Verify the affected component routes and representative consumers of any changed shared
rendering infrastructure.

Identify which examples participate in SSR and which mount only on the client. Only server-rendered
examples can prove hydration reuse. Capture their nodes before client scripts run, and distinguish
expected post-mount responsive changes from missing or misplaced descendants.

Reload at mobile, tablet, and desktop widths. Responsive branches can consume different hydration
ids and expose a mismatch only at one breakpoint.

Reject completion if the console contains any hydration diagnostic listed in Gate 5, a Solid
reactivity diagnostic introduced by the change, or an uncaught error, even when `docs:dev` is clean.

Do not treat a clean console as sufficient. Compare critical SSR nodes with the hydrated DOM and
verify that visual nodes remain nested, have non-zero bounds, retain their effective icon or
background style, and remain interactive.

Do not manually edit `dist`. Run `git diff --check` and confirm no unintended dependency, lockfile,
generated output, or user configuration changes.

## Failure Triage

If production hydration fails:

1. Rebuild unminified with `pnpm --filter @moraine/docs exec vite build --minify false`.
2. Break in `@solidjs/web`'s `getNextElement` and inspect the first non-Solid stack frame.
3. When debugging the unminified client, use this conditional breakpoint inside `getNextElement`
   after `key` is initialized:

   ```js
   isHydrating() && !sharedConfig.registry.get(key)
   ```

4. Compare the prospective key with server `_hk` attributes and with the owner order that allocated
   it.
5. Check whether an earlier memo, effect, `onSettled`, control-flow allocation, Portal, or
   primitive inside a component consumed a slot on only one side.
6. Fix the earliest missing or shifted key first; downstream component errors often disappear
   afterward.
7. If the DOM itself is wrong before scripts run, inspect browser parser rewriting before inspecting
   Solid.

## Prior Art

Use the local Kobalte checkout only as historical evidence for the single-resolution pattern:

- `kobalte/packages/core/src/checkbox/checkbox-root.tsx`
- `kobalte/packages/core/src/time-field/time-field-segment.tsx`
- Commit `0326af2d` (`fix render prop ssr`), which changed repeated `props.children` reads to one
  read.

Kobalte is not authority for Solid 2 runtime semantics. Port the ownership behavior, not Kobalte's
API shape or Solid 1.x implementation details. Resolve children before `renderWithProps`.

## Acceptance Checklist

For the gates applicable to the change, verify:

- Every JSX-capable prop has one documented semantic category.
- Repeatedly consumed JSX-producing values are resolved in the correct mounting scope; scalar props
  are not subject to a single-read rule.
- JSX-or-render-function children call `resolvePropsChildren` before `renderWithProps`. Named
  `*Render` props use `renderWithProps` only after the value is the component, not an unresolved
  children accessor.
- No original prop is reread after resolution.
- Conditional JSX uses lazy retained resolution and is not instantiated while its branch is absent.
- No lazy memo autodisposal path recreates JSX or owned state unintentionally.
- Server and client create the same hydration-visible owners, primitives, and keyed elements in the
  same order.
- Client-only primitives use an explicit `transparent`/`ssrSource`/`clientOnly`/`NoHydration`
  policy rather than accidental asymmetry.
- Server render output survives child normalization, and Portal/hydration markers do not become
  controls.
- Markup survives browser HTML parsing without implied wrappers or dropped nested forms.
- Native boolean properties match the requested state before hydration, after hydration, and after
  updates; editable inputs accept browser text entry and do not lose uncommitted text.
- Polymorphic root changes preserve intentionally retained children and their owned state.
- No helper component or DOM wrapper exists only to manipulate hydration ids.
- No empty wrapper, visual variant branch, or leaf-element substitution masks id-order drift.
- Browser-only work is in an effect apply function, `onSettled`, or an event handler, never in
  module/component setup or an effect compute that runs on the server.
- Getter-backed tests detect duplicate JSX instantiation; behavior tests prove scalar reactivity,
  cleanup, and DOM identity.
- Signal-write assertions use `flush()` or the repository's flushing testing-library wrapper.
- Every hydration test starts a fresh hydration session and compares nodes captured before mounting.
- Focused tests, QA, and relevant full tests pass or unrelated failures are recorded.
- Production SSG has zero hydration or reactivity diagnostics.
- Production refresh preserves critical JSX at mobile, tablet, and desktop widths.
- Critical SSR nodes remain present, nested, visible, and interactive after hydration.
- No `dist` file was edited manually.
