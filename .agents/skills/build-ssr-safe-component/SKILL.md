---
name: build-ssr-safe-component
description: Gate the design, implementation, tests, and production validation of every new SolidJS component in Moraine so JSX props are evaluated once and SSR/client hydration order stays identical. Use whenever creating a component, adding a component-level `children`, slot, icon, label, content, error, component, or render prop, or substantially changing how a component conditionally renders JSX.
---

# Build an SSR-Safe Component

Treat SSR safety as a required component acceptance gate, not a later bug fix. Do not consider a new component complete until every gate below passes.

## Gate 1: Inventory the JSX API

Before implementation, list every prop that can contain JSX, a component, or a render function. Classify each value exactly once:

| Kind | Examples | Resolution rule |
| --- | --- | --- |
| Actual children | `children` | Render directly if consumed once; use `children as resolveChildren` if inspected, normalized, or rendered from multiple paths |
| Arbitrary JSX slot | `title`, `header`, `footer`, `label`, `description`, `content`, `error`, `Icon.name` | Cache with `createMemo`; never pass to `children()` |
| Component/render prop | `itemRender`, `triggerRender` | Name with the `Render` suffix and preserve its component boundary |
| Preconstructed item data | `items[].label`, `items[].content` | Do not resolve globally unless a reactive getter is repeatedly evaluated by the owning component |

Reject the API design if a value has ambiguous semantics. A function must not sometimes mean a component and sometimes mean ordinary data.

Follow Moraine's namespace and public type rules from `AGENTS.md` while defining the API.

## Gate 2: Prove Single Resolution

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

For Moraine render-prop children, read the body once inside the resolver and keep `renderComponentOrElement`:

```tsx
const resolvedChildren = resolveChildren(() => {
  const body = local.children

  return renderComponentOrElement(body, {
    get loading() {
      return isLoading()
    },
  })
})
```

Do not use only `createMemo(() => local.children)`. Do not call `body(state)` directly because Moraine types these values as `ComponentOrElement` and relies on the renderer's `createComponent` boundary.

Allow a falsy render result to omit its optional wrapper instead of creating an empty label/content element.

### Arbitrary JSX props

Cache each prop before condition checks, normalization, classes, or rendering:

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

Solid hydration keys follow node creation order, not eventual DOM nesting. A child created before its parent root can consume the parent's key.

Review the component top to bottom and reject it if any eager computation can instantiate JSX before the root `Dynamic`, intrinsic element, or required provider consumes its key.

`createMemo` evaluates immediately. If reading a getter constructs fresh JSX, defer the memo and resolution into a function invoked from the root's children expression:

```tsx
function renderContent(): JSX.Element {
  const content = createMemo(() => props.content)
  return <Show when={content()}>{content()}</Show>
}

return <Dynamic component={tag()}>{renderContent()}</Dynamic>
```

Apply the same rule to providers. Resolve nested children inside the provider's children expression, then reuse the resolved value for every branch.

Do not add wrapper components only to alter hydration order. Preserve existing owner and `createComponent` boundaries.

## Gate 4: Control Conditional Trees

For overlays and other presence-controlled components:

- Cache raw trigger/content props.
- Base presence on the cached raw value.
- Instantiate the rendered content only inside the present branch.
- Never eagerly resolve a closed overlay's content tree.

```tsx
const content = createMemo(() => props.content)
const contentPresence = useTransitionPresence({
  open: () => Boolean(open() && content()),
})

<Show when={contentPresence.present()}>
  {renderComponentOrElement(content(), state)}
</Show>
```

For client-only content, SSR and initial hydration must render the same tree. Defer the client tree until Solid has cleared the hydration context:

```tsx
const [isMounted, setIsMounted] = createSignal(false)

onMount(() => queueMicrotask(() => setIsMounted(true)))
```

A synchronous `onMount` update can still occur during hydration. Likewise, a hydrating `ref` must not synchronously set state that reveals SSR-absent nodes. Assign the element in the ref, then measure from an effect, observer, or microtask.

## Gate 5: Add Mandatory Regression Tests

For every JSX prop inspected or consumed from multiple paths, add a getter-backed single-evaluation test:

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

- Plain JSX children and slot props evaluate once.
- Render-prop components are created once and remain reactive to state changes.
- Falsy render results omit optional wrappers.
- Empty, fallback, and reactive replacement behavior.
- Overlay trigger/content values evaluate once and closed content is not instantiated.
- Client-only or measured nodes are absent before their microtask and appear afterward.

JSDOM does not validate hydration key order. Unit tests are necessary but insufficient.

## Gate 6: Validate Production SSG

Run:

```powershell
bun run test <focused-test-files>
bun run qa
bun run test
bun run docs:preview
```

Use a real browser against the production preview. Listen for both uncaught exceptions and error-level console messages. Verify the new component's docs route and representative shared routes, at minimum `/`, `/button`, `/dialog`, and `/form-field` when shared component infrastructure changed.

Reject completion if the console contains a hydration error or `template is not a function`, even when `docs:dev` is clean.

Do not manually edit `dist`. Run `git diff --check` and confirm no unintended dependency, lockfile, generated output, or user configuration changes.

## Failure Triage

If production hydration fails:

1. Rebuild unminified with `bun x vite build docs --minify false`.
2. Break at Solid's `getNextElement` and inspect the first non-Solid stack frame.
3. When available, use this conditional breakpoint:

   ```js
   typeof template !== "function" &&
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

Do not approve the new component until all answers are yes:

- Every JSX-capable prop has one documented semantic category.
- Every inspected/rendered JSX value has one cached accessor.
- No original prop is reread after resolution.
- Parent roots and providers consume hydration keys before nested JSX is instantiated.
- Closed/client-only branches do not create SSR-absent trees during hydration.
- Getter-backed tests prove single evaluation.
- Stateful render props remain reactive without reinvocation.
- Focused tests, QA, and relevant full tests pass or unrelated failures are recorded.
- Production SSG has zero hydration console errors.
- No `dist` file was edited manually.
