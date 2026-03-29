# TypeScript

A guide to using TypeScript with Moraine.

## Overview

Moraine exposes types in two layers:

- **`XxxProps`** — the top-level public props type for each component, exported directly from `moraine`.
- **`XxxT.*`** — a namespace of component-specific sub-types (items, values, slots, etc.), also exported from `moraine`.

```tsx
import type { ButtonProps, SelectProps, SelectT } from 'moraine'
```

## Component Props (`XxxProps`)

Every component exports a `Props` type named after the component (e.g. `ButtonProps`, `SelectProps`). Use this when wrapping a component or extending its props interface.

```tsx
import type { ButtonProps } from 'moraine'

interface PrimaryButtonProps extends ButtonProps {
  trackingId?: string
}

function PrimaryButton(props: PrimaryButtonProps) {
  // ...
}
```

## Component Namespace (`XxxT`)

The `XxxT` namespace groups all supporting types for a component under a single import. This keeps the top-level exports focused and avoids polluting the global type space.

### Item models

List-like components (e.g. `Select`, `MultiSelect`) expose an `Items` type for their option objects.

```tsx
import type { SelectT } from 'moraine'

const regionOptions: SelectT.Items[] = [
  { label: 'Asia', value: 'asia' },
  { label: 'Europe', value: 'europe' },
]
```

### Controlled values

Use `XxxT.Value` to type state variables that hold a component's selected or active value.

```tsx
import type { SelectT } from 'moraine'

let selected: SelectT.Value | null = null
```

### Render callback params

Prop callbacks often receive component-specific objects. Type them using the appropriate namespace member.

```tsx
import type { SelectProps } from 'moraine'

const labelRender: SelectProps['labelRender'] = (option) =>
  typeof option.label === 'string' ? option.label : option.key ?? 'Unknown'
```

### Slot types

`XxxT.Slot` is a union of valid slot names used by the `classes` and `styles` props, giving you autocomplete and type safety when overriding per-slot styles.

```tsx
import type { CardT } from 'moraine'

const overrides: CardT.Classes = {
  header: 'bg-gray-100',
}
```

## Namespace Reference

Each `XxxT` namespace may expose the following members depending on the component:

| Member | Description |
| --- | --- |
| `Slot` | Union of slot names used by `classes` and `styles` |
| `Variant` | Variant options for visual/style customization |
| `Items` | Data model for list items or option objects |
| `Value` | Domain type of the component's controlled value |
| `Classes` | Typed map from slot name to CSS class string |
| `Styles` | Typed map from slot name to inline style object |
| `Base` | Component-specific business props (internal) |
| `Props` | Final public props shape (same as `XxxProps`) |

## Tips

- Use `import type` for all type-only imports to keep runtime bundles clean.
- Prefer exported `XxxProps` and `XxxT.*` types over importing internal source types directly.
- When in doubt, start with `XxxProps`; reach for `XxxT.*` only when you need a more specific sub-type.
