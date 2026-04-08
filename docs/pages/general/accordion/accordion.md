:::docs-header
:::

## Import

```tsx
import { Accordion } from 'moraine'
```

## Examples

### Single

Single-open mode with controlled state and icon leading/trailing slots.

:::example
name: Single
:::

### Multiple

Multiple-open mode with custom trailing icons.

:::example
name: Multiple
:::

### Disabled + Custom Content

Mix disabled items with rich JSX content blocks.

:::example
name: DisabledCustomContent
:::

## DOM Structure

```
root
└── item (×n)
    ├── header
    │   └── trigger
    │       ├── leading (Icon, optional)
    │       ├── label (optional)
    │       └── trailing (Icon, optional)
    └── content (optional)
```

:::docs-api-reference
:::
