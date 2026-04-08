:::docs-header
:::

## Import

```tsx
import { Popup } from 'moraine'
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

## DOM Structure

```
trigger
├── overlay (optional)
└── content (portal)
```

:::docs-api-reference
:::
