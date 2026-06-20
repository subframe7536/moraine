:::docs-header
:::

## Import

```tsx
import { Collapsible } from 'moraine'
```

## Slot Structure

Single expandable section with a trigger slot.

```text
root
├── trigger
└── content-wrapper
    └── content
```

## Examples

### Uncontrolled and Transition

FAQ pattern with optional height transition. Spacing belongs inside the content so the wrapper can collapse without layout shifts.

:::example
name: Uncontrolled
:::

### Controlled and Disabled

External state controls a billing panel and can temporarily disable the trigger while an operation is locked.

:::example
name: Controlled
:::

### Stateful Trigger

Compose a compact row where only the icon button toggles detail content.

:::example
name: Stateful
:::

:::docs-api-reference
:::
