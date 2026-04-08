:::docs-header
:::

## Import

```tsx
import { Popup } from 'moraine'
```

## Slot Structure

Wrapper trigger with an optional backdrop and a floating content portal.

```text
trigger
├── overlay (optional)
└── content (portal)
```

## Examples

### Default Container

Popup provides only container + overlay. Content styling is fully custom.

:::example
name: DefaultContainer
:::

### Dismiss Control

Block outside dismiss and count prevent-close attempts.

:::example
name: DismissControl
:::

### Scrollable Overlay Mode

Scrollable overlay keeps content in flow while preserving the backdrop.

:::example
name: ScrollableOverlayMode
:::

:::docs-api-reference
:::
