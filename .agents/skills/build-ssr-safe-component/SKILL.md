---
name: build-ssr-safe-component
description: Design, review, and refactor Moraine SolidJS components for JSX ownership, reactive updates, and SSR hydration safety. Use when creating components, changing JSX slots or render props, or reviewing existing SSR adaptations.
---

# Build an SSR-Safe Component

Validate JSX ownership, lazy mounting, and hydration behavior when creating or changing a component.
Apply the gates relevant to the change; an example's syntax is not a universal implementation requirement.

Match coverage to the requested scope. A full-library review includes public exports, attached
components, bound components, and shared rendering infrastructure; a focused change follows only
the affected rendering paths.

## Establish Runtime Evidence

For a suspected regression, reproduce observable behavior before choosing a fix. Inspect the installed
Solid runtime when ownership or evaluation timing is unclear. Use getter, mount, and cleanup counters
as probes alongside DOM identity, reactive updates, and real SSR/hydration assertions. Remove a candidate
change in isolation to establish whether it is necessary; restore temporary instrumentation afterward.

Compare baseline and candidate behavior with the same probe. Verify that the candidate reached both
server and client execution paths and that the relevant tests ran; unused transforms or skipped tests
cannot establish that an adaptation is unnecessary.

Do not infer a hydration bug from a getter-count assertion alone. Ordinary scalar props such as
`orientation`, `disabled`, or numeric values may be read by multiple consumers. Do not add memos or
single-read tests for those props unless an explicit API contract or measured computation cost requires
it. Test their observable semantics and reactive updates instead. JSX-producing getters differ because
reading them can instantiate nodes and owned computations.

## Gate 1: Inventory the JSX API

Before implementation, list every prop that can contain JSX, a component, or a render function. Classify each value exactly once:

| Kind                     | Examples                                                                             | Resolution rule                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Actual children          | `children`                                                                           | Render directly in a stable, single consumer; resolve when inspected, normalized, reused, or retained across a changing root |
| Arbitrary JSX slot       | `title`, `header`, `footer`, `label`, `description`, `content`, `error`, `icon` | Cache repeated reads in the mounting scope; do not apply `children()` indiscriminately to component-capable values |
| Component/render prop    | `itemRender`, `triggerRender`                                                        | Name with the `Render` suffix and preserve its component boundary                                                             |
| Preconstructed item data | `items[].label`, `items[].content`                                                   | Do not resolve globally unless a reactive getter is repeatedly evaluated by the owning component                              |

Reject the API design if a value has ambiguous semantics. A function must not sometimes mean a component and sometimes mean ordinary data.

Follow Moraine's namespace and public type rules from `AGENTS.md` while defining the API.

## Gate 2: Resolve JSX in the Correct Owner

Both `children()` and `createMemo()` evaluate immediately when created; deferring calls to their returned
accessors does not defer initialization. The examples below assume their owning tree should exist now.
For conditional content, create these resolvers in the mounting scope described in Gate 4.

### Actual children

When children are used for a condition and rendered content, import `children` as `resolveChildren` and reuse the accessor:

```tsx
import { Show, children as resolveChildren } from 'solid-js'

const resolvedChildren = resolveChildren(() => props.children)

<Show when={resolvedChildren()}>
  {(body) => <div data-slot="content">{body()}</div>}
</Show>
```

Use the `Show` callback accessor so the resolved value is not re-resolved. Never read `props.children` or `local.children` again after creating the accessor.

A single source-level rendering site can execute again when a polymorphic root changes. Retain
children outside that replaceable root when their nodes and owned state must survive the change.
Verify identity, reactive updates, and cleanup before removing a resolver. A stable native container
can consume children directly when it neither inspects nor reuses them.

For Moraine `ComponentOrElement` children, use two-stage resolution:

```tsx
const body = resolveChildren(() => local.children as JSX.Element)
const resolvedChildren = createMemo(() =>
  renderComponentOrElement(body() as ButtonT.Base['children'], {
    get loading() {
      return isLoading()
    },
  }),
)
```

The first stage resolves zero-argument Solid accessors returned by JSX control flow. The second stage
mounts a remaining state render prop through `renderComponentOrElement` and preserves its
`createComponent` boundary. This order matters because the same child can be a client-side signal
accessor but an SSR value on the server. Passing the unresolved accessor directly to
`renderComponentOrElement` adds a client-only component boundary and shifts hydration keys.

Do not use only `createMemo(() => local.children)`. Do not call the state render prop directly.
Do not special-case child resolution by size, variant, or visual child type.

Allow a falsy render result to omit its optional wrapper instead of creating an empty label/content element.
Keep this resolution in the existing owner unless component ownership or context requires another
boundary. Do not introduce an internal component only to manipulate hydration keys; that component
adds its own boundary and can hide the actual asymmetry.

