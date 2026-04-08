:::docs-header
:::

## Import

```tsx
import { FileUpload } from 'moraine'
```

## Examples

### Single Upload

Basic single-file mode with a live readout from onValueChange.

:::example
name: SingleUpload
:::

### Multiple + Max Files

Append files across selections, reject overflow, and show selected names.

:::example
name: MultipleMaxFiles
:::

### Sizes

Size scale from `xs` to `xl` for trigger height, spacing, and file list density.

:::example
name: Sizes
:::

### Trigger Mode (No Dropzone)

Use button-style trigger behavior by disabling dropzone interaction.

:::example
name: TriggerModeNoDropzone
:::

### Form Integration

Submit to validate a required attachment with Form + FormField.

:::example
name: FormIntegration
:::

## DOM Structure

```
root
├── control (dropzone or trigger button)
│   └── wrapper
│       ├── icon (Icon)
│       ├── label (optional)
│       └── description (optional)
└── files (optional, preview list)
    └── file (×n)
        ├── filePreview
        ├── fileMeta
        │   ├── fileName
        │   └── fileSize
        └── fileRemove
```

:::docs-api-reference
:::
