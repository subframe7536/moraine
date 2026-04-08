:::docs-header
:::

## Import

```tsx
import { Sheet } from 'moraine'
```

## Slot Structure

Wrapper trigger with optional backdrop and a sliding panel with title, body, and footer slots.

```text
trigger
├── overlay (optional)
└── content (portal)
    ├── header (optional)
    │   ├── wrapper (optional)
    │   │   ├── title (optional)
    │   │   └── description (optional)
    │   ├── actions (optional)
    │   └── close (optional)
    ├── body (optional)
    └── footer (optional)
```

## Examples

### Variants

Inset layout with custom close content or hidden close control.

:::example
name: Variants
:::

### Sides

Open sheet from each side with shared shell slots.

:::example
name: Sides
:::

### Dismiss Control

Prevent close on outside interaction and Escape while counting attempts.

:::example
name: DismissControl
:::

:::docs-api-reference
:::
