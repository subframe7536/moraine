:::docs-header
:::

## Import

```tsx
import { RadioGroup } from 'moraine'
```

## Examples

### Variants

List, card, and table variants for single selection.

:::example
name: Variants
:::

### Sizes + Orientation

Size scale and vertical/horizontal modes.

:::example
name: SizesOrientation
:::

### Controlled + Disabled

Controlled value with disabled option in data set.

:::example
name: ControlledDisabled
:::

### Indicator Positions

Start/end/hidden indicator styles with card variant.

:::example
name: IndicatorPositions
:::

## DOM Structure

```
root
└── fieldset
    ├── legend (optional)
    └── item (×n)
        ├── container
        │   ├── input
        │   └── control
        │       └── indicator
        └── wrapper (optional)
            ├── label (optional)
            └── description (optional)
```

:::docs-api-reference
:::
