import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import {
  INPUT_VARIANT_CLASSES,
  SURFACE_HIGHLIGHT_VARIANT,
  TEXT_SIZE_VARIANT,
} from '../../shared/cva-common.class'

export const textareaRootVariants = cva(
  'inline-flex w-full flex-col overflow-hidden rounded-md transition-[color,box-shadow] focus-within:effect-fv-border data-invalid:effect-invalid focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: TEXT_SIZE_VARIANT,
      variant: INPUT_VARIANT_CLASSES,
      highlight: SURFACE_HIGHLIGHT_VARIANT,
      disabled: {
        true: 'cursor-not-allowed opacity-75',
      },
    },
  },
)

export const textareaBaseVariants = cva(
  'flex-1 min-w-0 bg-transparent text-foreground outline-none style-placeholder disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
      autoresize: false,
    },
    variants: {
      size: {
        xs: 'min-h-17 py-1 px-2',
        sm: 'min-h-18 py-1.5 px-2.5',
        md: 'min-h-20 py-1.5 px-2.5',
        lg: 'min-h-22 py-2 px-3',
        xl: 'min-h-24 py-2 px-3',
      },
      autoresize: {
        true: 'resize-none',
        false: 'resize-y',
      },
    },
  },
)

export const textareaHeaderVariants = cva(
  'flex w-full items-center gap-2 text-muted-foreground font-medium',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'px-2 pt-1.5 pb-1 text-xs',
        sm: 'px-2.5 pt-2 pb-1 text-xs',
        md: 'px-2.5 pt-2 pb-1.5 text-sm',
        lg: 'px-3 pt-2.5 pb-1.5 text-sm',
        xl: 'px-3 pt-2.5 pb-2 text-base',
      },
    },
  },
)

export const textareaFooterVariants = cva(
  'flex w-full items-center gap-2 text-muted-foreground font-medium',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'p-1 text-xs',
        sm: 'p-1.5 text-xs',
        md: 'p-1.5 text-sm',
        lg: 'p-2 text-sm',
        xl: 'p-2 text-base',
      },
    },
  },
)

export type TextareaVariantProps = VariantProps<typeof textareaRootVariants> &
  VariantProps<typeof textareaBaseVariants>
