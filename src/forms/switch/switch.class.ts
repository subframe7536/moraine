import type { VariantProps } from 'cls-variant'

import { CHECKABLE_CONTAINER_SIZE_VARIANT } from '../../shared/cva-common.class'
import { cva } from '../../shared/utils'

export const switchContainerVariants = cva('flex items-center', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: CHECKABLE_CONTAINER_SIZE_VARIANT,
  },
})

export const switchBaseVariants = cva(
  'p-px outline-none b-(1 transparent) rounded-full bg-input inline-flex shrink-0 cursor-pointer transition-[color,box-shadow] items-center peer-focus:effect-fv-border data-invalid:effect-invalid dark:bg-input/80 data-checked:bg-primary',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'w-7',
        sm: 'w-8',
        md: 'w-9',
        lg: 'w-10',
        xl: 'w-11',
      },
    },
  },
)

export const switchThumbVariants = cva(
  'rounded-full bg-background flex pointer-events-none shadow-sm transition-transform items-center justify-center relative',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'size-3 data-checked:translate-x-3',
        sm: 'size-3.5 data-checked:translate-x-3.5',
        md: 'size-4 data-checked:translate-x-4',
        lg: 'size-4.5 data-checked:translate-x-4.5',
        xl: 'size-5 data-checked:translate-x-5',
      },
    },
  },
)

export const switchIconClass =
  'absolute size-10/12 transition-opacity text-primary data-checked:opacity-100 data-unchecked:(opacity-90 text-muted-foreground) data-loading:(opacity-80 animate-loading)'

export const switchWrapperVariants = cva('', {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'text-xs ms-1.5',
      sm: 'text-xs ms-2',
      md: 'text-sm ms-2',
      lg: 'text-sm ms-2.5',
      xl: 'text-base ms-3',
    },
  },
})

export type SwitchVariantProps = VariantProps<typeof switchContainerVariants>
