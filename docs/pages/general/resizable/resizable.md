:::widget
name: docs-header
:::

## import

```tsx
import { Resizable, ResizableT } from 'moraine'
```

## Examples

### Basic Horizontal

Two panels with auto-inserted divider and root-level handle rendering.

:::example
name: BasicHorizontal
:::

### Controlled Sizes

Use panel.size + onResize to sync external state. The callback now returns pixel sizes.

:::example
name: ControlledSizes
:::

### Vertical + Disable

The root disable prop keeps dividers visible while turning off drag and keyboard resizing.

:::example
name: VerticalDisable
:::

### Nested Panels

Use the root intersection prop to control whether crossed dividers become draggable.

:::example
name: NestedPanels
:::

### Collapsible + Collapsible Min

Clicking handle toggles collapse/expand while dragging divider still resizes. The collapsibleMin rail remains visible in collapsed state.

:::example
name: CollapsibleCollapsibleMin
:::

## API Reference

:::widget
name: docs-api-reference
:::
