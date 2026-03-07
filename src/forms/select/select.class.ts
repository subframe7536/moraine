import type { VariantProps } from 'cls-variant'
import { cva } from 'cls-variant/cva'

import { INPUT_VARIANT_CLASSES, SURFACE_HIGHLIGHT_VARIANT } from '../../shared/cva-common.class'

export const selectControlVariants = cva(
  'flex w-full cursor-pointer items-center rounded-md text-foreground outline-none transition focus-within:effect-fv-border data-invalid:effect-invalid focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'min-h-7 text-xs',
        sm: 'min-h-8 text-xs',
        md: 'min-h-9 text-sm',
        lg: 'min-h-10 text-sm',
        xl: 'min-h-11 text-base',
      },
      variant: INPUT_VARIANT_CLASSES,
      highlight: SURFACE_HIGHLIGHT_VARIANT,
      disabled: {
        true: 'effect-dis',
      },
    },
  },
)

export const selectInputVariants = cva(
  'flex-1 bg-transparent outline-none style-placeholder disabled:effect-dis',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'h-$s-h px-$s-px',
        multiSearch: 'min-w-12 ps-$s-ps',
        multiHidden: 'sr-only',
      },
      size: {
        xs: 'h-4 text-xs var-select-6-2-0.5',
        sm: 'h-4.5 text-xs var-select-7-2.5-1',
        md: 'h-5.5 text-sm var-select-8-2.5-1',
        lg: 'h-6 text-sm var-select-9-3-1.5',
        xl: 'h-6.5 text-base var-select-10-3-1.5',
      },
      readOnly: {
        true: 'cursor-pointer',
      },
    },
  },
)

export const selectTriggerIconVariants = cva(
  'text-muted-foreground opacity-80 cursor-pointer outline-none',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'me-1 size-3.5',
        sm: 'me-1.5 size-4',
        md: 'me-2 size-5',
        lg: 'me-2.5 size-6',
        xl: 'me-3 size-6',
      },
    },
  },
)

export const selectLeadingIconVariants = cva('shrink-0 text-muted-foreground', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'ms-1.5 text-sm',
      sm: 'ms-2 text-sm',
      md: 'ms-2.5 text-base',
      lg: 'ms-3 text-base',
      xl: 'ms-3.5 text-lg',
    },
  },
})

export const selectClearVariants = cva(
  'text-muted-foreground opacity-80 outline-none transition-opacity hover:opacity-100',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'me-0.5 text-xs',
        sm: 'me-1 text-xs',
        md: 'me-1.5 text-sm',
        lg: 'me-2 text-sm',
        xl: 'me-2.5 text-base',
      },
    },
  },
)

export const selectItemVariants = cva(
  'flex cursor-pointer items-center justify-between gap-2 rounded-sm py-1 ps-3 pe-2 outline-none data-disabled:effect-dis data-highlighted:(bg-accent text-accent-foreground)',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'min-h-6 text-xs',
        sm: 'min-h-7 text-xs',
        md: 'min-h-8 text-sm',
        lg: 'min-h-9 text-sm',
        xl: 'min-h-10 text-base',
      },
    },
  },
)

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants>
