:::docs-header
:::

## Import

```tsx
import { Switch } from 'moraine'
```

## Slot Structure

Toggle track with thumb and optional label area.

```text
root
├── container
│   ├── input
│   └── track
│       └── thumb
└── wrapper (optional)
    ├── label (optional)
    └── description (optional)
```

## Examples

### Basic + Controlled

Uncontrolled and controlled switch with icon slots.

:::example
name: BasicControlled
:::

### Variants

Loading, disabled, and explicit icon combinations.

:::example
name: Variants
:::

### Sizes

Switch size scale from xs to xl.

:::example
name: Sizes
:::

### Custom True/False Values

Map checked state to domain values instead of boolean.

:::example
name: CustomTrueFalseValues
:::

:::docs-api-reference
:::
