:::docs-header
:::

## Import

```tsx
import { MultiSelect } from 'moraine'
```

## Examples

### Multiple Select

Multi-selection with chips and allowClear.

:::example
name: MultipleSelect
:::

### Token Separators

Create and select tags when a separator is typed.

:::example
name: TokenSeparators
:::

### Create New Tags

Type a new value and press Enter or click Create in the empty state.

:::example
name: CreateNewTags
:::

### Max Count & Max Tag Count

Limit selections and visible chips.

:::example
name: MaxCountMaxTagCount
:::

## DOM Structure

```
control
├── tagsContainer
│   ├── tag (×n, Badge)
│   ├── tagOverflow (optional)
│   └── input
├── clear (IconButton, optional)
└── trigger (IconButton)
```

```
content (portal)
├── listbox
│   ├── item (×n)
│   │   ├── itemLabel
│   │   ├── itemDescription (optional)
│   │   └── itemTrailing (optional)
│   └── group (×n, optional)
│       └── label (optional)
└── empty (optional, no matches)
```

:::docs-api-reference
:::
