:::docs-header
:::

## Import

```tsx
import { Breadcrumb } from 'moraine'
```

## Slot Structure

Ordered navigation list with links and separators between items.

```text
root
└── list
    └── item (×n)
        ├── link
        └── separator (optional, between items)
```

## Examples

### Default

Simple breadcrumb trail with active last item.

:::example
name: Default
:::

### Sizes

Different size.

:::example
name: Sizes
:::

### Custom Separator + Disabled

Use an alternative separator and mark links as disabled.

:::example
name: CustomSeparatorDisabled
:::

### Wrapping

Toggle wrapping behavior for long breadcrumb labels.

:::example
name: Wrapping
:::

:::docs-api-reference
:::
