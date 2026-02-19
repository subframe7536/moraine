import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

export const fileUploadRootVariants = cva('relative flex flex-col', {
  defaultVariants: {
    size: 'md',
    disabled: false,
  },
  variants: {
    size: {
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-2.5',
      lg: 'gap-3',
      xl: 'gap-3.5',
    },
    disabled: {
      true: 'opacity-75',
    },
  },
})

export const fileUploadBaseVariants = cva(
  'group relative inline-flex w-full cursor-pointer items-center justify-center rounded-lg border bg-background text-center outline-none transition-colors focus-visible:effect-fv',
  {
    defaultVariants: {
      color: 'primary',
      size: 'md',
      dropzone: true,
      disabled: false,
      dragging: false,
    },
    variants: {
      color: {
        primary: 'focus-visible:(ring-primary border-primary/70)',
        secondary: 'focus-visible:(ring-secondary border-secondary/70)',
        neutral: 'focus-visible:(ring-foreground border-foreground/70)',
        error: 'focus-visible:(ring-destructive border-destructive/70)',
      },
      size: {
        xs: 'min-h-20 gap-1.5 px-2.5 py-2 text-xs',
        sm: 'min-h-24 gap-2 px-3 py-2.5 text-xs',
        md: 'min-h-28 gap-2 px-4 py-3 text-sm',
        lg: 'min-h-32 gap-2.5 px-4.5 py-3.5 text-sm',
        xl: 'min-h-36 gap-3 px-5 py-4 text-base',
      },
      highlight: {
        true: 'ring-1 ring-inset ring-border',
      },
      disabled: {
        true: 'cursor-not-allowed',
      },
      dragging: {
        true: '',
      },
      dropzone: {
        true: 'border-dashed',
        false: 'border-solid',
      },
    },
    compoundVariants: [
      { color: 'primary', highlight: true, class: 'ring-primary' },
      { color: 'secondary', highlight: true, class: 'ring-secondary' },
      { color: 'neutral', highlight: true, class: 'ring-foreground' },
      { color: 'error', highlight: true, class: 'ring-destructive' },
      { color: 'primary', dragging: true, class: 'border-primary bg-primary/8' },
      { color: 'secondary', dragging: true, class: 'border-secondary bg-secondary/8' },
      { color: 'neutral', dragging: true, class: 'border-foreground bg-muted/64' },
      { color: 'error', dragging: true, class: 'border-destructive bg-destructive/8' },
      { disabled: true, class: 'pointer-events-none bg-muted/32' },
    ],
  },
)

export const fileUploadWrapperVariants = cva(
  'pointer-events-none flex flex-col items-center justify-center text-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'gap-0.5',
        sm: 'gap-0.5',
        md: 'gap-1',
        lg: 'gap-1',
        xl: 'gap-1.5',
      },
    },
  },
)

export const fileUploadIconVariants = cva('text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-base',
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
    },
  },
})

export const fileUploadLabelVariants = cva('font-medium text-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export const fileUploadDescriptionVariants = cva('text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export const fileUploadFilesVariants = cva('flex flex-col', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'gap-1.5',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2',
      xl: 'gap-2.5',
    },
  },
})

export const fileUploadFileVariants = cva(
  'relative flex items-center rounded-md border bg-background',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'gap-1.5 px-2 py-1.5',
        sm: 'gap-1.5 px-2.5 py-2',
        md: 'gap-2 px-2.5 py-2',
        lg: 'gap-2.5 px-3 py-2.5',
        xl: 'gap-3 px-3.5 py-3',
      },
    },
  },
)

export const fileUploadPreviewVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-8',
        sm: 'size-8.5',
        md: 'size-9',
        lg: 'size-10',
        xl: 'size-11',
      },
    },
  },
)

export const fileUploadMetaVariants = cva('flex min-w-0 flex-1 flex-col', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'gap-0.5',
      sm: 'gap-0.5',
      md: 'gap-0.5',
      lg: 'gap-1',
      xl: 'gap-1',
    },
  },
})

export const fileUploadNameVariants = cva('truncate font-medium text-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
      xl: 'text-base',
    },
  },
})

export const fileUploadSizeVariants = cva('truncate text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-xs',
      xl: 'text-sm',
    },
  },
})

export const fileUploadRemoveVariants = cva(
  'inline-flex items-center justify-center rounded-sm text-muted-foreground transition-colors hover:(bg-muted text-foreground) focus-visible:effect-fv',
  {
    defaultVariants: {
      size: 'md',
      disabled: false,
    },
    variants: {
      size: {
        xs: 'size-5 text-xs',
        sm: 'size-5 text-xs',
        md: 'size-6 text-sm',
        lg: 'size-6.5 text-sm',
        xl: 'size-7 text-base',
      },
      disabled: {
        true: 'pointer-events-none opacity-64',
      },
    },
  },
)

export type FileUploadVariantProps = VariantProps<typeof fileUploadBaseVariants> &
  VariantProps<typeof fileUploadRootVariants>
