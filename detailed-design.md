# Moraine Theme Architecture and Component Contract Detailed Design

## Document Status

- **Target:** Future implementation on `style-refactor`
- **Version:** 3.0
- **Language:** English
- **Boundary:** This rewrite changes specification only. It does not authorize source, test, configuration, or generated-file changes.

## 1. Architecture

Moraine presentation is supplied through Theme Context. The official Theme belongs to `MoraineProvider`; components know only their family key and public types.

```text
defaultTheme or inherited Theme
               │
               ▼
       MoraineProvider
               │ appends optional custom Theme
               ▼
       ordered Theme layers
               │
               ▼
 createComponentStyles(name, props, options)
               │
               ├── resolved visual Variants
               ├── Recipe classes by slot
               └── group and instance overrides
```

The architecture has five parts:

1. Component namespaces define Slots, Variants, behavior props, and final Props.
2. `MoraineThemeSchema` connects Theme keys to namespace types at compile time.
3. `slotRecipe` and `atomicRecipe` create declarative class resolvers.
4. Providers construct ordered Theme contexts.
5. `createComponentStyles` resolves Variants and slot bindings inside components.

There is no separate runtime component-metadata layer. Theme maps are the only runtime maps keyed by component family.

## 2. Naming and Exports

### Theme API

```ts
export interface MoraineTheme {}
export interface CreateThemeOptions {}
export interface ComponentRecipeConfig<SlotName extends string, Variant> {}

export function createTheme(options?: CreateThemeOptions): MoraineTheme
```

`MoraineTheme`, `CreateThemeOptions`, `ComponentRecipeConfig`, and `createTheme` are exported from the Theme entry point. `defaultTheme` is owned by the Provider implementation rather than imported by component modules.

### Recipe API

```ts
export function slotRecipe(options: SlotRecipeOptions): SlotRecipe
export function atomicRecipe(options: AtomicRecipeOptions): AtomicRecipe
```

- `slotRecipe` resolves named slots in a component family.
- `atomicRecipe` resolves one class string for a single element or reusable fragment.
- Separate functions replace shape-based overload inference.

### Internal API

`createComponentStyles` follows Solid's `create*` convention because it creates reactive derivations in the current owner. Theme context access, compiled entries, and component style resolution remain internal.

## 3. Component Type Contract

### Namespace structure

```ts
import type { JSX, ValidComponent } from 'solid-js'

export namespace ButtonT {
  export interface Slot<T = unknown> {
    /** Interactive button element. */
    root?: T
    /** Loading indicator shown while an action is pending. */
    loading?: T
    /** Content before the label. */
    leading?: T
    /** Main button content. */
    label?: T
    /** Content after the label. */
    trailing?: T
  }

  export type SlotName = keyof Slot

  export interface Variant {
    /** Visual dimensions. @default 'md' */
    size?: 'sm' | 'md' | 'lg' | null
    /** Visual treatment. @default 'default' */
    variant?: 'default' | 'outline' | 'ghost' | null
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<JSX.CSSProperties>

  export interface Base {
    /** Shows a loading indicator and blocks repeated activation. @default false */
    loading?: boolean
  }

  export type Props<T extends ValidComponent = 'button'> = PolymorphicProps<
    T,
    Base & Variant & ComponentStyleProps<Classes, Styles>
  >
}

export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>
```

Rules:

- Component-owned properties carry their own JSDoc.
- Native attributes come from SolidJS element types.
- Component properties override conflicting native names through `Omit` or `Override`.
- Shared helpers have closed property sets.
- `Classes` and `Styles` directly instantiate the documented `Slot<T>` interface.
- The exported component signature remains generic when `as` or value types are inference sources.

### Shared helpers

Only reusable, narrow helpers are justified:

```ts
interface ComponentStyleProps<Classes, Styles> {
  class?: SlotClassValue
  style?: JSX.CSSProperties
  classes?: Classes
  styles?: Styles
}

type PolymorphicProps<T extends ValidComponent, OwnProps> = Override<ComponentProps<T>, OwnProps>
```

