:::docs-header
:::

## Import

```tsx
import { InputNumber } from 'moraine'
```

## Examples

### Variants

Visual style variants for the input shell.

:::example
name: Variants
:::

### Sizes

Size scale from `xs` to `xl` for input height and control rail sizing.

:::example
name: Sizes
:::

### Orientations

Horizontal (default) and vertical button layouts.

:::example
name: Orientations
:::

### Controlled

Value bound to a signal with live readout.

:::example
name: Controlled
:::

### Disabled

Non-interactive disabled state.

:::example
name: Disabled
:::

### Long Press

Press and hold increment or decrement to continuously step the value.

:::example
name: LongPress
:::

### Min / Max / Step

Constrained ranges and custom step increments.

:::example
name: MinMaxStep
:::

## DOM Structure

```
root
├── input
└── controls (optional, vertical orientation)
```

Horizontal orientation renders decrement/increment controls inline alongside `input` instead.

:::docs-api-reference
:::
