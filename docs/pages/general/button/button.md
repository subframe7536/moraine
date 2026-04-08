:::docs-header
:::

## Import

```tsx
import { Button } from 'moraine'
```

## Slot Structure

Trigger element with optional leading and trailing icon slots.

```text
root
├── leading (Icon, optional)
├── label (optional)
└── trailing (Icon, optional)
```

## Examples

### Variants

Visual variants from the Moraine button class contract.

:::example
name: Variants
:::

### Sizes

Text button sizes with a leading icon to preview spacing.

:::example
name: Sizes
:::

### Loading States

Controlled loading and async auto-loading from click handlers.

:::example
name: LoadingStates
:::

#### Loading Placement

When loading, the icon replaces `leading` first. If no `leading` is set, it replaces `trailing`.

:::example
name: LoadingPlacement
:::

### Icon Buttons

Icon-only sizes and variants.

:::example
name: IconButtons
:::

### Polymorphic

Anchor rendering support via the polymorphic as prop.

:::example
name: Polymorphic
:::

:::docs-api-reference
:::