Non-polymorphic components directly combine native attributes, Base, Variant, and style props. Helpers must preserve readable declaration output and may not introduce arbitrary keys.

## 4. Compile-time Theme Schema

`MoraineThemeSchema` provides Theme-key, Slot, and Variant completion without emitting JavaScript:

```ts
export interface MoraineThemeSchema {
  button: {
    slots: ButtonT.SlotName
    variants: ButtonT.Variant
  }
  input: {
    slots: InputT.SlotName
    variants: InputT.Variant
  }
  dialog: {
    slots: DialogT.SlotName
    variants: DialogT.Variant
  }
}

type ThemeName = keyof MoraineThemeSchema
type ThemeSlots<Name extends ThemeName> = MoraineThemeSchema[Name]['slots']
type ThemeVariants<Name extends ThemeName> = MoraineThemeSchema[Name]['variants']

type ThemeEntries = {
  [Name in ThemeName]?: ComponentRecipeConfig<ThemeSlots<Name>, ThemeVariants<Name>>
}

export interface CreateThemeOptions extends ThemeEntries {
  extends?: MoraineTheme
}
```

Changing a Slot or Variant flows through its namespace reference. Adding a family requires one schema entry because the new public Theme key is new information.

## 5. Recipe Model

### Component configuration

```ts
export interface ComponentRecipeConfig<SlotName extends string, Variant> {
  base?: Partial<Record<SlotName, ClassValue>>
  variants?: ComponentRecipeVariants<SlotName, Variant>
  compoundVariants?: readonly ComponentCompoundVariant<SlotName, Variant>[]
  defaults?: Partial<NonNullableProperties<Variant>>
}
```

Mapped slot records are acceptable inside Theme authoring. Public `classes` completion still uses `Slot<T>`, which preserves the slot documentation seen by component consumers.

### Evaluation

```ts
interface SlotRecipe<SlotName extends string, Variant> {
  (variants: Variant): Partial<Record<SlotName, string | undefined>>
  readonly options: ComponentRecipeConfig<SlotName, Variant>
}
```

A slot Recipe:

1. starts with `base`;
2. applies selected Variant classes;
3. applies matching compound variants in declaration order;
4. normalizes each slot with `cn()`;
5. never mutates its options.

Every Theme layer compiles and evaluates independently. Parent and child configuration objects are not recursively combined.

`atomicRecipe` uses the same selection and compound matching rules but returns one class string.

### Value semantics

- `undefined` permits fallback.
- A valid `null` suppresses that Variant and does not fall back.
- `false`, `0`, and `''` remain valid declared values.
- Boolean and numeric keys are stringified only for Recipe lookup after fallback resolution.

## 6. Theme Runtime

### Representation

```ts
declare const THEME_LAYERS: unique symbol

interface CompiledThemeLayer {
  readonly [name: string]: CompiledComponentRecipe | undefined
}

export interface MoraineTheme {
  readonly [THEME_LAYERS]: readonly CompiledThemeLayer[]
}
```

The symbol and compiled types are internal. Consumers create Themes through `createTheme()`.

### Theme creation

```ts
const brandTheme = createTheme({
  button: {
    base: { root: 'rounded-xl' },
    defaults: { size: 'lg' },
  },
})

const compactBrandTheme = createTheme({
  extends: brandTheme,
  input: {
    defaults: { size: 'sm' },
  },
})
```

`createTheme()`:

1. reads parent layers when `extends` is present;
2. compiles only supplied component entries;
3. appends one sparse own layer when it is non-empty;
4. returns an immutable outer object with ordered layers.

It does not enumerate all schema keys, create empty Recipes, clone component props, or deeply merge parent configuration.

### Official Theme

`defaultTheme` contains the complete official component Recipes and is imported by the Provider module. It is a runtime presentation map, not a component registry: it contains no constructors, prop metadata, slot arrays, root-slot metadata, or behavior state.

Component modules only call `createComponentStyles`. They must not import `defaultTheme` or official Recipe modules.