### Arbitrary JSX props

When a JSX prop is consumed repeatedly, cache it in its mounting scope before condition checks, normalization, classes, or rendering. A single rendering site may read it directly:

```tsx
const title = createMemo(() => props.title)

<Show when={title()}>
  <div data-slot="title">{title()}</div>
</Show>
```

Do not use `children()` here. It recursively resolves functions and arrays and may invoke component or render-prop values.

Cache the raw value before null/false normalization:

```tsx
const error = createMemo(() => props.error)
const resolvedError = createMemo(() => {
  const value = error()
  if (value === false) return false
  if (value != null) return value
  return fieldError()
})
```

## Gate 3: Preserve Hydration Creation Order

Solid hydration keys follow node creation order, not eventual DOM nesting. Require the server and
client to create the same nodes and component boundaries in the same order.

Do not impose parent-first creation as a universal rule. Resolving children before a root `Dynamic`
is valid when both environments follow the same sequence. Focus on asymmetric values, such as a
client-side signal accessor corresponding to an SSR value, and on helpers that interpret those
values as components in only one environment.

`createMemo` evaluates immediately. If production evidence shows that an eager getter creates a
different sequence, defer the memo and resolution into the root's children expression:

```tsx
function renderContent(): JSX.Element {
  const content = createMemo(() => props.content)
  return <Show when={content()}>{content()}</Show>
}

return <Dynamic component={tag()}>{renderContent()}</Dynamic>
```

Resolve children inside a provider when they depend on that provider's context, then reuse the
resolved value for every branch.

Do not add DOM wrappers or helper components only to alter hydration order. Preserve existing owner
and intentional `createComponent` boundaries.

### Normalize server and client values consistently

Child normalization must account for both server render values and client DOM nodes. DOM-only
filters can discard valid SSR content, while Portal markers must not become rendered items.
Verify fragments, conditional children, and Portals without parsing serialized HTML or depending
on private render-object fields.

### Keep reactive JSX accessors live

A JSX accessor needs reactive insertion, while a component needs its component boundary. Invoking
an accessor through an untracked component path can freeze its initial value. Distinguish these
paths using the prop's contract and installed runtime semantics; function arity alone is insufficient
because default parameters also produce zero-length functions. Preserve prop forwarding and verify
conditional replacement, updates, mounting, and cleanup.

### Verify native boolean attributes

Use the renderer's native attribute spelling at the DOM boundary, including forwarded props.
HTML boolean attributes are true whenever present, even with a string value of `"false"`.
Check native properties on parsed SSR HTML, after hydration, and through true/false updates.
For editable controls, verify browser typing as well as dispatched events.

## Gate 4: Control Conditional Trees

For overlays and other presence-controlled components:

- Determine presence from open/transition state without reading a JSX-producing content getter.
- Initialize content resolvers only inside the present branch, including in public wrappers. Delaying
  the base component cannot undo a wrapper's earlier `children()` or `createMemo()` call.
- A prop returning a component function can be read without mounting that function, but a raw JSX
  getter can create nodes immediately. Do not assume caching a "raw value" makes JSX lazy.

```tsx
<Show when={contentPresence.present()}>
  {(_present) => {
    const content = resolveChildren(() => props.children)
    return <div>{content()}</div>
  }}
</Show>
```

A named function passed as the callback is equivalent to an inline callback when invoked in the same
owner and at the same time. Choose the clearer local form; do not add helpers or force inlining merely
to satisfy this skill. Moving resolver construction into a function only helps if its invocation is
also deferred.

In Solid 1.9.15, `Show` recognizes a render callback using `typeof child === 'function' && child.length > 0`
and invokes it with `untrack`. Keep a parameter even when unused. A zero-argument function is treated as
an ordinary JSX accessor, which can acquire dependencies and recreate content during unrelated updates.
Verify this against the installed version when changing that pattern, and test node identity across
trigger replacement and positioning updates.

For client-only content, SSR and initial hydration must render the same tree. Defer the client tree until Solid has cleared the hydration context:

```tsx
const [isMounted, setIsMounted] = createSignal(false)

onMount(() => queueMicrotask(() => setIsMounted(true)))
```

A synchronous `onMount` update can still occur during hydration. Likewise, a hydrating `ref` must not synchronously set state that reveals SSR-absent nodes. Assign the element in the ref, then measure from an effect, observer, or microtask.

## Gate 5: Test Observable Behavior and JSX Ownership

For JSX-producing props consumed from multiple paths, use a getter-backed test to detect duplicate instantiation within one mount. Do not apply this assertion to ordinary scalar props:

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

