:::docs-header
:::

## Import

```tsx
import { Avatar } from 'moraine'
```

## Examples

### Single Avatar

Fallback first, then image crossfades in after preload.

:::example
name: SingleAvatar
:::

### Sizes

Scale from `xs` to `xl` for single and grouped avatar contexts.

:::example
name: Sizes
:::

### Fallback Modes

Text, initials-from-alt and fallback icon.

:::example
name: FallbackModes
:::

### Badge Positions

Top/bottom + left/right corner badge.

:::example
name: BadgePositions
:::

### Merged Group Mode

Use the same Avatar component with items.

:::example
name: MergedGroupMode
:::

## DOM Structure

Single avatar:

```
root
├── image
├── fallback
│   └── fallbackIcon (Icon, optional)
└── badge (optional)
```

Group avatar:

```
group
├── groupCount (optional, overflow count)
└── groupItem (×n, same as single avatar)
    ├── image
    ├── fallback
    │   └── fallbackIcon (Icon, optional)
    └── badge (optional)
```

:::docs-api-reference
:::
