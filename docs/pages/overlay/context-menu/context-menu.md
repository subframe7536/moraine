:::docs-header
:::

## Import

```tsx
import { ContextMenu } from 'moraine'
```

## Slot Structure

Right-click trigger with a floating menu portal containing grouped items.

### Menu

```text
trigger
└── content (portal)
    └── group (×n)
        ├── label (optional)
        ├── separator (optional)
        └── item (×n)
```

### Item internals

```text
item
├── itemLeading (optional)
├── itemWrapper
│   ├── itemLabel (optional)
│   └── itemDescription (optional)
└── itemTrailing
    └── itemIndicator (optional, checkbox items)
```

## Examples

### Sizes

Menu item size scale from `sm` to `lg` for compact and roomy density.

:::example
name: Sizes
:::

### Placements

Same file menu rendered with top/right/bottom/left placements for quick transition-direction sanity checks.

:::example
name: Placements
:::

### File Explorer

A file-row context menu with move flows, shortcuts, mixed labels, and destructive actions.

:::example
name: FileExplorer
:::

### Editor Selection

A code-editor-style context menu with refactors, toggles, and theme switching for keyboard and pointer testing.

:::example
name: EditorSelection
:::

### Project / Issue Actions

A denser project card menu with assignee and sprint submenus plus archive/delete actions.

:::example
name: ProjectIssueActions
:::

:::docs-api-reference
:::