Add applicable coverage for:

- Plain JSX children and slot props are not instantiated repeatedly within one mount.
- Render-prop components are created once and remain reactive to state changes.
- Falsy render results omit optional wrappers.
- Empty, fallback, and reactive replacement behavior.
- Closed overlay content is not instantiated; opening mounts it, closing releases owned resources, and reopening may create a fresh instance. Force-mounted content retains its instance across open-state changes.
- Client-only or measured nodes are absent before their microtask and appear afterward.

JSDOM can detect hydration-key mismatches when tests hydrate actual SSR output; client-only `render()` tests cannot. Production browser checks additionally cover build differences, layout, and visibility.

Create fixture JSX in its render or hydration owner. Defer inactive content so constructing input
data does not request hydration keys for nodes absent from the server output.

Capture server elements and their parents before hydration, then assert reuse; post-hydration
lookups and fixed key values cannot prove it. Isolate both bootstrap globals and runtime hydration
state for each test, since prior events or failures can switch later tests to client rendering.
Register cleanup before hydration, and keep version-specific state handling in test infrastructure.

Hydration can silently remove a mismatched descendant without logging an error. For critical JSX,
also assert in a production browser that the hydrated node still exists under its intended parent.

## Gate 6: Validate Production SSG

Run:

```sh
nub run test <focused-test-files>
nub run qa
nub run test
nub run docs:preview
```

Use a real browser against the production preview. Listen for uncaught exceptions and error-level
console messages. Verify the affected component routes and representative consumers of any changed
shared rendering infrastructure.

Identify which examples participate in SSR and which mount only on the client. Only server-rendered
examples can prove hydration reuse. Capture their nodes before client scripts run, and distinguish
expected post-mount responsive changes from missing or misplaced descendants.

Reload at mobile, tablet, and desktop widths. Responsive branches can consume different hydration
keys and expose a mismatch only at one breakpoint.

Reject completion if the console contains a hydration error or `template is not a function`, even when `docs:dev` is clean.

Do not treat a clean console as sufficient. Compare critical SSR nodes with the hydrated DOM and
verify that visual nodes remain nested, have non-zero bounds, and retain their effective icon or
background style.

Do not manually edit `dist`. Run `git diff --check` and confirm no unintended dependency, lockfile, generated output, or user configuration changes.

## Failure Triage

If production hydration fails:

1. Rebuild unminified with `nubx vite build docs --minify false`.
2. Break at Solid's `getNextElement` and inspect the first non-Solid stack frame.
3. When available, use this conditional breakpoint:

   ```js
   typeof template !== 'function' &&
     !sharedConfig.registry.has(getContextId(sharedConfig.context.count))
   ```

4. Compare the prospective key with SSR `data-hk` values.
5. Fix the earliest missing key first; downstream component errors often disappear afterward.

## Prior Art

Use the local Kobalte checkout as evidence for the single-resolution pattern:

- `kobalte/packages/core/src/checkbox/checkbox-root.tsx`
- `kobalte/packages/core/src/time-field/time-field-segment.tsx`
- Commit `0326af2d` (`fix render prop ssr`), which changed repeated `props.children` reads to one `const body = props.children` read.

Port the behavior, not Kobalte's API shape. Keep Moraine's `ComponentOrElement` and renderer semantics.

## Acceptance Checklist

For the gates applicable to the change, verify:

- Every JSX-capable prop has one documented semantic category.
- Repeatedly consumed JSX-producing values are resolved in the correct mounting scope; scalar props are not subject to a single-read rule.
- `ComponentOrElement` children resolve Solid accessors before component/render-prop mounting.
- No original prop is reread after resolution.
- Server and client create the same nodes and component boundaries in the same order.
- Server render objects survive child normalization, and Portal markers do not become controls.
- Native boolean properties match the requested state before hydration, after hydration, and after updates; editable inputs accept browser text entry.
- Polymorphic root changes preserve intentionally retained children and their owned state.
- No helper component or DOM wrapper exists only to manipulate hydration keys.
- No empty wrapper, visual variant branch, or leaf-element substitution masks key-order drift.
- Closed/client-only branches do not create SSR-absent trees during hydration.
- Getter-backed tests detect duplicate JSX instantiation; behavior tests prove scalar reactivity and DOM identity.
- Every hydration test starts a fresh hydration session and compares nodes captured before mounting.
- Stateful render props remain reactive without reinvocation.
- Focused tests, QA, and relevant full tests pass or unrelated failures are recorded.
- Production SSG has zero hydration console errors.
- Production refresh preserves critical JSX at mobile, tablet, and desktop widths.
- Critical SSR nodes remain present, nested, and visible after hydration.
- No `dist` file was edited manually.
