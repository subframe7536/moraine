:::docs-header
:::

## Import

```tsx
import { RadioGroup } from 'moraine'
```

## Slot Structure

Fieldset with optional legend and mutually exclusive radio items.

```text
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

:::docs-api-reference
:::
