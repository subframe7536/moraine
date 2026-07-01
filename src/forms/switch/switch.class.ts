import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils'

export const switchTrackVariants = cva(
  'p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer transition-[color,box-shadow] items-center group-focus-visible:effect-fv-border peer-focus-visible:effect-fv-border data-invalid:effect-invalid dark:bg-input/80 data-checked:bg-primary',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        xs: 'h-4 w-7',
        sm: 'h-4.5 w-8',
        md: 'h-5 w-9',
        lg: 'h-5.5 w-10',
        xl: 'h-6 w-11',
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

export type SwitchVariantProps = VariantProps<typeof switchTrackVariants>
