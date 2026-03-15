import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT_CLASSES } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const selectControlVariants = cva(
  'text-foreground outline-none rounded-md flex w-full cursor-pointer transition items-center focus-within:effect-fv-border data-invalid:effect-invalid data-disabled:effect-dis data-highlight:surface-highlight focus-within:data-invalid:effect-invalid',
  {
    defaultVariants: {
      size: 'md',
      variant: 'outline',
    },
    variants: {
      size: {
        xs: 'me-1',
        sm: 'me-1.5',
        md: 'me-2',
        lg: 'me-2.5',
        xl: 'me-3',
      },
      variant: INPUT_VARIANT_CLASSES,
    },
  },
)

export const selectInputVariants = cva(
  'style-placeholder outline-none bg-transparent flex-1 disabled:effect-dis data-readonly:cursor-pointer',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'px-$s-px h-$s-h',
        multiSearch: 'ps-$s-ps min-w-12',
        multiHidden: 'sr-only',
      },
      size: {
        xs: 'text-xs h-4 var-select-6-2-0.5',
        sm: 'text-xs h-4.5 var-select-7-2.5-1',
        md: 'text-sm h-5.5 var-select-8-2.5-1',
        lg: 'text-sm h-6 var-select-9-3-1.5',
        xl: 'text-base h-6.5 var-select-10-3-1.5',
      },
    },
  },
)

export const selectTriggerIconVariants = cva(
  'text-muted-foreground outline-none opacity-80 cursor-pointer',
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