## 7. Provider Semantics

### Context

```ts
interface MoraineThemeContextValue {
  readonly layers: () => readonly CompiledThemeLayer[]
  readonly hasProvider: true
}
```

The context default is `undefined`, allowing a missing Provider to differ from an intentionally empty boundary.

### Root styled Provider

```tsx
<MoraineProvider theme={brandTheme}>
  <App />
</MoraineProvider>
```

Without a parent context:

```text
defaultTheme.layers → optional props.theme.layers
```

When `theme` is omitted, only `defaultTheme` is supplied.

### Nested styled Provider

With a parent context:

```text
parent.layers → optional props.theme.layers
```

The nested Provider does not add `defaultTheme` again. It reads `props.theme` through an accessor so replacement remains reactive.

### Unstyled Provider

```tsx
<MoraineUnstyledProvider theme={headlessTheme}>
  <CustomSurface />
</MoraineUnstyledProvider>
```

Its layers are only `props.theme?.layers`. It ignores the parent and `defaultTheme`. A styled Provider nested inside inherits that reset context and does not silently restore official presentation.

### Missing Provider

The internal context accessor returns a stable empty layer list and warns once per application owner under this exact condition:

```ts
if (DEV && process.env.NODE_ENV !== 'test') {
  warnOnceForOwner()
}
```

`DEV` is imported from `solid-js`. If no owner exists, one module-level warning guard is sufficient. Production, SSR production builds, and tests are silent.

## 8. Component Style Resolution

### Contract

```ts
interface CreateComponentStylesOptions<SlotName extends string, Variant> {
  rootSlot?: SlotName
  inheritedVariants?: () => Partial<Variant> | undefined
  groupStyles?: () =>
    | {
        classes?: Partial<Record<SlotName, SlotClassValue>>
        styles?: Partial<Record<SlotName, JSX.CSSProperties>>
      }
    | undefined
  dynamicStyles?: () => Partial<Record<SlotName, JSX.CSSProperties>> | undefined
}

interface ComponentStyles<SlotName extends string, Variant> {
  readonly variants: Variant
  readonly root: SlotBinding
  slot(name: SlotName): SlotBinding
}

function createComponentStyles<Name extends keyof MoraineThemeSchema>(
  name: Name,
  props: ComponentStyleInput<Name>,
  options?: CreateComponentStylesOptions<ThemeSlots<Name>, ThemeVariants<Name>>,
): ComponentStyles<ThemeSlots<Name>, ThemeVariants<Name>>
```

The component passes its family key and reactive props. It passes no official Recipe, slot list, component descriptor, or internal state object.

### Variant resolution

For each property:

```ts
function resolveVariantValue(key: PropertyKey) {
  const instance = props[key]
  if (instance !== undefined) return instance

  const inherited = options?.inheritedVariants?.()?.[key]
  if (inherited !== undefined) return inherited

  const layers = themeLayers()
  for (let index = layers.length - 1; index >= 0; index--) {
    const themed = layers[index][name]?.defaults?.[key]
    if (themed !== undefined) return themed
  }

  return undefined
}
```

The `variants` result exposes reactive getters. Recipe code reads declared properties directly, so no runtime Variant-key inventory is needed.

### Class evaluation

Each active Theme entry evaluates with the final Variants. Results remain in layer order. A slot class resolves as:

```ts
cn(
  ...themeOutputs().map((output) => output[slot]),
  options?.groupStyles?.()?.classes?.[slot],
  props.classes?.[slot],
  slot === rootSlot ? props.class : undefined,
)
```

The component-level Recipe output array is memoized once per dependency state. Separate per-slot memo trees are unnecessary because a Recipe already returns all slot classes.

### Inline styles

```ts
;({
  ...options?.dynamicStyles?.()?.[slot],
  ...options?.groupStyles?.()?.styles?.[slot],
  ...props.styles?.[slot],
  ...(slot === rootSlot ? props.style : undefined),
})
```

