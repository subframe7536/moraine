# Plan: Production Root Props Migration

## Summary

Promote the root-props prototype into the production component API and migrate every public component to the same contract.

The default type surface exposes component business props plus root `aria-*` and `data-*` attributes. Full intrinsic HTML attributes are opt-in through type-only module augmentation. Custom Solid component props used through `as` remain available in both modes. Runtime behavior does not depend on the type configuration: valid rest props are always forwarded to the documented root element.

This is a breaking pre-alpha migration. Do not preserve the old `BaseProps<Base, Variant, Slot>` generic order.

## Public Type Contract

### Type configuration

Declare an intentionally empty, type-only interface in `src/shared/types.ts`:

```ts
export interface MoraineTypeConfig {}
```

Consumers enable full intrinsic root autocomplete through package-root augmentation:

```ts
declare module 'moraine' {
  interface MoraineTypeConfig {
    enableRootAutocomplete: true
  }
}
```

There is no runtime configuration object or function.

### Root props

Implement the following internal helpers in `src/shared/types.ts`:

- `Tags = keyof JSX.HTMLElementTags`.
- `DataAttributes` accepts `data-${string}` values supported by Solid.
- `CommonRootProps = JSX.AriaAttributes & DataAttributes`.
- `StrictedAttributes<T>` starts from `JSX.HTMLElementTags[T]` and removes lowercase event aliases and Solid directive prefixes: `on:`, `oncapture:`, `use:`, `prop:`, `attr:`, and `bool:`.
- `Override<A, B> = Omit<A, keyof B> & B`, so component-owned fields win over inherited root fields.
- `RootProps<T>` resolves the public root surface.
- `RuntimeRootProps<T>` resolves the full runtime forwarding surface without consulting `MoraineTypeConfig` and is used only for implementation typing.

`RootProps<T>` must resolve as follows:

- Intrinsic root, default mode: `CommonRootProps` only.
- Intrinsic root, autocomplete mode: `StrictedAttributes<T>`.
- Solid component root: `ComponentProps<T>` in both modes.

Use the production signature:

```ts
BaseProps<TElement, Base, Variant, TSlot>
```

It combines `RootProps<TElement>`, business props, variants, and slot styling. Business props override root fields. When `Variant` or `TSlot` is `never`, do not introduce unusable variant or slot-style members.

Only `MoraineTypeConfig` is a new public helper. Keep root-resolution helpers internal unless an existing public component declaration requires them to remain nameable in emitted declarations.

Keep `ElementProps<T>` for explicit secondary-element APIs such as `listboxProps`, `contentProps`, and `itemProps`.

### Existing ARIA props

Remove root `aria-*` declarations from component `Base` interfaces and obtain them from `RootProps`. This includes the existing root props on Badge, Breadcrumb, Pagination, Progress, and equivalent components.

Do not remove semantic business props such as `label`, `disabled`, `value`, or `open`. Components may continue deriving default ARIA values from them.

ARIA declarations for internal slots or render contexts remain local because they do not describe the public root.

## Polymorphic Components

Preserve existing polymorphism without adding a universal `as` API.

- `Button<T = 'button'>`, `List<T = 'ul'>`, `FormField<T = 'div'>`, and `FileUpload<T = 'div'>` use `T` as the first `BaseProps` argument.
- Remove intrinsic `ComponentProps<T>` inheritance from `ButtonT.Base` and `ListT.Base`; otherwise default mode would still expose all HTML attributes.
- Custom Solid components used through `as` always expose their required `ComponentProps<T>`, even when intrinsic autocomplete is disabled.
- Fixed-root components pass their actual rendered tag exactly once in their final `Props` declaration.

Do not add polymorphic inference to Icon based on `name`. Its string-backed root remains the documented intrinsic root.

## Root Ownership

Forward public root props to these elements:

- `span`: Avatar, Badge, KbdGroup.
- `kbd`: Kbd.
- `nav`: Breadcrumb, Pagination.
- `form`: Form.
- `button`: IconButtonInner.
- `div`: Accordion, AvatarGroup, ButtonGroup, Card, Collapsible, Progress, Resizable, Separator, Checkbox, CheckboxGroup, Input, InputNumber, RadioGroup, Select, MultiSelect, BaseSelect, Slider, Switch, Textarea, SidebarFrame, Stepper, and Tabs.
- Polymorphic root: Button, List, FormField, and FileUpload.
- Trigger wrapper `span`: Dialog, Sheet, Popup, Popover, Tooltip, DropdownMenu, and ContextMenu.
- Portal content root `div`: CommandPalette. Do not forward these props to its trigger or positioner.

Form control props such as `name`, `value`, `checked`, `required`, input events, and validation state remain component business props and continue targeting their existing internal controls. They must not leak to wrapper roots.

## Runtime Forwarding

At every public root boundary:

1. Preserve `mergeProps` only where reactive defaults are needed.
2. Use `splitProps` to separate business props, variants, `class`, `style`, `classes`, `styles`, `children`, render props, and internal control fields from root rest props.
3. Type the rest surface with `RuntimeRootProps<T>` where generic inference needs assistance.
4. Spread `{...rest}` onto the documented root.
5. Confirm business fields never reach the DOM.

Root JSX ordering must allow callers to override predefined accessibility and state metadata:

```tsx
<div
  data-slot="root"
  data-disabled={disabled() ? '' : undefined}
  aria-disabled={disabled() || undefined}
  {...rest}
  ref={handleRef}
  onClick={handleClick}
/>
```

Apply these precedence rules consistently:

- Generated and predefined `aria-*` and `data-*` attributes appear before `{...rest}`. User root props may override them, including `data-slot` and computed state attributes.
- `class` and `style` remain explicitly split and keep the existing merge order: component defaults, slot override, then top-level override.
- Refs and event handlers that require composition remain after `{...rest}` and are explicitly composed; do not let a spread replace internal behavior accidentally.
- Other structural invariants such as the rendered tag, required internal ref wiring, and internal control ownership remain component-controlled.

### Ref composition

Move the repeated `callRef` implementation into shared utilities. Internal ref assignment runs first, followed by the user ref. Support the ref shapes accepted by the relevant Solid element props without introducing React ref objects.

### Event listener types and execution

Solid exposes handler-union types, not an `EventListenerUnion` type. Migrate public DOM event props to the appropriate real Solid type:

- `JSX.EventHandlerUnion<T, E>` for general DOM events.
- `JSX.InputEventHandlerUnion<T, E>` for input events.
- `JSX.ChangeEventHandlerUnion<T, E>` for change events.
- `JSX.FocusEventHandlerUnion<T, E>` for focus events.

Apply this to existing DOM listener props in Input, Textarea, InputNumber, Checkbox, Switch, FileUpload, Breadcrumb, and overlay/menu APIs. Keep semantic callbacks such as `onValueChange`, `onOpenChange`, and `onClosePrevent` as ordinary functions.

Every explicitly owned DOM listener must be removed from `rest` and invoked through `callHandler(event, local.onX)` so both function and tuple handler forms work.

Execution policy:

- Run the user handler before cancelable internal behavior.
- Skip cancelable internal behavior when the user sets `event.defaultPrevented`.
- Preserve existing ordering for hard disabled/loading interaction guards when allowing the user handler first would violate the component invariant.
- Document exceptional ordering with a short local comment and cover it with a test.

### Overlay plumbing

- Add an internal typed `triggerProps` channel to Modal and Popper for root rest props.
- Modal and Popper compose trigger refs and handlers once, then Dialog, Sheet, Popup, Popover, and Tooltip pass their rest props through this channel.
- DropdownMenu and ContextMenu apply and compose rest props on their own trigger wrappers.
- Do not copy public trigger props onto overlay, positioner, portal content, or menu items.
- OverlayMenu remains responsible only for menu-layer behavior and explicit secondary-element prop APIs.

## Migration Sequence

### Phase 1: Type and declaration gate

1. Implement the shared type contract and export `MoraineTypeConfig` from the package root.
2. Add independent default and autocomplete type fixtures before changing all components.
3. Build the package and verify augmentation through `dist/index.d.mts` using imports from `moraine`, not source-relative imports.
4. Confirm custom `as` component props work in both modes.

Do not continue to the full migration until emitted declaration augmentation passes.

### Phase 2: Representative components

