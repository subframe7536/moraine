# Moraine Component Contracts and Theme Architecture Requirements

## Document Status

- **Project:** Moraine UI
- **Target branch:** `style-refactor`
- **Version:** 3.0
- **Stage:** Pre-1.0; breaking changes are allowed
- **Boundary:** This specification describes future implementation work. Updating it does not authorize source-code changes.

## 1. Context

Moraine is a SolidJS component library with accessible behavior, compound component families, and atomic class styling for Tailwind CSS and UnoCSS. The current contracts have several developer-experience problems:

- Visual defaults can come from component code, recipes, parent contexts, and application configuration without one documented precedence rule.
- Shared calculated prop types obscure component JSDoc and admit arbitrary attributes.
- Central slot metadata duplicates component namespaces and recipe definitions.
- Input wrappers do not forward native attributes like the Nuxt UI component that Moraine references.
- The global presentation object is described inconsistently as a preset, a complete registry, and an inheritance layer.

The replacement architecture uses a **Theme**: an ordered collection of component Recipes supplied through context. A Theme contains presentation configuration only. Behavior, controlled state, native attributes, render content, and interaction state stay outside it.

## 2. Goals

1. Give consumers predictable props, native forwarding, refs, events, defaults, and IDE documentation.
2. Give theme authors a declarative, typed Recipe API.
3. Give maintainers one local source for a component's slots and visual variants without runtime component metadata.
4. Resolve visual defaults through one reactive, undefined-only precedence model.
5. Style internal state through DOM attributes instead of public pseudo-variants or JavaScript callbacks.
6. Preserve SolidJS reactivity, SSR, hydration, polymorphic typing, and generic inference.
7. Measure bundle behavior through real consumer builds instead of arbitrary source-size limits.

## 3. Non-goals

- Do not redesign focus management, overlay positioning, form validation, virtualization, or controlled/uncontrolled state machines.
- Do not add runtime prop validation.
- Do not put render functions, native attributes, component instances, or state callbacks in Themes.
- Components must not import the official Theme or official component Recipes directly.
- Backward-compatibility shims are not required before 1.0.

## 4. Required Terminology

| Concept                                       | Name                      |
| --------------------------------------------- | ------------------------- |
| Complete or sparse presentation configuration | `MoraineTheme`            |
| Sparse custom Theme factory                   | `createTheme`             |
| Official Provider-owned Theme                 | `defaultTheme`            |
| Per-component Theme entry                     | `ComponentRecipeConfig`   |
| Multi-slot Recipe factory                     | `slotRecipe`              |
| Single-element Recipe factory                 | `atomicRecipe`            |
| Component-side reactive resolver              | `createComponentStyles`   |
| Styled boundary                               | `MoraineProvider`         |
| Theme-reset boundary                          | `MoraineUnstyledProvider` |

Avoid generic factory or resolver names that do not distinguish Theme creation, multi-slot Recipes, atomic Recipes, and component style resolution.

## 5. User Stories

### Component consumers

- Typing `<Button size="` shows valid values, component-authored JSDoc, and the official Theme default.
- Native Input attributes such as `form`, `list`, `enterKeyHint`, `aria-label`, and `data-testid` reach the native control.
- `ref` returns the visual wrapper, while `inputRef` or `textareaRef` returns the editable element.
- Native handlers receive native events; normalized values are reported through `onValueChange`.
- `classes` and `styles` complete documented slot names.

### Theme authors

- A sparse Theme overrides one component while retaining lower Provider layers.
- Theme inheritance preserves ordered Recipe layers rather than recursively combining configuration objects.
- Invalid, expanded, highlighted, loading, and placement states are styleable through documented `data-*` and ARIA selectors.

### Maintainers

- Adding a behavior prop changes only the component namespace and implementation.
- Changing a slot updates the local `Slot<T>` interface and local Recipe configuration.
- A component asks Theme Context for a Recipe by family key and never imports official presentation.

## 6. Functional Requirements

### FR-1: Component namespace contract

Every public component declares a `<Component>T` namespace with the applicable `Slot<T>`, `SlotName`, `Variant`, `Classes`, `Styles`, `Item`, `Base`, and `Props` members.