Recipes produce atomic classes rather than arbitrary inline-style callbacks. Measurement-derived geometry remains visible at the component call site through `dynamicStyles`.

`rootSlot` defaults to `'root'`. A DOM-rendering family part may select an existing family slot such as `'trigger'` or `'content'`.

## 9. Styleable State

Components project styleable state to stable DOM attributes:

```tsx
<button
  data-loading={loading() ? '' : undefined}
  data-expanded={expanded() ? '' : undefined}
  aria-invalid={invalid() || undefined}
/>
```

Recipes use flat utilities:

```ts
slotRecipe({
  base: {
    root: 'data-loading:cursor-wait data-expanded:bg-muted aria-invalid:ring-destructive',
  },
})
```

Rules:

- Prefer ARIA when a semantic state has an ARIA representation.
- Use `data-*` for visual or interaction state without one.
- Put state on every slot that needs it unless a supported descendant selector is clearer.
- Do not add derived booleans to public Variants solely for styling.
- Keep coordinates, measured dimensions, and transform origins in CSS custom properties or component-owned inline styles.
- Document state attributes as part of each family Recipe contract.

## 10. Compound Families

Compound APIs use one public Theme key:

```ts
interface MoraineThemeSchema {
  dialog: {
    slots: DialogT.SlotName
    variants: DialogT.Variant
  }
}
```

`Dialog.Trigger`, `Dialog.Content`, and `Dialog.Close` all request `dialog` and select their own root slot. Private behavior primitives used by Dialog do not apply another presentation layer.

A root that renders only Context exposes no `class`, `style`, `classes`, or `styles`. Shared visual Variants travel through family context as `inheritedVariants`; behavior state stays in behavior context and is projected to DOM attributes where needed.

## 11. Input and Textarea

### Type composition

```ts
type NativeInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'class' | 'style' | 'ref' | 'value' | 'defaultValue' | 'onInput' | 'onChange'
>

export namespace InputT {
  export interface Base extends NativeInputProps, FormIdentityOptions, FormStateOptions {
    value?: InputValue
    defaultValue?: InputValue
    onValueChange?: (value: InputValue) => void
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>
    onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
    ref?: Ref<HTMLDivElement>
    inputRef?: Ref<HTMLInputElement>
    class?: SlotClassValue
    style?: JSX.CSSProperties
    classes?: Classes
    styles?: Styles
  }
}
```

Textarea mirrors this structure with `JSX.TextareaHTMLAttributes<HTMLTextAreaElement>` and `textareaRef`. Component-owned value and event types deliberately override native names; other platform attributes remain inherited.

### Prop routing

```text
Input props
  ├── behavior and render props
  ├── Theme Variant and style props
  ├── wrapper ref
  ├── native-control ref
  ├── intercepted value and event props
  └── remaining native props → native control
```

The wrapper receives only root presentation, layout state, its ref, and Moraine focus-forwarding behavior. Caller ARIA, `data-*`, form attributes, and native events do not land on it.

The native control receives remaining native props first, followed by library-owned identity, form state, ARIA, value bindings, ref, slot marker, slot styles, and composed handlers. This order prevents a spread from replacing resolved state or internal handlers.

### Event composition

For an intercepted event:

1. Update or request the normalized value.
2. Invoke `onValueChange` when component semantics report a change.
3. Notify FormField/Form integration.
4. Invoke the caller's native handler with the original event.

Each stage runs once. Events Moraine does not intercept pass through unchanged.

### Form and ARIA precedence

Resolved identity and state use:

```text
Form/default value < nearest FormField value < explicit control prop
```

Only `undefined` falls back. Any Form rule that enforces a disabled subtree remains behavior logic and is documented separately from Theme precedence.

`aria-describedby` and `aria-labelledby` composition:

1. tokenize caller values;
2. append generated FormField IDs in stable semantic order;
3. remove empty tokens and duplicates while retaining first occurrence;
4. omit the attribute when no tokens remain.

Scalar ARIA values use an explicit caller value when it is not `undefined`, then fall back to FormField state. Labeling attributes always belong to the editable control.