1. Migrate Badge as the fixed intrinsic reference.
2. Migrate Button as the polymorphic and composed-event reference.
3. Migrate Input or Textarea as the wrapper/internal-control reference.
4. Migrate one Modal-based and one Popper-based overlay as trigger references.
5. Migrate CommandPalette as the portal-content ownership reference.

Use these implementations and tests as the patterns for the remaining components.

### Phase 3: Full component migration

Migrate components by ownership group: fixed elements, forms, navigation, polymorphic roots, then overlays. For every component, audit the complete `Base` and variant key set used by `splitProps`; do not infer the list only from the JSX root.

Update base overlay layers before their public wrappers so handler/ref composition is implemented once.

### Phase 4: Documentation and prototype cleanup

Update `docs/pages/typescript.mdx` with:

- Default `aria-*` and `data-*` support.
- Opt-in full intrinsic autocomplete.
- Type-only module augmentation and no runtime configuration.
- Custom component `as` behavior.
- Root ownership for wrappers, triggers, controls, and portal content.
- User override precedence for predefined ARIA/data attributes.
- The IDE performance reason for keeping full intrinsic attributes opt-in.

After production tests cover the prototype behavior, delete `src/shared/__prototype__`, including its TUI and `@ts-nocheck` assertions. Do not add a prototype package script.

## Test Plan

### Compile-time fixtures

Create separate TypeScript projects because module augmentation is global per compilation. Exclude them from the main repository `tsconfig` and run each explicitly.

Default fixture must verify:

- Business props compile.
- Root `aria-*` and `data-*` compile.
- Intrinsic `id`, `title`, `hidden`, `ref`, DOM event handlers, `href`, and other tag attributes are rejected unless explicitly owned as business props.
- Wrong-element intrinsic props are rejected.
- Custom component `as` props compile and required props remain required.
- Existing form business fields compile without becoming wrapper root props.

Autocomplete fixture must verify:

- Package-root augmentation enables exact intrinsic attributes.
- `Button<'a'>` accepts anchor props and rejects button-only props.
- Fixed roots accept their precise tag attributes and reject attributes for other tags.
- CamelCase Solid handlers compile.
- Lowercase event aliases and stripped directive prefixes are rejected.
- Business props override conflicting root declarations.

Add `test:types` to build first and then run both fixture projects. Include it in `qa`.

### Runtime coverage

Port the experimental Badge coverage to the real Badge and add representative tests for every root-ownership group. Test:

- Rest ARIA/data and full HTML attributes reach the documented root at runtime.
- User values override predefined `data-slot`, state `data-*`, and generated `aria-*` values.
- Business props and slot configuration do not leak to the DOM.
- Class and style merge order remains unchanged.
- User refs and internal refs both execute in the required order.
- Function handlers and tuple handlers both execute through `callHandler`.
- `defaultPrevented` cancels eligible internal behavior.
- Disabled/loading guards retain their invariants.
- Form control props stay on internal controls.
- Overlay root props reach only the trigger wrapper.
- CommandPalette root props reach only its portal content root.

Add at least one forwarding assertion to each migrated component's existing test file; use broader composition tests only for representative components and shared overlay bases.

## Verification

Run in this order:

1. `bun run test`.
2. `bun run typecheck`.
3. `bun run build`.
4. `bun run test:types`.
5. Inspect `dist/index.d.mts` for the empty public marker interface, stable generic order, and nameable declarations.
6. `bun run qa`.
7. `bun run docs:build`.

The current baseline is clean: repository typecheck passes, the experimental Badge suite passes 22 tests, and the existing Badge/Button suites pass 56 tests.

## Locked Decisions

- `BaseProps<TElement, Base, Variant, TSlot>` is authoritative.
- Default intrinsic root types expose only `aria-*` and `data-*` plus business props.
- Full intrinsic autocomplete is type-only and opt-in.
- Custom Solid component props remain available in both modes.
- Runtime always forwards root rest props.
- User root props may override predefined ARIA/data values.
- Explicit DOM listeners use Solid handler-union types and execute through `callHandler`.
- Existing root ownership is preserved; no universal `as` API is introduced.
- Existing form control props remain business props for their internal controls.
