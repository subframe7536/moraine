import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const selectControlVariants = cva(
  'text-foreground outline-none rounded-md flex w-full transition items-center focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'pe-1',
        sm: 'pe-1.5',
        md: 'pe-2',
        lg: 'pe-2.5',
        xl: 'pe-3',
      },
      variant: INPUT_VARIANT,
    },
  },
)

export const selectInputVariants = cva(
  'style-placeholder outline-none bg-transparent flex-1 w-full disabled:effect-dis',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'mx-$s-p p-1.5',
        multiSearch: 'leading-$s-m ps-$s-p min-w-12',
        multiHidden: 'sr-only',
      },
      size: {
        xs: 'text-xs var-select-0.5',
        sm: 'text-xs var-select-1',
        md: 'text-sm var-select-1',
        lg: 'text-sm var-select-1.5',
        xl: 'text-base var-select-1.5',
      },
    },
  },
)

export const selectTriggerIconVariants = cva(
  'text-muted-foreground me-0.5 outline-none opacity-80 cursor-pointer',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-3.4',
        md: 'size-4',
        lg: 'size-4.5',
        xl: 'size-5',
      },
    },
  },
)

export const selectLeadingIconVariants = cva('text-muted-foreground shrink-0', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-sm ms-1.5',
      sm: 'text-sm ms-2',
      md: 'text-base ms-2.5',
      lg: 'text-base ms-3',
      xl: 'text-lg ms-3.5',
    },
  },
})

export const selectClearVariants = cva(
  'text-muted-foreground outline-none opacity-80 transition-opacity hover:opacity-100',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs me-0.5',
        sm: 'text-xs me-1',
        md: 'text-sm me-1.5',
        lg: 'text-sm me-2',
        xl: 'text-base me-2.5',
      },
    },
  },
)

export const selectItemVariants = cva(
  'py-1 pe-2 ps-3 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'text-xs min-h-6',
        sm: 'text-xs min-h-7',
        md: 'text-sm min-h-8',
        lg: 'text-sm min-h-9',
        xl: 'text-base min-h-10',
      },
    },
  },
)

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants>
