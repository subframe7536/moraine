:::docs-header
:::

## Import

```tsx
import { Progress } from 'moraine'
```

## Slot Structure

Track with a fill indicator, optional status text, and step labels.

```text
root
├── status (optional, determinate only)
├── track
│   └── indicator
└── steps (optional, step mode)
    └── step (×n)
```

## Examples

### Sizes

Size scale from `xs` to `xl`.

:::example
name: Sizes
:::

### Orientations

Horizontal and vertical layouts with consistent value rendering.

:::example
name: Orientations
:::

### Determinate

Standard progress bar with status text and custom status renderer.

:::example
name: Determinate
:::

### Animations

Indeterminate animation variants: `carousel`, `reverse`, `swing`, and `elastic`.

:::example
name: Animations
:::

### Step Mode

String-array max renders named steps.

:::example
name: StepMode
:::

:::docs-api-reference
:::
