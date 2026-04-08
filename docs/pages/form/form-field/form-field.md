:::docs-header
:::

## Import

```tsx
import { FormField } from 'moraine'
```

## Slot Structure

Label, description, and hint area above a control slot with validation feedback.

```text
root
├── wrapper
│   ├── labelWrapper (optional)
│   │   ├── label
│   │   └── hint (optional)
│   └── description (optional)
└── {children}
    ├── help (optional)
    └── error (optional)
```

## Examples

### Basic

Label, hint, description, and help text with a single control.

:::example
name: Basic
:::

### With Validation

Bind to `Form` state and show validation feedback.

:::example
name: WithValidation
:::

### Horizontal Layout

Use `orientation="horizontal"` for form-like row layouts.

:::example
name: HorizontalLayout
:::

### Sizes

Preview the field typography scale from xs to xl.

:::example
name: Sizes
:::

### Manual Error

Force error state with a custom error message.

:::example
name: ManualError
:::

### Render Context

Use render-function children to react to `error` state.

:::example
name: RenderContext
:::

### Nested Path

Use array path names for nested form fields.

:::example
name: NestedPath
:::

:::docs-api-reference
:::
