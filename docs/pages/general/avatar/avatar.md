:::docs-header
:::

## Import

```tsx
import { Avatar } from 'moraine'
```

## Slot Structure

Single avatar with image fallback, or a group of avatars with an overflow counter.

### Single avatar

```text
root
├── image
├── fallback
│   └── fallbackIcon (Icon, optional)
└── badge (optional)
```

### Group avatar

```text
group
├── groupCount (optional, overflow count)
└── groupItem (×n)
    ├── image
    ├── fallback
    │   └── fallbackIcon (Icon, optional)
    └── badge (optional)
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

:::docs-api-reference
:::
