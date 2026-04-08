:::docs-header
:::

## Import

```tsx
import { MultiSelect } from 'moraine'
```

## Slot Structure

Tag container with inline input and a floating listbox with grouped options.

### Control

```text
control
├── tagsContainer
│   ├── tag (×n, Badge)
│   ├── tagOverflow (optional)
│   └── input
├── clear (IconButton, optional)
└── trigger (IconButton)
```

### Listbox

```text
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

:::docs-api-reference
:::
