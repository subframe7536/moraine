import type { VariantProps } from 'cls-variant'

import { TEXT_SIZE_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const fileUploadRootVariants = cva('flex flex-col relative data-disabled:effect-dis', {
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
  'text-center outline-none b-(1 input) rounded-lg bg-background inline-flex w-full cursor-pointer transition-[color,box-shadow] items-center justify-center relative focus-visible:effect-fv-border data-dragging:(border-primary bg-primary/8) data-invalid:effect-invalid dark:bg-input/30 data-highlight:surface-highlight',
  {
    defaultVariants: {
      size: 'md',
      dropzone: true,
    },
    variants: {
      size: {
        xs: 'text-xs px-2.5 py-2 gap-1.5 min-h-20',
        sm: 'text-xs px-3 py-2.5 gap-2 min-h-24',
        md: 'text-sm px-4 py-3 gap-2 min-h-28',
        lg: 'text-sm px-4.5 py-3.5 gap-2.5 min-h-32',
        xl: 'text-base px-5 py-4 gap-3 min-h-36',
      },
      dropzone: {
        true: 'border-dashed',
        false: 'border-solid',
      },
    },
  },
)

export const fileUploadWrapperVariants = cva(
  'text-center flex flex-col pointer-events-none items-center justify-center',
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

export const fileUploadLabelVariants = cva('text-foreground font-medium', {
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
  'b-(1 border) rounded-md bg-background flex items-center relative',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'px-2 py-1.5 gap-1.5',
        sm: 'px-2.5 py-2 gap-1.5',
        md: 'px-2.5 py-2 gap-2',
        lg: 'px-3 py-2.5 gap-2.5',
        xl: 'px-3.5 py-3 gap-3',
      },
    },
  },
)

export const fileUploadPreviewVariants = cva(
  'text-muted-foreground rounded-md bg-muted flex shrink-0 items-center justify-center relative overflow-hidden',
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

export const fileUploadMetaVariants = cva('flex flex-1 flex-col min-w-0', {
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

export const fileUploadNameVariants = cva('text-foreground font-medium truncate', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: TEXT_SIZE_VARIANT,
  },
})

export const fileUploadSizeVariants = cva('text-muted-foreground truncate', {
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
  'text-muted-foreground b-(1 transparent) rounded-sm inline-flex transition-colors items-center justify-center hover:(text-foreground bg-muted) focus-visible:effect-fv-border',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs size-5',
        sm: 'text-xs size-5',
        md: 'text-sm size-6',
        lg: 'text-sm size-6.5',
        xl: 'text-base size-7',
      },
    },
  },
)

export type FileUploadVariantProps = VariantProps<typeof fileUploadBaseVariants> & {
  highlight?: boolean
}
