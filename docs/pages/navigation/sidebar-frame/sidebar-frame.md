:::docs-header
status: new
:::

## Import

```tsx
import { SidebarFrame, SidebarFrameSheetResizableRender } from 'moraine'
```

## Examples

### Basic

Desktop fixed layout with a simple header/body/main composition.

:::example
name: Basic
:::

### Variants

Compare `default`, `floating`, and `inset` visual variants with the same content.

:::example
name: Variants
:::

### Sides

Compare `side="left"` and `side="right"` desktop layouts.

:::example
name: Sides
:::

### SheetResizableRender

Use `SidebarFrameSheetResizableRender` with external collapse button, `collapsibleMin`, and icon handle.

:::example
name: SheetResizableRender
:::

### ForcedMobile

Force mobile mode and open the sidebar sheet from main content via `ctx.toggle`.

:::example
name: ForcedMobile
:::

### HeaderFooterSlots

Use optional `renderSidebarHeader` and `renderSidebarFooter` while keeping body as the scroll region.

:::example
name: HeaderFooterSlots
:::

## DOM Structure

```
root
├── sidebar
│   ├── sidebarHeader (optional)
│   ├── sidebarBody
│   └── sidebarFooter (optional)
└── main
```

:::docs-api-reference
:::
