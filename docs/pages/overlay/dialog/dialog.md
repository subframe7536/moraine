:::docs-header
:::

## Import

```tsx
import { Dialog } from 'moraine'
```

## Slot Structure

Wrapper trigger with optional backdrop and a floating panel with title, body, and footer slots.

```text
trigger
├── overlay (optional)
└── content (portal)
    ├── header (optional)
    │   ├── wrapper (optional)
    │   │   ├── title (optional)
    │   │   └── description (optional)
    │   └── close (optional)
    ├── body (optional)
    └── footer (optional)
```

## Examples

### Default Shell

Header, description, actions, body, and footer slots.

:::example
name: DefaultShell
:::

### Variants

`close` supports default button, hidden, and custom JSX content.

:::example
name: Variants
:::

### Scrollable + Dismissible Control

Scrollable body with prevent-close callback when dismiss is disabled.

:::example
name: ScrollableDismissibleControl
:::

:::docs-api-reference
:::
