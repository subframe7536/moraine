import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT, TEXT_SIZE_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const textareaRootVariants = cva(
  'data-focused:data-invalid:effect-invalid rounded-md inline-flex flex-col w-full transition-[colors,box-shadow] overflow-hidden data-focused:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: TEXT_SIZE_VARIANT,
      variant: INPUT_VARIANT,
    },
  },
)

export const textareaBaseVariants = cva(
  'style-placeholder text-foreground outline-none bg-transparent flex-1 min-w-0 field-sizing-content disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      autoresize: false,
    },
    variants: {
      size: {
        xs: 'px-2 py-1 min-h-14',
        sm: 'px-2.5 py-2 min-h-15',
        md: 'px-2.5 py-2 min-h-16',
        lg: 'px-3 py-2 min-h-18',
        xl: 'px-3 py-2 min-h-20',
      },
      autoresize: {
        true: 'resize-none',
        false: 'resize-y',
      },
    },
  },
)

export const textareaHeaderVariants = cva(
  'text-muted-foreground font-medium flex gap-2 w-full items-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs px-2 pb-1 pt-1.5',
        sm: 'text-xs px-2.5 pb-1 pt-2',
        md: 'text-sm px-2.5 pb-1.5 pt-2',
        lg: 'text-sm px-3 pb-1.5 pt-2.5',
        xl: 'text-base px-3 pb-2 pt-2.5',
      },
    },
  },
)

export const textareaFooterVariants = cva(
  'text-muted-foreground font-medium flex gap-2 w-full items-center',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs p-1',
        sm: 'text-xs p-1.5',
        md: 'text-sm p-1.5',
        lg: 'text-sm p-2',
        xl: 'text-base p-2',
      },
    },
  },
)

export type TextareaVariantProps = VariantProps<typeof textareaRootVariants> &
  VariantProps<typeof textareaBaseVariants>
