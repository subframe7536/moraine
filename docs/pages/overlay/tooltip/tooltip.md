:::docs-header
:::

## Import

```tsx
import { Tooltip } from 'moraine'
```

## Slot Structure

Wrapper trigger with a floating content portal containing text and optional keyboard hints.

```text
trigger
└── content (portal)
    ├── text (optional)
    └── kbds (optional)
        └── kbd (×n)
```

## Examples

### Placements

Tooltip positioned on each side.

:::example
name: Placements
:::

### Trigger Types

Tooltip on buttons and inline text.

:::example
name: TriggerTypes
:::

### Keyboard Shortcuts

Display keyboard shortcut hints alongside tooltip text.

:::example
name: KeyboardShortcuts
:::

### Text Only vs Shortcuts Only

Content variations.

:::example
name: TextOnlyVsShortcutsOnly
:::

:::docs-api-reference
:::
