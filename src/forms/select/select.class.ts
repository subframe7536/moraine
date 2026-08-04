import type { VariantProps } from 'cls-variant'

import { INPUT_VARIANT } from '../../shared/cva-common.class.ts'
import { cva } from '../../shared/utils.ts'

export const selectControlVariants = cva(
  'text-foreground outline-none rounded-md flex w-full transition items-center data-invalid:effect-invalid data-disabled:effect-dis',
  {
    defaultVariants: {
      variant: 'outline',
    },
    variants: {
      variant: INPUT_VARIANT,
      search: {
        true: 'cursor-text focus-within:effect-fv-border focus-within:data-invalid:effect-invalid',
        false:
          'cursor-pointer focus-visible:effect-fv-border focus-visible:data-invalid:effect-invalid',
      },
    },
  },
)

export const selectInputVariants = cva(
  'outline-none bg-transparent flex-1 w-full disabled:effect-dis',
  {
    defaultVariants: {
      mode: 'single',
      size: 'md',
    },
    variants: {
      mode: {
        single: 'mx-$s-p p-1.5',
        multi: 'leading-$s-m ps-$s-p min-w-12',
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
  'text-muted-foreground me-2 outline-none opacity-80 cursor-pointer',
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

export const selectItemVariants = cva(
  'py-1 pe-2 ps-3 outline-none rounded-sm flex gap-2 cursor-pointer items-center justify-between data-highlighted:(text-accent-foreground bg-accent-hover) data-selected:(text-accent-foreground bg-accent-active) data-disabled:effect-dis',
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

export type SelectControlVariantProps = VariantProps<typeof selectControlVariants> &
  VariantProps<typeof selectTriggerIconVariants>