```ts
export namespace ButtonT {
  export interface Slot<T = unknown> {
    /** Interactive button element. */
    root?: T
    /** Main content between the leading and trailing regions. */
    label?: T
  }

  export type SlotName = keyof Slot
  export interface Variant {
    size?: 'sm' | 'md' | 'lg' | null
    variant?: 'default' | 'outline' | 'ghost' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<JSX.CSSProperties>
  export interface Base {}
  export type Props = /* native props + Base + Variant + style props */
}

export type ButtonProps = ButtonT.Props
```

- The only top-level component type is `<Component>Props`.
- `Classes` and `Styles` instantiate `Slot<T>` directly so property JSDoc survives completion.
- Shared helpers may compose native, polymorphic, and style props, but must not add an unrestricted string index signature.
- Polymorphic components preserve required custom-component props and infer native event and ref types from `as`.

### FR-2: JSDoc

- Every component-owned public prop and slot has a concise English description.
- `@default` is required only when Moraine or `defaultTheme` supplies a non-`undefined` fallback.
- Inherited SolidJS attributes rely on upstream documentation and are not copied.
- Published declarations preserve representative Prop, Variant, and Slot descriptions.
- Documentation tooling prefers named public types over expanded calculated types.

### FR-3: Theme shape and composition

`createTheme()` creates a sparse `MoraineTheme`. Component entries use the declarative fields `base`, `variants`, `compoundVariants`, and `defaults`.

```ts
const compactTheme = createTheme({
  button: {
    base: { root: 'rounded-md' },
    variants: {
      size: {
        sm: { root: 'h-7 px-2' },
      },
    },
    defaults: { size: 'sm' },
  },
})
```

- A missing component entry contributes nothing.
- `extends` accepts one parent Theme and retains its ordered layers before the child layer.
- Theme creation never recursively merges Recipe configuration objects.
- Every layer evaluates independently; resulting classes merge in layer order with `cn()`.
- Theme entries contain no prop dictionaries, slot arrays, root-slot declarations, or state schemas.

### FR-4: Provider behavior

The official Theme comes from a Provider.

- A root `MoraineProvider` starts with `defaultTheme`; its optional `theme` layers follow.
- A nested `MoraineProvider` inherits the nearest context and appends its optional Theme without adding `defaultTheme` again.
- `theme` is reactive; replacement updates classes and defaults without remounting component DOM.
- `MoraineUnstyledProvider` discards parent layers and `defaultTheme`; its optional Theme is complete for that subtree.
- A styled Provider nested inside an unstyled boundary inherits the reset context and does not silently restore official presentation.
- Without a Provider, components remain functional and accessible but receive no Recipe.
- The missing-Provider warning runs only when `DEV` imported from `solid-js` is truthy and `process.env.NODE_ENV !== 'test'`.
- Warnings are deduplicated per application owner when an owner exists; production and tests remain silent.

### FR-5: Component style resolution

`createComponentStyles` is an internal Solid primitive. It reads ordered Recipes from Theme Context and resolves visual Variants in this low-to-high order:

```text
older Recipe defaults < newer Theme defaults < inherited context < instance props
```

- Only `undefined` permits fallback; preserve `false`, `0`, `''`, and valid `null`.
- Controlled values and behavioral options never receive Theme defaults.
- Every Recipe evaluates independently with the final Variants.
- Slot classes merge as `Theme layers < group classes < instance classes[slot] < root class`.
- Inline styles merge shallowly as `component dynamic style < group styles < instance styles[slot] < root style`.
- Props and context stay reactive without destructuring or object-spread copies.

### FR-6: Styleable state

- Internal state is projected through stable `data-*` or ARIA attributes on relevant DOM nodes.
- Recipes use standard flat Tailwind-compatible selectors.
- Derived state is not exported as a Variant solely for styling.
- Measurement-derived geometry stays in component-owned inline styles or CSS custom properties.
- Theme configuration accepts no arbitrary state callbacks.

### FR-7: Component family keys

