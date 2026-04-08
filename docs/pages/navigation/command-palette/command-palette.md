:::docs-header
:::

## Import

```tsx
import { CommandPalette } from 'moraine'
```

## Examples

### Usage

Click the button or press ⌘K to open the command palette.

:::example
name: Usage
:::

### Basic

Groups of items with icons, kbds, and descriptions.

:::example
name: Basic
:::

### Custom Empty State

Override the default 'No results.' message.

:::example
name: CustomEmptyState
:::

### Loading

Search icon becomes a spinner while loading.

:::example
name: Loading
:::

### With Close Button

A close button in the input trailing slot.

:::example
name: WithCloseButton
:::

### Sub-Navigation

Items with children drill into a sub-group. Press Backspace or the back button to return.

:::example
name: SubNavigation
:::

## DOM Structure

```
root
├── inputWrapper
│   ├── search (IconButton, optional)
│   ├── back (IconButton, optional)
│   ├── input
│   └── close (IconButton, optional)
├── listbox (optional)
│   └── item (×n)
│       ├── itemLeading (Icon, optional)
│       ├── itemWrapper
│       │   ├── itemLabel (optional)
│       │   │   ├── itemLabelPrefix (optional)
│       │   │   ├── itemLabelBase
│       │   │   └── itemLabelSuffix (optional)
│       │   └── itemDescription (optional)
│       └── itemTrailing (Icon or Kbd, optional)
├── group (×n, optional)
│   └── label (optional)
├── empty (optional, no matches)
└── footer (optional)
```

:::docs-api-reference
:::