## 12. Documentation and JSDoc

- Component-owned Props, Variants, and Slots have English descriptions.
- `@default` documents actual Moraine or `defaultTheme` behavior only.
- Callbacks, refs, and content props without defaults receive no placeholder default tags.
- Public aliases remain named and readable in emitted declarations.

The existing AST-based API extractor remains authoritative. It is extended only for new intersections or shared helpers.

A focused editor-completion test may import the pinned TypeScript 7 API from `typescript/unstable/sync` to verify one Button Variant, one Input-owned prop, one inherited native attribute, one documented slot, and one generic Select prop. It must not duplicate the complete public API in a golden manifest.

## 13. SSR and Reactivity

- Do not destructure reactive props or capture `props.theme` outside an accessor.
- Do not evaluate JSX-valued props inside Theme infrastructure.
- Recipe evaluation reads no browser globals, layout, time, randomness, or environment-specific state.
- Server and initial client renders use identical layer order.
- Theme replacement changes attributes on existing nodes without changing render branches solely because classes changed.
- Components touched by the future migration require getter single-evaluation tests and production hydration validation.

## 14. Bundle and Runtime Verification

Two consumer fixtures define the ownership boundary:

1. Import one component without a Provider. The output must exclude `defaultTheme` and unrelated component Recipes.
2. Import `MoraineProvider` with that component. The output may include the complete official Theme and must apply official classes.

Inspect a bundler metafile or stable class sentinels and record raw and gzip sizes against the branch baseline. Do not use fixed byte limits for source constants.

Runtime expectations:

- Theme creation compiles only supplied entries.
- Missing entries allocate nothing.
- Each component memoizes its ordered Recipe outputs once per reactive dependency state.
- Slot lookup and class merging are proportional to active Theme layers.

## 15. Future Implementation Sequence

This sequence is specification only and is not executed by this documentation change.

1. Add Theme types, explicit Recipe factories, context, and Provider behavior with focused tests.
2. Add `createComponentStyles` and verify precedence, reactivity, null handling, SSR, and node preservation.
3. Migrate Button as the polymorphic and multi-slot reference.
4. Migrate Input and Textarea with FormField integration and native forwarding.
5. Migrate Dialog/Modal as the compound reference and Select as the generic reference.
6. Migrate remaining families without behavior changes.
7. Remove superseded styling infrastructure and update public usage documentation.

No compatibility adapter is added. Each future stage must leave the repository buildable and must not combine behavior changes with Theme migration.

## 16. Future Verification

After focused tests, the future implementation uses only the non-duplicated final gates:

```sh
nub run qa
nub run test
nub run docs:build
```

`qa` already covers formatting, linting, type checking, and packaged type tests. `test` already builds before running the suite. Production hydration validation additionally uses `nub run docs:preview` at mobile, tablet, and desktop widths.

## 17. Acceptance Matrix

| Area          | Required result                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Naming        | The specification consistently uses Theme, `slotRecipe`, `atomicRecipe`, and `createComponentStyles`. |
| Provider      | Root, nested, unstyled, and missing-Provider behavior matches Section 7.                              |
| Ownership     | Components obtain official presentation only through Theme Context.                                   |
| Types         | Namespace docs, polymorphic props, native attributes, refs, and generic inference remain precise.     |
| Inputs        | Native props and events reach the editable control; wrapper styles and refs remain stable.            |
| State         | Recipes style state through DOM attributes without callback configuration.                            |
| Composition   | Theme layers evaluate independently and merge deterministically.                                      |
| SSR           | Hydration output matches and Theme replacement preserves node identity.                               |
| Bundle        | A component-only consumer excludes the complete official Theme.                                       |
| Documentation | AST extraction remains authoritative with focused completion smoke coverage.                          |

## 18. Documentation-only Boundary

Applying this specification rewrite changes only `requirements.md` and `detailed-design.md`. Source files, tests, configuration, generated documentation, lockfiles, and build artifacts remain untouched until a separate implementation request.