- Each public family owns one Theme key, such as `dialog`, `select`, or `dropdownMenu`.
- Namespaced DOM parts share the family Recipe and consume their corresponding slots.
- Behavior-only roots expose no meaningless style props.
- Theme keys do not encode implementation nesting or private primitive names.

### FR-8: Input and Textarea ownership

Input and Textarea follow the [Nuxt UI Input](https://github.com/nuxt/ui/blob/v4/src/runtime/components/Input.vue) forwarding model while preserving Moraine's wrapper-ref convention.

The wrapper receives:

- `class`, `style`, and root slot overrides;
- top-level `ref`;
- Moraine-owned layout and state attributes.

The native control receives:

- all remaining native attributes, including caller ARIA and `data-*`;
- native event handlers;
- resolved FormField identity and state;
- control-slot classes and styles;
- `inputRef` or `textareaRef`.

Additional requirements:

- Props extend the corresponding SolidJS native attribute interface and omit only fields Moraine overrides.
- Native attributes are not maintained through a hand-written allowlist.
- `onInput`, `onChange`, focus, keyboard, clipboard, composition, and validation handlers keep native event signatures.
- `onValueChange` is the normalized-value callback.
- Internal value work runs first, FormField notification second, and the user native handler last; each runs once.
- Caller and generated `aria-describedby`/`aria-labelledby` tokens merge in stable order and deduplicate.
- Explicit `id`, `name`, `disabled`, `required`, and `readOnly` override inherited values when not `undefined`.

### FR-9: Compile-time Theme schema

- A type-only `MoraineThemeSchema` maps each component family to its Slot and Variant types.
- It drives `createTheme()` completion and validation.
- It emits no runtime registry or slot inventory.
- Adding a family requires one schema entry; existing Slot and Variant changes flow from namespace types.

## 7. Non-functional Requirements

### Reactivity and SSR

- Provider replacement, inherited context, Theme defaults, and props remain reactive.
- Theme resolution is deterministic and performs no browser-global reads.
- Server and initial client output have identical classes, styles, and state attributes.
- JSX-valued props are evaluated once per semantic render decision.
- Theme replacement preserves values, focus, selection, uncontrolled state, and DOM identity.

### Runtime and bundle behavior

- Component modules import no official Theme entry.
- Importing a component without a Provider must not pull the complete official Theme into the consumer bundle.
- Importing `MoraineProvider` may include `defaultTheme`, because the Provider owns official presentation.
- Sparse Themes create no empty Recipes for missing component keys.
- Bundle acceptance uses tree-shaken consumer fixtures and gzip comparison, not source-constant byte counts.

### Maintainability

- Add no runtime dependency.
- Shared Theme infrastructure contains no component-name branches.
- Behavior primitives remain separate from presentation resolution.
- Public and internal names distinguish Themes, slot Recipes, atomic Recipes, and reactive component style resolution.

## 8. Acceptance Criteria

### Types and documentation

- Button, Input, and Select slot completion retains Slot JSDoc.
- Input/Textarea native attributes and event targets infer the correct element.
- Button polymorphism and Select/Form generics remain intact.
- Published declarations retain representative docs and real defaults.

### Theme and Provider

- A root Provider applies `defaultTheme` without an explicit prop.
- Custom and nested Themes override in stable layer order.
- The unstyled boundary removes inherited and official classes.
- Missing Provider behavior is unstyled and warns only in non-test development.
- Reactive Theme replacement does not replace DOM nodes.

### Input and Textarea

- Native attributes, ARIA, `data-*`, and events land on the editable control.
- Root `class`, `style`, and `ref` land on the wrapper.
- Named refs capture the native control.
- FormField IDs and ARIA references merge with caller tokens.
- Native and value callbacks receive documented payloads once.

### State, SSR, and bundle

- Internal state styling uses DOM attributes without public pseudo-variants.
- SSR hydration preserves output and node identity.
- A one-component consumer without a Provider excludes `defaultTheme` and unrelated Recipes.
- A Provider consumer includes official presentation and supports custom Theme layers.

## 9. Documentation-only Scope

This document and `detailed-design.md` are the only files changed by this specification rewrite. Source code, tests, configuration, generated documentation, lockfiles, and build artifacts remain untouched until a separate implementation request.
