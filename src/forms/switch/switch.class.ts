import type { VariantProps } from 'cls-variant'

import { cva } from '../../shared/utils.ts'

export const switchTrackVariants = cva(
  'p-px outline-none border border-transparent rounded-full bg-input inline-flex shrink-0 cursor-pointer shadow-xs transition-[color,background-color,box-shadow] items-center focus-visible:effect-fv-border data-invalid:effect-invalid data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
      sm: 'h-4 w-7',
      md: 'h-4.5 w-8',
      lg: 'h-5 w-9',
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
      sm: 'size-3 data-checked:translate-x-3',
      md: 'size-3.5 data-checked:translate-x-3.5',
      lg: 'size-4 data-checked:translate-x-4',
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
      sm: 'text-xs ms-2',
      md: 'text-sm ms-2',
      lg: 'text-sm ms-2.5',
    },
  },
})

export type SwitchVariantProps = VariantProps<typeof switchTrackVariants>
