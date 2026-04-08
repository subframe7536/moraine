:::docs-header
:::

## Import

```tsx
import { Select } from 'moraine'
```

## Slot Structure

Trigger control and a floating listbox with grouped options.

### Control

```text
control
├── leading (Icon, optional)
├── input
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

### Single Select

Basic single selection with controlled value.

:::example
name: SingleSelect
:::

### Variants

Visual style variants.

:::example
name: Variants
:::

### Sizes

From xs to xl.

:::example
name: Sizes
:::

### Disabled

Non-interactive state.

:::example
name: Disabled
:::

### Trigger-Only Open

Only the trigger icon can open the dropdown menu.

:::example
name: TriggerOnlyOpen
:::

### Searchable

Type to filter options.

:::example
name: Searchable
:::

### Grouped Options

Options organized in sections.

:::example
name: GroupedOptions
:::

### Infinite Scroll

Scroll to the bottom to load more options.

:::example
name: InfiniteScroll
:::

:::docs-api-reference
:::
