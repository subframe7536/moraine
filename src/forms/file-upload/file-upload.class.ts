import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { TEXT_SIZE_VARIANT } from '../../shared/cva-common.class'

export const fileUploadRootVariants = cva('relative flex flex-col data-disabled:effect-dis', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-2.5',
      lg: 'gap-3',
      xl: 'gap-3.5',
    },
  },
})

export const fileUploadBaseVariants = cva(
  'group relative inline-flex w-full cursor-pointer items-center justify-center rounded-lg b-(1 input) bg-background text-center outline-none transition-[color,box-shadow] dark:bg-input/30 focus-visible:effect-fv-border data-highlight:surface-highlight data-dragging:(border-primary bg-primary/8) data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      dropzone: true,
    },
    variants: {
      size: {
        xs: 'min-h-20 gap-1.5 px-2.5 py-2 text-xs',
        sm: 'min-h-24 gap-2 px-3 py-2.5 text-xs',
        md: 'min-h-28 gap-2 px-4 py-3 text-sm',
        lg: 'min-h-32 gap-2.5 px-4.5 py-3.5 text-sm',
        xl: 'min-h-36 gap-3 px-5 py-4 text-base',
      },
      dropzone: {
        true: 'border-dashed',
        false: 'border-solid',
      },
    },
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
    size: TEXT_SIZE_VARIANT,
  },
})

export const fileUploadDescriptionVariants = cva('text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
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
  'relative flex items-center rounded-md b-(1 border) bg-background',
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
    size: TEXT_SIZE_VARIANT,
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
  'inline-flex items-center justify-center rounded-sm b-(1 transparent) text-muted-foreground transition-colors hover:(bg-muted text-foreground) focus-visible:effect-fv-border',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-5 text-xs',
        sm: 'size-5 text-xs',
        md: 'size-6 text-sm',
        lg: 'size-6.5 text-sm',
        xl: 'size-7 text-base',
      },
    },
  },
)

export type FileUploadVariantProps = VariantProps<typeof fileUploadBaseVariants> & {
  highlight?: boolean
}
