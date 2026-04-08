:::docs-header
:::

## Import

```tsx
import { Pagination } from 'moraine'
```

## Slot Structure

Page controls with previous, next, and numbered page link buttons.

```text
root
└── list
    ├── item (prev)
    │   └── prev (Button)
    ├── item (×n, page links)
    │   └── link (Button)
    └── item (next)
        └── next (Button)
```

## Examples

### Variants

Render controls as links and override variant pairing when needed.

:::example
name: Variants
:::

### Sizes

Size scale from `xs` to `xl` for page links and previous/next controls.

:::example
name: Sizes
:::

### Controlled

Default ghost + outline controls with external page state management.

:::example
name: Controlled
:::

### Minimal

Hide prev/next controls and show only page buttons.

:::example
name: Minimal
:::

:::docs-api-reference
:::
